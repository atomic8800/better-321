"use client";

export const TOKEN_KEY = "pulse_token";
export const SESSION_HEADER = "x-session-token";

export function getToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null | undefined): void {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* storage unavailable */
  }
}

export function clearToken(): void {
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

/** fetch() that always includes the session (cookie + header fallback). */
export function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const h = new Headers(init.headers);
  const t = getToken();
  if (t) h.set(SESSION_HEADER, t);
  return fetch(input, { ...init, headers: h, credentials: "include", cache: "no-store" });
}

/** Append the token to a URL (for EventSource, which cannot send custom headers). */
export function withToken(url: string): string {
  const t = getToken();
  if (!t) return url;
  return `${url}${url.includes("?") ? "&" : "?"}token=${encodeURIComponent(t)}`;
}

export function hardNavigate(path: string): void {
  window.location.assign(path);
}
