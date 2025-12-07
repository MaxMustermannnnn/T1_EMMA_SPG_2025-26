const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");

// Datenbank & Table-Model
const db = require("../db/db");
const { users } = require("../db/schema.js");
const { eq } = require("drizzle-orm");

// TODO:
/*
    create user
    Get user by id
    update user by id
    delete user by id
    

*/

//Create User
router.post("/", async (req, res) => {
  try {
    const body = req.body;

    // Passwort hashen
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(body.password, saltRounds);

    const newUser = {
      email: body.email,
      password: hashedPassword, // nur den Hash speichern
      username: body.username,
      first_name: body.first_name,
      last_name: body.last_name,
    };

    const inserted = await db.insert(users).values(newUser).returning();

    // Passwort nicht zurückgeben
    const { password, ...safeUser } = inserted[0];
    res.status(201).json(safeUser);
  } catch (error) {
    console.error("INSERT ERROR FULL:", error);
    res.status(500).json({ error: error.message });
  }
});

//Get User by ID
router.get("/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await db.select().from(users).where(eq(users.id, userId));
    if (user.length === 0) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }
    // Passwort nicht zurückgeben nur alles andere
    const { password, ...safeUser } = user[0];
    res.json(safeUser);
  } catch (error) {
    console.error("GET USER ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

//Update User by ID
router.put("/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const body = req.body;
    const updatedUser = {
      email: body.email,
      username: body.username,
      first_name: body.first_name,
      last_name: body.last_name,
    };
    const updated = await db
      .update(users)
      .set(updatedUser)
      .where(eq(users.id, userId))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }

    const { password, ...safeUser } = updated[0];
    res.json(safeUser);
  } catch (error) {
    console.error("UPDATE USER ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

//Delete User by ID
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const deleted = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning();
    if (deleted.length === 0) {
      return res.status(404).json({ error: "Benutzer nicht gefunden" });
    }
    res.json({ message: "Benutzer erfolgreich gelöscht" });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
