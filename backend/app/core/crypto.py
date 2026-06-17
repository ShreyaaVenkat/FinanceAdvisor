from cryptography.fernet import Fernet
import base64
from app.core.config import settings

# A valid 32-byte URL-safe base64 key for local development fallback
DEFAULT_KEY = b"fPZ8x2eK4_o_zY49r8_7lK2j8r7V6o1B7X4U3Y2T1s0="

class EncryptionHelper:
    def __init__(self):
        try:
            # Try loading key from settings
            key = settings.ENCRYPTION_KEY.encode()
            # Verify if it's a valid Fernet key
            self.fernet = Fernet(key)
        except Exception:
            # Fallback to DEFAULT_KEY if config key is invalid
            self.fernet = Fernet(DEFAULT_KEY)

    def encrypt(self, plain_text: str) -> str:
        if not plain_text:
            return ""
        return self.fernet.encrypt(plain_text.encode()).decode()

    def decrypt(self, encrypted_text: str) -> str:
        if not encrypted_text:
            return ""
        try:
            return self.fernet.decrypt(encrypted_text.encode()).decode()
        except Exception:
            # Return original if decryption fails (e.g. if field was not encrypted)
            return encrypted_text

cipher = EncryptionHelper()
