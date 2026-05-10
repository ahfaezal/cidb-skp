export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

export async function apiGet(path: string) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("API GET failed");
  }

  return res.json();
}

export async function apiPost(path: string, data: unknown) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
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
  const res = await fetch(`${API_BASE_URL}${path}`, {
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
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("API DELETE failed");
  }

  return res.json();
}
