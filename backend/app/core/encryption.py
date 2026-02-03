"""
Encryption service for securing API credentials at rest.
Uses Fernet (AES-128-CBC + HMAC) encryption derived from SECRET_KEY.
"""

from cryptography.fernet import Fernet
from app.core.config import settings
import base64
import hashlib


class EncryptionService:
    """Service for encrypting and decrypting sensitive credential data."""

    def __init__(self):
        # Derive a 32-byte key from SECRET_KEY using SHA-256
        key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
        # Fernet requires a base64-encoded 32-byte key
        self._fernet = Fernet(base64.urlsafe_b64encode(key))

    def encrypt(self, plaintext: str) -> str:
        """
        Encrypt a plaintext string.

        Args:
            plaintext: The string to encrypt

        Returns:
            Base64-encoded encrypted string, or None if plaintext is None/empty
        """
        if not plaintext:
            return None
        return self._fernet.encrypt(plaintext.encode()).decode()

    def decrypt(self, ciphertext: str) -> str:
        """
        Decrypt an encrypted string.

        Args:
            ciphertext: The encrypted string to decrypt

        Returns:
            Decrypted plaintext string, or None if ciphertext is None/empty
        """
        if not ciphertext:
            return None
        return self._fernet.decrypt(ciphertext.encode()).decode()

    def mask_token(self, token: str, visible_chars: int = 4) -> str:
        """
        Mask a token showing only first and last N characters.

        Args:
            token: The token to mask
            visible_chars: Number of characters to show at start and end

        Returns:
            Masked token like "abcd...wxyz"
        """
        if not token:
            return None
        if len(token) <= visible_chars * 2:
            return "*" * len(token)
        return f"{token[:visible_chars]}...{token[-visible_chars:]}"


# Singleton instance
encryption_service = EncryptionService()
