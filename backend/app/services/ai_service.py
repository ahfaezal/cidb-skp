"""Bounded AI calls and per-user throttling for the single-worker deployment."""
import asyncio
import logging
import os
import re
import time
from collections import defaultdict, deque
from threading import Lock

import httpx
from fastapi import Depends, HTTPException, Request

from app.services.auth_service import get_current_user

_history = defaultdict(deque)
_lock = Lock()
_active = set()
_log = logging.getLogger(__name__)


def check_rate(key, limit, window):
    now = time.monotonic()
    with _lock:
        # Bound the number of remembered keys as well as each queue.
        for old_key in list(_history):
            if not _history[old_key] or _history[old_key][-1] <= now - 3600:
                del _history[old_key]
        history = _history[key]
        while history and history[0] <= now - window:
            history.popleft()
        if len(history) >= limit:
            raise HTTPException(429, "Terlalu banyak permintaan. Cuba semula sebentar lagi.", headers={"Retry-After": str(window)})
        history.append(now)


def limit_login(request: Request):
    check_rate(("login", request.client.host if request.client else "unknown"), 15, 300)


def ai_user(user=Depends(get_current_user)):
    check_rate(("ai", user.id), 6, 60)
    return user


QUOTA_CODES = {"insufficient_quota", "credit_balance_exhausted", "billing_hard_limit_reached", "usage_limit_reached", "spend_limit_reached"}


def provider_error(response):
    try:
        error = response.json().get("error", {})
    except (ValueError, AttributeError):
        error = {}
    return error if isinstance(error, dict) else {}


def safe_diagnostic(value):
    # Never log credentials or full request/document bodies.
    text = str(value or "")
    key = os.getenv("OPENAI_API_KEY")
    if key:
        text = text.replace(key, "[redacted]")
    text = re.sub(r"sk-[A-Za-z0-9_-]+", "[redacted]", text)
    return text.replace("\n", " ").replace("\r", " ")[:700]


def provider_failure(response):
    error = provider_error(response)
    code, kind = error.get("code"), error.get("type")
    _log.warning(
        "AI provider failure status=%s code=%s type=%s model_request_id=%s reason=%s retry_after=%s remaining_tokens=%s remaining_requests=%s",
        response.status_code, safe_diagnostic(code), safe_diagnostic(kind),
        response.headers.get("x-request-id"), safe_diagnostic(error.get("message")),
        response.headers.get("retry-after"), response.headers.get("x-ratelimit-remaining-tokens"),
        response.headers.get("x-ratelimit-remaining-requests"),
    )
    if code in QUOTA_CODES or kind == "insufficient_quota":
        return HTTPException(503, "Kredit atau had belanja projek API pada server tidak mencukupi. Pentadbir perlu semak akaun dan projek API yang digunakan server.")
    if response.status_code == 429:
        return HTTPException(429, "Had permintaan atau token AI sementara dicapai. Tunggu sebentar dan cuba dengan jumlah soalan atau fail nota yang lebih kecil.", headers={"Retry-After": response.headers.get("retry-after", "60")})
    if response.status_code in (401, 403):
        return HTTPException(503, "Akses API AI pada server gagal. Pentadbir perlu semak kunci API dan kebenaran projek.")
    return HTTPException(502, "Permintaan AI gagal. Hubungi pentadbir atau cuba semula.")


async def request_ai(payload, user_id, timeout=120):
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise HTTPException(503, "AI belum dikonfigurasi. Hubungi pentadbir.")
    with _lock:
        if user_id in _active or len(_active) >= 3:
            raise HTTPException(429, "Penjanaan AI sedang berjalan. Tunggu sebelum mencuba semula.", headers={"Retry-After": "10"})
        _active.add(user_id)
    payload = {**payload, "store": False, "max_output_tokens": 16000}
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            for attempt in range(2):
                response = await client.post("https://api.openai.com/v1/responses", headers={"Authorization": f"Bearer {key}"}, json=payload)
                error = provider_error(response) if response.status_code >= 400 else {}
                quota = error.get("code") in QUOTA_CODES or error.get("type") == "insufficient_quota"
                if response.status_code in (429, 502, 503) and not quota and attempt == 0:
                    try:
                        delay = float(response.headers.get("retry-after", "5"))
                    except ValueError:
                        delay = 5
                    # Long waits and oversized requests need user action, not repeated calls.
                    if 0 <= delay <= 15 and "too large" not in str(error.get("message", "")).lower():
                        await asyncio.sleep(max(2, delay))
                        continue
                if response.status_code >= 400:
                    raise provider_failure(response)
                data = response.json()
                if data.get("status") in ("incomplete", "failed", "cancelled"):
                    raise HTTPException(502, "Hasil AI tidak lengkap. Kurangkan jumlah soalan dan cuba semula.")
                _log.info("AI usage user=%s model=%s usage=%s request_id=%s", user_id, payload.get("model"), data.get("usage"), response.headers.get("x-request-id"))
                return data
    except httpx.TimeoutException as exc:
        raise HTTPException(504, "AI mengambil masa terlalu lama. Kurangkan jumlah soalan dan cuba semula.") from exc
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(502, "Sambungan AI terganggu. Cuba semula.") from exc
    finally:
        with _lock:
            _active.discard(user_id)
