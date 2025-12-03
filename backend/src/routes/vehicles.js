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

// Create vehicle

router.post("/", async (req, res) => {
    try {
        //Daten kommen als JSON im Request-Body vom Frontend
        const newVehicle = req.body;

        // Insert mit Drizzle-ORM:
        const inserted = await db.insert(vehicles)
            .values(newVehicle)
            .returning(); //gibt das neu angelegte Fahrzeug zurück
        
        res.status(201).json(inserted[0]); // [] da returning ein Array liefert
    } catch (error) {
        res.status(500).json({ error: error.message});
    }
});

//  Get all vehicles

router.get("/", async (req, res) => {
  try {
    const allVehicles = await db.select().from(vehicles);
    res.json(allVehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Vehicle by ID

router.get("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        const vehicle = await db
            .select()
            .from(vehicles)
            .where(eq(vehicles.id, id));
        if (vehicle.length === 0) {
            return res.status(404).json({ error: "Fahrzeug nicht gefunden" });
        }
        res.json(vehicle[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
})

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
})

//  Update Vehicle by ID

router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = req.body; // z.B. { brand: "VW", mileage: 120000 }

    const updated = await db
      .update(vehicles)
      .set(data)
      .where(eq(vehicles.id, id))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "Fahrzeug nicht gefunden" });
    }

    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



//  DELETE Vehicle by ID

router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const deleted = await db
      .delete(vehicles)
      .where(eq(vehicles.id, id))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ error: "Fahrzeug nicht gefunden" });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


module.exports = router;