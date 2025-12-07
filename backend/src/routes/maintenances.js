const express = require("express");
const router = express.Router();


// Datenbank & Table-Model
const db = require("../db/db");
const { maintenances } = require("../db/schema.js");
const { eq } = require("drizzle-orm");


/*
Todo:

Get maintenances by id DONE!

Get maintenances by vehicleId DONE!

Create maintenance  DONE

update maintenance DONE

delete maintenance DONE
*/

// Get maintenance by ID
router.get("/:id", async (req, res) => {
    try {
        const maintenanceId = Number(req.params.id);
        const maintenance = await db
            .select()
            .from(maintenances)
            .where(eq(maintenances.id, maintenanceId));
        res.json(maintenance);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch maintenance" });
    }
});

// Get maintenances by vehicleId
router.get("/vehicle/:vehicleId", async (req, res) => {
    try {
        const vehicleId = Number(req.params.vehicleId);
        const maintenanceRecords = await db
            .select()
            .from(maintenances)
            .where(eq(maintenances.vehicleId, vehicleId));
        res.json(maintenanceRecords);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch maintenances" });
    }
})

//Create maintenance
router.post("/", async (req, res) => {
    try {
        const body = req.body;
        const newMaintenance = {
            vehicleId: body.vehicleId,
            date: body.date,
            type: body.type,
            category: body.category,
            location: body.location ?? null,
            currency: body.currency ?? "EUR",
            nextDueDate: body.nextDueDate ?? null,
            nextDueMileage: body.nextDueMileage ?? null,
            reminderDate: body.reminderDate ?? null,
            completed: body.completed ?? false,
            mileageAtService: body.mileageAtService ?? null,
            description: body.description ?? null,
            cost: body.cost ?? null,
        };

        const inserted = await db
            .insert(maintenances)
            .values(newMaintenance)
            .returning();
        res.status(201).json(inserted[0]);
    } catch (error) {
        console.error("INSERT ERROR FULL:", error);
        res.status(500).json({ error: /*"Failed to create maintenance"*/ error.message });
    }
})

// Update maintenance
router.put("/:id", async (req, res) => {
    try {
        const maintenanceId = Number(req.params.id);
        const body = req.body;
        const updatedMaintenance = {
            vehicleId: body.vehicleId,
            date: body.date,
            type: body.type,
            category: body.category,
            location: body.location ?? null,
            currency: body.currency ?? "EUR",
            nextDueDate: body.nextDueDate ?? null,
            nextDueMileage: body.nextDueMileage ?? null,
            reminderDate: body.reminderDate ?? null,
            completed: body.completed ?? false,
            mileageAtService: body.mileageAtService ?? null,
            description: body.description ?? null,
            cost: body.cost ?? null,
        };

        const updated = await db
            .update(maintenances)
            .set(updatedMaintenance)
            .where(eq(maintenances.id, maintenanceId))
            .returning();

        if (updated.length === 0) {
            return res.status(404).json({ error: "Maintenance not found" });
        }

        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ error: "Failed to update maintenance" });
    }
});


// Delete maintenance
router.delete("/:id", async (req, res) => {
    try {
        const maintenanceId = Number(req.params.id);

        const deleted = await db
            .delete(maintenances)
            .where(eq(maintenances.id, maintenanceId))
            .returning();

        if (deleted.length === 0) {
            return res.status(404).json({ error: "Maintenance not found" });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete maintenance" });
    }
});

module.exports = router;