from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from jose import jwt
import os
from dotenv import load_dotenv

from ..database import get_db
from ..models import Student, Outpass, User, QRPass
from ..schemas import OutpassRequest
from ..auth import get_current_user
from ..services.email import send_outpass_request


load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"


router = APIRouter(
    prefix="/student",
    tags=["Student"]
)


@router.post("/outpasses")
def create_outpass(
    data: OutpassRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Find the student
    student = db.query(Student).filter(
        Student.user_id == current_user.id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found"
        )

    # Check parent email
    if not student.parent_email:
        raise HTTPException(
            status_code=400,
            detail="Parent email is not registered"
        )

    # Check for an active outpass
    active_outpass = db.query(Outpass).filter(
        Outpass.student_id == student.id,
        Outpass.status.in_([
            "PENDING",
            "PARENT_APPROVED",
            "APPROVED",
            "OUT"
        ])
    ).first()

    if active_outpass:
        raise HTTPException(
            status_code=400,
            detail="You already have an active outpass"
        )

    # Check date
    today = datetime.now().date()

    if data.date < today:
        raise HTTPException(
            status_code=400,
            detail="Outpass date cannot be in the past"
        )

    # Check departure and return time
    if data.departure_time >= data.expected_return_time:
        raise HTTPException(
            status_code=400,
            detail="Expected return time must be after departure time"
        )

    # Create outpass
    outpass = Outpass(
        student_id=student.id,
        date=data.date,
        destination=data.destination,
        departure_time=data.departure_time,
        expected_return_time=data.expected_return_time,
        status="PENDING"
    )

    db.add(outpass)
    db.commit()
    db.refresh(outpass)

    # Create parent approval token
    parent_token = jwt.encode(
        {
            "outpass_id": outpass.id,
            "purpose": "parent_approval",
            "exp": datetime.utcnow() + timedelta(hours=24)
        },
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    # Send email to the registered parent email
    try:

        print(
            "Sending email to:",
            student.parent_email
        )

        send_outpass_request(
            parent_email=student.parent_email,
            student=student,
            outpass=outpass,
            approval_token=parent_token
        )

        print(
            "Parent approval email sent successfully."
        )

    except Exception as e:

        print(
            "Email notification failed:",
            str(e)
        )

        raise HTTPException(
            status_code=500,
            detail=f"Email notification failed: {str(e)}"
        )

    return {
        "message": "Outpass request submitted",
        "outpass_id": outpass.id,
        "status": outpass.status,
        "parent_email": student.parent_email
    }


@router.get("/outpasses")
def get_my_outpasses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    # Find the student
    student = db.query(Student).filter(
        Student.user_id == current_user.id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student profile not found"
        )

    # Get all outpasses
    outpasses = db.query(Outpass).filter(
        Outpass.student_id == student.id
    ).all()

    result = []

    for outpass in outpasses:

        qr_pass = db.query(QRPass).filter(
            QRPass.outpass_id == outpass.id
        ).first()

        result.append({
            "id": outpass.id,
            "date": str(outpass.date),
            "destination": outpass.destination,
            "departure_time": str(
                outpass.departure_time
            ),
            "expected_return_time": str(
                outpass.expected_return_time
            ),
            "status": outpass.status,
            "created_at": str(
                outpass.created_at
            ),
            "qr_token": (
                qr_pass.token
                if qr_pass
                and outpass.status in [
                    "APPROVED",
                    "OUT"
                ]
                else None
            )
        })

    return result