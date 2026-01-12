import { useState } from "react";

function Login({ onLogin, switchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login fehlgeschlagen");
        return;
      }

      // Erwartet: token, name, email vom Backend
      localStorage.setItem("token", data.token);
      if (data.name) localStorage.setItem("userName", data.name);
      if (data.email) localStorage.setItem("userEmail", data.email);

      if (onLogin) onLogin(data.token);
    } catch (err) {
      setError("Server nicht erreichbar");
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">Carlender</div>
          <h2>Willkommen zurück</h2>
          <p>Melde dich an, um dein Fahrzeug-Wartungsbuch zu öffnen.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">E-Mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Passwort</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="login-button">
            Einloggen
          </button>
        </form>

        <p className="login-footer-text">
          Du hast noch keinen Account?
          <button
            type="button"
            className="link-button link-button-primary"
            onClick={switchToRegister}
          >
            Jetzt registrieren
            <span className="link-arrow">→</span>
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
