"""API endpoints for managing user API credentials."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import User, FacebookCredential, GeminiCredential
from app.core.deps import get_current_superuser, get_current_active_user
from app.core.encryption import encryption_service
from app.services.credential_service import credential_service
from app.schemas.credentials import (
    FacebookCredentialCreate,
    FacebookCredentialUpdate,
    FacebookCredentialResponse,
    GeminiCredentialCreate,
    GeminiCredentialUpdate,
    GeminiCredentialResponse,
    UserCredentialsResponse,
    UserFacebookCredentialResponse,
    UserGeminiCredentialResponse,
    SetDefaultCredentialRequest,
)

router = APIRouter()


def _build_facebook_response(cred: FacebookCredential) -> FacebookCredentialResponse:
    """Build response object with masked tokens."""
    return FacebookCredentialResponse(
        id=cred.id,
        user_id=cred.user_id,
        name=cred.name,
        ad_account_id=cred.ad_account_id,
        app_id=cred.app_id,
        is_default=cred.is_default,
        is_active=cred.is_active,
        access_token_masked=encryption_service.mask_token(
            encryption_service.decrypt(cred.access_token_encrypted)
        ),
        app_secret_masked=encryption_service.mask_token(
            encryption_service.decrypt(cred.app_secret_encrypted)
        ) if cred.app_secret_encrypted else None,
        created_at=cred.created_at,
        updated_at=cred.updated_at,
    )


def _build_gemini_response(cred: GeminiCredential) -> GeminiCredentialResponse:
    """Build response object with masked API key."""
    return GeminiCredentialResponse(
        id=cred.id,
        user_id=cred.user_id,
        name=cred.name,
        is_default=cred.is_default,
        is_active=cred.is_active,
        api_key_masked=encryption_service.mask_token(
            encryption_service.decrypt(cred.api_key_encrypted)
        ),
        created_at=cred.created_at,
        updated_at=cred.updated_at,
    )


# ==================== Facebook Credentials (Superuser Only) ====================

@router.get("/facebook", response_model=List[FacebookCredentialResponse])
async def list_facebook_credentials(
    user_id: str = None,
    current_user: User = Depends(get_current_superuser),
    db: Session = Depends(get_db),
):
    """List all Facebook credentials (superuser only). Optionally filter by user_id."""
    query = db.query(FacebookCredential)
    if user_id:
        query = query.filter(FacebookCredential.user_id == user_id)
    credentials = query.all()
    return [_build_facebook_response(c) for c in credentials]


@router.post("/facebook", response_model=FacebookCredentialResponse, status_code=status.HTTP_201_CREATED)
async def create_facebook_credential(
    data: FacebookCredentialCreate,
    current_user: User = Depends(get_current_superuser),
    db: Session = Depends(get_db),
):
    """Create a Facebook credential for a user (superuser only)."""
    # Verify user exists
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # If setting as default, clear other defaults for this user
    if data.is_default:
        db.query(FacebookCredential).filter(
            FacebookCredential.user_id == data.user_id,
            FacebookCredential.is_default == True
        ).update({"is_default": False})

    cred = FacebookCredential(
        user_id=data.user_id,
        name=data.name,
        access_token_encrypted=encryption_service.encrypt(data.access_token),
        ad_account_id=data.ad_account_id,
        app_id=data.app_id,
        app_secret_encrypted=encryption_service.encrypt(data.app_secret) if data.app_secret else None,
        is_default=data.is_default,
        is_active=data.is_active,
    )

    db.add(cred)
    db.commit()
    db.refresh(cred)

    return _build_facebook_response(cred)


@router.get("/facebook/{credential_id}", response_model=FacebookCredentialResponse)
async def get_facebook_credential(
    credential_id: str,
    current_user: User = Depends(get_current_superuser),
    db: Session = Depends(get_db),
):
    """Get a specific Facebook credential (superuser only)."""
    cred = db.query(FacebookCredential).filter(FacebookCredential.id == credential_id).first()
    if not cred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credential not found"
        )
    return _build_facebook_response(cred)


@router.put("/facebook/{credential_id}", response_model=FacebookCredentialResponse)
async def update_facebook_credential(
    credential_id: str,
    data: FacebookCredentialUpdate,
    current_user: User = Depends(get_current_superuser),
    db: Session = Depends(get_db),
):
    """Update a Facebook credential (superuser only)."""
    cred = db.query(FacebookCredential).filter(FacebookCredential.id == credential_id).first()
    if not cred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credential not found"
        )

    if data.name is not None:
        cred.name = data.name
    if data.access_token is not None:
        cred.access_token_encrypted = encryption_service.encrypt(data.access_token)
    if data.ad_account_id is not None:
        cred.ad_account_id = data.ad_account_id
    if data.app_id is not None:
        cred.app_id = data.app_id
    if data.app_secret is not None:
        cred.app_secret_encrypted = encryption_service.encrypt(data.app_secret)
    if data.is_active is not None:
        cred.is_active = data.is_active
    if data.is_default is not None:
        if data.is_default:
            # Clear other defaults for this user
            db.query(FacebookCredential).filter(
                FacebookCredential.user_id == cred.user_id,
                FacebookCredential.is_default == True,
                FacebookCredential.id != credential_id
            ).update({"is_default": False})
        cred.is_default = data.is_default

    db.commit()
    db.refresh(cred)

    return _build_facebook_response(cred)


@router.delete("/facebook/{credential_id}")
async def delete_facebook_credential(
    credential_id: str,
    current_user: User = Depends(get_current_superuser),
    db: Session = Depends(get_db),
):
    """Delete a Facebook credential (superuser only)."""
    cred = db.query(FacebookCredential).filter(FacebookCredential.id == credential_id).first()
    if not cred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credential not found"
        )

    db.delete(cred)
    db.commit()

    return {"message": "Credential deleted successfully"}


# ==================== Gemini Credentials (Superuser Only) ====================

@router.get("/gemini", response_model=List[GeminiCredentialResponse])
async def list_gemini_credentials(
    user_id: str = None,
    current_user: User = Depends(get_current_superuser),
    db: Session = Depends(get_db),
):
    """List all Gemini credentials (superuser only). Optionally filter by user_id."""
    query = db.query(GeminiCredential)
    if user_id:
        query = query.filter(GeminiCredential.user_id == user_id)
    credentials = query.all()
    return [_build_gemini_response(c) for c in credentials]


@router.post("/gemini", response_model=GeminiCredentialResponse, status_code=status.HTTP_201_CREATED)
async def create_gemini_credential(
    data: GeminiCredentialCreate,
    current_user: User = Depends(get_current_superuser),
    db: Session = Depends(get_db),
):
    """Create a Gemini credential for a user (superuser only)."""
    # Verify user exists
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # If setting as default, clear other defaults for this user
    if data.is_default:
        db.query(GeminiCredential).filter(
            GeminiCredential.user_id == data.user_id,
            GeminiCredential.is_default == True
        ).update({"is_default": False})

    cred = GeminiCredential(
        user_id=data.user_id,
        name=data.name,
        api_key_encrypted=encryption_service.encrypt(data.api_key),
        is_default=data.is_default,
        is_active=data.is_active,
    )

    db.add(cred)
    db.commit()
    db.refresh(cred)

    return _build_gemini_response(cred)


@router.get("/gemini/{credential_id}", response_model=GeminiCredentialResponse)
async def get_gemini_credential(
    credential_id: str,
    current_user: User = Depends(get_current_superuser),
    db: Session = Depends(get_db),
):
    """Get a specific Gemini credential (superuser only)."""
    cred = db.query(GeminiCredential).filter(GeminiCredential.id == credential_id).first()
    if not cred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credential not found"
        )
    return _build_gemini_response(cred)


@router.put("/gemini/{credential_id}", response_model=GeminiCredentialResponse)
async def update_gemini_credential(
    credential_id: str,
    data: GeminiCredentialUpdate,
    current_user: User = Depends(get_current_superuser),
    db: Session = Depends(get_db),
):
    """Update a Gemini credential (superuser only)."""
    cred = db.query(GeminiCredential).filter(GeminiCredential.id == credential_id).first()
    if not cred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credential not found"
        )

    if data.name is not None:
        cred.name = data.name
    if data.api_key is not None:
        cred.api_key_encrypted = encryption_service.encrypt(data.api_key)
    if data.is_active is not None:
        cred.is_active = data.is_active
    if data.is_default is not None:
        if data.is_default:
            # Clear other defaults for this user
            db.query(GeminiCredential).filter(
                GeminiCredential.user_id == cred.user_id,
                GeminiCredential.is_default == True,
                GeminiCredential.id != credential_id
            ).update({"is_default": False})
        cred.is_default = data.is_default

    db.commit()
    db.refresh(cred)

    return _build_gemini_response(cred)


@router.delete("/gemini/{credential_id}")
async def delete_gemini_credential(
    credential_id: str,
    current_user: User = Depends(get_current_superuser),
    db: Session = Depends(get_db),
):
    """Delete a Gemini credential (superuser only)."""
    cred = db.query(GeminiCredential).filter(GeminiCredential.id == credential_id).first()
    if not cred:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credential not found"
        )

    db.delete(cred)
    db.commit()

    return {"message": "Credential deleted successfully"}


# ==================== User's Own Credentials ====================

@router.get("/me", response_model=UserCredentialsResponse)
async def get_my_credentials(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get current user's credentials (masked view)."""
    fb_creds = db.query(FacebookCredential).filter(
        FacebookCredential.user_id == current_user.id
    ).all()

    gemini_creds = db.query(GeminiCredential).filter(
        GeminiCredential.user_id == current_user.id
    ).all()

    return UserCredentialsResponse(
        facebook_credentials=[
            UserFacebookCredentialResponse(
                id=c.id,
                name=c.name,
                ad_account_id=c.ad_account_id,
                app_id=c.app_id,
                access_token_masked=encryption_service.mask_token(
                    encryption_service.decrypt(c.access_token_encrypted)
                ),
                is_default=c.is_default,
                is_active=c.is_active,
                created_at=c.created_at,
            )
            for c in fb_creds
        ],
        gemini_credentials=[
            UserGeminiCredentialResponse(
                id=c.id,
                name=c.name,
                api_key_masked=encryption_service.mask_token(
                    encryption_service.decrypt(c.api_key_encrypted)
                ),
                is_default=c.is_default,
                is_active=c.is_active,
                created_at=c.created_at,
            )
            for c in gemini_creds
        ],
    )


@router.put("/me/default")
async def set_my_default_credential(
    data: SetDefaultCredentialRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Set default credential for current user."""
    success = credential_service.set_default_credential(
        db, current_user, data.credential_type, data.credential_id
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credential not found or invalid type"
        )

    return {"message": "Default credential updated"}
