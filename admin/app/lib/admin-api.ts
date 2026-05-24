export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

class AdminAuthError extends Error {
  code: "AUTH_REQUIRED" | "UNAUTHORIZED";

  constructor(code: "AUTH_REQUIRED" | "UNAUTHORIZED") {
    super(code);
    this.code = code;
  }
}

export function clearAdminSession() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminUser");
}

export function getAdminToken() {
  if (typeof window === "undefined") {
    return "";
  }

  const token = localStorage.getItem("adminToken") || "";

  if (!token || token === "undefined" || token === "null") {
    return "";
  }

  return token;
}

function emitUnauthorized() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new CustomEvent("admin:unauthorized"));
}

export async function ensureAdminSession() {
  const token = getAdminToken();
  if (!token) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.status === 401 || response.status === 403) {
      clearAdminSession();
      emitUnauthorized();
      return false;
    }

    return response.ok;
  } catch {
    return false;
  }
}

export async function fetchAdmin(path: string, init?: RequestInit) {
  const token = getAdminToken();
  if (!token) {
    emitUnauthorized();
    throw new AdminAuthError("AUTH_REQUIRED");
  }

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    clearAdminSession();
    emitUnauthorized();
    throw new AdminAuthError("UNAUTHORIZED");
  }

  return response;
}
export async function apiFetch(path: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && init?.body && typeof init.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetchAdmin(path, { ...init, headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || response.statusText);
  }
  
  // if 204 No Content, return null
  if (response.status === 204) return null;
  return response.json();
}

export { API_BASE_URL, AdminAuthError };