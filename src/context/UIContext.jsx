import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { LS } from "../services/storage";

const UICtx = createContext(null);
export const useUI = () => useContext(UICtx);

export function UIProvider({ children }) {
  const [theme, setThemeState] = useState(() => LS.get("ms_theme", "system"));
  const [toast, setToast] = useState("");
  const [modal, setModalState] = useState(null);
  const timer = useRef();

  useEffect(() => {
    const r = document.documentElement;
    if (theme === "system") r.removeAttribute("data-theme");
    else r.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const f = (e) => { if (e.key === "Escape") setModalState(null); };
    addEventListener("keydown", f);
    return () => removeEventListener("keydown", f);
  }, []);

  const setTheme = (t) => { setThemeState(t); LS.set("ms_theme", t); };
  const tt = useCallback((m) => {
    setToast(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 2600);
  }, []);
  // setModal(<Element/>, "wide" | "mid") to open, setModal(null) to close
  const setModal = useCallback((n, w) => setModalState(n ? { n, w } : null), []);

  return <UICtx.Provider value={{ theme, setTheme, toast, tt, modal, setModal }}>{children}</UICtx.Provider>;
}
