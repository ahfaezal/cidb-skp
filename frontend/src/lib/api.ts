export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export async function apiFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = typeof window === "undefined" ? "" : window.localStorage.getItem("skpAuthToken");
  if (token && input.startsWith(`${API_BASE_URL}/`)) headers.set("Authorization", `Bearer ${token}`);
  try {
    const response = await fetch(input, { ...init, headers, signal: init.signal || AbortSignal.timeout(180000) });
    if (response.status === 401 && token && typeof window !== "undefined") window.dispatchEvent(new Event("skp-session-expired"));
    return response;
  } catch (error) {
    if (error instanceof DOMException && ["TimeoutError", "AbortError"].includes(error.name)) throw new Error("Permintaan mengambil masa terlalu lama. Cuba semula; draf anda masih dalam paparan.");
    throw new Error("Sambungan ke pelayan terganggu. Semak internet dan cuba semula.");
  }
}

export async function apiGet(path: string) {
  const res = await apiFetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("API GET failed");
  }

  return res.json();
}

export async function apiPost(path: string, data: unknown) {
  const res = await apiFetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("API POST failed");
  }

  return res.json();
}

export async function apiPut(path: string, data: unknown) {
  const res = await apiFetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("API PUT failed");
  }

  return res.json();
}

export async function apiDelete(path: string) {
  const res = await apiFetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("API DELETE failed");
  }

  return res.json();
}
