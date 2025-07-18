const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

class AgentGUI {
    constructor() {
        this.mainWindow = null;
        this.agent = null;
        this.initialized = false;
    }

    createWindow() {
        // Create the browser window
        this.mainWindow = new BrowserWindow({
            width: 1200,
            height: 900,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, '06_preload.cjs')
            },
            title: 'optqo Platform - Modular AI Agent',
            show: false, // Don't show until ready
            center: true,
            minWidth: 800,
            minHeight: 600,
            backgroundColor: '#1a1a2e'
        });

        // Load the HTML file
        this.mainWindow.loadFile('01_optqo_interface.html');

        // Show window when ready
        this.mainWindow.once('ready-to-show', () => {
            this.mainWindow.show();
            
            // Initialize agent with default context
            this.initializeAgent();
        });

        // Handle window closed
        this.mainWindow.on('closed', () => {
            this.mainWindow = null;
        });

        // Open DevTools for debugging (commented out for production)
        // this.mainWindow.webContents.openDevTools();
    }

    async initializeAgent() {
        try {
            console.log('Starting agent initialization...');
            
            // Create organized workspace structure
            const workspacePath = path.join(__dirname, '..', '09_workspace');
            const workspaceDirs = {
                'local-projects': path.join(workspacePath, 'local-projects'),
                'github-repos': path.join(workspacePath, 'github-repos'),
                'analysis-results': path.join(workspacePath, 'analysis-results'),
                'reports': path.join(workspacePath, 'reports')
            };
            
            // Ensure all workspace directories exist
            for (const [name, dirPath] of Object.entries(workspaceDirs)) {
                if (!fs.existsSync(dirPath)) {
                    console.log(`Creating workspace directory: ${name} -> ${dirPath}`);
                    fs.mkdirSync(dirPath, { recursive: true });
                }
            }
            
            // Store workspace paths for later use
            this.workspacePaths = workspaceDirs;
            
            // Use absolute path for module import
            const modulePath = path.join(__dirname, '..', '01_core', 'modular-agent.js');
            const moduleUrl = `file:///${modulePath.replace(/\\/g, '/')}`;
            
            console.log('Importing module from:', moduleUrl);
            
            // Check if the module file exists
            if (!fs.existsSync(modulePath)) {
                throw new Error(`Module not found: ${modulePath}`);
            }
            
            const { default: ModularAIAgent } = await import(moduleUrl);
            
            console.log('Creating agent instance...');
            this.agent = new ModularAIAgent();
            
            console.log('Initializing with data-scientist context...');
            await this.agent.initialize('data-scientist');
            this.initialized = true;
            
            console.log('Agent initialized successfully!');
            console.log('Workspace structure created:');
            for (const [name, path] of Object.entries(workspaceDirs)) {
                console.log(`  ${name}: ${path}`);
            }
            
            // Notify renderer that agent is ready
            this.mainWindow.webContents.send('agent-initialized', {
                success: true,
                context: this.agent.getCurrentContext(),
                available: this.agent.getAvailableContexts(),
                workspace: this.workspacePaths
            });
            
        } catch (error) {
            console.error('Failed to initialize agent:', error);
            console.error('Error stack:', error.stack);
            
            // Send more detailed error to renderer
            this.mainWindow.webContents.send('agent-initialized', {
                success: false,
                error: error.message,
                stack: error.stack,
                type: 'initialization'
            });
            
            this.mainWindow.webContents.send('agent-error', {
                message: error.message,
                stack: error.stack,
                type: 'initialization'
            });
        }
    }

    // Utility function to copy directories recursively
    async copyDirectory(src, dest) {
        try {
            const stats = await fs.promises.stat(src);
            if (stats.isDirectory()) {
                // Create destination directory
                await fs.promises.mkdir(dest, { recursive: true });
                
                // Read directory contents
                const entries = await fs.promises.readdir(src);
                
                // Copy each entry recursively
                for (const entry of entries) {
                    const srcPath = path.join(src, entry);
                    const destPath = path.join(dest, entry);
                    await this.copyDirectory(srcPath, destPath);
                }
            } else {
                // Copy file
                await fs.promises.copyFile(src, dest);
            }
        } catch (error) {
            console.error(`Error copying ${src} to ${dest}:`, error);
            throw error;
        }
    }

    setupIPC() {
        // Handle folder selection
        ipcMain.handle('select-folder', async () => {
            const result = await dialog.showOpenDialog(this.mainWindow, {
                properties: ['openDirectory'],
                title: 'Select Project Folder to Analyze'
            });
            
            if (!result.canceled && result.filePaths.length > 0) {
                return {
                    success: true,
                    folderPath: result.filePaths[0]
                };
            }
            return {
                success: false,
                message: 'No folder selected'
            };
        });

        // Handle context switching
        ipcMain.handle('switch-context', async (event, contextName) => {
            if (!this.initialized) {
                throw new Error('Agent not initialized');
            }
            
            await this.agent.switchContext(contextName);
            return this.agent.getCurrentContext();
        });

        // Handle project copying to workspace (separate from analysis)
        ipcMain.handle('copy-project-to-workspace', async (event, sourcePath, destPath) => {
            try {
                this.mainWindow.webContents.send('analysis-progress', 'Copying project to workspace...');
                
                console.log('📋 Copying project:');
                console.log('   From:', sourcePath);
                console.log('   To:', destPath);
                
                // Copy the directory
                await this.copyDirectory(sourcePath, destPath);
                
                console.log('✅ Project copied successfully');
                this.mainWindow.webContents.send('analysis-progress', 'Project copied successfully');
                
                return { success: true, workspacePath: destPath };
                
            } catch (error) {
                console.error('❌ Copy failed:', error);
                this.mainWindow.webContents.send('analysis-error', `Copy failed: ${error.message}`);
                return { success: false, error: error.message };
            }
        });

        // Handle project analysis
        ipcMain.handle('analyze-project', async (event, projectPath, options = {}) => {
            if (!this.initialized) {
                throw new Error('Agent not initialized');
            }
            
            try {
                this.mainWindow.webContents.send('analysis-progress', 'Preparing project for analysis...');
                
                // Analyze the project (it's already in workspace from copy step)
                this.mainWindow.webContents.send('analysis-progress', 'Starting code analysis...');
                
                // Analyze the workspace copy
                const result = await this.agent.runActivity('analyze', projectPath, {
                    ...options,
                    output: this.workspacePaths['analysis-results']
                });
                
                // Generate HTML report
                this.mainWindow.webContents.send('analysis-progress', 'Generating HTML report...');
                
                try {
                    // Import report generator
                    const moduleUrl = `file:///${path.join(__dirname, '..' ,'01_core', 'report-generator.js').replace(/\\/g, '/')}`;
                    const { ReportGenerator } = await import(moduleUrl);
                    
                    const reportGenerator = new ReportGenerator();
                    const reportResult = await reportGenerator.generateHTMLReport(result, {
                        outputDir: this.workspacePaths['reports']
                    });
                    
                    if (reportResult.success) {
                        console.log('📊 HTML report generated:', reportResult.reportPath);
                        result.htmlReport = reportResult;
                    } else {
                        console.warn('⚠️ HTML report generation failed:', reportResult.error);
                    }
                } catch (reportError) {
                    console.warn('⚠️ HTML report generation failed:', reportError.message);
                }
                
                // Add workspace info to result
                const projectName = path.basename(projectPath);
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
                
                result.workspaceInfo = {
                    originalPath: projectPath,
                    workspacePath: projectPath,
                    projectName: projectName,
                    analysisTime: timestamp
                };
                
                this.mainWindow.webContents.send('analysis-progress', 'Analysis complete');
                return result;
                
            } catch (error) {
                this.mainWindow.webContents.send('analysis-error', error.message);
                throw error;
            }
        });

        // Handle GitHub repository cloning and analysis
        ipcMain.handle('analyze-github', async (event, repoUrl, options = {}) => {
            if (!this.initialized) {
                throw new Error('Agent not initialized');
            }
            
            try {
                this.mainWindow.webContents.send('analysis-progress', 'Preparing GitHub repository...');
                
                // Import the CLI class to use GitHub functionality
                const { exec } = require('child_process');
                const { promisify } = require('util');
                const execAsync = promisify(exec);
                
                // Normalize GitHub URL
                const repoPath = this.normalizeGitHubUrl(repoUrl);
                const repoName = repoPath.split('/')[1];
                const repoOwner = repoPath.split('/')[0];
                const cloneUrl = `https://github.com/${repoPath}.git`;
                
                // Create timestamped workspace folder for this repo
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
                const workspaceRepoPath = path.join(this.workspacePaths['github-repos'], `${repoOwner}-${repoName}-${timestamp}`);
                
                this.mainWindow.webContents.send('analysis-progress', `Cloning ${repoPath} to workspace...`);
                
                // Clone repository to workspace
                await execAsync(`git clone ${cloneUrl} "${workspaceRepoPath}"`);
                this.mainWindow.webContents.send('analysis-progress', 'Repository cloned, starting analysis...');
                
                // Analyze the cloned repository
                const result = await this.agent.runActivity('analyze', workspaceRepoPath, {
                    ...options,
                    output: this.workspacePaths['analysis-results']
                });
                
                // Generate HTML report
                this.mainWindow.webContents.send('analysis-progress', 'Generating HTML report...');
                
                try {
                    // Import report generator
                    const moduleUrl = `file:///${path.join(__dirname, '..' ,'01_core', 'report-generator.js').replace(/\\/g, '/')}`;
                    const { ReportGenerator } = await import(moduleUrl);
                    
                    const reportGenerator = new ReportGenerator();
                    const reportResult = await reportGenerator.generateHTMLReport(result, {
                        outputDir: this.workspacePaths['reports']
                    });
                    
                    if (reportResult.success) {
                        console.log('📊 HTML report generated:', reportResult.reportPath);
                        result.htmlReport = reportResult;
                    } else {
                        console.warn('⚠️ HTML report generation failed:', reportResult.error);
                    }
                } catch (reportError) {
                    console.warn('⚠️ HTML report generation failed:', reportError.message);
                }
                
                // Add workspace info to result
                result.workspaceInfo = {
                    githubUrl: `https://github.com/${repoPath}`,
                    repoPath: repoPath,
                    workspacePath: workspaceRepoPath,
                    repoName: repoName,
                    repoOwner: repoOwner,
                    cloneTime: timestamp
                };
                
                this.mainWindow.webContents.send('analysis-progress', 'Analysis complete');
                return result;
                
            } catch (error) {
                this.mainWindow.webContents.send('analysis-error', error.message);
                throw error;
            }
        });

        // Get available contexts
        ipcMain.handle('get-contexts', async () => {
            if (!this.initialized) {
                return [];
            }
            return this.agent.getAvailableContexts();
        });

        // Get current context
        ipcMain.handle('get-current-context', async () => {
            if (!this.initialized) {
                return null;
            }
            return this.agent.getCurrentContext();
        });

        // Open HTML report in external browser
        ipcMain.handle('open-html-report', async (event, reportPath) => {
            try {
                const { shell } = require('electron');
                await shell.openPath(reportPath);
                return { success: true };
            } catch (error) {
                console.error('❌ Failed to open report:', error);
                return { success: false, error: error.message };
            }
        });
    }

    normalizeGitHubUrl(input) {
        // Handle different GitHub URL formats
        if (input.includes('github.com')) {
            // Extract repo path from full URL
            const match = input.match(/github\.com\/([^\/]+\/[^\/]+)/);
            return match ? match[1].replace('.git', '') : input;
        } else if (input.includes('/')) {
            // Already in username/repo format
            return input;
        } else {
            throw new Error('Invalid GitHub URL format. Use: username/repo or https://github.com/username/repo');
        }
    }
}

// Create GUI instance
const gui = new AgentGUI();

// App event handlers
app.whenReady().then(() => {
    gui.setupIPC();
    gui.createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            gui.createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handle certificate errors (for development)
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
    if (process.env.NODE_ENV === 'development') {
        // In development, ignore certificate errors
        event.preventDefault();
        callback(true);
    } else {
        // In production, use default behavior
        callback(false);
    }
});
