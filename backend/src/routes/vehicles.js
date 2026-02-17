const express = require("express");
const router = express.Router(); // Subrouter für /api/vehicles

// Datenbank & Table-Model
const db = require("../db/db"); // Drizzle Instanz
const { vehicles, maintenances } = require("../db/schema.js"); // Tabelle Fahrzeuge
const { eq } = require("drizzle-orm"); // WHERE-Helfer

// Create vehicle – legt Fahrzeug für eingeloggten Nutzer an, nutzt userId aus Token
router.post("/", async (req, res) => {
  // req.user.id kommt aus authMiddleware, req.body: Fahrzeuginfos
  try {
    const body = req.body;
    if (
      !body.type ||
      !body.brand ||
      !body.model ||
      !body.mileage ||
      !body.licensePlate
    ) {
      return res
        .status(400)
        .json({ error: "Pflichtfelder müssen ausgefüllt werden." });
    }
    const newVehicle = {
      userId: req.user.id, // Aus Token
      type: body.type,
      brand: body.brand,
      model: body.model,
      licensePlate: body.licensePlate,
      vin: body.vin,
      mileage: body.mileage,
      color: body.color,
      purchaseDate: body.purchaseDate,
      notes: body.notes,
      bildurl: body.bildurl ?? null, // WICHTIG: explizit setzen
    };

    console.log("NEW VEHICLE:", newVehicle);

    const inserted = await db.insert(vehicles).values(newVehicle).returning();

    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error("CREATE VEHICLE ERROR:", error);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

//  Get all vehicles – listet nur Fahrzeuge des eingeloggten Nutzers
router.get("/", async (req, res) => {
  // nutzt req.user.id zur Filterung
  try {
    const allVehicles = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.userId, req.user.id)); //Nur eigene Autos sichtbar
    res.json(allVehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Vehicle by ID – prüft Besitzrecht vor Rückgabe
router.get("/:id", async (req, res) => {
  // req.params.id: Fahrzeug-ID, Abgleich vehicle.userId vs req.user.id
  try {
    const id = Number(req.params.id);
    const result = await db.select().from(vehicles).where(eq(vehicles.id, id));

    const vehicle = result[0];
    if (!vehicle)
      return res.status(404).json({ error: "Fahrzeug nicht gefunden" });

    if (vehicle.userId !== req.user.id) {
      return res.status(403).json({ error: "Keine Berechtigung" });
    }

    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Vehicles by User ID – alle Fahrzeuge eines Nutzers, keine Besitzprüfung hier
router.get("/user/:userId", async (req, res) => {
  // req.params.userId: Nutzer-ID dessen Fahrzeuge geladen werden sollen
  try {
    const userId = Number(req.params.userId);
    const userVehicles = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.userId, userId));
    res.json(userVehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//  Update Vehicle by ID – nur Besitzer darf aktualisieren
router.put("/:id", async (req, res) => {
  // req.params.id: Fahrzeug-ID; req.body: neue Daten; Besitzprüfung über req.user.id
  try {
    const id = Number(req.params.id);

    const existing = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, id));

    const vehicle = existing[0];
    if (!vehicle)
      return res.status(404).json({ error: "Fahrzeug nicht gefunden" });
    if (vehicle.userId !== req.user.id) {
      return res.status(403).json({ error: "Keine Berechtigung" });
    }

    const data = req.body;
    const updated = await db
      .update(vehicles)
      .set(data)
      .where(eq(vehicles.id, id))
      .returning();

    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//  DELETE Vehicle by ID – nur Besitzer darf löschen
router.delete("/:id", async (req, res) => {
  // req.params.id: Fahrzeug-ID; Besitzprüfung über req.user.id
  try {
    const id = Number(req.params.id);

    const existing = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, id));

    const vehicle = existing[0];
    if (!vehicle)
      return res.status(404).json({ error: "Fahrzeug nicht gefunden" });
    if (vehicle.userId !== req.user.id) {
      return res.status(403).json({ error: "Keine Berechtigung" });
    }

    // Lösche zuerst alle verknüpften Wartungen
    await db.delete(maintenances).where(eq(maintenances.vehicleId, id));
    
    // Dann lösche das Fahrzeug
    await db.delete(vehicles).where(eq(vehicles.id, id));
    res.json({ success: true });
  } catch (err) {
    console.error("DELETE VEHICLE ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
