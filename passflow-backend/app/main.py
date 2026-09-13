from fastapi import FastAPI
from .routers.warden import router as warden_router
from .routers.auth import router as auth_router
from .routers.student import router as student_router
from .routers.parent import router as parent_router
from .routers.gate import router as gate_router

app = FastAPI(
    title="PassFlow API",
    description="Hostel Outpass Management System"
)


app.include_router(auth_router)
app.include_router(student_router)
app.include_router(parent_router)
app.include_router(gate_router)
app.include_router(warden_router)