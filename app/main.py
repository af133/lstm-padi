from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api import features
from app.services.firebase_service import start_scheduler
@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    print("Scheduler cuaca telah aktif via Lifespan!")
    yield
    print("Aplikasi berhenti.")
app = FastAPI(
    title="LSTM Padi Backend API", 
    lifespan=lifespan
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(features.router)

@app.api_route("/", methods=["GET", "HEAD"])
def read_root():
    return {"message": "LSTM Padi Backend is Running"}