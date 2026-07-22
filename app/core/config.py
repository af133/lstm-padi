from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID")
    FIREBASE_API_KEY: str = os.getenv("FIREBASE_API_KEY")
    PREDICTION_API_URL: str = os.getenv("PREDICTION_API_URL")
    SECRET_KEY_RECAPTCHA: str = os.getenv("SECRET_KEY_RECAPTCHA")
    SUPABASE_URL: str=os.getenv("SUPABASE_URL")
    SUPABASE_SECRET_KEY:str = os.getenv("SUPABASE_SECRET_KEY")
    SUPABASE_JWKS_URL:str = os.getenv("SUPABASE_JWKS_URL")
    SUPABASE_PUBLISHABLE_KEY:str = os.getenv("SUPABASE_PUBLISHABLE_KEY")
settings = Settings()