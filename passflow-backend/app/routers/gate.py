from datetime import datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import QRPass, Student, Outpass, GateEvent
from ..auth import get_current_security


router = APIRouter(
    prefix="/gate",
    tags=["Gate"]
)


@router.post("/scan")
def scan_qr(
    token: str,
    current_user=Depends(get_current_security),
    db: Session = Depends(get_db)
):

    # Find QR pass
    qr_pass = db.query(QRPass).filter(
        QRPass.token == token
    ).first()

    if not qr_pass:
        raise HTTPException(
            status_code=404,
            detail="Invalid QR code"
        )

    # Check QR expiry
    current_datetime = datetime.now(
        ZoneInfo("Asia/Kolkata")
    ).replace(tzinfo=None)

    if qr_pass.expires_at < current_datetime:
        raise HTTPException(
            status_code=400,
            detail="QR code has expired"
        )

    # Find outpass
    outpass = db.query(Outpass).filter(
        Outpass.id == qr_pass.outpass_id
    ).first()

    if not outpass:
        raise HTTPException(
            status_code=404,
            detail="Outpass not found"
        )

    # Find student
    student = db.query(Student).filter(
        Student.id == qr_pass.student_id
    ).first()

    if not student:
        raise HTTPException(
            status_code=404,
            detail="Student not found"
        )

    # ==========================================
    # FIRST SCAN → OUT
    # ==========================================

    if not qr_pass.used_for_exit:

        if outpass.status != "APPROVED":
            raise HTTPException(
                status_code=400,
                detail="Outpass is not approved"
            )

        qr_pass.used_for_exit = True
        outpass.status = "OUT"

        gate_event = GateEvent(
            outpass_id=outpass.id,
            student_id=student.id,
            event_type="OUT",
            verified_by=current_user.username
        )

        db.add(gate_event)
        db.commit()

        return {
            "message": "Student marked OUT",
            "action": "OUT",

            "student": {
                "name": student.name,
                "roll_number": student.roll_number,
                "department": student.department,
                "room_number": student.room_number,
                "photo_url": student.photo_url
            },

            "outpass": {
                "destination": outpass.destination,
                "expected_return_time": str(
                    outpass.expected_return_time
                )
            }
        }

    # ==========================================
    # SECOND SCAN → IN
    # ==========================================

    if not qr_pass.used_for_return:

        if outpass.status != "OUT":
            raise HTTPException(
                status_code=400,
                detail="Student is not currently OUT"
            )

        # Get current Indian time
        current_time = datetime.now(
            ZoneInfo("Asia/Kolkata")
        ).time()

        # Check whether student is late
        is_late = (
            current_time > outpass.expected_return_time
        )

        qr_pass.used_for_return = True
        outpass.status = "RETURNED"

        gate_event = GateEvent(
            outpass_id=outpass.id,
            student_id=student.id,
            event_type="IN",
            verified_by=current_user.username
        )

        db.add(gate_event)
        db.commit()

        if is_late:
            message = "Student marked IN - RETURNED LATE"
        else:
            message = "Student marked IN - RETURNED ON TIME"

        return {
            "message": message,
            "action": "IN",

            "return_status": (
                "LATE" if is_late else "ON_TIME"
            ),

            "student": {
                "name": student.name,
                "roll_number": student.roll_number,
                "department": student.department,
                "room_number": student.room_number,
                "photo_url": student.photo_url
            },

            "outpass": {
                "destination": outpass.destination,

                "expected_return_time": str(
                    outpass.expected_return_time
                ),

                "actual_return_time": str(
                    current_time
                )
            }
        }
    raise HTTPException(
        status_code=400,
        detail="This QR pass has already been used"
    )