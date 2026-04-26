import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useGetCurrentUser, useLogout } from "@workspace/api-client-react";

type AuthContextValue = {
  user:
    | {
        id: string;
        email: string;
        name: string;
        role: string;
      }
    | null;
  isLoading: boolean;
  isAuthed: boolean;
  isAdmin: boolean;
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

  const user = data?.user ?? null;
  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthed: !!user,
      isAdmin: user?.role === "admin" || user?.role === "superadmin",
      loginDialogOpen,
      loginReason,
      openLogin,
      closeLogin,
      logout,
    }),
    [user, isLoading, loginDialogOpen, loginReason, openLogin, closeLogin, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
