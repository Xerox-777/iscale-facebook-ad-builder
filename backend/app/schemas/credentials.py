"""Pydantic schemas for API credential management."""

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# Facebook Credential Schemas
class FacebookCredentialBase(BaseModel):
    name: str
    ad_account_id: str
    app_id: Optional[str] = None
    is_default: bool = False
    is_active: bool = True


class FacebookCredentialCreate(FacebookCredentialBase):
    user_id: str
    access_token: str  # Will be encrypted before storage
    app_secret: Optional[str] = None  # Will be encrypted before storage


class FacebookCredentialUpdate(BaseModel):
    name: Optional[str] = None
    access_token: Optional[str] = None  # Will be encrypted before storage
    ad_account_id: Optional[str] = None
    app_id: Optional[str] = None
    app_secret: Optional[str] = None  # Will be encrypted before storage
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None


class FacebookCredentialResponse(FacebookCredentialBase):
    id: str
    user_id: str
    access_token_masked: str  # Shows first/last 4 chars
    app_secret_masked: Optional[str] = None  # Shows first/last 4 chars if present
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Gemini Credential Schemas
class GeminiCredentialBase(BaseModel):
    name: str
    is_default: bool = False
    is_active: bool = True


class GeminiCredentialCreate(GeminiCredentialBase):
    user_id: str
    api_key: str  # Will be encrypted before storage


class GeminiCredentialUpdate(BaseModel):
    name: Optional[str] = None
    api_key: Optional[str] = None  # Will be encrypted before storage
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None


class GeminiCredentialResponse(GeminiCredentialBase):
    id: str
    user_id: str
    api_key_masked: str  # Shows first/last 4 chars
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# User's own credentials view (masked)
class UserFacebookCredentialResponse(BaseModel):
    id: str
    name: str
    ad_account_id: str
    app_id: Optional[str] = None
    access_token_masked: str
    is_default: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserGeminiCredentialResponse(BaseModel):
    id: str
    name: str
    api_key_masked: str
    is_default: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserCredentialsResponse(BaseModel):
    facebook_credentials: List[UserFacebookCredentialResponse]
    gemini_credentials: List[UserGeminiCredentialResponse]


class SetDefaultCredentialRequest(BaseModel):
    credential_type: str  # "facebook" or "gemini"
    credential_id: str
