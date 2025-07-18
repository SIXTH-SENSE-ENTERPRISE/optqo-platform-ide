const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Serve static files from the entire project
app.use(express.static(path.join(__dirname, '..')));

// Serve the GUI specifically
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../14_gui/01_optqo_interface.html'));
});

// API endpoint for file browsing
app.get('/api/browse', (req, res) => {
    const fs = require('fs');
    const dirPath = req.query.path || process.cwd();
    
    try {
        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        const result = items.map(item => ({
            name: item.name,
            isDirectory: item.isDirectory(),
            path: path.join(dirPath, item.name)
        }));
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`🌐 optqo Platform Web GUI server running at http://localhost:${port}`);
    console.log(`📁 Serving files from: ${path.join(__dirname, '..')}`);
    console.log(`🚀 Ready for analysis!`);
});
