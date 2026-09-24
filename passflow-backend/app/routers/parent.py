import os
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
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


def decode_parent_token(token):

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    if payload.get("purpose") != "parent_approval":
        raise HTTPException(
            status_code=401,
            detail="Invalid approval token"
        )

    return payload


def get_outpass_from_token(token, db):

    payload = decode_parent_token(token)

    outpass_id = payload.get("outpass_id")

    if not outpass_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid approval token"
        )

    outpass = db.query(Outpass).filter(
        Outpass.id == outpass_id
    ).first()

    if not outpass:
        raise HTTPException(
            status_code=404,
            detail="Outpass not found"
        )

    return outpass


# --------------------------------------------------
# EXISTING API APPROVE ENDPOINT
# --------------------------------------------------

@router.post("/approve/{token}")
def approve_outpass(
    token: str,
    db: Session = Depends(get_db)
):

    outpass = get_outpass_from_token(token, db)

    if outpass.status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail="Outpass is not pending"
        )

    outpass.status = "PARENT_APPROVED"

    db.commit()

    return {
        "message": "Parent approved the outpass. Waiting for warden approval.",
        "outpass_id": outpass.id,
        "status": outpass.status
    }


# --------------------------------------------------
# EXISTING API REJECT ENDPOINT
# --------------------------------------------------

@router.post("/reject/{token}")
def reject_outpass(
    token: str,
    db: Session = Depends(get_db)
):

    outpass = get_outpass_from_token(token, db)

    if outpass.status != "PENDING":
        raise HTTPException(
            status_code=400,
            detail="Outpass is not pending"
        )

    outpass.status = "REJECTED"

    db.commit()

    return {
        "message": "Outpass rejected by parent.",
        "outpass_id": outpass.id,
        "status": outpass.status
    }


# --------------------------------------------------
# EMAIL APPROVE LINK
# --------------------------------------------------

@router.get(
    "/email/approve/{token}",
    response_class=HTMLResponse
)
def email_approve_outpass(
    token: str,
    db: Session = Depends(get_db)
):

    outpass = get_outpass_from_token(token, db)

    if outpass.status != "PENDING":
        return """
        <html>
            <body>
                <h2>PassFlow</h2>
                <p>This outpass has already been processed.</p>
            </body>
        </html>
        """

    outpass.status = "PARENT_APPROVED"

    db.commit()

    return """
    <html>
        <head>
            <title>PassFlow</title>
        </head>
        <body>
            <h2>✅ Outpass Approved</h2>

            <p>
                You have approved your child's outpass request.
            </p>

            <p>
                The request is now waiting for warden approval.
            </p>

            <p>
                The QR pass will be generated after the warden approves it.
            </p>
        </body>
    </html>
    """


# --------------------------------------------------
# EMAIL REJECT LINK
# --------------------------------------------------

@router.get(
    "/email/reject/{token}",
    response_class=HTMLResponse
)
def email_reject_outpass(
    token: str,
    db: Session = Depends(get_db)
):

    outpass = get_outpass_from_token(token, db)

    if outpass.status != "PENDING":
        return """
        <html>
            <body>
                <h2>PassFlow</h2>
                <p>This outpass has already been processed.</p>
            </body>
        </html>
        """

    outpass.status = "REJECTED"

    db.commit()

    return """
    <html>
        <head>
            <title>PassFlow</title>
        </head>
        <body>
            <h2>❌ Outpass Rejected</h2>

            <p>
                You have rejected your child's outpass request.
            </p>
        </body>
    </html>
    """