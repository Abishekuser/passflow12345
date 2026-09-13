import uuid
import os

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    Form,
    File,
    UploadFile
)

from sqlalchemy.orm import Session
from dotenv import load_dotenv
from supabase import create_client

from ..database import get_db
from ..models import User, Student
from ..schemas import LoginRequest
from ..auth import (
    hash_password,
    verify_password,
    create_access_token
)


load_dotenv()


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")


supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/signup")
async def signup(
    username: str = Form(...),
    password: str = Form(...),

    name: str = Form(...),
    roll_number: str = Form(...),
    department: str = Form(...),
    year: int = Form(...),
    room_number: str = Form(...),

    parent_name: str = Form(...),
    parent_phone: str = Form(...),
    parent_language: str = Form(...),

    photo: UploadFile = File(...),

    db: Session = Depends(get_db)
):

    # Check username
    existing_user = db.query(User).filter(
        User.username == username
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )


    # Check roll number
    existing_student = db.query(Student).filter(
        Student.roll_number == roll_number
    ).first()

    if existing_student:
        raise HTTPException(
            status_code=400,
            detail="Roll number already exists"
        )


    # Check photo type
    if not photo.content_type or not photo.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="Only image files are allowed"
        )


    # Read photo
    photo_data = await photo.read()


    # Create unique file name
    file_name = f"{uuid.uuid4()}_{photo.filename}"


    # Upload photo to Supabase Storage
    try:

        supabase.storage.from_("student-photos").upload(
            file_name,
            photo_data,
            {
                "content-type": photo.content_type
            }
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Photo upload failed: {str(e)}"
        )


    # Get public URL
    photo_url = supabase.storage.from_(
        "student-photos"
    ).get_public_url(file_name)


    # Hash password
    hashed_password = hash_password(password)


    # Create user
    user = User(
        username=username,
        password_hash=hashed_password,
        role="STUDENT"
    )

    db.add(user)
    db.commit()
    db.refresh(user)


    # Create student
    student = Student(
        user_id=user.id,
        name=name,
        roll_number=roll_number,
        department=department,
        year=year,
        room_number=room_number,

        photo_url=photo_url,

        parent_name=parent_name,
        parent_phone=parent_phone,
        parent_language=parent_language
    )

    db.add(student)
    db.commit()
    db.refresh(student)


    return {
        "message": "Student registered successfully",
        "user_id": user.id,
        "student_id": student.id,
        "photo_url": photo_url
    }


@router.post("/login")
def login(
    data: LoginRequest,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.username == data.username
    ).first()


    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )


    if not verify_password(
        data.password,
        user.password_hash
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )


    token = create_access_token({
        "user_id": user.id,
        "role": user.role
    })


    return {
        "access_token": token,
        "token_type": "bearer"
    }