import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

function formatLabel(vehicle) {
	const parts = [vehicle.brand, vehicle.model, vehicle.licensePlate].filter(Boolean);
	return parts.length > 0 ? parts.join(" ") : "Fahrzeug";
}

export default function Fahrzeuguebersicht() {
	const navigate = useNavigate();
	const [vehicles, setVehicles] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [showEditForm, setShowEditForm] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [formError, setFormError] = useState("");
	const [saving, setSaving] = useState(false);
	const [deletingId, setDeletingId] = useState(null);
	const [formData, setFormData] = useState({
		type: "",
		brand: "",
		model: "",
		licensePlate: "",
		vin: "",
		mileage: "",
		color: "",
		purchaseDate: "",
		notes: "",
		bildurl: "",
	});
	
	// State für Autocomplete Vorschläge
	const [brandSuggestions, setBrandSuggestions] = useState([]);
	const [modelSuggestions, setModelSuggestions] = useState([]);
	const [showBrandDropdown, setShowBrandDropdown] = useState(false);
	const [showModelDropdown, setShowModelDropdown] = useState(false);
	const [previewImage, setPreviewImage] = useState(null);

	const token = localStorage.getItem("token");

	const vehicleCount = useMemo(() => vehicles.length, [vehicles.length]);

	useEffect(() => {
		// Load all brands on component mount
		const loadBrands = async () => {
			try {
				const response = await fetch(`${API_BASE}/api/suggestions/brands?type=${formData.type || "PKW"}`);
				const data = await response.json();
				setBrandSuggestions(data || []);
			} catch (err) {
				console.error("Error loading brands:", err);
			}
		};
		loadBrands();
	}, [formData.type]);

	useEffect(() => {
		if (!token) {
			setLoading(false);
			setVehicles([]);
			return;
		}

		const loadVehicles = async () => {
			setLoading(true);
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
			} finally {
				setLoading(false);
			}
		};

		loadVehicles();
	}, [token]);

	const handleInputChange = (event) => {
		const { name, value } = event.target;
		
		// Reset brand and model when type changes
		if (name === "type") {
			setFormData((prev) => ({ ...prev, [name]: value, brand: "", model: "" }));
			setBrandSuggestions([]);
			setModelSuggestions([]);
			setShowBrandDropdown(false);
			setShowModelDropdown(false);
			return;
		}
		
		setFormData((prev) => ({ ...prev, [name]: value }));
		
		// Fetch model suggestions
		if (name === "model" && formData.brand) {
			if (value.length > 0) {
				fetchModelSuggestions(formData.brand, value);
				setShowModelDropdown(true);
			} else {
				fetchModelSuggestions(formData.brand, "");
				setShowModelDropdown(true);
			}
		}
	};

	const handleImageUpload = (event) => {
		const file = event.target.files?.[0];
		if (!file) return;

		// Check file size (max 2MB)
		if (file.size > 2 * 1024 * 1024) {
			setFormError("Bild ist zu groß. Maximale Größe: 2 MB");
			return;
		}

		// Check file type
		if (!file.type.startsWith("image/")) {
			setFormError("Bitte wähle eine Bilddatei aus");
			return;
		}

		const reader = new FileReader();
		reader.onload = (e) => {
			const base64String = e.target?.result;
			setFormData((prev) => ({ ...prev, bildurl: base64String }));
			setPreviewImage(base64String);
			setFormError("");
		};
		reader.onerror = () => {
			setFormError("Fehler beim Lesen der Datei");
		};
		reader.readAsDataURL(file);
	};

	const clearImage = () => {
		setFormData((prev) => ({ ...prev, bildurl: "" }));
		setPreviewImage(null);
	};

	const fetchModelSuggestions = async (brand, search, type = formData.type) => {
		try {
			const response = await fetch(
				`${API_BASE}/api/suggestions/models/${encodeURIComponent(brand)}?type=${encodeURIComponent(type || "PKW")}&search=${encodeURIComponent(search)}`
			);
			const data = await response.json();
			setModelSuggestions(data || []);
		} catch (err) {
			console.error("Error fetching model suggestions:", err);
			setModelSuggestions([]);
		}
	};

	const filterBrandSuggestions = (search) => {
		if (!search) return brandSuggestions;
		return brandSuggestions.filter(brand =>
			brand.toLowerCase().includes(search.toLowerCase())
		);
	};

	const getFilteredBrands = () => {
		return filterBrandSuggestions(formData.brand);
	};

	const handleBrandSelect = (brand) => {
		setFormData((prev) => ({ ...prev, brand, model: "" }));
		setShowBrandDropdown(false);
		// Load models for the selected brand
		fetchModelSuggestions(brand, "", formData.type);
		setShowModelDropdown(true);
	};

	const handleModelSelect = (model) => {
		setFormData((prev) => ({ ...prev, model }));
		setShowModelDropdown(false);
		setModelSuggestions([]);
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (!token) {
			setFormError("Bitte melde dich an, um ein Fahrzeug anzulegen.");
			return;
		}
		if (!formData.type || !formData.brand || !formData.model || !formData.mileage || !formData.licensePlate) {
			setFormError("Bitte alle Pflichtfelder ausfüllen.");
			return;
		}

		setSaving(true);
		setFormError("");
		try {
			const payload = {
				type: formData.type,
				brand: formData.brand,
				model: formData.model,
				licensePlate: formData.licensePlate,
				mileage: Number(formData.mileage),
				vin: formData.vin || null,
				color: formData.color || null,
				purchaseDate: formData.purchaseDate || null,
				notes: formData.notes || null,
				bildurl: formData.bildurl || null,
			};

			const response = await fetch(`${API_BASE}/api/vehicles`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(payload),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.error || "Fahrzeug konnte nicht gespeichert werden");
			}
			setVehicles((prev) => [data, ...prev]);
			setFormData({
				type: "",
				brand: "",
				model: "",
				licensePlate: "",
				vin: "",
				mileage: "",
				color: "",
				purchaseDate: "",
				notes: "",
				bildurl: "",
			});
			setPreviewImage(null);
			setShowForm(false);
		} catch (err) {
			setFormError(err.message || "Fahrzeug konnte nicht gespeichert werden");
		} finally {
			setSaving(false);
		}
	};

	const openEditForm = (vehicle) => {
		setFormData({
			type: vehicle.type || "",
			brand: vehicle.brand || "",
			model: vehicle.model || "",
			licensePlate: vehicle.licensePlate || "",
			vin: vehicle.vin || "",
			mileage: vehicle.mileage || "",
			color: vehicle.color || "",
			purchaseDate: vehicle.purchaseDate || "",
			notes: vehicle.notes || "",
			bildurl: vehicle.bildurl || "",
		});
		setPreviewImage(vehicle.bildurl || null);
		setEditingId(vehicle.id);
		setShowEditForm(true);
		setFormError("");
	};

	const handleSaveEdit = async (event) => {
		event.preventDefault();
		if (!token || !editingId) {
			setFormError("Fehler beim Bearbeiten");
			return;
		}

		if (!formData.type || !formData.brand || !formData.model || !formData.mileage || !formData.licensePlate) {
			setFormError("Bitte alle Pflichtfelder ausfüllen.");
			return;
		}

		setSaving(true);
		setFormError("");
		try {
			const payload = {
				type: formData.type,
				brand: formData.brand,
				model: formData.model,
				licensePlate: formData.licensePlate,
				mileage: Number(formData.mileage),
				vin: formData.vin || null,
				color: formData.color || null,
				purchaseDate: formData.purchaseDate || null,
				notes: formData.notes || null,
				bildurl: formData.bildurl || null,
			};

			const response = await fetch(`${API_BASE}/api/vehicles/${editingId}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(payload),
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.error || "Fahrzeug konnte nicht gespeichert werden");
			}
			setVehicles((prev) => prev.map((v) => (v.id === editingId ? data : v)));
			setShowEditForm(false);
			setEditingId(null);
			setFormData({
				type: "",
				brand: "",
				model: "",
				licensePlate: "",
				vin: "",
				mileage: "",
				color: "",
				purchaseDate: "",
				notes: "",
				bildurl: "",
			});
			setPreviewImage(null);
		} catch (err) {
			setFormError(err.message || "Fahrzeug konnte nicht gespeichert werden");
		} finally {
			setSaving(false);
		}
	};

	const cancelEdit = () => {
		setShowEditForm(false);
		setEditingId(null);
		setFormData({
			type: "",
			brand: "",
			model: "",
			licensePlate: "",
			vin: "",
			mileage: "",
			color: "",
			purchaseDate: "",
			notes: "",
			bildurl: "",
		});
		setPreviewImage(null);
		setFormError("");
	};

	const handleDelete = async (vehicle) => {
		if (!token) {
			setError("Bitte melde dich an, um Fahrzeuge zu löschen.");
			return;
		}
		const label = formatLabel(vehicle);
		const confirmed = window.confirm(`Fahrzeug "${label}" wirklich löschen?`);
		if (!confirmed) return;

		setDeletingId(vehicle.id);
		setError("");
		try {
			const response = await fetch(`${API_BASE}/api/vehicles/${vehicle.id}`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token}` },
			});
			const data = await response.json();
			if (!response.ok) {
				throw new Error(data.error || "Fahrzeug konnte nicht gelöscht werden");
			}
			setVehicles((prev) => prev.filter((item) => item.id !== vehicle.id));
		} catch (err) {
			setError(err.message || "Fahrzeug konnte nicht gelöscht werden");
		} finally {
			setDeletingId(null);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6 md:p-8">
			<div className="mx-auto max-w-6xl">
				<header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
					<div>
						<h1 className="text-4xl md:text-5xl font-bold leading-[1.25] pb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
							Fahrzeugübersicht
						</h1>
						<p className="text-sm text-slate-500">
							{vehicleCount} Fahrzeug{vehicleCount === 1 ? "" : "e"} in deinem Account
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-3">
						<button
							type="button"
							className="inline-flex items-center justify-center rounded-full border-2 border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
							onClick={() => navigate("/dashboard")}
						>
							Zurück zum Dashboard
						</button>
						<button
							type="button"
							className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-500"
							onClick={() => setShowForm((prev) => !prev)}
						>
							{showForm ? "Formular schließen" : "Fahrzeug anlegen"}
						</button>
					</div>
				</header>

				{!token && (
					<div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
						Bitte melde dich an, um deine Fahrzeuge zu sehen.
					</div>
				)}

				{error && (
					<div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
						{error}
					</div>
				)}

				{showForm && (
					<form
						onSubmit={handleSubmit}
						className="mt-6 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
					>
						<label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
							Typ *
							<select
								name="type"
								value={formData.type}
								onChange={handleInputChange}
								className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
								required
							>
								<option value="">Bitte waehlen</option>
								<option value="PKW">PKW</option>
								<option value="LKW">LKW</option>
								<option value="Moped">Moped</option>
							</select>
						</label>

						<label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
							Marke *
							<div className="relative">
								<input
									type="text"
									name="brand"
									value={formData.brand}
									onChange={handleInputChange}
									onFocus={() => setShowBrandDropdown(true)}
									onBlur={() => setTimeout(() => setShowBrandDropdown(false), 200)}
									className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
									placeholder="Marke eingeben oder wählen..."
									required
									autoComplete="off"
								/>
								{showBrandDropdown && (
									<div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
										{getFilteredBrands().length > 0 ? (
											getFilteredBrands().map((brand) => (
												<button
													key={brand}
													type="button"
													onClick={() => handleBrandSelect(brand)}
													className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition"
												>
													{brand}
												</button>
											))
										) : (
											<div className="px-3 py-2 text-sm text-slate-400">
												Keine Marke gefunden
											</div>
										)}
									</div>
								)}
							</div>
						</label>

						<label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
							Modell *
							<div className="relative">
								<input
									type="text"
									name="model"
									value={formData.model}
									onChange={handleInputChange}
									onFocus={() => formData.brand && setShowModelDropdown(true)}
									onBlur={() => setTimeout(() => setShowModelDropdown(false), 200)}
									className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-100 disabled:text-slate-400"
									placeholder={formData.brand ? "Modell eingeben oder wählen..." : "Erst Marke wählen"}
									required
									disabled={!formData.brand}
									autoComplete="off"
								/>
								{showModelDropdown && formData.brand && (
									<div className="absolute top-full left-0 right-0 z-10 mt-1 max-h-60 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
										{modelSuggestions.length > 0 ? (
											modelSuggestions.map((model) => (
												<button
													key={model}
													type="button"
													onClick={() => handleModelSelect(model)}
													className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition"
												>
													{model}
												</button>
											))
										) : (
											<div className="px-3 py-2 text-sm text-slate-400">
												Keine Modelle gefunden
											</div>
										)}
									</div>
								)}
							</div>
						</label>

						<label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
							Kennzeichen *
							<input
								type="text"
								name="licensePlate"
								value={formData.licensePlate}
								onChange={handleInputChange}
								className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
								required
							/>
						</label>

						<label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
							Kilometerstand *
							<input
								type="number"
								name="mileage"
								value={formData.mileage}
								onChange={handleInputChange}
								min="0"
								className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
								required
							/>
						</label>

						<label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
							VIN
							<input
								type="text"
								name="vin"
								value={formData.vin}
								onChange={handleInputChange}
								className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
							/>
						</label>

						<label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
							Farbe
							<input
								type="text"
								name="color"
								value={formData.color}
								onChange={handleInputChange}
								className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
							/>
						</label>


						<label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
							Kaufdatum
							<input
								type="date"
								name="purchaseDate"
								value={formData.purchaseDate}
								onChange={handleInputChange}
								className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
							/>
						</label>

						<label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
							Bild
							<div className="flex flex-col gap-3">
								{previewImage ? (
									<div className="relative h-32 w-32 overflow-hidden rounded-lg border-2 border-blue-300 bg-blue-50">
										<img
											src={previewImage}
											alt="Preview"
											className="h-full w-full object-cover"
										/>
										<button
											type="button"
											onClick={clearImage}
											className="absolute top-1 right-1 rounded-full bg-red-500 text-white p-1 hover:bg-red-600 transition"
										>
											✕
										</button>
									</div>
								) : (
									<div className="h-32 w-full rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
										<span className="text-xs text-slate-400">Kein Bild ausgewählt</span>
									</div>
								)}
								<input
									type="file"
									accept="image/*"
									onChange={handleImageUpload}
									className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 file:mr-3 file:rounded-md file:border-0 file:bg-blue-500 file:px-3 file:py-2 file:text-sm file:text-white file:font-semibold file:cursor-pointer hover:file:bg-blue-600 transition"
								/>
								<p className="text-xs text-slate-400">Maximale Größe: 2 MB. Format: JPG, PNG, etc.</p>
							</div>
						</label>

						<label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
							Notizen
							<input
								type="text"
								name="notes"
								value={formData.notes}
								onChange={handleInputChange}
								className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
								placeholder="Optionale Notiz"
							/>
						</label>

						{formError && (
							<div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
								{formError}
							</div>
						)}

						<div>
							<button
								type="submit"
								disabled={saving}
								className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800 disabled:opacity-60"
							>
								{saving ? "Speichern..." : "Fahrzeug speichern"}
							</button>
						</div>
					</form>
				)}

				{/* Edit Modal */}
				{showEditForm && (
					<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
						<form
							onSubmit={handleSaveEdit}
							className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg max-w-2xl w-full my-8"
						>
							<div className="flex justify-between items-center mb-6">
								<h2 className="text-xl font-semibold text-slate-900">Fahrzeug bearbeiten</h2>
								<button
									type="button"
									onClick={cancelEdit}
									className="text-slate-500 hover:text-slate-700 text-2xl font-bold"
								>
									✕
								</button>
							</div>

							<div className="grid gap-4">
								<label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
									Typ *
									<select
										name="type"
										value={formData.type}
										onChange={handleInputChange}
										className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
										required
									>
										<option value="">Bitte waehlen</option>
										<option value="PKW">PKW</option>
										<option value="LKW">LKW</option>
										<option value="Moped">Moped</option>
									</select>
								</label>

								<label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
									Marke *
									<input
										type="text"
										name="brand"
										value={formData.brand}
										onChange={handleInputChange}
										className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
										required
									/>
								</label>

								<label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
									Modell *
									<input
										type="text"
										name="model"
										value={formData.model}
										onChange={handleInputChange}
										className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
										required
									/>
								</label>

								<label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
									Kennzeichen *
									<input
										type="text"
										name="licensePlate"
										value={formData.licensePlate}
										onChange={handleInputChange}
										className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
										required
									/>
								</label>

								<label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
									Kilometerstand *
									<input
										type="number"
										name="mileage"
										value={formData.mileage}
										onChange={handleInputChange}
										min="0"
										className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
										required
									/>
								</label>

								<label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
									VIN
									<input
										type="text"
										name="vin"
										value={formData.vin}
										onChange={handleInputChange}
										className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
									/>
								</label>

								<label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
									Farbe
									<input
										type="text"
										name="color"
										value={formData.color}
										onChange={handleInputChange}
										className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
									/>
								</label>

								<label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
									Kaufdatum
									<input
										type="date"
										name="purchaseDate"
										value={formData.purchaseDate}
										onChange={handleInputChange}
										className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
									/>
								</label>

								<label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
									Bild
									<div className="flex flex-col gap-3">
										{previewImage ? (
											<div className="relative h-32 w-32 overflow-hidden rounded-lg border-2 border-blue-300 bg-blue-50">
												<img
													src={previewImage}
													alt="Preview"
													className="h-full w-full object-cover"
												/>
												<button
													type="button"
													onClick={clearImage}
													className="absolute top-1 right-1 rounded-full bg-red-500 text-white p-1 hover:bg-red-600 transition"
												>
													✕
												</button>
											</div>
										) : (
											<div className="h-32 w-full rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center">
												<span className="text-xs text-slate-400">Kein Bild ausgewählt</span>
											</div>
										)}
										<input
											type="file"
											accept="image/*"
											onChange={handleImageUpload}
											className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 file:mr-3 file:rounded-md file:border-0 file:bg-blue-500 file:px-3 file:py-2 file:text-sm file:text-white file:font-semibold file:cursor-pointer hover:file:bg-blue-600 transition"
										/>
										<p className="text-xs text-slate-400">Maximale Größe: 2 MB. Format: JPG, PNG, etc.</p>
									</div>
								</label>

								<label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
									Notizen
									<input
										type="text"
										name="notes"
										value={formData.notes}
										onChange={handleInputChange}
										className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"
										placeholder="Optionale Notiz"
									/>
								</label>

								{formError && (
									<div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
										{formError}
									</div>
								)}

								<div className="flex gap-3">
									<button
										type="submit"
										disabled={saving}
										className="flex-1 rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800 disabled:opacity-60"
									>
										{saving ? "Speichern..." : "Änderungen speichern"}
									</button>
									<button
										type="button"
										onClick={cancelEdit}
										className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
									>
										Abbrechen
									</button>
								</div>
							</div>
						</form>
					</div>
				)}

				{loading ? (
					<div className="mt-8 grid gap-4 md:grid-cols-2">
						{[1, 2, 3, 4].map((item) => (
							<div
								key={item}
								className="h-40 animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
							/>
						))}
					</div>
				) : vehicles.length === 0 ? (
					<div className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm">
						Es wurden noch keine Fahrzeuge angelegt.
					</div>
				) : (
					<div className="mt-8 grid gap-5 md:grid-cols-2">
						{vehicles.map((vehicle) => (
							<article
								key={vehicle.id}
								className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg"
							>
								<div className="flex items-start gap-4">
									<div className="h-20 w-20 overflow-hidden rounded-2xl bg-slate-100">
										{vehicle.bildurl ? (
											<img
												src={vehicle.bildurl}
												alt={formatLabel(vehicle)}
												className="h-full w-full object-cover"
											/>
										) : (
											<div className="flex h-full w-full items-center justify-center text-xs font-semibold text-slate-400">
												Kein Bild
											</div>
										)}
									</div>
									<div className="flex-1">
										<h2 className="text-lg font-semibold text-slate-900">
											{formatLabel(vehicle)}
										</h2>
										<p className="text-sm text-slate-500">{vehicle.type || "Fahrzeugtyp"}</p>
										{vehicle.vin && (
											<p className="mt-1 text-xs text-slate-400">VIN: {vehicle.vin}</p>
										)}
									</div>
									<div className="flex gap-2">
										<button
											type="button"
											className="inline-flex items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
											onClick={() => openEditForm(vehicle)}
										>
											✏️ Bearbeiten
										</button>
										<button
											type="button"
											className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
											disabled={deletingId === vehicle.id}
											onClick={() => handleDelete(vehicle)}
										>
											{deletingId === vehicle.id ? "Löschen..." : "🗑️ Löschen"}
										</button>
									</div>
								</div>

								<div className="mt-4 space-y-2 text-sm text-slate-600">
									<div>
										<span className="block text-xs uppercase tracking-wide text-slate-400">
											Kilometerstand
										</span>
										<span>{vehicle.mileage ? `${vehicle.mileage} km` : "Keine Angabe"}</span>
									</div>
									<div>
										<span className="block text-xs uppercase tracking-wide text-slate-400">
											Farbe
										</span>
										<span>{vehicle.color || "Keine Angabe"}</span>
									</div>
									<div>
										<span className="block text-xs uppercase tracking-wide text-slate-400">
											Kaufdatum
										</span>
										<span>{vehicle.purchaseDate || "Keine Angabe"}</span>
									</div>
									<div>
										<span className="block text-xs uppercase tracking-wide text-slate-400">
											Notizen
										</span>
										<span>{vehicle.notes || "Keine Notizen"}</span>
									</div>
								</div>
							</article>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
