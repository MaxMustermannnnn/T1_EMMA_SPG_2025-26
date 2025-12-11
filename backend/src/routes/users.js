const express = require("express"); // Express-Framework
const router = express.Router(); // Subrouter für /api/users
const bcrypt = require("bcrypt"); // Passwort-Hashing
const jwt = require("jsonwebtoken"); // JWT-Erzeugung/Prüfung

// Datenbank & Table-Model
const db = require("../db/db"); // Drizzle DB-Client
const { users } = require("../db/schema.js"); // Users-Tabelle
const { eq } = require("drizzle-orm"); // Vergleichsoperator für WHERE (DRIZZLE)

const authMiddleware = require("../middleware/authMiddleware"); // prüft JWT und setzt req.user

//Create User

// Erstellt einen neuen Nutzer: Passwort wird gehasht, in DB gespeichert, Rückgabe ohne Passwort
router.post("/", async (req, res) => {
  // req.body: { email, password, username, first_name, last_name }
  try {
    const body = req.body;

    if (
      !body.email ||
      !body.password ||
      !body.username ||
      !body.first_name ||
      !body.last_name
    ) {
      return res
        .status(400)
        .json({ error: "Alle Felder müssen ausgefüllt werden." });
    }

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
    console.error("CREATE USER ERROR:", error);
    res.status(500).json({ error: "Interner Serverfehler" });
  }
});

//Get User by ID
// Liest einen Nutzer per ID aus, entfernt das Passwort vor der Ausgabe
router.get("/:id", async (req, res) => {
  // req.params.id: numerische User-ID
  try {
    const userId = Number(req.params.id);
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
// Aktualisiert eigene Nutzerdaten; Auth-Zwang und Eigentumsprüfung
router.put("/:id", authMiddleware, async (req, res) => {
  // authMiddleware -> req.user.id aus Token
  try {
    const userId = Number(req.params.id);

    if (!req.user || req.user.id !== userId) {
      return res
        .status(403)
        .json({ error: "Du darfst nur deinen eigenen Account bearbeiten" });
    }

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
// Löscht den eigenen Account; Auth-Zwang und Eigentumsprüfung
router.delete("/:id", authMiddleware, async (req, res) => {
  // req.params.id: Ziel-User; req.user.id: Besitzer aus Token
  try {
    const userId = Number(req.params.id);

    if (!req.user || req.user.id !== userId) {
      return res
        .status(403)
        .json({ error: "Du darfst nur deinen eigenen Account löschen!" });
    }

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

//Login User
// Prüft Anmeldedaten, vergleicht Passwort-Hash und erstellt JWT bei Erfolg
router.post("/login", async (req, res) => {
  // req.body: { email, password }, Rückgabe: { token }
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email und Passwort sind Pflichtfelder" });
    }
    const result = await db.select().from(users).where(eq(users.email, email));
    const user = result[0];

    if (!user) {
      return res.status(401).json({ error: "Benutzer oder Passwort falsch" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: "Benutzer oder Passwort falsch" });
    }

    // JWT Token erstellen
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ error: "Login fehlgeschlagen" });
  }
});

module.exports = router;
