from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.auth_service import (
    ALLOWED_ROLES,
    create_access_token,
    get_current_user,
    get_db,
    hash_password,
    require_roles,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class UserCreate(BaseModel):
    email: str
    name: str
    role: str
    projectRef: str = "SKP-CIDB"
    password: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    projectRef: str
    isActive: bool


def user_to_response(user: User):
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        projectRef=user.project_ref,
        isActive=user.is_active,
    )


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email.lower()).first()

    if not user or not user.is_active or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email atau kata laluan tidak sah.")

    return {
        "accessToken": create_access_token(user),
        "user": user_to_response(user),
    }


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    return user_to_response(user)


@router.get("/users", response_model=List[UserResponse])
def list_users(
    _: User = Depends(require_roles("Super Admin")),
    db: Session = Depends(get_db),
):
    return [user_to_response(user) for user in db.query(User).order_by(User.name.asc()).all()]


@router.post("/users", response_model=UserResponse)
def create_user(
    data: UserCreate,
    _: User = Depends(require_roles("Super Admin")),
    db: Session = Depends(get_db),
):
    role = data.role.strip()
    if role not in ALLOWED_ROLES:
        raise HTTPException(status_code=422, detail="Peranan pengguna tidak sah.")

    if db.query(User).filter(User.email == data.email.lower()).first():
        raise HTTPException(status_code=409, detail="Email pengguna telah wujud.")

    user = User(
        email=data.email.lower(),
        name=data.name.strip(),
        role=role,
        project_ref=data.projectRef.strip() or "SKP-CIDB",
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return user_to_response(user)
