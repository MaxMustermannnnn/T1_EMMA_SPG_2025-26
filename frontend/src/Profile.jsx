import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// Dekodiert den JWT-Payload (base64url -> JSON), damit wir die User-ID lesen koennen.
// Wichtig: Das ist nur zum Auslesen gedacht, NICHT zum Verifizieren.
function decodeJwtPayload(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
  const padded = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, "=");

  try {
    const decoded = atob(padded);
    const json = decodeURIComponent(
      decoded
        .split("")
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );
    return JSON.parse(json);
  } catch (err) {
    return null;
  }
}

// Standard-Formularstruktur fuer kontrollierte Inputs.
const emptyForm = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
};

export default function Profile({ onLogout }) {
  // Hilfsfunktion fuer Navigation (z.B. zum Login).
  const navigate = useNavigate();

  // User-Objekt, geladen vom Backend.
  const [user, setUser] = useState(null);

  // Formularwerte fuer editierbare Felder (kontrollierte Inputs).
  const [formData, setFormData] = useState(emptyForm);

  // UI-Status fuer Laden/Speichern + Fehler/Erfolgsmeldungen.
  const [status, setStatus] = useState({ loading: true, saving: false, error: "", success: "" });

  // Gespeicherte User-ID, aus dem JWT dekodiert.
  const [userId, setUserId] = useState(null);

  // Token einmal beim Mount lesen. Falls sich der Token aendert, neu laden.
  const token = useMemo(() => localStorage.getItem ("token"), []);

  // Anzeigename: bevorzugt Vorname+Nachname, sonst Username.
  const displayName =
    user?.first_name || user?.last_name
      ? `${user?.first_name || ""} ${user?.last_name || ""}`.trim()
      : user?.username || "Benutzer";

  // Initialen fuer den Avatar-Kreis.
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Speichern nur aktivieren, wenn sich etwas geaendert hat.
  const hasChanges =
    user &&
    (formData.first_name !== user.first_name ||
      formData.last_name !== user.last_name ||
      formData.username !== user.username ||
      formData.email !== user.email);

  // Profil laden, sobald die Komponente gemountet wird.
  useEffect(() => {
    // Kein Token -> wie ausgeloggt behandeln.
    if (!token) {
      if (onLogout) onLogout();
      navigate("/login");
      return;
    }

    // User-ID aus dem JWT Payload lesen.
    const payload = decodeJwtPayload(token);
    if (!payload?.id) {
      setStatus((prev) => ({ ...prev, loading: false, error: "Token ist ungültig." }));
      return;
    }

    // User-ID speichern, damit wir spaeter PUT/DELETE nutzen koennen.
    const id = Number(payload.id);
    setUserId(id);

    // Aktuelles Profil vom Backend laden.
    const loadProfile = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Profil konnte nicht geladen werden");
        }
        // Userdaten speichern und Formularwerte initial setzen.
        setUser(data);
        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          username: data.username || "",
          email: data.email || "",
        });
        setStatus((prev) => ({ ...prev, loading: false, error: "" }));
      } catch (err) {
        setStatus((prev) => ({ ...prev, loading: false, error: err.message || "Fehler beim Laden" }));
      }
    };

    loadProfile();
  }, [navigate, onLogout, token]);

  // Allgemeiner Change-Handler fuer alle Inputs.
  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Profil-Aenderungen ans Backend speichern.
  const handleSave = async () => {
    if (!userId) return;
    setStatus((prev) => ({ ...prev, saving: true, error: "", success: "" }));
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Profil konnte nicht gespeichert werden");
      }
      // UI mit den gespeicherten Daten vom Server aktualisieren.
      setUser(data);
      setFormData({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        username: data.username || "",
        email: data.email || "",
      });
      setStatus((prev) => ({ ...prev, saving: false, success: "Profil aktualisiert." }));
    } catch (err) {
      setStatus((prev) => ({ ...prev, saving: false, error: err.message || "Fehler beim Speichern" }));
    }
  };

  // Account loeschen (mit Sicherheitsabfrage).
  const handleDelete = async () => {
    if (!userId) return;
    const confirmed = window.confirm("Möchtest du deinen Account wirklich löschen?");
    if (!confirmed) return;

    setStatus((prev) => ({ ...prev, saving: true, error: "", success: "" }));
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Account konnte nicht gelöscht werden");
      }
      // Nach dem Loeschen ausloggen und Client-State leeren.
      if (onLogout) onLogout();
    } catch (err) {
      setStatus((prev) => ({ ...prev, saving: false, error: err.message || "Fehler beim Löschen des Accounts" }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
        {/* Kopfbereich: Avatar, Name und Schnellaktionen */}
        <section className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-600 text-2xl font-semibold text-white shadow-lg shadow-blue-200">
              {initials || "?"}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{displayName}</h1>
              <p className="text-sm text-slate-500">{user?.email || ""}</p>
              {user?.username ? (
                <p className="text-xs text-slate-400">@{user.username}</p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Zurück zum Dashboard
            </button>
            <button
              onClick={() => onLogout && onLogout()}
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
            >
              Logout
            </button>
          </div>
        </section>

        {/* Ladezustand waehrend wir das Profil holen */}
        {status.loading ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
            Profil wird geladen...
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
            {/* Bearbeitbares Profilformular */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Persönliche Daten</h2>
                {status.success ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {status.success}
                  </span>
                ) : null}
              </div>

              {/* Fehlermeldung von Laden/Speichern */}
              {status.error ? (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {status.error}
                </div>
              ) : null}

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {/* Jeder Input ist kontrolliert ueber formData */}
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Vorname
                  <input
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nachname
                  <input
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Benutzername
                  <input
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
                  />
                </label>
                <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  E-Mail
                  <input
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
                  />
                </label>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {/* Speichern nur aktiv, wenn Aenderungen vorhanden sind */}
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || status.saving}
                  className="rounded-full bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {status.saving ? "Speichern..." : "Profil speichern"}
                </button>
                <button
                  onClick={() => setFormData({
                    first_name: user?.first_name || "",
                    last_name: user?.last_name || "",
                    username: user?.username || "",
                    email: user?.email || "",
                  })}
                  className="rounded-full border border-slate-300 bg-white px-6 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Änderungen verwerfen
                </button>
              </div>
            </section>

            {/* Seitenleiste fuer Account-Aktionen */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-slate-900">Account-Aktionen</h2>
              <p className="mt-2 text-sm text-slate-500">
                Diese Aktionen betreffen deinen Zugang zu Carlender.
              </p>

              <div className="mt-6 flex flex-col gap-4">
                {/* Nur-Lese-Informationen */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-800">Deine User-ID</p>
                  <p className="mt-1 text-xs text-slate-500">{user?.id ?? ""}</p>
                </div>
                {/* Gefaehrliche Aktion: Account loeschen */}
                <button
                  onClick={handleDelete}
                  className="rounded-full border border-rose-300 bg-rose-50 px-6 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  Account löschen
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}