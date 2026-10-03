"""Bounded AI calls and per-user throttling for the single-worker deployment."""
import asyncio
import logging
import os
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
                if response.status_code in (429, 502, 503) and attempt == 0:
                    await asyncio.sleep(2)
                    continue
                if response.status_code >= 400:
                    _log.warning("AI provider failure status=%s request_id=%s", response.status_code, response.headers.get("x-request-id"))
                    message = "Kuota atau had AI telah dicapai. Hubungi pentadbir." if response.status_code == 429 else "Permintaan AI gagal. Hubungi pentadbir atau cuba semula."
                    raise HTTPException(502, message)
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
