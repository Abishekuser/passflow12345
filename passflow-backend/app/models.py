from datetime import datetime, date, time

from sqlalchemy import Column, Integer, String, Date, Time, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="user", uselist=False)


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    name = Column(String, nullable=False)
    roll_number = Column(String, unique=True, nullable=False)
    department = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    room_number = Column(String, nullable=False)

    photo_url = Column(String, nullable=True)

    parent_name = Column(String, nullable=False)
    parent_phone = Column(String, nullable=False)
    parent_language = Column(String, nullable=False)

    user = relationship("User", back_populates="student")
    outpasses = relationship("Outpass", back_populates="student")


class Outpass(Base):
    __tablename__ = "outpasses"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)

    date = Column(Date, nullable=False)
    destination = Column(String, nullable=False)
    departure_time = Column(Time, nullable=False)
    expected_return_time = Column(Time, nullable=False)

    status = Column(String, default="PENDING", nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="outpasses")
    qr_pass = relationship("QRPass", back_populates="outpass", uselist=False)
    gate_events = relationship("GateEvent", back_populates="outpass")


class QRPass(Base):
    __tablename__ = "qr_passes"

    id = Column(Integer, primary_key=True, index=True)

    outpass_id = Column(
        Integer,
        ForeignKey("outpasses.id"),
        unique=True,
        nullable=False
    )

    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)

    token = Column(String, unique=True, nullable=False)

    expires_at = Column(DateTime, nullable=False)

    used_for_exit = Column(Boolean, default=False)
    used_for_return = Column(Boolean, default=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    outpass = relationship("Outpass", back_populates="qr_pass")


class GateEvent(Base):
    __tablename__ = "gate_events"

    id = Column(Integer, primary_key=True, index=True)

    outpass_id = Column(Integer, ForeignKey("outpasses.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)

    event_type = Column(String, nullable=False)

    timestamp = Column(DateTime, default=datetime.utcnow)

    verified_by = Column(String, nullable=False)

    outpass = relationship("Outpass", back_populates="gate_events")