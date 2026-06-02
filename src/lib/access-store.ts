// Client-side access code storage (sessionStorage).
const KEY = "nv_access_code";

export function getAccessCode(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(KEY);
}

export function setAccessCode(code: string) {
  sessionStorage.setItem(KEY, code);
}

export function clearAccessCode() {
  sessionStorage.removeItem(KEY);
}

export function requireAccess(): string {
  const c = getAccessCode();
  if (!c) throw new Error("No access code");
  return c;
}
