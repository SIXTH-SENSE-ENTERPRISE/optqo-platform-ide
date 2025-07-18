import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import ModularAIAgent from './01_core/modular-agent.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AgentGUI {
    constructor() {
        this.mainWindow = null;
        this.agent = new ModularAIAgent();
        this.initialized = false;
    }

    createWindow() {
        // Create the browser window
        this.mainWindow = new BrowserWindow({
            width: 1000,
            height: 700,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'gui-preload.js')
            },
            icon: path.join(__dirname, 'assets', 'icon.png'), // Optional: Add your icon
            title: 'optqo Platform - Modular AI Agent',
            show: false, // Don't show until ready
            center: true,
            minWidth: 800,
            minHeight: 600
        });

        // Load the HTML file
        this.mainWindow.loadFile('gui-interface.html');

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

        // Open DevTools in development
        if (process.env.NODE_ENV === 'development') {
            this.mainWindow.webContents.openDevTools();
        }
    }

    async initializeAgent() {
        try {
            await this.agent.initialize('data-scientist'); // Default context
            this.initialized = true;
            
            // Send initialization status to renderer
            this.mainWindow.webContents.send('agent-initialized', {
                success: true,
                context: this.agent.getCurrentContext()
            });
        } catch (error) {
            console.error('Failed to initialize agent:', error);
            this.mainWindow.webContents.send('agent-initialized', {
                success: false,
                error: error.message
            });
        }
    }

    setupEventHandlers() {
        // Handle folder selection
        ipcMain.handle('select-folder', async () => {
            const result = await dialog.showOpenDialog(this.mainWindow, {
                properties: ['openDirectory'],
                title: 'Select Project Folder to Analyze',
                buttonLabel: 'Select Folder'
            });

            if (!result.canceled && result.filePaths.length > 0) {
                return {
                    success: true,
                    folderPath: result.filePaths[0]
                };
            } else {
                return {
                    success: false,
                    message: 'No folder selected'
                };
            }
        });

        // Handle project analysis
        ipcMain.handle('analyze-project', async (event, { folderPath, options = {} }) => {
            if (!this.initialized) {
                return {
                    success: false,
                    error: 'Agent not initialized'
                };
            }

            try {
                // Send progress update
                this.mainWindow.webContents.send('analysis-progress', {
                    status: 'starting',
                    message: 'Starting analysis...'
                });

                const result = await this.agent.runActivity('analyze', folderPath, {
                    ...options,
                    progressCallback: (progress) => {
                        this.mainWindow.webContents.send('analysis-progress', progress);
                    }
                });

                return {
                    success: true,
                    data: result
                };

            } catch (error) {
                console.error('Analysis failed:', error);
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        // Handle context switching
        ipcMain.handle('switch-context', async (event, contextName) => {
            try {
                await this.agent.switchContext(contextName);
                return {
                    success: true,
                    context: this.agent.getCurrentContext()
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        // Get available contexts
        ipcMain.handle('get-contexts', async () => {
            try {
                const contexts = this.agent.getAvailableContexts();
                return {
                    success: true,
                    contexts: contexts
                };
            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        });

        // Handle GitHub clone and analyze
        ipcMain.handle('clone-analyze-github', async (event, { repoUrl, options = {} }) => {
            try {
                // This would integrate with the GitHub functionality we just built
                const { exec } = await import('child_process');
                const { promisify } = await import('util');
                const execAsync = promisify(exec);

                // Send progress update
                this.mainWindow.webContents.send('analysis-progress', {
                    status: 'cloning',
                    message: `Cloning repository: ${repoUrl}`
                });

                // Implement GitHub cloning logic here
                // For now, return a placeholder
                return {
                    success: true,
                    message: 'GitHub integration coming soon!'
                };

            } catch (error) {
                return {
                    success: false,
                    error: error.message
                };
            }
        });
    }
}

// App event handlers
app.whenReady().then(() => {
    const agentGUI = new AgentGUI();
    agentGUI.setupEventHandlers();
    agentGUI.createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            agentGUI.createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
