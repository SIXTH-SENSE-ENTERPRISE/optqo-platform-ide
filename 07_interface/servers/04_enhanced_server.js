/**
 * Enhanced optqo Platform Server
 * Provides file browsing, workspace management, and analysis APIs
 */

import express from 'express';
import { promises as fs } from 'fs';
import { join, dirname, extname, relative } from 'path';
import { fileURLToPath } from 'url';
// import cors from 'cors';
// import { workspaceManager } from '../09_workspace/workspace-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(join(ROOT_DIR, 'web')));

// Serve the streamlined interface as default
app.get('/', (req, res) => {
    res.sendFile(join(ROOT_DIR, 'web', '09_streamlined_interface.html'));
});

// API Routes

/**
 * Get list of available workspaces
 */
app.get('/api/workspaces', async (req, res) => {
    try {
        // Mock workspaces for now
        const workspaces = [
            { id: 'proj_001', name: 'Financial Analysis', type: 'analysis', created: new Date().toISOString() },
            { id: 'proj_002', name: 'Data Pipeline', type: 'optimization', created: new Date().toISOString() }
        ];
        res.json(workspaces);
    } catch (error) {
        console.error('Error listing workspaces:', error);
        res.status(500).json({ error: 'Failed to list workspaces' });
    }
});

/**
 * Create a new workspace
 */
app.post('/api/workspaces', async (req, res) => {
    try {
        const { projectName, projectType = 'analysis' } = req.body;
        
        if (!projectName) {
            return res.status(400).json({ error: 'Project name is required' });
        }
        
        // Mock workspace creation
        const workspace = {
            id: `proj_${Date.now()}`,
            projectName,
            projectType,
            created: new Date().toISOString(),
            path: join(ROOT_DIR, '09_workspace', 'sessions', projectName)
        };
        
        res.json(workspace);
    } catch (error) {
        console.error('Error creating workspace:', error);
        res.status(500).json({ error: 'Failed to create workspace' });
    }
});

/**
 * Get workspace details
 */
app.get('/api/workspaces/:id', async (req, res) => {
    try {
        // Mock workspace details
        const workspace = {
            id: req.params.id,
            name: `Project ${req.params.id}`,
            type: 'analysis',
            created: new Date().toISOString(),
            path: join(ROOT_DIR, '09_workspace', 'sessions', req.params.id)
        };
        
        res.json(workspace);
    } catch (error) {
        console.error('Error getting workspace:', error);
        res.status(500).json({ error: 'Failed to get workspace' });
    }
});

/**
 * Browse files in a directory
 */
app.get('/api/files/browse', async (req, res) => {
    try {
        const { path: requestPath = '', workspace } = req.query;
        let basePath;
        
        if (workspace && workspace !== 'standalone') {
            // Mock workspace path
            basePath = join(ROOT_DIR, '09_workspace', 'sessions', workspace);
        } else {
            basePath = ROOT_DIR;
        }
        
        const fullPath = join(basePath, requestPath);
        
        // Security check - ensure path is within allowed directory
        const relativePath = relative(basePath, fullPath);
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
            
            // Sort directories first, then files
            fileList.sort((a, b) => {
                if (a.type !== b.type) {
                    return a.type === 'directory' ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
            });
            
            res.json({
                path: requestPath,
                items: fileList
            });
        } else {
            res.status(400).json({ error: 'Path is not a directory' });
        }
    } catch (error) {
        console.error('Error browsing files:', error);
        if (error.code === 'ENOENT') {
            res.status(404).json({ error: 'Path not found' });
        } else {
            res.status(500).json({ error: 'Failed to browse files' });
        }
    }
});

/**
 * Get file content
 */
app.get('/api/files/content', async (req, res) => {
    try {
        const { path: requestPath, workspace } = req.query;
        
        if (!requestPath) {
            return res.status(400).json({ error: 'File path is required' });
        }
        
        let basePath;
        if (workspace && workspace !== 'standalone') {
            const workspaceObj = await workspaceManager.getWorkspace(workspace);
            if (!workspaceObj) {
                return res.status(404).json({ error: 'Workspace not found' });
            }
            basePath = workspaceObj.path;
        } else {
            basePath = ROOT_DIR;
        }
        
        const fullPath = join(basePath, requestPath);
        
        // Security check
        const relativePath = relative(basePath, fullPath);
        if (relativePath.startsWith('..')) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        const stats = await fs.stat(fullPath);
        if (!stats.isFile()) {
            return res.status(400).json({ error: 'Path is not a file' });
        }
        
        // Check file size limit (10MB)
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
        if (error.code === 'ENOENT') {
            res.status(404).json({ error: 'File not found' });
        } else {
            res.status(500).json({ error: 'Failed to read file' });
        }
    }
});

/**
 * Save file content
 */
app.post('/api/files/save', async (req, res) => {
    try {
        const { path: requestPath, content, workspace } = req.body;
        
        if (!requestPath || content === undefined) {
            return res.status(400).json({ error: 'File path and content are required' });
        }
        
        let basePath;
        if (workspace && workspace !== 'standalone') {
            const workspaceObj = await workspaceManager.getWorkspace(workspace);
            if (!workspaceObj) {
                return res.status(404).json({ error: 'Workspace not found' });
            }
            basePath = workspaceObj.path;
        } else {
            basePath = ROOT_DIR;
        }
        
        const fullPath = join(basePath, requestPath);
        
        // Security check
        const relativePath = relative(basePath, fullPath);
        if (relativePath.startsWith('..')) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // Ensure directory exists
        const dir = dirname(fullPath);
        await fs.mkdir(dir, { recursive: true });
        
        await fs.writeFile(fullPath, content, 'utf-8');
        
        const stats = await fs.stat(fullPath);
        
        res.json({
            path: requestPath,
            size: stats.size,
            modified: stats.mtime,
            message: 'File saved successfully'
        });
    } catch (error) {
        console.error('Error saving file:', error);
        res.status(500).json({ error: 'Failed to save file' });
    }
});

/**
 * Start analysis on files or code
 */
app.post('/api/analysis/start', async (req, res) => {
    try {
        const { files, code, context = 'general-analyst', workspace } = req.body;
        
        // Simulate analysis process
        const analysisId = `analysis_${Date.now()}`;
        
        // In a real implementation, this would:
        // 1. Create analysis job
        // 2. Initialize crew system
        // 3. Queue analysis tasks
        // 4. Return job ID for polling
        
        res.json({
            analysisId,
            status: 'started',
            message: 'Analysis started with crew system',
            estimatedTime: '3-5 minutes'
        });
        
        // Simulate analysis completion after 5 seconds
        setTimeout(() => {
            console.log(`Analysis ${analysisId} completed`);
        }, 5000);
        
    } catch (error) {
        console.error('Error starting analysis:', error);
        res.status(500).json({ error: 'Failed to start analysis' });
    }
});

/**
 * Get analysis status and results
 */
app.get('/api/analysis/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Simulate analysis results
        res.json({
            analysisId: id,
            status: 'completed',
            progress: 100,
            results: {
                summary: 'Code analysis completed successfully',
                findings: [
                    'Code structure is well-organized',
                    'Performance optimizations identified',
                    'Security best practices followed'
                ],
                metrics: {
                    complexity: 'Medium',
                    maintainability: 'High',
                    performance: 'Good'
                }
            }
        });
    } catch (error) {
        console.error('Error getting analysis:', error);
        res.status(500).json({ error: 'Failed to get analysis' });
    }
});

/**
 * Upload project files
 */
app.post('/api/projects/upload', async (req, res) => {
    try {
        const { files, projectName } = req.body;
        
        if (!files || !projectName) {
            return res.status(400).json({ error: 'Files and project name are required' });
        }
        
        // Create project directory
        const projectPath = join(ROOT_DIR, '08_workspace', 'projects', projectName);
        await fs.mkdir(projectPath, { recursive: true });
        
        // In a real implementation, save the uploaded files
        // For now, just simulate successful upload
        const projectInfo = {
            id: `proj_${Date.now()}`,
            name: projectName,
            path: projectPath,
            fileCount: files.length,
            uploadedAt: new Date().toISOString(),
            status: 'uploaded'
        };
        
        res.json(projectInfo);
    } catch (error) {
        console.error('Error uploading project:', error);
        res.status(500).json({ error: 'Failed to upload project' });
    }
});

/**
 * Clone GitHub repository
 */
app.post('/api/projects/clone', async (req, res) => {
    try {
        const { githubUrl, projectName } = req.body;
        
        if (!githubUrl) {
            return res.status(400).json({ error: 'GitHub URL is required' });
        }
        
        // Create project directory
        const cleanName = projectName || githubUrl.split('/').pop().replace('.git', '');
        const projectPath = join(ROOT_DIR, '08_workspace', 'projects', cleanName);
        await fs.mkdir(projectPath, { recursive: true });
        
        // In a real implementation, use git clone
        // For now, simulate successful clone
        const projectInfo = {
            id: `proj_${Date.now()}`,
            name: cleanName,
            path: projectPath,
            source: githubUrl,
            clonedAt: new Date().toISOString(),
            status: 'cloned'
        };
        
        res.json(projectInfo);
    } catch (error) {
        console.error('Error cloning repository:', error);
        res.status(500).json({ error: 'Failed to clone repository' });
    }
});

/**
 * Start analysis on a project
 */
app.post('/api/projects/:id/analyze', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Simulate analysis start
        const analysisInfo = {
            projectId: id,
            analysisId: `analysis_${Date.now()}`,
            status: 'started',
            startedAt: new Date().toISOString(),
            agents: [
                'Data Scientist',
                'Architect',
                'Security',
                'Performance', 
                'Quality',
                'Documentation',
                'Orchestrator'
            ]
        };
        
        res.json(analysisInfo);
    } catch (error) {
        console.error('Error starting analysis:', error);
        res.status(500).json({ error: 'Failed to start analysis' });
    }
});

/**
 * Get analysis status
 */
app.get('/api/analysis/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Simulate analysis progress
        const status = {
            analysisId: id,
            status: 'completed',
            progress: 100,
            completedAgents: 7,
            totalAgents: 7,
            completedAt: new Date().toISOString(),
            reportReady: true
        };
        
        res.json(status);
    } catch (error) {
        console.error('Error getting analysis status:', error);
        res.status(500).json({ error: 'Failed to get analysis status' });
    }
});

/**
 * Download analysis report
 */
app.get('/api/analysis/:id/download', async (req, res) => {
    try {
        const { id } = req.params;
        const { format = 'html' } = req.query;
        
        // Generate sample report content
        const reportContent = generateSampleReport(id, format);
        
        const timestamp = new Date().toISOString().split('T')[0];
        const fileName = `optqo-analysis-${id}-${timestamp}.${format}`;
        
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', format === 'html' ? 'text/html' : 'application/pdf');
        
        res.send(reportContent);
    } catch (error) {
        console.error('Error downloading report:', error);
        res.status(500).json({ error: 'Failed to download report' });
    }
});

function generateSampleReport(analysisId, format) {
    if (format === 'html') {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>optqo Platform Analysis Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; }
        .agent-result { background: #f8f9fa; padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; }
        .metric { display: inline-block; margin: 10px 15px 10px 0; padding: 10px; background: #e3f2fd; border-radius: 5px; }
        .recommendation { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 optqo Platform Analysis Report</h1>
        <p>Comprehensive Code Analysis by 7-Agent Crew System</p>
        <p>Analysis ID: ${analysisId} | Generated: ${new Date().toLocaleString()}</p>
    </div>

    <div class="section">
        <h2>📊 Executive Summary</h2>
        <p>Your codebase has been analyzed by our advanced 7-agent crew system. Here are the key findings:</p>
        <div class="metric">Code Quality: 85%</div>
        <div class="metric">Security Score: 92%</div>
        <div class="metric">Performance: 78%</div>
        <div class="metric">Documentation: 65%</div>
    </div>

    <div class="section">
        <h2>🤖 Agent Analysis Results</h2>
        
        <div class="agent-result">
            <h3>📊 Data Scientist Agent</h3>
            <p>Analyzed code patterns, data structures, and statistical implementations.</p>
            <ul>
                <li>Identified 12 optimization opportunities</li>
                <li>Found 3 potential data bottlenecks</li>
                <li>Recommended algorithm improvements</li>
            </ul>
        </div>

        <div class="agent-result">
            <h3>🏗️ Architecture Agent</h3>
            <p>Evaluated system design, modularity, and structural patterns.</p>
            <ul>
                <li>Architecture follows 85% of best practices</li>
                <li>Suggested refactoring for 2 components</li>
                <li>Recommended design pattern improvements</li>
            </ul>
        </div>

        <div class="agent-result">
            <h3>🔒 Security Agent</h3>
            <p>Scanned for vulnerabilities, security patterns, and compliance.</p>
            <ul>
                <li>No critical security vulnerabilities found</li>
                <li>2 medium-risk issues identified</li>
                <li>Security score: 92/100</li>
            </ul>
        </div>

        <div class="agent-result">
            <h3>⚡ Performance Agent</h3>
            <p>Analyzed runtime efficiency, memory usage, and optimization opportunities.</p>
            <ul>
                <li>Identified 5 performance bottlenecks</li>
                <li>Memory usage can be optimized by 23%</li>
                <li>Runtime improvements possible</li>
            </ul>
        </div>

        <div class="agent-result">
            <h3>✅ Quality Agent</h3>
            <p>Evaluated code quality, maintainability, and best practices.</p>
            <ul>
                <li>Code quality score: 85/100</li>
                <li>Test coverage: 78%</li>
                <li>Documentation completeness: 65%</li>
            </ul>
        </div>

        <div class="agent-result">
            <h3>📝 Documentation Agent</h3>
            <p>Assessed documentation quality, completeness, and clarity.</p>
            <ul>
                <li>API documentation: 70% complete</li>
                <li>Code comments: Good coverage</li>
                <li>README files: Need improvement</li>
            </ul>
        </div>

        <div class="agent-result">
            <h3>🎭 Orchestrator Agent</h3>
            <p>Coordinated analysis workflow and synthesized findings.</p>
            <ul>
                <li>All agents completed successfully</li>
                <li>Cross-agent insights identified</li>
                <li>Prioritized recommendations generated</li>
            </ul>
        </div>
    </div>

    <div class="section">
        <h2>💡 Key Recommendations</h2>
        
        <div class="recommendation">
            <h4>🎯 High Priority</h4>
            <p>Implement security patches for identified medium-risk vulnerabilities</p>
        </div>
        
        <div class="recommendation">
            <h4>🚀 Performance</h4>
            <p>Optimize database queries and implement caching mechanisms</p>
        </div>
        
        <div class="recommendation">
            <h4>📚 Documentation</h4>
            <p>Improve README files and add API documentation</p>
        </div>
    </div>

    <div class="section">
        <h2>📈 Next Steps</h2>
        <ol>
            <li>Address high-priority security recommendations</li>
            <li>Implement performance optimizations</li>
            <li>Improve documentation coverage</li>
            <li>Schedule follow-up analysis in 30 days</li>
        </ol>
    </div>
</body>
</html>`;
    }
    
    return `optqo Platform Analysis Report - Analysis ID: ${analysisId}`;
}

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        features: [
            'workspace-management',
            'file-browsing',
            'crew-analysis',
            'real-time-updates'
        ]
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: error.message 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 optqo Platform Server running at http://localhost:${PORT}`);
    console.log(`📊 Features: Workspace Management, File Browser, Crew Analysis`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
