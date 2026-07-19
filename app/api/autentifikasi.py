import requests
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.schemas.input_data import LoginRequest
from app.core.config import Settings
router = APIRouter()

# Konfigurasi

VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"

@router.post("/login")
async def login(credentials: LoginRequest):
    payload = {
        'secret': Settings.SECRET_KEY_RECAPTCHA,
        'response': credentials.recaptcha_token
    }
    response = requests.post(VERIFY_URL, data=payload)
    result = response.json()

    # 2. Cek apakah validasi gagal
    if not result.get('success'):
        raise HTTPException(
            status_code=400, 
            detail="Verifikasi reCAPTCHA gagal. Anda terdeteksi sebagai bot."
        )
    if credentials.username == "admin@padi.com" and credentials.password == "hello@Password123":
        return {"message": "Login berhasil!"}
    
    raise HTTPException(status_code=401, detail="Username atau password salah")