// Central auth-token storage. Single source of truth for the JWT and user id.
// Everything reads/writes through here so the login, logout, and API layers
// can never drift apart (previously the token was written to a cookie but read
// from localStorage, so every authenticated request sent an empty token).
import Cookies from "js-cookie";

const TOKEN_KEY = "auth_token";
const USER_ID_KEY = "user_id";

/** Persist the JWT and user id. `remember` controls session vs 7-day cookie. */
export function setAuth(token: string, userId: string, remember = true): void {
  const opts = remember ? { expires: 7 } : undefined;
  Cookies.set(TOKEN_KEY, token, opts);
  if (userId) {
    Cookies.set(USER_ID_KEY, userId, opts);
  }
}

/** The stored JWT, or "" when unauthenticated. */
export function getToken(): string {
  return Cookies.get(TOKEN_KEY) || "";
}

/** The stored user id, or "" when unavailable. */
export function getUserId(): string {
  return Cookies.get(USER_ID_KEY) || "";
}

/** Remove all auth cookies (logout). */
export function clearAuth(): void {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(USER_ID_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== "";
}
