/**
 * Simple optqo Platform Server v2.0
 * File browsing and basic workspace management
 */

import express from 'express';
import { promises as fs } from 'fs';
import { join, dirname, extname, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..', '..');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(join(__dirname, '..', 'web')));

// Serve the enhanced interface
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, '..', 'web', '08_enhanced_interface.html'));
});

// Mock workspaces
const mockWorkspaces = [
    { id: 'proj_001', name: 'Financial Analysis', type: 'analysis', created: new Date().toISOString() },
    { id: 'proj_002', name: 'Data Pipeline', type: 'optimization', created: new Date().toISOString() }
];

// API Routes
app.get('/api/workspaces', (req, res) => {
    res.json(mockWorkspaces);
});

app.post('/api/workspaces', (req, res) => {
    const { projectName, projectType = 'analysis' } = req.body;
    
    if (!projectName) {
        return res.status(400).json({ error: 'Project name is required' });
    }
    
    const workspace = {
        id: `proj_${Date.now()}`,
        name: projectName,
        type: projectType,
        created: new Date().toISOString()
    };
    
    mockWorkspaces.push(workspace);
    res.json(workspace);
});

app.get('/api/workspaces/:id', (req, res) => {
    const workspace = mockWorkspaces.find(w => w.id === req.params.id);
    if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
    }
    res.json(workspace);
});

// File browsing
app.get('/api/files/browse', async (req, res) => {
    try {
        const { path: requestPath = '' } = req.query;
        const fullPath = join(ROOT_DIR, requestPath);
        
        // Security check
        const relativePath = relative(ROOT_DIR, fullPath);
        if (relativePath.startsWith('..')) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const stats = await fs.stat(fullPath);
        
        if (stats.isDirectory()) {
            const items = await fs.readdir(fullPath);
            const fileList = await Promise.all(
                items.map(async (item) => {
                    const itemPath = join(fullPath, item);
                    const itemStats = await fs.stat(itemPath);
                    
                    return {
                        name: item,
                        path: join(requestPath, item).replace(/\\/g, '/'),
                        type: itemStats.isDirectory() ? 'directory' : 'file',
                        size: itemStats.size,
                        modified: itemStats.mtime,
                        extension: itemStats.isFile() ? extname(item) : null
                    };
                })
            );
            
            fileList.sort((a, b) => {
                if (a.type !== b.type) {
                    return a.type === 'directory' ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
            });
            
            res.json({ path: requestPath, items: fileList });
        } else {
            res.status(400).json({ error: 'Path is not a directory' });
        }
    } catch (error) {
        console.error('Error browsing files:', error);
        res.status(500).json({ error: 'Failed to browse files' });
    }
});

// Get file content
app.get('/api/files/content', async (req, res) => {
    try {
        const { path: requestPath } = req.query;
        
        if (!requestPath) {
            return res.status(400).json({ error: 'File path is required' });
        }
        
        const fullPath = join(ROOT_DIR, requestPath);
        
        // Security check
        const relativePath = relative(ROOT_DIR, fullPath);
        if (relativePath.startsWith('..')) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const stats = await fs.stat(fullPath);
        if (!stats.isFile()) {
            return res.status(400).json({ error: 'Path is not a file' });
        }
        
        // File size limit (10MB)
        if (stats.size > 10 * 1024 * 1024) {
            return res.status(413).json({ error: 'File too large' });
        }
        
        const content = await fs.readFile(fullPath, 'utf-8');
        
        res.json({
            path: requestPath,
            content,
            size: stats.size,
            modified: stats.mtime,
            extension: extname(fullPath)
        });
    } catch (error) {
        console.error('Error reading file:', error);
        res.status(500).json({ error: 'Failed to read file' });
    }
});

// Analysis endpoint
app.post('/api/analysis/start', (req, res) => {
    const analysisId = `analysis_${Date.now()}`;
    
    res.json({
        analysisId,
        status: 'started',
        message: 'Analysis started with crew system'
    });
});

app.get('/api/analysis/:id', (req, res) => {
    res.json({
        analysisId: req.params.id,
        status: 'completed',
        progress: 100,
        results: {
            summary: 'Analysis completed successfully',
            findings: ['Code structure is well-organized', 'Performance optimizations available']
        }
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
    });
});

// Error handling
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 optqo Platform Server v2.0 running at http://localhost:${PORT}`);
    console.log(`📊 Features: File Browser, Workspace Management, Analysis APIs`);
});

export default app;
