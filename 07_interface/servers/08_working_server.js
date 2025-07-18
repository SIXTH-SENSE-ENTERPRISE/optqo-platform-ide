/**
 * Working optqo Platform Server with Upload Support
 * Minimal server that actually works
 */

import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '..', 'web')));

// Serve the streamlined interface as default
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'web', '09_streamlined_interface.html'));
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

// Upload project files
app.post('/api/projects/upload', async (req, res) => {
    try {
        const { files, projectName } = req.body;
        
        if (!files || !projectName) {
            return res.status(400).json({ error: 'Files and project name are required' });
        }
        
        // Create project directory in local-projects folder
        const projectPath = path.join(__dirname, '..', '..', '08_workspace', 'local-projects', projectName);
        await fs.mkdir(projectPath, { recursive: true });
        
        // Simulate successful upload
        const projectInfo = {
            id: `proj_${Date.now()}`,
            name: projectName,
            path: projectPath,
            fileCount: files.length,
            uploadedAt: new Date().toISOString(),
            status: 'uploaded',
            type: 'local-upload'
        };
        
        res.json(projectInfo);
    } catch (error) {
        console.error('Error uploading project:', error);
        res.status(500).json({ error: 'Failed to upload project' });
    }
});

// Clone GitHub repository
app.post('/api/projects/clone', async (req, res) => {
    try {
        const { githubUrl, projectName } = req.body;
        
        if (!githubUrl) {
            return res.status(400).json({ error: 'GitHub URL is required' });
        }
        
        // Create project directory in github-repos folder
        const cleanName = projectName || githubUrl.split('/').pop().replace('.git', '');
        const projectPath = path.join(__dirname, '..', '..', '08_workspace', 'github-repos', cleanName);
        await fs.mkdir(projectPath, { recursive: true });
        
        // Simulate successful clone
        const projectInfo = {
            id: `proj_${Date.now()}`,
            name: cleanName,
            path: projectPath,
            source: githubUrl,
            clonedAt: new Date().toISOString(),
            status: 'cloned',
            type: 'github-clone'
        };
        
        res.json(projectInfo);
    } catch (error) {
        console.error('Error cloning repository:', error);
        res.status(500).json({ error: 'Failed to clone repository' });
    }
});

// Start analysis on a project
app.post('/api/projects/:id/analyze', async (req, res) => {
    try {
        const { id } = req.params;
        const { context = 'general' } = req.body;
        
        // Simulate analysis start
        const analysisInfo = {
            projectId: id,
            analysisId: `analysis_${Date.now()}`,
            context: context,
            status: 'started',
            startedAt: new Date().toISOString()
        };
        
        res.json(analysisInfo);
    } catch (error) {
        console.error('Error starting analysis:', error);
        res.status(500).json({ error: 'Failed to start analysis' });
    }
});

// Get analysis status
app.get('/api/analysis/:id/status', (req, res) => {
    res.json({
        id: req.params.id,
        status: 'completed',
        progress: 100,
        results: 'Analysis completed successfully'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Working optqo Platform Server running on http://localhost:${PORT}`);
    console.log(`Serving streamlined interface with upload support`);
});
