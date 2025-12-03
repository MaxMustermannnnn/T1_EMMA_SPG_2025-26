const express = require('express');
const cors = require('cors');
require('dotenv').config();


// Requires von Routen(vehicles, users und maintenances)
const documentsRouter = require('./routes/documents');
const vehiclesRouter = require('./routes/vehicles');
/*const usersRouter = require('./routes/users');  <--- Muss noch einkommentiert werden
const maintenancesRouter = require('./routes/maintenances'); <--- Muss noch einkommentiert werden
*/

const app = express();
const PORT = process.env.PORT || 5000;

//  CORS und JSON-Middleware
app.use(cors());
app.use(express.json());

// API-Routes
app.use('/api/documents', documentsRouter);
app.use('/api/vehicles', vehiclesRouter);
/*
app.use('/api/users', usersRouter);
app.use('/api/maintenances', maintenancesRouter);
*/




// Test Route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Fahrzeug-Wartungsbuch API',
    status: 'running'
  });
});

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    database: process.env.DATABASE_URL ? 'configured' : 'not configured'
  });
});

app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
