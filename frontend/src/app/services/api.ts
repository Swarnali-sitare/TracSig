/**
 * Fetch helper for the Flask API: Bearer JWT, 401 → refresh → retry.
 * Base URL: VITE_API_URL or http://127.0.0.1:5000
 */

const ACCESS_KEY = "tracsig_access_token";
const REFRESH_KEY = "tracsig_refresh_token";

export function getApiBaseUrl(): string {
  const u = import.meta.env.VITE_API_URL;
  if (u != null && String(u).trim() !== "") {
    return String(u).replace(/\/$/, "");
  }
  return "http://127.0.0.1:5000";
}

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function setStoredTokens(access: string, refresh: string): void {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearStoredTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

function parseErrorBody(text: string, status: number): { message: string; code?: string } {
  try {
    const j = JSON.parse(text) as { error?: { message?: string; code?: string } };
    if (j?.error?.message) {
      return { message: j.error.message, code: j.error.code };
    }
  } catch {
    /* ignore */
  }
  return { message: text || `Request failed (${status})` };
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const rt = localStorage.getItem(REFRESH_KEY);
    if (!rt) return false;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rt }),
      });
      if (!res.ok) return false;
      const data = (await res.json()) as { access_token: string; refresh_token: string };
      setStoredTokens(data.access_token, data.refresh_token);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export type ApiRequestOptions = RequestInit & { _retry?: boolean };

export async function apiRequest<T>(path: string, init?: ApiRequestOptions): Promise<T> {
  const { _retry, ...rest } = init || {};
  const base = getApiBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const headers = new Headers(rest.headers);
  const body = rest.body;
  if (body != null && !(body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = localStorage.getItem(ACCESS_KEY);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res = await fetch(url, { ...rest, headers });

  if (res.status === 401 && !_retry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers.set("Authorization", `Bearer ${localStorage.getItem(ACCESS_KEY)}`);
      res = await fetch(url, { ...rest, headers, _retry: true });
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  if (!res.ok) {
    const { message, code } = parseErrorBody(text, res.status);
    throw new ApiRequestError(message, res.status, code);
  }

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

/** Like apiRequest but returns a Blob (previews); same refresh retry. */
export async function apiFetchBlob(path: string, init?: ApiRequestOptions): Promise<Blob> {
  const { _retry, ...rest } = init || {};
  const base = getApiBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path}`;
  const headers = new Headers(rest.headers);
  const token = localStorage.getItem(ACCESS_KEY);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res = await fetch(url, { ...rest, headers });

  if (res.status === 401 && !_retry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers.set("Authorization", `Bearer ${localStorage.getItem(ACCESS_KEY)}`);
      res = await fetch(url, { ...rest, headers, _retry: true });
    }
  }

  if (!res.ok) {
    const text = await res.text();
    const { message, code } = parseErrorBody(text, res.status);
    throw new ApiRequestError(message, res.status, code);
  }

  return res.blob();
}
