import requests
from fastapi import APIRouter, HTTPException, Response, Cookie
from typing import Optional
from app.schemas.input_data import LoginRequest
from app.core.config import Settings

router = APIRouter()

VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"
@router.post("/login")
async def login(credentials: LoginRequest, response: Response):
    payload = {
        'secret': Settings.SECRET_KEY_RECAPTCHA,
        'response': credentials.recaptcha_token
    }
    verify_res = requests.post(VERIFY_URL, data=payload).json()

    if not verify_res.get('success'):
        raise HTTPException(
            status_code=400, 
            detail="Verifikasi reCAPTCHA gagal. Anda terdeteksi sebagai bot."
        )
    if credentials.username == "admin@padi.com" and credentials.password == "hello@Password123":
        response.set_cookie(
            key="session_padi", 
            value="authenticated_user", 
            httponly=True, 
            max_age=86400
        )
        return {"message": "Login berhasil!"}
    raise HTTPException(status_code=401, detail="Username atau password salah")
@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="session_padi")
    return {"message": "Logout berhasil!"}
@router.get("/status")

async def get_status(session_padi: Optional[str] = Cookie(None)):
    if session_padi != "authenticated_user":
        raise HTTPException(status_code=401, detail="Belum login")
    return {"status": "Anda sedang login"}