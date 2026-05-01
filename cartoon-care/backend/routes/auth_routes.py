"""
auth_routes.py — Authentication API endpoints
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.config import settings
from services.auth_service import (
    register_user,
    authenticate_user,
    get_all_users,
    delete_user_by_id,
    get_current_user,
    require_admin,
    create_access_token,
    get_or_create_google_user,
)
from models.user_model import User
from typing import List
import logging
import httpx
import urllib.parse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user account."""
    result = await register_user(db, data)
    return result


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login with email and password. Returns JWT token."""
    user = await authenticate_user(db, data.email, data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/logout")
async def logout():
    """Logout — client should discard the token."""
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return current_user


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin only — list all registered users."""
    return await get_all_users(db)


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Admin only — delete a user and all their stories."""
    deleted = await delete_user_by_id(db, user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")


# ════════════════════════════════════════════════════════════════
# GOOGLE OAUTH
# ════════════════════════════════════════════════════════════════

@router.get("/google")
async def google_login():
    """Redirects user to Google's OAuth consent screen."""
    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    }
    google_auth_url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)
    return RedirectResponse(url=google_auth_url)


@router.get("/google/callback")
async def google_callback(code: str = None, error: str = None, db: AsyncSession = Depends(get_db)):
    """Handles Google OAuth callback, creates/logs in user, redirects to frontend."""
    if error or not code:
        return RedirectResponse(url="http://localhost:5173/login?error=google_auth_failed")

    try:
        async with httpx.AsyncClient() as client:
            # Exchange code for tokens
            token_res = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                    "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code",
                },
            )
            token_data = token_res.json()

            if "error" in token_data:
                logger.error(f"Google token error: {token_data}")
                return RedirectResponse(url="http://localhost:5173/login?error=token_failed")

            access_token = token_data.get("access_token")

            # Get user info from Google
            user_res = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )
            google_user = user_res.json()

        # Get or create user in our database
        user = await get_or_create_google_user(
            db,
            email=google_user.get("email"),
            name=google_user.get("name", google_user.get("email", "").split("@")[0]),
            google_id=google_user.get("id"),
        )

        # Create our JWT token
        jwt_token = create_access_token({"sub": str(user.id), "role": user.role})

        # Redirect to frontend with token
        frontend_url = f"http://localhost:5173/auth/callback?token={jwt_token}&user={urllib.parse.quote_plus(str({'id': user.id, 'name': user.name, 'email': user.email, 'role': user.role}))}"
        return RedirectResponse(url=frontend_url)

    except Exception as e:
        logger.error(f"Google OAuth error: {e}")
        return RedirectResponse(url="http://localhost:5173/login?error=server_error")
