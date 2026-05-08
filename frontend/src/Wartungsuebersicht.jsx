import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

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

export default function Wartungsuebersicht() {
  const navigate = useNavigate();
  const [maintenances, setMaintenances] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const token = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setMaintenances([]);
      return;
    }

    const payload = decodeJwtPayload(token);
    if (!payload?.id) {
      setError("Token ist ungültig.");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [vehiclesResponse, maintenanceResponse] = await Promise.all([
          fetch(`${API_BASE}/api/vehicles`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/maintenances`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!vehiclesResponse.ok) throw new Error("Fahrzeuge konnten nicht geladen werden");
        if (!maintenanceResponse.ok) throw new Error("Wartungen konnten nicht geladen werden");

        const [vehiclesData, maintenanceData] = await Promise.all([
          vehiclesResponse.json(),
          maintenanceResponse.json(),
        ]);

        setVehicles(Array.isArray(vehiclesData) ? vehiclesData : []);
        setMaintenances(Array.isArray(maintenanceData) ? maintenanceData : []);
      } catch (err) {
        console.error("Error loading data:", err);
        setError(err.message || "Fehler beim Laden der Daten");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [token]);

  const getVehicleLabel = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return "Unbekanntes Fahrzeug";
    const parts = [vehicle.brand, vehicle.model, vehicle.licensePlate].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Fahrzeug";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Kein Datum";
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (value, currency = "EUR") => {
    if (!value) return "-";
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: currency,
    }).format(value);
  };

  const handleMaintenanceClick = (maintenance) => {
    setSelectedMaintenance(maintenance);
    setEditForm({ ...maintenance });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMaintenance(null);
    setEditMode(false);
    setEditForm(null);
  };

  const formatInputDate = (dateString) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  };

  const handleEditChange = (key, value) => {
    setEditForm(prev => ({ ...(prev || {}), [key]: value }));
  };

  const handleSave = async () => {
    if (!selectedMaintenance || !editForm) return;
    setSaving(true);
    try {
      const payload = {
        ...editForm,
        vehicleId: editForm.vehicleId ? Number(editForm.vehicleId) : null,
        cost: editForm.cost ? Number(editForm.cost) : null,
        mileageAtService: editForm.mileageAtService ? Number(editForm.mileageAtService) : null,
        nextDueMileage: editForm.nextDueMileage ? Number(editForm.nextDueMileage) : null,
        completed: !!editForm.completed,
      };

      const res = await fetch(`${API_BASE}/api/maintenances/${selectedMaintenance.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Speichern fehlgeschlagen");
      const updated = await res.json();
      setMaintenances(prev => prev.map(m => (m.id === updated.id ? updated : m)));
      setSelectedMaintenance(updated);
      setEditForm({ ...updated });
      setEditMode(false);
    } catch (err) {
      console.error(err);
      setError(err.message || "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMaintenance) return;
    const ok = window.confirm("Wartung wirklich löschen?");
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_BASE}/api/maintenances/${selectedMaintenance.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Löschen fehlgeschlagen");
      setMaintenances(prev => prev.filter(m => m.id !== selectedMaintenance.id));
      closeModal();
    } catch (err) {
      console.error(err);
      setError(err.message || "Fehler beim Löschen");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8">
      {/* Header */}
      <section className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold pb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Wartungen
            </h1>
            <p className="text-gray-600 mt-2">
              Alle anstehenden und durchgeführten Wartungen
            </p>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200"
          >
            Zurück
          </button>
        </div>
      </section>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-gray-600 py-12">Wartungen werden geladen...</div>
      ) : maintenances.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mb-4 text-5xl">📋</div>
          <p className="text-gray-600">Keine Wartungen vorhanden</p>
          <p className="text-sm text-gray-500 mt-2">Erstelle eine neue Wartung über die Fahrzeugverwaltung</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {maintenances.map((maintenance) => (
            <div
              key={maintenance.id}
              onClick={() => handleMaintenanceClick(maintenance)}
              className="cursor-pointer bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 border border-slate-200 hover:border-blue-300"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M5 2a1 1 0 011-1h8a1 1 0 011 1v14a1 1 0 01-1 1H6a1 1 0 01-1-1V2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{maintenance.type || "Wartung"}</h3>
                      <p className="text-sm text-slate-600">{getVehicleLabel(maintenance.vehicleId)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-slate-600 mt-3">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">📅</span>
                      {formatDate(maintenance.nextDueDate || maintenance.date)}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">🏷️</span>
                      {maintenance.category || "-"}
                    </div>
                    {maintenance.cost && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">💰</span>
                        {formatCurrency(maintenance.cost, maintenance.currency)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:text-right">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      maintenance.completed
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {maintenance.completed ? "✓ Abgeschlossen" : "⏳ Ausstehend"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedMaintenance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Wartungsdetails</h2>
              <button
                onClick={closeModal}
                className="text-slate-500 hover:text-slate-700 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            

                  {/* Actions */}
                  <div className="flex items-center justify-between mb-4 gap-3">
                    <div className="flex gap-2">
                      {!editMode ? (
                        <>
                          <button
                            onClick={() => setEditMode(true)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200"
                          >
                            Bearbeiten
                          </button>
                          <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-rose-500 hover:bg-rose-400 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200"
                          >
                            {deleting ? 'Lösche...' : 'Löschen'}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setEditMode(false); setEditForm({ ...selectedMaintenance }); }}
                            className="bg-slate-300 hover:bg-slate-200 text-slate-800 px-4 py-2 rounded-xl font-semibold transition-all duration-200"
                          >
                            Abbrechen
                          </button>
                          <button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-semibold transition-all duration-200"
                          >
                            {saving ? 'Speichern...' : 'Speichern'}
                          </button>
                        </>
                      )}
                    </div>
                    <button
                      onClick={closeModal}
                      className="text-slate-500 hover:text-slate-700 px-3 py-2 rounded-full"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Editable Form / Readonly Details */}
                  {editMode ? (
                    <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex flex-col">
                          <span className="text-sm text-slate-600">Fahrzeug</span>
                          <select
                            value={editForm?.vehicleId ?? ''}
                            onChange={(e) => handleEditChange('vehicleId', e.target.value)}
                            className="mt-1 p-2 rounded-md border"
                          >
                            <option value="">-- wählen --</option>
                            {vehicles.map(v => (
                              <option key={v.id} value={v.id}>{getVehicleLabel(v.id)}</option>
                            ))}
                          </select>
                        </label>
                        <label className="flex flex-col">
                          <span className="text-sm text-slate-600">Typ</span>
                          <input value={editForm?.type ?? ''} onChange={(e) => handleEditChange('type', e.target.value)} className="mt-1 p-2 rounded-md border" />
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex flex-col">
                          <span className="text-sm text-slate-600">Kategorie</span>
                          <input value={editForm?.category ?? ''} onChange={(e) => handleEditChange('category', e.target.value)} className="mt-1 p-2 rounded-md border" />
                        </label>
                        <label className="flex flex-col">
                          <span className="text-sm text-slate-600">Status</span>
                          <div className="flex items-center gap-2 mt-1">
                            <input type="checkbox" checked={!!editForm?.completed} onChange={(e) => handleEditChange('completed', e.target.checked)} />
                            <span>{editForm?.completed ? 'Abgeschlossen' : 'Ausstehend'}</span>
                          </div>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex flex-col">
                          <span className="text-sm text-slate-600">Wartungsdatum</span>
                          <input type="date" value={formatInputDate(editForm?.date)} onChange={(e) => handleEditChange('date', e.target.value)} className="mt-1 p-2 rounded-md border" />
                        </label>
                        <label className="flex flex-col">
                          <span className="text-sm text-slate-600">Nächstes Fälligkeitsdatum</span>
                          <input type="date" value={formatInputDate(editForm?.nextDueDate)} onChange={(e) => handleEditChange('nextDueDate', e.target.value)} className="mt-1 p-2 rounded-md border" />
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex flex-col">
                          <span className="text-sm text-slate-600">Meilage bei Service (km)</span>
                          <input type="number" value={editForm?.mileageAtService ?? ''} onChange={(e) => handleEditChange('mileageAtService', e.target.value)} className="mt-1 p-2 rounded-md border" />
                        </label>
                        <label className="flex flex-col">
                          <span className="text-sm text-slate-600">Nächste Meilage (km)</span>
                          <input type="number" value={editForm?.nextDueMileage ?? ''} onChange={(e) => handleEditChange('nextDueMileage', e.target.value)} className="mt-1 p-2 rounded-md border" />
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex flex-col">
                          <span className="text-sm text-slate-600">Kosten</span>
                          <input type="number" step="0.01" value={editForm?.cost ?? ''} onChange={(e) => handleEditChange('cost', e.target.value)} className="mt-1 p-2 rounded-md border" />
                        </label>
                        <label className="flex flex-col">
                          <span className="text-sm text-slate-600">Währung</span>
                          <input value={editForm?.currency ?? 'EUR'} onChange={(e) => handleEditChange('currency', e.target.value)} className="mt-1 p-2 rounded-md border" />
                        </label>
                      </div>

                      <label className="flex flex-col">
                        <span className="text-sm text-slate-600">Ort</span>
                        <input value={editForm?.location ?? ''} onChange={(e) => handleEditChange('location', e.target.value)} className="mt-1 p-2 rounded-md border" />
                      </label>

                      <label className="flex flex-col">
                        <span className="text-sm text-slate-600">Beschreibung</span>
                        <textarea value={editForm?.description ?? ''} onChange={(e) => handleEditChange('description', e.target.value)} className="mt-1 p-2 rounded-md border" rows={4} />
                      </label>
                    </div>
                  ) : (
                    <>
                      {/* Main Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4 border border-blue-200">
                          <p className="text-sm font-semibold text-slate-600 uppercase">Fahrzeug</p>
                          <p className="text-lg font-bold text-slate-900 mt-1">
                            {getVehicleLabel(selectedMaintenance.vehicleId)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-4 border border-purple-200">
                          <p className="text-sm font-semibold text-slate-600 uppercase">Typ</p>
                          <p className="text-lg font-bold text-slate-900 mt-1">
                            {selectedMaintenance.type || "-"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-4 border border-green-200">
                          <p className="text-sm font-semibold text-slate-600 uppercase">Kategorie</p>
                          <p className="text-lg font-bold text-slate-900 mt-1">
                            {selectedMaintenance.category || "-"}
                          </p>
                        </div>

                        <div className="rounded-xl bg-gradient-to-br from-orange-50 to-orange-100 p-4 border border-orange-200">
                          <p className="text-sm font-semibold text-slate-600 uppercase">Status</p>
                          <p className={`text-lg font-bold mt-1 ${
                            selectedMaintenance.completed ? "text-emerald-600" : "text-orange-600"
                          }`}>
                            {selectedMaintenance.completed ? "✓ Abgeschlossen" : "⏳ Ausstehend"}
                          </p>
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                          <p className="text-sm font-semibold text-slate-600 uppercase">Wartungsdatum</p>
                          <p className="text-base font-bold text-slate-900 mt-1">
                            {formatDate(selectedMaintenance.date)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                          <p className="text-sm font-semibold text-slate-600 uppercase">Nächstes Fälligkeitsdatum</p>
                          <p className="text-base font-bold text-slate-900 mt-1">
                            {formatDate(selectedMaintenance.nextDueDate) || "-"}
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                          <p className="text-sm font-semibold text-slate-600 uppercase">Meilage bei Service</p>
                          <p className="text-base font-bold text-slate-900 mt-1">
                            {selectedMaintenance.mileageAtService || "-"} km
                          </p>
                        </div>
                        <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                          <p className="text-sm font-semibold text-slate-600 uppercase">Nächste Meilage</p>
                          <p className="text-base font-bold text-slate-900 mt-1">
                            {selectedMaintenance.nextDueMileage || "-"} km
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      {selectedMaintenance.description && (
                        <div className="mb-6 rounded-lg border border-slate-200 p-4 bg-slate-50">
                          <p className="text-sm font-semibold text-slate-600 uppercase">Beschreibung</p>
                          <p className="text-base text-slate-700 mt-2 whitespace-pre-wrap">
                            {selectedMaintenance.description}
                          </p>
                        </div>
                      )}

                      {/* Additional Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {selectedMaintenance.location && (
                          <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                            <p className="text-sm font-semibold text-slate-600 uppercase">Ort</p>
                            <p className="text-base text-slate-900 mt-1">{selectedMaintenance.location}</p>
                          </div>
                        )}
                        {selectedMaintenance.cost && (
                          <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                            <p className="text-sm font-semibold text-slate-600 uppercase">Kosten</p>
                            <p className="text-base font-bold text-slate-900 mt-1">
                              {formatCurrency(selectedMaintenance.cost, selectedMaintenance.currency)}
                            </p>
                          </div>
                        )}
                        {selectedMaintenance.reminderDate && (
                          <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                            <p className="text-sm font-semibold text-slate-600 uppercase">Erinnerungsdatum</p>
                            <p className="text-base text-slate-900 mt-1">{formatDate(selectedMaintenance.reminderDate)}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
          </div>
        </div>
      )}
    </div>
  );
}
