import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/authService";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let active = true;
    let unsubscribe;
    try {
      unsubscribe = authService.subscribe(
        (nextUser) => {
          if (!active) return;
          setUser(nextUser);
          if (nextUser) setAuthError("");
          setReady(true);
        },
        (error) => {
          if (!active) return;
          setUser(null);
          setAuthError(error.message);
          setReady(true);
        }
      );
    } catch (error) {
      setAuthError(error.message);
      setReady(true);
    }
    return () => { active = false; unsubscribe?.(); };
  }, []);

  const login = async (email, pw) => {
    try {
      setUser(await authService.login(email, pw));
      setAuthError("");
      return "";
    } catch (error) { return error.message; }
  };
  const signup = async (data) => {
    try {
      setUser(await authService.signup(data));
      setAuthError("");
      return "";
    } catch (error) { return error.message; }
  };
  const logout = async () => { await authService.logout(); setUser(null); setAuthError(""); };
  const deleteAccount = async () => { await authService.deleteAccount(user.uid || user.email); setUser(null); };

  const updateUser = async (patch) => {
    const updated = await authService.updateUser(user.uid || user.email, patch);
    setUser(updated);
    return updated;
  };
  const syncUser = (patch) => {
    setUser((current) => current && ({
      ...current,
      ...patch,
      pts: patch.points ?? patch.pts ?? current.pts,
    }));
  };
  const changePassword = (current, next) => authService.changePassword(user.email, current, next);
  const exportData = () => authService.exportData(user.uid || user.email);

  if (!ready) return null;
  return (
    <AuthCtx.Provider value={{ user, authError, login, signup, logout, deleteAccount, updateUser, syncUser, changePassword, exportData }}>
      {children}
    </AuthCtx.Provider>
  );
}
