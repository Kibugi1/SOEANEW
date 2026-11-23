/**
 * Client for the SOEA admin API (backend/docs/API_HANDOFF.md §4 and §7).
 *
 * The access token is kept in sessionStorage: it survives a page reload but not
 * closing the tab, and it expires after 15 minutes unless renewed. The session
 * provider renews it while the dashboard is open (at most 12 hours per sign-in).
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:5000/api/v1";

const TOKEN_KEY = "soea-admin-token";

export type Role = "admin" | "editor" | "author";

export interface AdminUser {
  id: string;
  email: string;
  role: Role;
  full_name: string | null;
  must_change_password: boolean;
  team_profile: { id: string; slug: string; display_name: string } | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  user: AdminUser;
}

export interface Pagination {
  page: number;
  per_page: number;
  total: number;
  pages: number;
}

export interface Collection<T> {
  data: T[];
  meta: { pagination: Pagination };
}

/** An error returned by the API, with field-level details for forms. */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: Record<string, string[] | Record<string, string[]>> = {},
  ) {
    super(message);
  }

  /** The first message for a form field, if the API reported one. */
  fieldError(field: string): string | undefined {
    const value = this.details[field];
    return Array.isArray(value) ? value[0] : undefined;
  }
}

export const tokenStore = {
  get(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable (private mode): the session lasts until reload */
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

let onUnauthorized: (() => void) | null = null;

/** The session provider registers how to react when the API rejects the token. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

type Options = Omit<RequestInit, "body"> & { json?: unknown; body?: BodyInit; auth?: boolean };

export async function apiFetch<T>(path: string, options: Options = {}): Promise<T> {
  const { json, auth = true, headers, ...init } = options;
  const requestHeaders = new Headers(headers);
  if (json !== undefined) requestHeaders.set("Content-Type", "application/json");
  const token = auth ? tokenStore.get() : null;
  if (token) requestHeaders.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: requestHeaders,
      body: json !== undefined ? JSON.stringify(json) : options.body,
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Cannot reach the SOEA server. Check your connection and try again.");
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const error = payload?.error ?? {};
    const apiError = new ApiError(
      response.status,
      error.code ?? "HTTP_ERROR",
      error.message ?? "Something went wrong. Please try again.",
      error.details ?? {},
    );
    if (response.status === 401 && auth && token) onUnauthorized?.();
    throw apiError;
  }
  return payload as T;
}

/** Unwraps the `{ data }` envelope of single-item responses. */
export async function apiData<T>(path: string, options: Options = {}): Promise<T> {
  const payload = await apiFetch<{ data: T }>(path, options);
  return payload.data;
}
