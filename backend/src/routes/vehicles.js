const express = require("express");
const router = express.Router();

// Datenbank & Table-Model
const db = require("../db/db");
const { vehicles } = require("../db/schema.js");
const { eq } = require("drizzle-orm");

/*
GET /api/vehicles               !DONE!

GET /api/vehicles/:id           !DONE!

GET /api/vehicles/user/:userId  !DONE!

POST /api/vehicles              !DONE!

UPDATE /api/vehicles/:id        !DONE!

DELETE /api/vehicles/:id        !DONE!
*/

// Create vehicle               !DONE!

router.post("/", async (req, res) => {
  try {
    const body = req.body;

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
    console.error("INSERT ERROR FULL:", error);
    res.status(500).json({ error: error.message });
  }
});

//  Get all vehicles

router.get("/", async (req, res) => {
  try {
    const allVehicles = await db.select().from(vehicles).where(eq(vehicles.userId, req.user.id)); //Nur eigene Autos sichtbar
    res.json(allVehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Vehicle by ID

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, id));

    const vehicle = result[0];
    if (!vehicle) return res.status(404).json({ error: "Fahrzeug nicht gefunden" });

    if (vehicle.userId !== req.user.id) {
      return res.status(403).json({ error: "Keine Berechtigung" });
    }

    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get Vehicles by User ID

router.get("/user/:userId", async (req, res) => {
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

//  Update Vehicle by ID

router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existing = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, id));

    const vehicle = existing[0];
    if (!vehicle) return res.status(404).json({ error: "Fahrzeug nicht gefunden" });
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

//  DELETE Vehicle by ID

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const existing = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, id));

    const vehicle = existing[0];
    if (!vehicle) return res.status(404).json({ error: "Fahrzeug nicht gefunden" });
    if (vehicle.userId !== req.user.id) {
      return res.status(403).json({ error: "Keine Berechtigung" });
    }

    await db.delete(vehicles).where(eq(vehicles.id, id));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
