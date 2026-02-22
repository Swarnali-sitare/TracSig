const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export function getApiUrl(path: string): string {
  const base = BASE_URL.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { accessToken?: string | null } = {}
): Promise<T> {
  const { accessToken, ...init } = options;
  const headers = new Headers(init.headers as HeadersInit);
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }
  const url = getApiUrl(path);
  const res = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as { message?: string }).message ?? res.statusText;
    throw new Error(message);
  }
  return data as T;
}
