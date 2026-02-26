import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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
        const [vehiclesResponse, maintenanceResponse] = await Promise.all([
          fetch("http://localhost:5000/api/vehicles", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/maintenances", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!vehiclesResponse.ok) throw new Error("Fahrzeuge konnten nicht geladen werden");
        const vehiclesData = await vehiclesResponse.json();
        setVehicles(vehiclesData);

        if (maintenanceResponse.ok) {
          const allMaintData = await maintenanceResponse.json();
          const vehicleIds = vehiclesData.map(v => v.id);
          const userMaintenances = allMaintData.filter(m => vehicleIds.includes(m.vehicleId));

          setAllMaintenances(userMaintenances);

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

  const goToProfile = () => navigate("/profile");
  const goToCalendar = () => navigate("/calendar");

  const overdueCount = allMaintenances.filter(m => {
    if (m.completed) return false;
    if (!m.date && !m.nextDueDate) return false;
    const checkDate = new Date(m.nextDueDate || m.date);
    return checkDate < new Date();
  }).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 flex items-center justify-center">
        <div className="text-slate-500 text-base">Daten werden geladen...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
      {/* Sidebar */}
      <aside className="w-[280px] bg-gradient-to-b from-slate-800 to-slate-900 text-white px-6 py-6 flex flex-col fixed h-screen shadow-[4px_0_20px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="text-[32px] bg-gradient-to-br from-blue-500 to-purple-500 w-12 h-12 rounded-xl flex items-center justify-center">
            🚗
          </div>
          <span className="text-[22px] font-bold text-white">Carlender</span>
        </div>

        <nav className="flex flex-col gap-2 flex-1">
          <a className="px-4 py-3.5 rounded-xl cursor-pointer transition-all text-[15px] font-medium text-white bg-gradient-to-br from-blue-500 to-blue-600 shadow-[0_4px_12px_rgba(59,130,246,0.4)]">
            Dashboard
          </a>
          <a className="px-4 py-3.5 rounded-xl cursor-pointer transition-all text-[15px] font-medium text-slate-400 hover:text-white hover:bg-white/10">
            Fahrzeuge
          </a>
          <a
            className="px-4 py-3.5 rounded-xl cursor-pointer transition-all text-[15px] font-medium text-slate-400 hover:text-white hover:bg-white/10"
            onClick={goToCalendar}
          >
            Kalender
          </a>
          <a
            className="px-4 py-3.5 rounded-xl cursor-pointer transition-all text-[15px] font-medium text-slate-400 hover:text-white hover:bg-white/10"
            onClick={goToProfile}
          >
            Profil
          </a>
        </nav>

        <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl mt-auto">
          <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center font-semibold text-base">
            MK
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">Max Schlaffer</div>
            <div className="text-xs text-slate-400 truncate">SCH220285@spengergasse.at</div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-[280px] px-10 py-8">
        <header className="mb-8">
          <h1 className="text-[32px] font-bold text-slate-900 mb-2">Willkommen zurück!</h1>
          <p className="text-base text-slate-500">
            Hier ist eine Übersicht über Ihre Fahrzeuge und anstehende Termine
          </p>

          <div className="mt-6 flex justify-center gap-4">
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
        <section className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-5 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]">
            <div className="text-sm text-slate-500 mb-2">Fahrzeuge</div>
            <div className="text-[40px] font-bold text-slate-900 mb-1 leading-none">{vehicles.length}</div>
            <div className="text-xs text-slate-400">Registrierte Fahrzeuge</div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]">
            <div className="text-sm text-slate-500 mb-2">Anstehende Termine</div>
            <div className="text-[40px] font-bold text-slate-900 mb-1 leading-none">{maintenances.length}</div>
            <div className="text-xs text-slate-400">In den nächsten 30 Tagen</div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]">
            <div className="text-sm text-slate-500 mb-2">Alle Wartungen</div>
            <div className="text-[40px] font-bold text-slate-900 mb-1 leading-none">{allMaintenances.length}</div>
            <div className="text-xs text-slate-400">Insgesamt</div>
          </div>

          {overdueCount > 0 && (
            <div className="bg-white p-6 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]">
              <div className="text-sm text-slate-500 mb-2">Überfällig</div>
              <div className="text-[40px] font-bold text-slate-900 mb-1 leading-none">{overdueCount}</div>
              <div className="text-xs text-slate-400">Verpasste Termine</div>
            </div>
          )}
        </section>

        {/* Content */}
        <section className="grid grid-cols-[repeat(auto-fit,minmax(400px,1fr))] gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Meine Fahrzeuge</h2>
              <p className="text-sm text-slate-500">Ihre registrierten Fahrzeuge im Überblick</p>
            </div>

            <div className="flex flex-col gap-3 mb-4">
              {vehicles.slice(0, 3).map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl transition-all hover:bg-slate-100 cursor-pointer"
                >
                  <div className="text-2xl w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                    🚗
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-900 mb-0.5">
                      {vehicle.brand} {vehicle.model}
                    </div>
                    <div className="text-[13px] text-slate-500">{vehicle.licensePlate}</div>
                  </div>
                  <div className="text-sm text-slate-500 font-medium">
                    {vehicle.currentKm?.toLocaleString() || 0} km
                  </div>
                </div>
              ))}
              {vehicles.length === 0 && (
                <p className="p-4 text-slate-500 text-center">Keine Fahrzeuge gefunden</p>
              )}
            </div>

            <button
              className="w-full py-3 bg-transparent border border-slate-200 rounded-xl text-slate-500 font-medium transition-all hover:bg-slate-50 hover:border-slate-300 hover:text-slate-600"
              onClick={() => navigate("/fahrzeuge")}
            >
              Alle Fahrzeuge anzeigen
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <div className="mb-5">
              <h2 className="text-xl font-semibold text-slate-900 mb-1">Anstehende Termine</h2>
              <p className="text-sm text-slate-500">Ihre nächsten Termine im Überblick</p>
            </div>

            {maintenances.length > 0 ? (
              <div className="mb-4">
                {maintenances.slice(0, 2).map((maint) => {
                  const vehicle = vehicles.find(v => v.id === maint.vehicleId);
                  return (
                    <div
                      key={maint.id}
                      className="p-5 bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl mb-4 last:mb-0 border-l-4 border-sky-500"
                    >
                      <div className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                        {maint.type || maint.description}
                        {maint.type?.toLowerCase().includes("tüv") && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-red-50 text-red-500">
                            TÜV
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-slate-500 mb-2">
                        {vehicle ? `${vehicle.brand} ${vehicle.model} • ${vehicle.licensePlate}` : "Fahrzeug nicht gefunden"}
                      </div>
                      <div className="text-sm font-semibold text-sky-500">
                        {maint.nextDueDate
                          ? new Date(maint.nextDueDate).toLocaleDateString("de-DE")
                          : new Date(maint.date).toLocaleDateString("de-DE")}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-5 bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl mb-4 border-l-4 border-sky-500">
                <div className="font-semibold text-slate-900 mb-1">Keine anstehenden Termine</div>
                <div className="text-sm text-slate-500">Keine Wartungen in den nächsten 30 Tagen</div>
              </div>
            )}

            <button
              className="w-full py-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white font-semibold transition-all hover:from-blue-600 hover:to-blue-700 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(59,130,246,0.4)]"
              onClick={goToCalendar}
            >
              Zum Kalender
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}