const express = require("express"); // Express-App für HTTP-Server
const cors = require("cors"); // CORS-Header erlauben Frontend-Zugriff
require("dotenv").config(); // Lädt .env (PORT, JWT_SECRET, DB-URL)

// Route-Module (Dokumente, Fahrzeuge, Nutzer, Wartungen, Vorschläge)
const documentsRouter = require("./routes/documents");
const vehiclesRouter = require("./routes/vehicles");
const usersRouter = require("./routes/users");
const maintenancesRouter = require("./routes/maintenances");
const suggestionsRouter = require("./routes/suggestions");
const authMiddleware = require("./middleware/authMiddleware"); // prüft JWT

const app = express();
const PORT = process.env.PORT || 5000; // Fallback auf 5000, falls .env fehlt

//  CORS und JSON-Middleware
app.use(cors()); // erlaubt Cross-Origin-Aufrufe
app.use(express.json({ limit: "50mb" })); // parsed JSON-Body in req.body, erhöhtes Limit für Base64-Bilder

// API-Routes
// Dokumente öffentlich
app.use("/api/documents", documentsRouter);

// User-Routen öffentlich (Registrierung/Anmeldung)
app.use("/api/users", usersRouter); //Offen

// Vorschläge öffentlich (für Autocomplete)
app.use("/api/suggestions", suggestionsRouter);

// Fahrzeuge und Wartungen nur mit gültigem JWT erreichbar
app.use("/api/vehicles", authMiddleware, vehiclesRouter); // authMiddleware = 1. Arg, vehiclesRouter = 2. Arg
app.use("/api/maintenances", authMiddleware, maintenancesRouter); // gleiche Schutzkette

// Test Route: einfacher Status-Check
app.get("/", (req, res) => {
  res.json({
    message: "Fahrzeug-Wartungsbuch API",
    status: "running",
  });
});

// Health Check: liefert Basiszustand und DB-Konfig-Info
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: process.env.DATABASE_URL ? "configured" : "not configured",
  });
});

// Startet den HTTP-Server
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
