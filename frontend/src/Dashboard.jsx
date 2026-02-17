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

export default function Dashboard({ onLogout }) {
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

  const goToVehicles = () => {
    navigate("/fahrzeuge");
  };

  const goToCalendar = () => {
    navigate("/calendar");
  };

  const goToMaintenances = () => {
    navigate("/wartungen");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8">
      {/* Header */}
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold leading-[1.25] pb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Fahrzeug-Wartungsbuch
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Übersicht über Ihre Fahrzeuge und anstehenden Wartungstermine.
        </p>

        <div className="mt-6 flex justify-center flex-wrap gap-3">
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200">
            Abmelden
          </button>

          <button
            onClick={goToProfile}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200">
            Profil
          </button>

          <button
            onClick={goToVehicles}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200">
            Fahrzeuge
          </button>

          <button
            onClick={goToMaintenances}
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200">
            Wartungen
          </button>

          <button
            onClick={goToCalendar}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200">
            Kalender
          </button>
        </div>
      </section>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          {error}
        </div>
      )}

      {/* Stat Cards */}
      {loading ? (
        <div className="text-center text-gray-600">Daten werden geladen...</div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="group bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-blue-200 cursor-pointer" onClick={goToVehicles}>
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
                </svg>
              </div>
              <div className="text-3xl font-bold text-gray-900">{vehicles.length}</div>
            </div>
            <div className="text-sm font-medium text-gray-600">Fahrzeuge</div>
            <div className="text-xs text-gray-500">Aktiv registriert</div>
          </div>

          <div className="group bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-orange-200 cursor-pointer" onClick={goToMaintenances}>
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div className="text-3xl font-bold text-gray-900">{maintenances.length}</div>
            </div>
            <div className="text-sm font-medium text-gray-600">Anstehende Wartungen</div>
            <div className="text-xs text-gray-500">In den nächsten 30 Tagen</div>
          </div>

          <div className="group bg-white p-8 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-amber-200 cursor-pointer" onClick={goToMaintenances}>
            <div className="flex items-center mb-3">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.3A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z"/>
                </svg>
              </div>
              <div className="text-3xl font-bold text-gray-900">{allMaintenances.length}</div>
            </div>
            <div className="text-sm font-medium text-gray-600">Alle Wartungen</div>
            <div className="text-xs text-gray-500">Insgesamt</div>
          </div>
        </section>
      )}
    </div>
  );
}
