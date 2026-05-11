import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Optional

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.user import User


ALLOWED_ROLES = {
    "Super Admin",
    "Project Manager",
    "Fasilitator",
    "Pegawai CIDB",
    "Pegawai Penilai",
    "Ahli Panel Pembangun",
}


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _secret_key():
    return os.getenv("AUTH_SECRET_KEY") or os.getenv("SECRET_KEY") or "skp-cidb-dev-secret"


def _b64encode(data: bytes):
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64decode(data: str):
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode(data + padding)


def hash_password(password: str):
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120000)
    return f"pbkdf2_sha256${salt}${digest.hex()}"


def verify_password(password: str, password_hash: str):
    try:
        algorithm, salt, expected = password_hash.split("$", 2)
    except ValueError:
        return False

    if algorithm != "pbkdf2_sha256":
        return False

    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120000)
    return hmac.compare_digest(digest.hex(), expected)


def create_access_token(user: User):
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "projectRef": user.project_ref,
        "exp": int(time.time()) + (60 * 60 * 24),
    }
    body = _b64encode(json.dumps(payload, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(_secret_key().encode("utf-8"), body.encode("utf-8"), hashlib.sha256).digest()
    return f"{body}.{_b64encode(signature)}"


def decode_access_token(token: str):
    try:
        body, signature = token.split(".", 1)
        expected = hmac.new(_secret_key().encode("utf-8"), body.encode("utf-8"), hashlib.sha256).digest()
        if not hmac.compare_digest(_b64decode(signature), expected):
            raise ValueError("Invalid signature")
        payload = json.loads(_b64decode(body))
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Token tidak sah.") from exc

    if int(payload.get("exp", 0)) < int(time.time()):
        raise HTTPException(status_code=401, detail="Sesi telah tamat.")

    return payload


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Login diperlukan.")

    payload = decode_access_token(authorization.split(" ", 1)[1])
    user = db.query(User).filter(User.id == int(payload["sub"]), User.is_active.is_(True)).first()

    if not user:
        raise HTTPException(status_code=401, detail="Pengguna tidak aktif atau tidak ditemui.")

    return user


def require_roles(*roles: str):
    def dependency(user: User = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(status_code=403, detail="Akses tidak dibenarkan.")
        return user

    return dependency
