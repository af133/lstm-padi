from dotenv import load_dotenv
import os

load_dotenv()

class Settings:
    FIREBASE_PROJECT_ID: str = os.getenv("FIREBASE_PROJECT_ID")
    FIREBASE_API_KEY: str = os.getenv("FIREBASE_API_KEY")
    PREDICTION_API_URL: str = os.getenv("PREDICTION_API_URL")
    SECRET_KEY_RECAPTCHA: str = os.getenv("SECRET_KEY_RECAPTCHA")
settings = Settings()