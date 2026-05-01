const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname, 'frontend')));

const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
    console.log(`📁 Main: http://localhost:${PORT}/index.html`);
    console.log(`👑 Admin: http://localhost:${PORT}/admin/index.html`);
});