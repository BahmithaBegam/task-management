const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db'); // Ungaloda db.js file-ai import panrathu

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route to check Supabase connection
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      success: true, 
      message: 'Supabase connected successfully!', 
      time: result.rows[0].now 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Basic route
app.get('/', (req, res) => {
  res.send('Task Management API is running with Supabase!');
});

// Server listen
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});