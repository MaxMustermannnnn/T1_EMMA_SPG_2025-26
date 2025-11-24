// Import der Postgres-Verbindung und Drizzle
const { Pool } = require('pg');
const { drizzle } = require('drizzle-orm/neon-serverless');

//Dotenv für Database URL
require("dotenv").config();

//Neuer Connection Pool zu Neon mit Database URL aus .env
const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

// Neue Drizzle Instanz für ORM
const db = drizzle(pool)

// Exportiere DB-Instanz für andere Dateien
module.exports = db; 