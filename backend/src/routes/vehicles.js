const express = require("express");
const router = express.Router();


// Datenbank & Table-Model
const db = require("../db/db");
const { vehicles } = require("../db/schema.js");

// INSERT-ROUTE 

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

module.exports = router;