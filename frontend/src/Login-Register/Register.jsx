import { useState, useEffect } from "react";

// Registrierungs-Komponente mit umfassender Eingabevalidierung
export default function Register({ onRegistered, switchToLogin }) {
  // Formularfelder
  const [first_name, setFirstName] = useState("");
  const [last_name, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Individuelle Fehler für jedes Feld (für bessere UX)
  const [fieldErrors, setFieldErrors] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    password: ""
  });

  useEffect(() => {
    document.title = "Carlender - Registrierung";
  }, []);

  // Validierung für Namen (Vorname/Nachname)
  const validateName = (name, fieldName) => {
    if (!name.trim()) return `${fieldName} ist erforderlich`;
    if (name.length < 2) return `${fieldName} muss mindestens 2 Zeichen lang sein`;
    if (name.length > 50) return `${fieldName} darf maximal 50 Zeichen lang sein`;
    if (!/^[a-zA-ZäöüÄÖÜß\s\-']+$/.test(name)) return `${fieldName} darf nur Buchstaben, Leerzeichen, Bindestriche und Apostrophe enthalten`;
    return "";
  };

  // Validierung für Username (keine Sonderzeichen, Längenbegrenzung)
  const validateUsername = (username) => {
    if (!username.trim()) return "Username ist erforderlich";
    if (username.length < 3) return "Username muss mindestens 3 Zeichen lang sein";
    if (username.length > 20) return "Username darf maximal 20 Zeichen lang sein";
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) return "Username darf nur Buchstaben, Zahlen, Unterstriche und Bindestriche enthalten";
    return "";
  };

  // E-Mail-Validierung mit Regex
  const validateEmail = (email) => {
    if (!email.trim()) return "E-Mail ist erforderlich";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Bitte geben Sie eine gültige E-Mail-Adresse ein";
    return "";
  };

  // Sichere Passwort-Validierung (Komplexitätsanforderungen)
  const validatePassword = (password) => {
    if (!password) return "Passwort ist erforderlich";
    if (password.length < 8) return "Passwort muss mindestens 8 Zeichen lang sein";
    if (!/(?=.*[a-z])/.test(password)) return "Passwort muss mindestens einen Kleinbuchstaben enthalten";
    if (!/(?=.*[A-Z])/.test(password)) return "Passwort muss mindestens einen Großbuchstaben enthalten";
    if (!/(?=.*\d)/.test(password)) return "Passwort muss mindestens eine Zahl enthalten";
    if (!/(?=.*[@$!%*?&])/.test(password)) return "Passwort muss mindestens ein Sonderzeichen enthalten (@$!%*?&)";
    return "";
  };

  // Echtzeit-Validierung für einzelne Felder
  const handleFirstNameChange = (e) => {
    const value = e.target.value;
    setFirstName(value);
    const error = validateName(value, "Vorname");
    setFieldErrors(prev => ({ ...prev, first_name: error }));
  };

  const handleLastNameChange = (e) => {
    const value = e.target.value;
    setLastName(value);
    const error = validateName(value, "Nachname");
    setFieldErrors(prev => ({ ...prev, last_name: error }));
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value;
    setUsername(value);
    const error = validateUsername(value);
    setFieldErrors(prev => ({ ...prev, username: error }));
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    const error = validateEmail(value);
    setFieldErrors(prev => ({ ...prev, email: error }));
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    const error = validatePassword(value);
    setFieldErrors(prev => ({ ...prev, password: error }));
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Alle Felder validieren
    const firstNameError = validateName(first_name, "Vorname");
    const lastNameError = validateName(last_name, "Nachname");
    const usernameError = validateUsername(username);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    const newFieldErrors = {
      first_name: firstNameError,
      last_name: lastNameError,
      username: usernameError,
      email: emailError,
      password: passwordError
    };

    setFieldErrors(newFieldErrors);

    // Prüfen ob irgendein Fehler vorliegt
    const hasErrors = Object.values(newFieldErrors).some(error => error !== "");
    
    if (hasErrors) {
      setError("Bitte korrigieren Sie die markierten Fehler");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name, last_name, email, password, username }),
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
            <label htmlFor="first_name">Vorname</label>
            <input
              id="first_name"
              type="text"
              value={first_name}
              onChange={handleFirstNameChange}
              className={fieldErrors.first_name ? "error" : ""}
              required
            />
            {fieldErrors.first_name && <p className="field-error">{fieldErrors.first_name}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="last_name">Nachname</label>
            <input
              id="last_name"
              type="text"
              value={last_name}
              onChange={handleLastNameChange}
              className={fieldErrors.last_name ? "error" : ""}
              required
            />
            {fieldErrors.last_name && <p className="field-error">{fieldErrors.last_name}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={handleUsernameChange}
              className={fieldErrors.username ? "error" : ""}
              required
            />
            {fieldErrors.username && <p className="field-error">{fieldErrors.username}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">E-Mail</label>
            <input
              id="reg-email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              className={fieldErrors.email ? "error" : ""}
              required
            />
            {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="reg-password">Passwort</label>
            <input
              id="reg-password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              className={fieldErrors.password ? "error" : ""}
              required
            />
            {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
            <p className="field-hint">Mindestens 8 Zeichen, mit Groß-/Kleinbuchstaben, Zahl und Sonderzeichen</p>
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
