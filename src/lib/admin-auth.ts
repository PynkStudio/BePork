export const ADMIN_SESSION_KEY = "bepork-admin-session";
export const ADMIN_TOKEN_HEADER = "x-bepork-admin";

export function getAdminPassword(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
    return process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  }
  return "admin";
}
