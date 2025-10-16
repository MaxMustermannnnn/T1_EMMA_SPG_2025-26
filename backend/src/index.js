const express = require('express');
const cors = require('cors');
const documentsRouter = require('./routes/documents');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== WICHTIG: Zuerst CORS und JSON-Middleware
app.use(cors());
app.use(express.json());

// Dann deine API-Routes:
app.use('/api/documents', documentsRouter);

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
