import os
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from jose import jwt
from dotenv import load_dotenv

from ..database import get_db
from ..models import Outpass


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

    # Decode parent approval token
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

    # Check token purpose
    if payload.get("purpose") != "parent_approval":
        raise HTTPException(
            status_code=401,
            detail="Invalid approval token"
        )

    outpass_id = payload.get("outpass_id")

    # Find outpass
    outpass = db.query(Outpass).filter(
        Outpass.id == outpass_id
    ).first()

    if not outpass:
        raise HTTPException(
            status_code=404,
            detail="Outpass not found"
        )

    # Parent can approve only pending requests
    if outpass.status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail="Outpass is not pending"
        )

    # --------------------------------
    # Parent approval
    # --------------------------------

    outpass.status = "PARENT_APPROVED"

    db.commit()

    return {
        "message": "Parent approved the outpass. Waiting for warden approval.",
        "outpass_id": outpass.id,
        "status": outpass.status
    }


@router.post("/reject/{token}")
def reject_outpass(
    token: str,
    db: Session = Depends(get_db)
):

    # Decode parent approval token
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

    # Check token purpose
    if payload.get("purpose") != "parent_approval":
        raise HTTPException(
            status_code=401,
            detail="Invalid approval token"
        )

    outpass_id = payload.get("outpass_id")

    # Find outpass
    outpass = db.query(Outpass).filter(
        Outpass.id == outpass_id
    ).first()

    if not outpass:
        raise HTTPException(
            status_code=404,
            detail="Outpass not found"
        )

    # Parent can reject only pending requests
    if outpass.status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail="Outpass is not pending"
        )

    # --------------------------------
    # Parent rejection
    # --------------------------------

    outpass.status = "REJECTED"

    db.commit()

    return {
        "message": "Outpass rejected by parent.",
        "outpass_id": outpass.id,
        "status": outpass.status
    }