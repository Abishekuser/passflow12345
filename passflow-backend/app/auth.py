import os

from datetime import datetime, timedelta

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt
from dotenv import load_dotenv

from .database import get_db
from .models import User


load_dotenv()


SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


security = HTTPBearer()


def hash_password(password):
    return pwd_context.hash(password)


def verify_password(password, hashed_password):
    return pwd_context.verify(
        password,
        hashed_password
    )


def create_access_token(data):

    data = data.copy()

    data["exp"] = datetime.utcnow() + timedelta(hours=24)

    return jwt.encode(
        data,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


def decode_access_token(token):

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload

    except:

        return None


def get_current_user(
    credentials=Depends(security),
    db: Session = Depends(get_db)
):

    token = credentials.credentials

    payload = decode_access_token(token)

    if payload is None:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user_id = payload.get("user_id")

    if user_id is None:

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:

        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user


def get_current_warden(
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "WARDEN":

        raise HTTPException(
            status_code=403,
            detail="Warden access required"
        )

    return current_user


def get_current_security(
    current_user: User = Depends(get_current_user)
):

    if current_user.role != "SECURITY":

        raise HTTPException(
            status_code=403,
            detail="Security access required"
        )

    return current_user