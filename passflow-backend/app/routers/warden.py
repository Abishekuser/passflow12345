from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Student, Outpass, User
from ..auth import get_current_warden


router = APIRouter(
    prefix="/warden",
    tags=["Warden"]
)


@router.get("/students")
def get_students(
    current_user: User = Depends(get_current_warden),
    db: Session = Depends(get_db)
):

    students = db.query(Student).all()

    current_time = datetime.now(
        ZoneInfo("Asia/Kolkata")
    ).time()

    result = []

    for student in students:

        latest_outpass = db.query(Outpass).filter(
            Outpass.student_id == student.id
        ).order_by(
            Outpass.id.desc()
        ).first()

        # Default status
        status = "IN"

        if latest_outpass:

            # Student is currently outside
            if latest_outpass.status == "OUT":

                if current_time > latest_outpass.expected_return_time:
                    status = "LATE"
                else:
                    status = "OUT"

            # Student already returned
            elif latest_outpass.status == "RETURNED":

                status = "RETURNED"

            # Other statuses
            else:
                status = latest_outpass.status

        result.append({
            "name": student.name,
            "department": student.department,
            "roll_number": student.roll_number,
            "room_number": student.room_number,
            "status": status
        })

    return result


@router.get("/pending")
def get_pending_outpasses(
    current_user: User = Depends(get_current_warden),
    db: Session = Depends(get_db)
):

    outpasses = db.query(Outpass).filter(
        Outpass.status == "PENDING"
    ).all()

    result = []

    for outpass in outpasses:

        student = db.query(Student).filter(
            Student.id == outpass.student_id
        ).first()

        result.append({
            "outpass_id": outpass.id,
            "name": student.name,
            "department": student.department,
            "roll_number": student.roll_number,
            "room_number": student.room_number,
            "date": str(outpass.date),
            "destination": outpass.destination,
            "departure_time": str(outpass.departure_time),
            "expected_return_time": str(
                outpass.expected_return_time
            ),
            "status": outpass.status
        })

    return result