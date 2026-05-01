const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors());

// Serve static files from frontend folder
app.use(express.static(path.join(__dirname, 'frontend')));

// API routes (using your existing backend)
// Import your backend server logic
require('./backend/server');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🌐 Frontend server running on: http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${path.join(__dirname, 'frontend')}`);
});