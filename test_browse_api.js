/**
 * Quick test to verify file browsing API
 */

import express from 'express';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..', '..');

const app = express();
const PORT = 3001; // Use different port to avoid conflicts

app.use(express.json());

// Test endpoint
app.get('/test-browse', async (req, res) => {
    try {
        const targetPath = req.query.path || ROOT_DIR;
        const fullPath = targetPath.startsWith('/') ? join(ROOT_DIR, targetPath) : join(ROOT_DIR, targetPath);
        
        console.log('Browsing path:', fullPath);
        
        const items = await fs.readdir(fullPath);
        const fileList = [];
        
        for (const item of items) {
            const itemPath = join(fullPath, item);
            try {
                const stats = await fs.stat(itemPath);
                fileList.push({
                    name: item,
                    path: join(targetPath, item),
                    type: stats.isDirectory() ? 'directory' : 'file',
                    size: stats.size
                });
            } catch (err) {
                console.log('Error reading item:', item, err.message);
            }
        }
        
        res.json(fileList);
    } catch (error) {
        console.error('Browse error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🧪 Test server running at http://localhost:${PORT}`);
    console.log(`📂 Test browse: http://localhost:${PORT}/test-browse`);
});
