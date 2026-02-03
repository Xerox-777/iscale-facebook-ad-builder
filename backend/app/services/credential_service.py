"""Service for managing and retrieving user API credentials."""

from typing import Optional, Tuple
from sqlalchemy.orm import Session
from app.models import User, FacebookCredential, GeminiCredential
from app.core.encryption import encryption_service


class CredentialService:
    """Service for retrieving decrypted user credentials."""

    @staticmethod
    def get_user_facebook_credentials(
        db: Session, user: User
    ) -> Optional[Tuple[str, str, Optional[str], Optional[str]]]:
        """
        Get user's default Facebook credentials (decrypted).

        Args:
            db: Database session
            user: User object

        Returns:
            Tuple of (access_token, ad_account_id, app_id, app_secret) or None
        """
        # First try to get the default credential
        cred = db.query(FacebookCredential).filter(
            FacebookCredential.user_id == user.id,
            FacebookCredential.is_default == True,
            FacebookCredential.is_active == True
        ).first()

        # Fallback to any active credential
        if not cred:
            cred = db.query(FacebookCredential).filter(
                FacebookCredential.user_id == user.id,
                FacebookCredential.is_active == True
            ).first()

        if not cred:
            return None

        return (
            encryption_service.decrypt(cred.access_token_encrypted),
            cred.ad_account_id,
            cred.app_id,
            encryption_service.decrypt(cred.app_secret_encrypted) if cred.app_secret_encrypted else None
        )

    @staticmethod
    def get_user_gemini_key(db: Session, user: User) -> Optional[str]:
        """
        Get user's default Gemini API key (decrypted).

        Args:
            db: Database session
            user: User object

        Returns:
            Decrypted API key string or None
        """
        # First try to get the default credential
        cred = db.query(GeminiCredential).filter(
            GeminiCredential.user_id == user.id,
            GeminiCredential.is_default == True,
            GeminiCredential.is_active == True
        ).first()

        # Fallback to any active credential
        if not cred:
            cred = db.query(GeminiCredential).filter(
                GeminiCredential.user_id == user.id,
                GeminiCredential.is_active == True
            ).first()

        if not cred:
            return None

        return encryption_service.decrypt(cred.api_key_encrypted)

    @staticmethod
    def set_default_credential(
        db: Session, user: User, credential_type: str, credential_id: str
    ) -> bool:
        """
        Set a credential as the default for a user.

        Args:
            db: Database session
            user: User object
            credential_type: "facebook" or "gemini"
            credential_id: ID of the credential to set as default

        Returns:
            True if successful, False otherwise
        """
        if credential_type == "facebook":
            # Clear existing default
            db.query(FacebookCredential).filter(
                FacebookCredential.user_id == user.id,
                FacebookCredential.is_default == True
            ).update({"is_default": False})

            # Set new default
            cred = db.query(FacebookCredential).filter(
                FacebookCredential.id == credential_id,
                FacebookCredential.user_id == user.id
            ).first()

            if cred:
                cred.is_default = True
                db.commit()
                return True

        elif credential_type == "gemini":
            # Clear existing default
            db.query(GeminiCredential).filter(
                GeminiCredential.user_id == user.id,
                GeminiCredential.is_default == True
            ).update({"is_default": False})

            # Set new default
            cred = db.query(GeminiCredential).filter(
                GeminiCredential.id == credential_id,
                GeminiCredential.user_id == user.id
            ).first()

            if cred:
                cred.is_default = True
                db.commit()
                return True

        return False


# Singleton instance
credential_service = CredentialService()
