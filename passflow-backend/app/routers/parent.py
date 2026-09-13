import os
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from jose import jwt
from dotenv import load_dotenv
from zoneinfo import ZoneInfo

from ..database import get_db
from ..models import Outpass, QRPass
from ..qr import generate_qr_token, generate_qr_image


load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"


router = APIRouter(
    prefix="/parent",
    tags=["Parent"]
)


def create_parent_token(outpass_id):

    data = {
        "outpass_id": outpass_id,
        "purpose": "parent_approval",
        "exp": datetime.utcnow() + timedelta(hours=24)
    }

    return jwt.encode(
        data,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


@router.post("/approve/{token}")
def approve_outpass(
    token: str,
    db: Session = Depends(get_db)
):

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

    except:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    if payload.get("purpose") != "parent_approval":
        raise HTTPException(
            status_code=401,
            detail="Invalid approval token"
        )

    outpass_id = payload.get("outpass_id")

    outpass = db.query(Outpass).filter(
        Outpass.id == outpass_id
    ).first()

    if not outpass:
        raise HTTPException(
            status_code=404,
            detail="Outpass not found"
        )

    if outpass.status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail="Outpass is not pending"
        )

    # Approve the outpass
    outpass.status = "APPROVED"

    # Create QR token
    qr_token = generate_qr_token()

    qr_pass = QRPass(
        outpass_id=outpass.id,
        student_id=outpass.student_id,
        token=qr_token,
        expires_at=datetime.now(ZoneInfo("Asia/Kolkata")).replace(tzinfo=None) + timedelta(hours=24)
    )

    db.add(qr_pass)

    db.commit()
    db.refresh(qr_pass)

    # Generate QR image
    image = generate_qr_image(qr_token)
    image.save(f"qr_{outpass.id}.png")

    return {
        "message": "Outpass approved and QR generated",
        "outpass_id": outpass.id,
        "status": outpass.status,
        "qr_token": qr_token
    }


@router.post("/reject/{token}")
def reject_outpass(
    token: str,
    db: Session = Depends(get_db)
):

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

    except:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    if payload.get("purpose") != "parent_approval":
        raise HTTPException(
            status_code=401,
            detail="Invalid approval token"
        )

    outpass_id = payload.get("outpass_id")

    outpass = db.query(Outpass).filter(
        Outpass.id == outpass_id
    ).first()

    if not outpass:
        raise HTTPException(
            status_code=404,
            detail="Outpass not found"
        )

    if outpass.status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail="Outpass is not pending"
        )

    # Reject the outpass
    outpass.status = "REJECTED"

    db.commit()

    return {
        "message": "Outpass rejected",
        "outpass_id": outpass.id,
        "status": outpass.status
    }