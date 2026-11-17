from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers.warden import router as warden_router
from .routers.auth import router as auth_router
from .routers.student import router as student_router
from .routers.parent import router as parent_router
from .routers.gate import router as gate_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    from .telegram_bot import start_bot, stop_bot

    telegram_application = await start_bot()
    app.state.telegram_application = telegram_application
    try:
        yield
    finally:
        await stop_bot(telegram_application)


app = FastAPI(
    title="PassFlow API",
    description="Hostel Outpass Management System",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://passflow-frontend.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(student_router)
app.include_router(parent_router)
app.include_router(gate_router)
app.include_router(warden_router)