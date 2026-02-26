import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/dashboard.css";

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

export default function Dashboardtest({ onLogout }) {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [allMaintenances, setAllMaintenances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState(null);

  const token = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    if (!token) {
      if (onLogout) onLogout();
      navigate("/login");
      return;
    }

    const payload = decodeJwtPayload(token);
    if (!payload?.id) {
      setError("Token ist ungültig.");
      setLoading(false);
      return;
    }

    const id = Number(payload.id);
    setUserId(id);

    const loadData = async () => {
      try {
        // Load vehicles
        const vehiclesResponse = await fetch("http://localhost:5000/api/vehicles", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!vehiclesResponse.ok) throw new Error("Fahrzeuge konnten nicht geladen werden");
        const vehiclesData = await vehiclesResponse.json();
        setVehicles(vehiclesData);

        // Load all maintenances and filter by user's vehicles
        const maintenanceResponse = await fetch("http://localhost:5000/api/maintenances", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (maintenanceResponse.ok) {
          const allMaintData = await maintenanceResponse.json();
          const vehicleIds = vehiclesData.map(v => v.id);
          const userMaintenances = allMaintData.filter(m => vehicleIds.includes(m.vehicleId));
          
          // Store all maintenances
          setAllMaintenances(userMaintenances);
          
          // Filter upcoming maintenances in next 30 days
          const today = new Date();
          const in30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
          const upcoming = userMaintenances.filter(m => {
            if (!m.date && !m.nextDueDate) return false;
            const checkDate = new Date(m.nextDueDate || m.date);
            return checkDate >= today && checkDate <= in30Days && !m.completed;
          });
          setMaintenances(upcoming);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setError(err.message || "Fehler beim Laden der Daten");
        setLoading(false);
      }
    };

    loadData();
  }, [token, navigate, onLogout]);

  const goToProfile = () => {
    navigate("/profile");
  };

  const goToCalendar = () => {
    navigate("/calendar");
  };

  // Calculate overdue maintenances
  const overdueCount = allMaintenances.filter(m => {
    if (m.completed) return false;
    if (!m.date && !m.nextDueDate) return false;
    const checkDate = new Date(m.nextDueDate || m.date);
    return checkDate < new Date();
  }).length;

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Daten werden geladen...</div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">🚗</div>
          <span className="logo-text"> Carlender</span>
        </div>

        <nav className="sidebar-nav">
          <a className="nav-item active">Dashboard</a>
          <a className="nav-item">Fahrzeuge</a>
          <a className="nav-item" onClick={goToCalendar}>
            Kalender
          </a>
          <a className="nav-item" onClick={goToProfile}>
            Profil
          </a>
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">MK</div>
          <div className="user-info">
            <div className="user-name">Max Schlaffer</div>
            <div className="user-mail">SCH220285@spengergasse.at</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <header className="main-header">
          <h1>Willkommen zurück!</h1>
          <p>Hier ist eine Übersicht über Ihre Fahrzeuge und anstehende Termine</p>

          {/* Buttons aus eurer alten Version */}
          <div className="mt-6 flex justify-center space-x-4">
            <button
              onClick={onLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200"
            >
              Abmelden
            </button>

            <button
              onClick={goToProfile}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200"
            >
              Profil
            </button>

            <button
              onClick={goToCalendar}
              className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200"
            >
              Kalender
            </button>
          </div>
        </header>

          {/* Stat Cards */}
        <section className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Fahrzeuge</div>
            <div className="stat-value">{vehicles.length}</div>
            <div className="stat-sub">Registrierte Fahrzeuge</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Anstehende Termine</div>
            <div className="stat-value">{maintenances.length}</div>
            <div className="stat-sub">In den nächsten 30 Tagen</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Alle Wartungen</div>
            <div className="stat-value">{allMaintenances.length}</div>
            <div className="stat-sub">Insgesamt</div>
          </div>

          {overdueCount > 0 && (
            <div className="stat-card">
              <div className="stat-label">Überfällig</div>
              <div className="stat-value">{overdueCount}</div>
              <div className="stat-sub">Verpasste Termine</div>
            </div>
          )}
        </section>

        {/* Content */}
        <section className="content-grid">
          <div className="panel">
            <div className="panel-header">
              <h2>Meine Fahrzeuge</h2>
              <p>Ihre registrierten Fahrzeuge im Überblick</p>
            </div>

            <div className="vehicle-list">
              {vehicles.slice(0, 3).map((vehicle) => (
                <div key={vehicle.id} className="vehicle-item">
                  <div className="vehicle-icon">🚗</div>
                  <div className="vehicle-main">
                    <div className="vehicle-name">{vehicle.brand} {vehicle.model}</div>
                    <div className="vehicle-plate">{vehicle.licensePlate}</div>
                  </div>
                  <div className="vehicle-km">{vehicle.currentKm?.toLocaleString() || 0} km</div>
                </div>
              ))}
              {vehicles.length === 0 && (
                <p style={{ padding: "16px", color: "#64748b", textAlign: "center" }}>
                  Keine Fahrzeuge gefunden
                </p>
              )}
            </div>

            <button className="btn-ghost" onClick={() => navigate("/fahrzeuge")}>Alle Fahrzeuge anzeigen</button>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Anstehende Termine</h2>
              <p>Ihre nächsten Termine im Überblick</p>
            </div>

            {maintenances.length > 0 ? (
              maintenances.slice(0, 2).map((maint) => {
                const vehicle = vehicles.find(v => v.id === maint.vehicleId);
                return (
                  <div key={maint.id} className="appointment-card">
                    <div className="appointment-title">
                      {maint.type || maint.description}
                      {maint.type?.toLowerCase().includes("tüv") && (
                        <span className="badge badge-danger">TÜV</span>
                      )}
                    </div>
                    <div className="appointment-sub">
                      {vehicle ? `${vehicle.brand} ${vehicle.model} • ${vehicle.licensePlate}` : 'Fahrzeug nicht gefunden'}
                    </div>
                    <div className="appointment-date">
                      {maint.nextDueDate ? new Date(maint.nextDueDate).toLocaleDateString("de-DE") : new Date(maint.date).toLocaleDateString("de-DE")}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="appointment-card">
                <div className="appointment-title">Keine anstehenden Termine</div>
                <div className="appointment-sub">Keine Wartungen in den nächsten 30 Tagen</div>
              </div>
            )}

            <button className="btn-primary" onClick={goToCalendar}>
              Zum Kalender
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}