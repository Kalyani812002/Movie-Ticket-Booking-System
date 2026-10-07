import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [sessionError, setSessionError] = useState("");

  const restoreSession = useCallback(async () => {
    setInitializing(true);
    setSessionError("");
    try {
      window.localStorage.removeItem("cinebook_token");
      window.localStorage.removeItem("cinebook_user");
    } catch {
      // The cookie-based session does not depend on browser storage.
    }
    try {
      const { user: currentUser } = await api.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      setUser(null);
      if (error.status !== 401) setSessionError(error.message);
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    try {
      const session = await api.login(credentials);
      setUser(session.user);
      setSessionError("");
      return session.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (details) => {
    setLoading(true);
    try {
      const session = await api.register(details);
      setUser(session.user);
      setSessionError("");
      return session.user;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    setSessionError("");
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      initializing,
      sessionError,
      isAuthenticated: Boolean(user),
      restoreSession,
      login,
      register,
      logout
    }),
    [user, loading, initializing, sessionError, restoreSession, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider.");
  return context;
}
