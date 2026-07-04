export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export class AuthError extends Error {
  code: "AUTH_REQUIRED" | "UNAUTHORIZED";
  constructor(code: "AUTH_REQUIRED" | "UNAUTHORIZED") {
    super(code);
    this.code = code;
  }
}

export type SessionUser = {
  sub: string;
  email: string;
  role: string;
  fullName: string;
  profileImage?: string;
};

export function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("studentToken");
  localStorage.removeItem("studentUser");
}

export function getToken(): string {
  if (typeof window === "undefined") return "";
  const token = localStorage.getItem("studentToken") || "";
  if (!token || token === "undefined" || token === "null") return "";
  return token;
}

export function getUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("studentUser");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: SessionUser) {
  localStorage.setItem("studentToken", token);
  localStorage.setItem("studentUser", JSON.stringify(user));
}

function emitUnauthorized() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("student:unauthorized"));
}

export async function ensureSession(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/users/profile_data`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.status === 401 || res.status === 403) {
      clearSession();
      emitUnauthorized();
      return false;
    }
    return res.ok;
  } catch {
    return false;
  }
}

export async function apiFetch(path: string, init?: RequestInit) {
  const token = getToken();
  if (!token) {
    emitUnauthorized();
    throw new AuthError("AUTH_REQUIRED");
  }

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init?.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (res.status === 401) {
    clearSession();
    emitUnauthorized();
    throw new AuthError("UNAUTHORIZED");
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || res.statusText);
  }

  if (res.status === 204) return null;
  return res.json();
}
