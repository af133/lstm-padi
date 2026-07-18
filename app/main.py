from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import predict
import os

app = FastAPI(title="LSTM Padi Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict.router)

@app.get("/")
def read_root():
    return {"message": "LSTM Padi Backend is Running"}