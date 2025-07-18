const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // Folder selection
    selectFolder: () => ipcRenderer.invoke('select-folder'),
    
    // Context management
    switchContext: (contextName) => ipcRenderer.invoke('switch-context', contextName),
    getContexts: () => ipcRenderer.invoke('get-contexts'),
    getCurrentContext: () => ipcRenderer.invoke('get-current-context'),
    
    // Project analysis
    analyzeProject: (projectPath, options) => ipcRenderer.invoke('analyze-project', projectPath, options),
    copyProjectToWorkspace: (sourcePath, destPath) => ipcRenderer.invoke('copy-project-to-workspace', sourcePath, destPath),
    analyzeGithub: (repoUrl, options) => ipcRenderer.invoke('analyze-github', repoUrl, options),
    cloneAnalyzeGithub: (repoUrl, options) => ipcRenderer.invoke('analyze-github', repoUrl, options),
    
    // Report viewing
    openHtmlReport: (reportPath) => ipcRenderer.invoke('open-html-report', reportPath),
    
    // Event listeners
    onAgentInitialized: (callback) => ipcRenderer.on('agent-initialized', callback),
    onAgentError: (callback) => ipcRenderer.on('agent-error', callback),
    onAnalysisProgress: (callback) => ipcRenderer.on('analysis-progress', callback),
    onAnalysisError: (callback) => ipcRenderer.on('analysis-error', callback),
    
    // Remove listeners
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
});
