import { useEffect, useMemo, useState } from "react";


function buildDateKey(dateString) {
  if (!dateString) return null;
  return String(dateString).slice(0, 10);
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 2, 1));
  const [vehicles, setVehicles] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: "",
    vehicleId: "",
    type: "",
    category: "",
    description: "",
  });

  const token = localStorage.getItem("token");

  const vehicleById = useMemo(() => {
    const map = {};
    for (const v of vehicles) {
      map[v.id] = v;
    }
    return map;
  }, [vehicles]);

  const eventsByDate = useMemo(() => {
    const map = {};
    for (const item of maintenances) {
      const key = buildDateKey(item.date);
      if (!key) continue;
      const vehicle = vehicleById[item.vehicleId];
      const vehicleLabel = vehicle
        ? `${vehicle.brand || ""} ${vehicle.model || ""} ${vehicle.licensePlate || ""}`.trim()
        : "Fahrzeug";
      const title = `${item.type || "Wartung"} - ${vehicleLabel}`.trim();
      if (!map[key]) map[key] = [];
      map[key].push(title);
    }
    return map;
  }, [maintenances, vehicleById]);

  useEffect(() => {
    if (!token) return;
    const loadVehicles = async () => {
      setError("");
      try {
        const response = await fetch(`${API_BASE}/api/vehicles`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Fahrzeuge konnten nicht geladen werden");
        }
        setVehicles(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Fahrzeuge konnten nicht geladen werden");
      }
    };

    loadVehicles();
  }, [token]);

  const loadMaintenances = async (vehicleList) => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const results = await Promise.all(
        vehicleList.map(async (vehicle) => {
          const response = await fetch(
            `${API_BASE}/api/maintenances/vehicle/${vehicle.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || "Wartungen konnten nicht geladen werden");
          }
          return Array.isArray(data) ? data : [];
        })
      );
      setMaintenances(results.flat());
    } catch (err) {
      setError(err.message || "Wartungen konnten nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vehicles.length > 0) {
      loadMaintenances(vehicles);
    } else {
      setMaintenances([]);
    }
  }, [vehicles]);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  const firstDay = (new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay() + 6) % 7; // Monday-first

  const dayCells = [];
  for (let i = 0; i < firstDay; i++) {
    dayCells.push(<div key={`empty-${i}`} className="min-h-[110px] rounded-xl bg-slate-100/60" />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayEvents = eventsByDate[dateKey] || [];

    dayCells.push(
      <div
        key={day}
        className="min-h-[110px] rounded-xl border border-slate-200 bg-white p-2 text-sm shadow-sm"
      >
        <div className="text-xs font-semibold text-slate-500">{day}</div>
        {dayEvents.length > 0 && (
          <div className="mt-2 space-y-1">
            {dayEvents.map((event, idx) => (
              <div
                key={idx}
                className="rounded-md bg-indigo-50 px-2 py-1 text-xs text-indigo-700"
                title={event}
              >
                {event}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const handleMonthChange = (direction) => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1)
    );
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.vehicleId || !formData.type || !formData.category) {
      setError("Bitte Datum, Fahrzeug, Typ und Kategorie ausfüllen.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/api/maintenances`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vehicleId: Number(formData.vehicleId),
          date: formData.date,
          type: formData.type,
          category: formData.category,
          description: formData.description || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Termin konnte nicht gespeichert werden");
      }
      setShowForm(false);
      setFormData({ date: "", vehicleId: "", type: "", category: "", description: "" });
      await loadMaintenances(vehicles);
    } catch (err) {
      setError(err.message || "Termin konnte nicht gespeichert werden");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Wartungskalender</h1>
            <p className="text-sm text-slate-500">Deine Termine aus dem Backend</p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500"
            onClick={() => setShowForm((prev) => !prev)}
          >
            {showForm ? "Formular schließen" : "Termin hinzufügen"}
          </button>
        </header>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-5"
          >
            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Datum
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Fahrzeug
              <select
                name="vehicleId"
                value={formData.vehicleId}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
                required
              >
                <option value="">Bitte wählen</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {`${vehicle.brand || ""} ${vehicle.model || ""} ${vehicle.licensePlate || ""}`.trim()}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Typ
              <input
                type="text"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
                placeholder="z.B. TUEV"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Kategorie
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
                placeholder="z.B. Inspektion"
                required
              />
            </label>

            <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 md:col-span-5">
              Beschreibung
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
                placeholder="Optionale Notiz"
              />
            </label>

            <div className="md:col-span-5">
              <button
                type="submit"
                disabled={loading}
                className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? "Speichern..." : "Termin speichern"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
              onClick={() => handleMonthChange(-1)}
            >
              ←
            </button>
            <h3 className="text-lg font-semibold text-slate-900">
              {currentDate.toLocaleDateString("de-DE", {
                month: "long",
                year: "numeric",
              })}
            </h3>
            <button
              type="button"
              className="rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
              onClick={() => handleMonthChange(1)}
            >
              →
            </button>
          </div>

          <div className="mt-6 grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
            <div>Mo</div>
            <div>Di</div>
            <div>Mi</div>
            <div>Do</div>
            <div>Fr</div>
            <div>Sa</div>
            <div>So</div>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-3">{dayCells}</div>
        </div>
      </div>
    </div>
  );
}
