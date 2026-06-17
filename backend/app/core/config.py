import os

class Settings:
    PROJECT_NAME: str = "Personal Finance Advisor"
    API_V1_STR: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "7d4b4a1b02130e6ef843a8bb6d1163ffc3413cb1017bd686a7d7efbcf662df9d")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "sqlite:///C:/Users/SHREYAA VENKAT/.gemini/antigravity/scratch/personal-finance-advisor/backend/app.db"
    )
    
    # Cryptography key for field-level encryption (32-byte url-safe base64 key)
    # This is a fallback key for development.
    ENCRYPTION_KEY: str = os.getenv(
        "ENCRYPTION_KEY", 
        "UjJZV0p6YUdGM2FXNWhaR0Z5WVc1aFpHRXlNelExTmpjPQ==" 
    )

settings = Settings()
