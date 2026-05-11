import { useState, lazy, Suspense } from "react";
import { useNavigate, Routes, Route } from "react-router-dom";

const Login = lazy(() => import("./Login-Register/Login"));
const Register = lazy(() => import("./Login-Register/Register"));
const Dashboard = lazy(() => import("./Dashboardtest"));
const Fahrzeuguebersicht = lazy(() => import("./Fahrzeuguebersicht"));
const Wartungsuebersicht = lazy(() => import("./Wartungsuebersicht"));
const Profile = lazy(() => import("./Profile"));
const Calendar = lazy(() => import("./Calendar"));

function App() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => ({
    token: localStorage.getItem("token"),
    name: localStorage.getItem("userName"),
    email: localStorage.getItem("userEmail"),
  }));

  const [authMode, setAuthMode] = useState("login");

  const authBypass = import.meta.env.VITE_AUTH_BYPASS === "true" || localStorage.getItem("authBypass") === "true";
  const effectiveToken = authBypass ? "dev-token" : user.token;

  if (!effectiveToken) {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-700">Lade Seite…</div>}>
        <Routes>
          <Route path="/register" element={
            <Register
              onRegistered={() => {}}
              switchToLogin={() => {
                setAuthMode("login");
                navigate("/login");
              }}
            />
          } />
          <Route path="/login" element={
            <Login
              onLogin={token => setUser({ token, name: null, email: null })}
              switchToRegister={() => {
                setAuthMode("register");
                navigate("/register");
              }}
            />
          } />
          <Route path="*" element={
            <Login
              onLogin={token => setUser({ token, name: null, email: null })}
              switchToRegister={() => {
                setAuthMode("register");
                navigate("/register");
              }}
            />
          } />
        </Routes>
      </Suspense>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    setUser({ token: null, name: null, email: null });
    setAuthMode("login");
    navigate("/login");
  };

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-700">Lade Seite…</div>}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard onLogout={handleLogout} />} />
        <Route path="/profile" element={<Profile onLogout={handleLogout} />} />
        <Route path="/fahrzeuge" element={<Fahrzeuguebersicht />} />
        <Route path="/wartungen" element={<Wartungsuebersicht />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="*" element={<Dashboard onLogout={handleLogout} />} />
      </Routes>
    </Suspense>
  );
}

export default App;
