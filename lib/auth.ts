const AUTH_KEY = "facttic-auth";

export interface AuthUser {
  email: string;
  loggedIn: boolean;
  timestamp: number;}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function login(email: string): void {  if (!isBrowser()) return;
  const payload: AuthUser = {
    email,
    loggedIn: true,
    timestamp: Date.now(),
  };
  localStorage.setItem(AUTH_KEY, JSON.stringify(payload));
}

export function logout(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(AUTH_KEY);
}

export function isAuthenticated(): boolean {
  if (!isBrowser()) return false;
  return localStorage.getItem(AUTH_KEY) !== null;
}

export function getUser(): AuthUser | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}
