<<<<<<< HEAD
import { useState } from "react";
=======
import { useEffect, useMemo, useState } from "react";
>>>>>>> fd91bf90c72126afd18ab98ef329fbf8e4e90c75
import { useNavigate } from "react-router-dom";
import "./Profile.css";

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

const emptyForm = {
  first_name: "",
  last_name: "",
  username: "",
  email: "",
};

export default function Profile({ onLogout }) {
  const navigate = useNavigate();
<<<<<<< HEAD
  const [selectedVehicle, setSelectedVehicle] = useState(0);

  const userName = localStorage.getItem("userName") || "Max Mustermann";
  
  const vehicles = [
    {
      marke: "Volkswagen",
      modell: "Golf 8",
      baujahr: "2023",
      kmStand: "45.230 km",
      kennzeichen: "WI-AB 1234",
      motor: "1.5 TSI",
      letztesService: "15.02.2026"
    },
    {
      marke: "BMW",
      modell: "3er 320i", 
      baujahr: "2023",
      kmStand: "28.920 km",
      kennzeichen: "WI-CD 5678",
      motor: "2.0 Turbo",
      letztesService: "05.02.2026"
    }
  ];

  const currentVehicle = vehicles[selectedVehicle];

  return (
    <div className="profile-page">
      <section className="profile-container">
        <header className="profile-header">
          <h1 className="profile-title">Fahrzeug-Profil</h1>
          <button onClick={() => navigate("/dashboard")} className="btn-back">
            ← Zurück zum Dashboard
          </button>
        </header>

        <div className="vehicle-card">
          <div className="owner-section">
            <div className="owner-avatar">{userName.charAt(0).toUpperCase()}</div>
            <div className="owner-info">
              <h2>{userName}</h2>
              <p>Fahrzeughalter</p>
            </div>
          </div>

          <div className="vehicle-tabs">
            {vehicles.map((vehicle, index) => (
              <div
                key={index}
                className={`tab-item ${index === selectedVehicle ? 'active' : ''}`}
                onClick={() => setSelectedVehicle(index)}
              >
                <span>{vehicle.marke}</span>
              </div>
            ))}
          </div>

          <div className="vehicle-details">
            <div className="detail-group">
              <h3>Fahrzeug</h3>
              <div className="vehicle-main">
                <p className="vehicle-name">{currentVehicle.marke} {currentVehicle.modell}</p>
                <p>{currentVehicle.baujahr} • {currentVehicle.kmStand}</p>
                <span className="license-plate">{currentVehicle.kennzeichen}</span>
              </div>
            </div>
            
            <div className="detail-group">
              <h3>Technik</h3>
              <div className="tech-info">
                <p>{currentVehicle.motor}</p>
                <p className="service-date">Letztes Service: {currentVehicle.letztesService}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="action-grid">
          <div className="action-card maintenance">
            <span className="icon">📅</span>
            <h3>Nächste Wartung</h3>
            <p>15.03.2026</p>
            <span>Planen →</span>
          </div>
          <div className="action-card service">
            <span className="icon">⚙️</span>
            <h3>Service-Historie</h3>
            <p>28 Einträge</p>
            <span>Anzeigen →</span>
          </div>
          <div className="action-card documents">
            <span className="icon">📄</span>
            <h3>Dokumente</h3>
            <p>12 Dateien</p>
            <span>Verwalten →</span>
          </div>
        </div>
      </section>
=======
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [status, setStatus] = useState({ loading: true, saving: false, error: "", success: "" });
  const [userId, setUserId] = useState(null);

  const token = useMemo(() => localStorage.getItem("token"), []);

  const displayName =
    user?.first_name || user?.last_name
      ? `${user?.first_name || ""} ${user?.last_name || ""}`.trim()
      : user?.username || "Benutzer";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const hasChanges =
    user &&
    (formData.first_name !== user.first_name ||
      formData.last_name !== user.last_name ||
      formData.username !== user.username ||
      formData.email !== user.email);

  useEffect(() => {
    if (!token) {
      if (onLogout) onLogout();
      navigate("/login");
      return;
    }

    const payload = decodeJwtPayload(token);
    if (!payload?.id) {
      setStatus((prev) => ({ ...prev, loading: false, error: "Token ist ungültig." }));
      return;
    }

    const id = Number(payload.id);
    setUserId(id);

    const loadProfile = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Profil konnte nicht geladen werden");
        }
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

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

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
      if (onLogout) onLogout();
    } catch (err) {
      setStatus((prev) => ({ ...prev, saving: false, error: err.message || "Fehler beim Löschen des Accounts" }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-10">
      <div className="mx-auto max-w-5xl">
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

        {status.loading ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm">
            Profil wird geladen...
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Persönliche Daten</h2>
                {status.success ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {status.success}
                  </span>
                ) : null}
              </div>

              {status.error ? (
                <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {status.error}
                </div>
              ) : null}

              <div className="mt-6 grid gap-4 md:grid-cols-2">
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

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-slate-900">Account-Aktionen</h2>
              <p className="mt-2 text-sm text-slate-500">
                Diese Aktionen betreffen deinen Zugang zu Carlender.
              </p>

              <div className="mt-6 flex flex-col gap-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-800">Deine User-ID</p>
                  <p className="mt-1 text-xs text-slate-500">{user?.id ?? ""}</p>
                </div>
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
>>>>>>> fd91bf90c72126afd18ab98ef329fbf8e4e90c75
    </div>
  );
}
