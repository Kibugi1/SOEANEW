"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AdminUser,
  ApiError,
  TokenResponse,
  apiData,
  setUnauthorizedHandler,
  tokenStore,
} from "./api";

/** Renew a few minutes before the 15-minute token expires. */
const REFRESH_EVERY_MS = 10 * 60 * 1000;

type Status = "loading" | "signed-out" | "signed-in";

interface SessionValue {
  status: Status;
  user: AdminUser | null;
  /** Why the person was signed out, shown on the login screen. */
  notice: string | null;
  signIn(email: string, password: string): Promise<AdminUser>;
  signOut(): Promise<void>;
  changePassword(currentPassword: string, newPassword: string): Promise<AdminUser>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function AdminSessionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<AdminUser | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const refreshTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const endSession = useCallback((message: string | null) => {
    tokenStore.clear();
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    refreshTimer.current = null;
    setUser(null);
    setNotice(message);
    setStatus("signed-out");
  }, []);

  const startRefreshing = useCallback(() => {
    if (refreshTimer.current) clearInterval(refreshTimer.current);
    refreshTimer.current = setInterval(async () => {
      try {
        const fresh = await apiData<TokenResponse>("/auth/refresh", { method: "POST" });
        tokenStore.set(fresh.access_token);
        setUser(fresh.user);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          endSession("Your session has ended. Please sign in again.");
        }
        // Network errors: keep the session and try again at the next tick.
      }
    }, REFRESH_EVERY_MS);
  }, [endSession]);

  const accept = useCallback(
    (response: TokenResponse) => {
      tokenStore.set(response.access_token);
      setUser(response.user);
      setNotice(null);
      setStatus("signed-in");
      startRefreshing();
      return response.user;
    },
    [startRefreshing],
  );

  // Any request rejected for an expired or revoked token signs the person out.
  useEffect(() => {
    setUnauthorizedHandler(() => endSession("Your session has ended. Please sign in again."));
    return () => setUnauthorizedHandler(null);
  }, [endSession]);

  // Resume a session after a page reload.
  useEffect(() => {
    const resume = tokenStore.get()
      ? apiData<TokenResponse>("/auth/refresh", { method: "POST" })
      : Promise.reject(new ApiError(401, "NO_SESSION", ""));
    resume
      .then(accept)
      .catch((error) => {
        endSession(error instanceof ApiError && error.status === 0 ? error.message : null);
      });
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [accept, endSession]);

  const signIn = useCallback(
    async (email: string, password: string) =>
      accept(
        await apiData<TokenResponse>("/auth/login", {
          method: "POST",
          json: { email, password },
          auth: false,
        }),
      ),
    [accept],
  );

  const signOut = useCallback(async () => {
    try {
      await apiData("/auth/logout", { method: "POST" });
    } catch {
      /* already signed out on the server, or offline: clear locally anyway */
    }
    endSession("You have signed out.");
  }, [endSession]);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) =>
      accept(
        await apiData<TokenResponse>("/auth/change-password", {
          method: "POST",
          json: { current_password: currentPassword, new_password: newPassword },
        }),
      ),
    [accept],
  );

  const value = useMemo(
    () => ({ status, user, notice, signIn, signOut, changePassword }),
    [status, user, notice, signIn, signOut, changePassword],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useAdminSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useAdminSession must be used inside AdminSessionProvider.");
  return value;
}

export const ROLE_LABELS: Record<AdminUser["role"], string> = {
  admin: "Admin",
  editor: "Editor",
  author: "Author",
};
