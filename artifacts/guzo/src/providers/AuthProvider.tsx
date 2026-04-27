import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useGetCurrentUser, useLogout } from "@workspace/api-client-react";

type Role = "user" | "moderator" | "admin" | "superadmin";

const RANK: Record<Role, number> = {
  user: 0,
  moderator: 10,
  admin: 100,
  superadmin: 1000,
};

type AuthContextValue = {
  user:
    | {
        id: string;
        email: string;
        name: string;
        role: Role;
        status?: "active" | "suspended" | "banned";
      }
    | null;
  isLoading: boolean;
  isAuthed: boolean;
  /** Any privileged staff (moderator+). */
  isStaff: boolean;
  /** Has admin or super-admin powers. */
  isAdmin: boolean;
  /** Super-admin only. */
  isSuperAdmin: boolean;
  hasRoleAtLeast: (min: Role) => boolean;
  loginDialogOpen: boolean;
  loginReason: string | null;
  openLogin: (reason?: string) => void;
  closeLogin: () => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useGetCurrentUser();
  const logoutMutation = useLogout();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [loginReason, setLoginReason] = useState<string | null>(null);

  const openLogin = useCallback((reason?: string) => {
    setLoginReason(reason ?? null);
    setLoginDialogOpen(true);
  }, []);
  const closeLogin = useCallback(() => setLoginDialogOpen(false), []);

  const logout = useCallback(() => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        window.location.assign(import.meta.env.BASE_URL || "/");
      },
    });
  }, [logoutMutation]);

  const rawUser = data?.user ?? null;
  const user = rawUser
    ? {
        id: rawUser.id,
        email: rawUser.email,
        name: rawUser.name,
        role: ((rawUser.role as Role) ?? "user") as Role,
        status: ("status" in rawUser ? (rawUser as any).status : "active") as
          | "active"
          | "suspended"
          | "banned",
      }
    : null;

  const value = useMemo<AuthContextValue>(() => {
    const role = user?.role ?? "user";
    const rank = RANK[role] ?? 0;
    return {
      user,
      isLoading,
      isAuthed: !!user,
      isStaff: rank >= RANK.moderator,
      isAdmin: rank >= RANK.admin,
      isSuperAdmin: role === "superadmin",
      hasRoleAtLeast: (min: Role) => rank >= RANK[min],
      loginDialogOpen,
      loginReason,
      openLogin,
      closeLogin,
      logout,
    };
  }, [user, isLoading, loginDialogOpen, loginReason, openLogin, closeLogin, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
