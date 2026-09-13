from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers.warden import router as warden_router
from .routers.auth import router as auth_router
from .routers.student import router as student_router
from .routers.parent import router as parent_router
from .routers.gate import router as gate_router

app = FastAPI(
    title="PassFlow API",
    description="Hostel Outpass Management System"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["passflow-frontend.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(student_router)
app.include_router(parent_router)
app.include_router(gate_router)
app.include_router(warden_router)