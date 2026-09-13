from datetime import date, time

from pydantic import BaseModel


class LoginRequest(BaseModel):
    username: str
    password: str


class OutpassRequest(BaseModel):
    date: date
    destination: str
    departure_time: time
    expected_return_time: time