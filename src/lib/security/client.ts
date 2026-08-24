const SECURITY_API_URL = process.env.NEXT_PUBLIC_SECURITY_API_URL ?? "";
const SECURITY_API_KEY = process.env.NEXT_PUBLIC_SECURITY_API_KEY ?? "";

class SecurityApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`Security API ${status}`);
    this.status = status;
    this.body = body;
  }
}

async function securityFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${SECURITY_API_URL}${path}`, {
    ...options,
    headers: {
      "x-api-key": SECURITY_API_KEY,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) throw new SecurityApiError(res.status, body);
  return body as T;
}

export type SecurityTenant = {
  id: string;
  name: string;
  slug: string;
  status: "active" | "suspended" | "archived";
  plan: string;
  max_operators: number;
  contact_email: string;
  contact_name: string;
  created_at: string;
  operator_count?: number;
  site_count?: number;
};

export type SecurityUser = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization_id: string;
  active: boolean;
  created_at: string;
};

export type SecurityAuditLog = {
  id: string;
  actor_id: string;
  actor_email: string;
  action: string;
  target_type: string;
  target_id: string;
  details: Record<string, unknown>;
  created_at: string;
};

export type SecurityDashboardStats = {
  tenants_by_status: Record<string, number>;
  tenants_by_plan: Record<string, number>;
  total_operators: number;
  total_sites: number;
  total_clients: number;
  active_shifts: number;
  pending_invitations: number;
  activity_24h: number;
};

export type SecurityConfig = Record<string, unknown>;

export const securityApi = {
  listTenants: (params?: Record<string, string>) =>
    securityFetch<{ tenants: SecurityTenant[]; total: number }>(
      `/tenants${params ? "?" + new URLSearchParams(params) : ""}`
    ),

  getTenant: (id: string) =>
    securityFetch<{ tenant: SecurityTenant }>(`/tenants/${id}`),

  createTenant: (data: Partial<SecurityTenant>) =>
    securityFetch<{ tenant: SecurityTenant }>("/tenants", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateTenant: (id: string, data: Partial<SecurityTenant>) =>
    securityFetch<{ tenant: SecurityTenant }>(`/tenants/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  suspendTenant: (id: string) =>
    securityFetch(`/tenants/${id}/suspend`, { method: "POST" }),

  activateTenant: (id: string) =>
    securityFetch(`/tenants/${id}/activate`, { method: "POST" }),

  archiveTenant: (id: string) =>
    securityFetch(`/tenants/${id}/archive`, { method: "POST" }),

  listUsers: (params?: Record<string, string>) =>
    securityFetch<{ users: SecurityUser[]; total: number }>(
      `/users${params ? "?" + new URLSearchParams(params) : ""}`
    ),

  getUser: (id: string) =>
    securityFetch<{ user: SecurityUser }>(`/users/${id}`),

  disableUser: (id: string, reason?: string) =>
    securityFetch(`/users/${id}/disable`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  enableUser: (id: string) =>
    securityFetch(`/users/${id}/enable`, { method: "POST" }),

  listAudit: (params?: Record<string, string>) =>
    securityFetch<{ logs: SecurityAuditLog[]; total: number }>(
      `/audit${params ? "?" + new URLSearchParams(params) : ""}`
    ),

  dashboardStats: () =>
    securityFetch<SecurityDashboardStats>("/stats/dashboard"),

  getConfig: () =>
    securityFetch<SecurityConfig>("/config"),

  updateConfig: (data: Record<string, unknown>) =>
    securityFetch("/config", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};
