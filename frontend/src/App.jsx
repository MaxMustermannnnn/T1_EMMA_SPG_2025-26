import { useState } from "react";
import { useNavigate, useLocation, Routes, Route } from "react-router-dom";
import Login from "./Login-Register/Login";
import Register from "./Login-Register/Register";
import Dashboard from "./Dashboard";
import Profile from "./Profile";
import Calendar from "./Calendar";

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [user, setUser] = useState(() => ({
    token: localStorage.getItem("token"),
    name: localStorage.getItem("userName"),
    email: localStorage.getItem("userEmail"),
  }));

  const [authMode, setAuthMode] = useState("login");
  const authBypass = import.meta.env.VITE_AUTH_BYPASS === "true" || localStorage.getItem("authBypass") === "true";
  const effectiveToken = authBypass ? "dev-token" : user.token;

  // Wenn nicht angemeldet, nur Login/Register zeigen,
  if (!effectiveToken) {
    return (
      <Routes>
        <Route path="/register" element={
          <Register
            onRegistered={() => {}}
            switchToLogin={() => setAuthMode("login")}
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

  // Wenn angemeldet, zeige die Routes
  return (
    <Routes>
      <Route path="/dashboard" element={<Dashboard onLogout={handleLogout} />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="*" element={<Dashboard onLogout={handleLogout} />} />
    </Routes>
  );
}

export default App;
