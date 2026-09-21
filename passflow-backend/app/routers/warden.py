from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Student, Outpass, User, QRPass
from ..auth import get_current_warden
from ..qr import generate_qr_token, generate_qr_image


router = APIRouter(
    prefix="/warden",
    tags=["Warden"]
)


# =========================================================
# GET ALL STUDENTS
# =========================================================

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

        status = "IN"

        if latest_outpass:

            if latest_outpass.status == "OUT":

                if current_time > latest_outpass.expected_return_time:
                    status = "LATE"
                else:
                    status = "OUT"

            elif latest_outpass.status == "RETURNED":

                status = "RETURNED"

            else:

                status = latest_outpass.status

        result.append({
            "name": student.name,
            "department": student.department,
            "roll_number": student.roll_number,
            "room_number": student.room_number,
            "year": student.year,
            "status": status
        })

    return result


# =========================================================
# GET PARENT-APPROVED OUTPASSES
# =========================================================

@router.get("/pending")
def get_pending_outpasses(
    year: int | None = None,
    current_user: User = Depends(get_current_warden),
    db: Session = Depends(get_db)
):

    query = db.query(Outpass).join(
        Student,
        Outpass.student_id == Student.id
    ).filter(
        Outpass.status == "PARENT_APPROVED"
    )

    # Optional year filter
    if year is not None:
        query = query.filter(
            Student.year == year
        )

    outpasses = query.order_by(
        Outpass.id.desc()
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
            "year": student.year,
            "date": str(outpass.date),
            "destination": outpass.destination,
            "departure_time": str(outpass.departure_time),
            "expected_return_time": str(
                outpass.expected_return_time
            ),
            "status": outpass.status
        })

    return result


# =========================================================
# APPROVE SINGLE OUTPASS
# =========================================================

@router.post("/approve/{outpass_id}")
def approve_outpass(
    outpass_id: int,
    current_user: User = Depends(get_current_warden),
    db: Session = Depends(get_db)
):

    outpass = db.query(Outpass).filter(
        Outpass.id == outpass_id
    ).first()

    if not outpass:
        raise HTTPException(
            status_code=404,
            detail="Outpass not found"
        )

    # Warden can approve only after parent approval
    if outpass.status != "PARENT_APPROVED":
        raise HTTPException(
            status_code=400,
            detail="Outpass has not been approved by parent"
        )

    # Prevent duplicate QR
    existing_qr = db.query(QRPass).filter(
        QRPass.outpass_id == outpass.id
    ).first()

    if existing_qr:
        raise HTTPException(
            status_code=400,
            detail="QR pass already exists"
        )

    # -----------------------------------------
    # WARDEN APPROVAL
    # -----------------------------------------

    outpass.status = "APPROVED"

    # Generate secure QR token
    qr_token = generate_qr_token()

    qr_pass = QRPass(
        outpass_id=outpass.id,
        student_id=outpass.student_id,
        token=qr_token,
        expires_at=
            datetime.now(
                ZoneInfo("Asia/Kolkata")
            ).replace(tzinfo=None)
            + timedelta(hours=24)
    )

    db.add(qr_pass)

    db.commit()
    db.refresh(qr_pass)

    # Generate QR image
    image = generate_qr_image(qr_token)

    image.save(
        f"qr_{outpass.id}.png"
    )

    return {
        "message": "Outpass approved by warden and QR generated",
        "outpass_id": outpass.id,
        "status": outpass.status,
        "qr_token": qr_token
    }


# =========================================================
# REJECT SINGLE OUTPASS
# =========================================================

@router.post("/reject/{outpass_id}")
def reject_outpass(
    outpass_id: int,
    current_user: User = Depends(get_current_warden),
    db: Session = Depends(get_db)
):

    outpass = db.query(Outpass).filter(
        Outpass.id == outpass_id
    ).first()

    if not outpass:
        raise HTTPException(
            status_code=404,
            detail="Outpass not found"
        )

    if outpass.status != "PARENT_APPROVED":
        raise HTTPException(
            status_code=400,
            detail="Outpass is not waiting for warden approval"
        )

    outpass.status = "REJECTED"

    db.commit()

    return {
        "message": "Outpass rejected by warden",
        "outpass_id": outpass.id,
        "status": outpass.status
    }


# =========================================================
# BULK APPROVE OUTPASSES
# =========================================================

@router.post("/approve-selected")
def approve_selected_outpasses(
    outpass_ids: list[int],
    current_user: User = Depends(get_current_warden),
    db: Session = Depends(get_db)
):

    if not outpass_ids:
        raise HTTPException(
            status_code=400,
            detail="No outpasses selected"
        )

    approved = []
    skipped = []

    for outpass_id in outpass_ids:

        outpass = db.query(Outpass).filter(
            Outpass.id == outpass_id
        ).first()

        if not outpass:
            skipped.append({
                "outpass_id": outpass_id,
                "reason": "Outpass not found"
            })
            continue

        # Only parent-approved requests can be approved
        if outpass.status != "PARENT_APPROVED":
            skipped.append({
                "outpass_id": outpass_id,
                "reason": "Parent approval required"
            })
            continue

        # Check existing QR
        existing_qr = db.query(QRPass).filter(
            QRPass.outpass_id == outpass.id
        ).first()

        if existing_qr:
            skipped.append({
                "outpass_id": outpass_id,
                "reason": "QR already exists"
            })
            continue

        # Approve
        outpass.status = "APPROVED"

        # Generate QR
        qr_token = generate_qr_token()

        qr_pass = QRPass(
            outpass_id=outpass.id,
            student_id=outpass.student_id,
            token=qr_token,
            expires_at=
                datetime.now(
                    ZoneInfo("Asia/Kolkata")
                ).replace(tzinfo=None)
                + timedelta(hours=24)
        )

        db.add(qr_pass)

        # Generate QR image
        image = generate_qr_image(qr_token)

        image.save(
            f"qr_{outpass.id}.png"
        )

        approved.append({
            "outpass_id": outpass.id,
            "qr_token": qr_token
        })

    db.commit()

    return {
        "message": "Selected outpasses processed",
        "approved": approved,
        "skipped": skipped
    }