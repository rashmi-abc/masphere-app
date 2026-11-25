import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedLayout from "./components/Layout";
import AuthPage from "./pages/AuthPage";
import Discover from "./pages/Discover";
import Plans from "./pages/Plans";
import Opportunities from "./pages/Opportunities";
import Calendar from "./pages/Calendar";
import Rewards from "./pages/Rewards";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Sheroes from "./pages/Sheroes";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route element={<ProtectedLayout />}>
        <Route path="/discover" element={<Discover />} />
        <Route path="/sheroes" element={<WomenOnly><Sheroes /></WomenOnly>} />
        <Route path="/plans/:id?" element={<Plans />} />
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/rewards" element={<Rewards />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings/:tab?" element={<Settings />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
      <Route path="*" element={<Navigate to="/discover" replace />} />
    </Routes>
  );
}

function WomenOnly({ children }) {
  const { user } = useAuth();
  const isWoman = ["woman", "female"].includes(String(user?.gender || "").trim().toLowerCase());
  return isWoman ? children : <Navigate to="/discover" replace />;
}
