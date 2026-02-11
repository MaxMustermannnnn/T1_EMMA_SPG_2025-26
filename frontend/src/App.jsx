import { useState } from "react";
import Login from "./Login-Register/Login";
import Register from "./Login-Register/Register";
import Layout from "./Layout";
import Dashboard from "./Dashboard";

function App() {
  const [user, setUser] = useState(() => ({
    token: localStorage.getItem("token"),
    name: localStorage.getItem("userName"),
    email: localStorage.getItem("userEmail"),
  }));

  const [authMode, setAuthMode] = useState("login"); // "login" | "register"

  if (!user.token) {
    if (authMode === "register") {
      return (
        <Register
          onRegistered={() => {}}
          switchToLogin={() => setAuthMode("login")}
        />
      );
    }

    return (
      <Login
        onLogin={token => setUser({ token, name: null, email: null })}
        switchToRegister={() => setAuthMode("register")}
      />
    );
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    setUser({ token: null, name: null, email: null });
    setAuthMode("login");
  };

  return (
    <Dashboard onLogout={handleLogout} />
  );
}

export default App;
