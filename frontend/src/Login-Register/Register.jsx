import { useState } from "react";

export default function Register({ onRegistered, switchToLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Registrierung fehlgeschlagen");
        return;
      }

      if (onRegistered) onRegistered();
      switchToLogin();
    } catch (err) {
      setError("Server nicht erreichbar");
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">Carlender</div>
          <h2>Account erstellen</h2>
          <p>Lege dein Konto für das Fahrzeug-Wartungsbuch an.</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">E-Mail</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Passwort</label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="form-error">{error}</p>}

          <button type="submit" className="login-button">
            Registrieren
          </button>
        </form>

        <p className="login-footer-text">
          Du hast bereits einen Account?
          <button
            type="button"
            className="link-button link-button-primary"
            onClick={switchToLogin}
          >
            Zum Login
            <span className="link-arrow">→</span>
          </button>
        </p>
      </div>
    </div>
  );
}
