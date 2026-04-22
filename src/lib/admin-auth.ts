export const ADMIN_SESSION_KEY = "bepork-admin-session";
export const ADMIN_TOKEN_HEADER = "x-bepork-admin";

export function readAdminSession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(ADMIN_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAdminSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ADMIN_SESSION_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

export function clearAdminSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function getAdminPassword(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
    return process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  }
  return "admin";
}

/** Dopo login: solo path interni admin/cucina (no open redirect). */
export function getSafeAdminPostLoginPath(raw: string | null): string {
  const fallback = "/admin";
  if (!raw) return fallback;
  let path: string;
  try {
    path = decodeURIComponent(raw.trim());
  } catch {
    return fallback;
  }
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  if (path.startsWith("/admin/login")) return fallback;
  if (path === "/cucina" || path.startsWith("/cucina/")) return path;
  if (path.startsWith("/admin")) return path;
  return fallback;
}
