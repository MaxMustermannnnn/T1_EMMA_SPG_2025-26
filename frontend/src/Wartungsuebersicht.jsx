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
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editError, setEditError] = useState("");
  const [editForm, setEditForm] = useState({
    vehicleId: "",
    type: "",
    category: "",
    date: "",
    nextDueDate: "",
    mileageAtService: "",
    nextDueMileage: "",
    location: "",
    cost: "",
    currency: "EUR",
    reminderDate: "",
    description: "",
    completed: false,
  });

  const token = useMemo(() => localStorage.getItem("token"), []);

  const vehicleMap = useMemo(() => {
    const map = new Map();
    vehicles.forEach((vehicle) => map.set(vehicle.id, vehicle));
    return map;
  }, [vehicles]);

  useEffect(() => {
    document.title = "Carlender - Wartungen";
  }, []);

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
      setLoading(true);
      try {
        const [vehiclesResponse, maintenanceResponse] = await Promise.all([
          fetch(`${API_BASE}/api/vehicles`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/maintenances`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const vehiclesData = await vehiclesResponse.json();
        if (!vehiclesResponse.ok) throw new Error(vehiclesData.error || "Fahrzeuge konnten nicht geladen werden");
        const maintenanceData = await maintenanceResponse.json();
        if (!maintenanceResponse.ok) throw new Error(maintenanceData.error || "Wartungen konnten nicht geladen werden");

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
    const vehicle = vehicleMap.get(vehicleId);
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
    setShowModal(true);
    setIsEditing(false);
    setEditError("");
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMaintenance(null);
    setIsEditing(false);
    setEditError("");
  };

  const toDateInputValue = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 10);
  };

  const startEdit = () => {
    if (!selectedMaintenance) return;
    setEditForm({
      vehicleId: selectedMaintenance.vehicleId || "",
      type: selectedMaintenance.type || "",
      category: selectedMaintenance.category || "",
      date: toDateInputValue(selectedMaintenance.date),
      nextDueDate: toDateInputValue(selectedMaintenance.nextDueDate),
      mileageAtService: selectedMaintenance.mileageAtService ?? "",
      nextDueMileage: selectedMaintenance.nextDueMileage ?? "",
      location: selectedMaintenance.location || "",
      cost: selectedMaintenance.cost ?? "",
      currency: selectedMaintenance.currency || "EUR",
      reminderDate: toDateInputValue(selectedMaintenance.reminderDate),
      description: selectedMaintenance.description || "",
      completed: Boolean(selectedMaintenance.completed),
    });
    setEditError("");
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditError("");
  };

  const handleEditInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveEdit = async () => {
    if (!token || !selectedMaintenance?.id) {
      setEditError("Bitte melde dich erneut an.");
      return;
    }

    if (!editForm.vehicleId || !editForm.type || !editForm.category || !editForm.date) {
      setEditError("Bitte alle Pflichtfelder ausfüllen.");
      return;
    }

    const payload = {
      vehicleId: Number(editForm.vehicleId),
      type: editForm.type.trim(),
      category: editForm.category.trim(),
      date: editForm.date,
      location: editForm.location.trim() || null,
      currency: editForm.currency.trim() || "EUR",
      nextDueDate: editForm.nextDueDate || null,
      nextDueMileage: editForm.nextDueMileage === "" ? null : Number(editForm.nextDueMileage),
      reminderDate: editForm.reminderDate || null,
      completed: Boolean(editForm.completed),
      mileageAtService: editForm.mileageAtService === "" ? null : Number(editForm.mileageAtService),
      description: editForm.description.trim() || null,
      cost: editForm.cost === "" ? null : Number(editForm.cost),
    };

    setSaving(true);
    setEditError("");
    try {
      const response = await fetch(`${API_BASE}/api/maintenances/${selectedMaintenance.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Wartung konnte nicht gespeichert werden");
      }

      setMaintenances((prev) => prev.map((item) => (item.id === data.id ? data : item)));
      setSelectedMaintenance(data);
      setIsEditing(false);
    } catch (err) {
      setEditError(err.message || "Wartung konnte nicht gespeichert werden");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMaintenance = async () => {
    if (!token || !selectedMaintenance?.id) {
      setEditError("Bitte melde dich erneut an.");
      return;
    }

    const confirmed = window.confirm("Möchtest du diese Wartung wirklich löschen?");
    if (!confirmed) return;

    setDeleting(true);
    setEditError("");
    try {
      const response = await fetch(`${API_BASE}/api/maintenances/${selectedMaintenance.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Wartung konnte nicht gelöscht werden");
      }

      setMaintenances((prev) => prev.filter((item) => item.id !== selectedMaintenance.id));
      closeModal();
    } catch (err) {
      setEditError(err.message || "Wartung konnte nicht gelöscht werden");
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
              <h2 className="text-2xl font-bold text-slate-900">
                {isEditing ? "Wartung bearbeiten" : "Wartungsdetails"}
              </h2>
              <button
                onClick={closeModal}
                className="text-slate-500 hover:text-slate-700 text-2xl font-bold"
              >
                ✕
              </button>
            </div>

            {isEditing ? (
              <>
                {editError && (
                  <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
                    {editError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">Fahrzeug *</span>
                    <select
                      name="vehicleId"
                      value={editForm.vehicleId}
                      onChange={handleEditInputChange}
                      className="rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      <option value="">Fahrzeug auswählen</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {getVehicleLabel(vehicle.id)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">Typ *</span>
                    <input
                      type="text"
                      name="type"
                      value={editForm.type}
                      onChange={handleEditInputChange}
                      className="rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">Kategorie *</span>
                    <input
                      type="text"
                      name="category"
                      value={editForm.category}
                      onChange={handleEditInputChange}
                      className="rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">Wartungsdatum *</span>
                    <input
                      type="date"
                      name="date"
                      value={editForm.date}
                      onChange={handleEditInputChange}
                      className="rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">Nächstes Fälligkeitsdatum</span>
                    <input
                      type="date"
                      name="nextDueDate"
                      value={editForm.nextDueDate}
                      onChange={handleEditInputChange}
                      className="rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">Erinnerungsdatum</span>
                    <input
                      type="date"
                      name="reminderDate"
                      value={editForm.reminderDate}
                      onChange={handleEditInputChange}
                      className="rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">Kilometerstand bei Service</span>
                    <input
                      type="number"
                      min="0"
                      name="mileageAtService"
                      value={editForm.mileageAtService}
                      onChange={handleEditInputChange}
                      className="rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">Nächster Kilometerstand</span>
                    <input
                      type="number"
                      min="0"
                      name="nextDueMileage"
                      value={editForm.nextDueMileage}
                      onChange={handleEditInputChange}
                      className="rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">Ort</span>
                    <input
                      type="text"
                      name="location"
                      value={editForm.location}
                      onChange={handleEditInputChange}
                      className="rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">Kosten</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="cost"
                      value={editForm.cost}
                      onChange={handleEditInputChange}
                      className="rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </label>

                  <label className="flex flex-col gap-2">
                    <span className="text-sm font-semibold text-slate-700">Währung</span>
                    <input
                      type="text"
                      maxLength={5}
                      name="currency"
                      value={editForm.currency}
                      onChange={handleEditInputChange}
                      className="rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  </label>
                </div>

                <label className="flex flex-col gap-2 mb-4">
                  <span className="text-sm font-semibold text-slate-700">Beschreibung</span>
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleEditInputChange}
                    rows={4}
                    className="rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </label>

                <label className="inline-flex items-center gap-2 mb-6 cursor-pointer">
                  <input
                    type="checkbox"
                    name="completed"
                    checked={editForm.completed}
                    onChange={handleEditInputChange}
                    className="h-4 w-4"
                  />
                  <span className="text-sm font-semibold text-slate-700">Als abgeschlossen markieren</span>
                </label>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={cancelEdit}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                    disabled={saving}
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={saving}
                  >
                    {saving ? "Speichern..." : "Änderungen speichern"}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Main Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Fahrzeug */}
                  <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-4 border border-blue-200">
                    <p className="text-sm font-semibold text-slate-600 uppercase">Fahrzeug</p>
                    <p className="text-lg font-bold text-slate-900 mt-1">
                      {getVehicleLabel(selectedMaintenance.vehicleId)}
                    </p>
                  </div>

                  {/* Typ */}
                  <div className="rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 p-4 border border-purple-200">
                    <p className="text-sm font-semibold text-slate-600 uppercase">Typ</p>
                    <p className="text-lg font-bold text-slate-900 mt-1">
                      {selectedMaintenance.type || "-"}
                    </p>
                  </div>

                  {/* Kategorie */}
                  <div className="rounded-xl bg-gradient-to-br from-green-50 to-green-100 p-4 border border-green-200">
                    <p className="text-sm font-semibold text-slate-600 uppercase">Kategorie</p>
                    <p className="text-lg font-bold text-slate-900 mt-1">
                      {selectedMaintenance.category || "-"}
                    </p>
                  </div>

                  {/* Status */}
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

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleDeleteMaintenance}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={deleting}
                  >
                    {deleting ? "Löschen..." : "Löschen"}
                  </button>
                  <button
                    onClick={startEdit}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                    disabled={deleting}
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
                    disabled={deleting}
                  >
                    Schließen
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
