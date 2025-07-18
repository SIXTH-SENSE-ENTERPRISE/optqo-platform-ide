// GUI Script for Modular AI Agent
class AgentInterface {
    constructor() {
        this.currentContext = 'data-scientist'; // Default context
        this.isAnalyzing = false;
        this.selectedFolder = null;
        this.workspaceCopyPath = null;
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Folder selection - separate from analysis
        document.getElementById('selectFolderCard').addEventListener('click', () => {
            this.selectFolder();
        });

        // Copy to workspace button
        document.getElementById('copyToWorkspaceBtn').addEventListener('click', () => {
            this.copyToWorkspace();
        });

        // Analyze button
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.runAnalysis();
        });

        // GitHub analysis
        document.getElementById('analyzeGithubBtn').addEventListener('click', () => {
            this.analyzeGithubRepository();
        });

        // GitHub URL input - analyze on Enter
        document.getElementById('githubUrl').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.analyzeGithubRepository();
            }
        });

        // View HTML report button
        document.getElementById('viewReportBtn').addEventListener('click', () => {
            this.openHtmlReport();
        });

        // Listen for electron events
        if (window.electronAPI) {
            window.electronAPI.onAgentInitialized((event, data) => {
                this.handleAgentInitialized(data);
            });

            window.electronAPI.onAnalysisProgress((event, progress) => {
                this.updateProgress(progress);
            });
        }
    }

    async loadContexts() {
        try {
            if (!window.electronAPI) {
                this.showAlert('Electron API not available', 'error');
                return;
            }

            const result = await window.electronAPI.getContexts();
            if (result.success) {
                this.renderContextTabs(result.contexts);
            } else {
                this.showAlert(`Failed to load contexts: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showAlert(`Error loading contexts: ${error.message}`, 'error');
        }
    }

    renderContextTabs(contexts) {
        const tabsContainer = document.getElementById('contextTabs');
        tabsContainer.innerHTML = '';

        contexts.forEach((context, index) => {
            const tab = document.createElement('div');
            tab.className = `context-tab ${index === 0 ? 'active' : ''}`;
            tab.textContent = context.name.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
            tab.addEventListener('click', () => this.switchContext(context.name, tab));
            tabsContainer.appendChild(tab);
        });

        // Set first context as current
        if (contexts.length > 0) {
            this.currentContext = contexts[0].name;
        }
    }

    async switchContext(contextName, tabElement) {
        try {
            // Update UI immediately
            document.querySelectorAll('.context-tab').forEach(tab => tab.classList.remove('active'));
            tabElement.classList.add('active');

            const result = await window.electronAPI.switchContext(contextName);
            if (result.success) {
                this.currentContext = contextName;
                document.getElementById('currentContext').textContent = 
                    `Context: ${result.context.name.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
            } else {
                this.showAlert(`Failed to switch context: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showAlert(`Error switching context: ${error.message}`, 'error');
        }
    }

    // Step 1: Select Folder Only
    async selectFolder() {
        try {
            console.log('📁 Requesting folder selection...');
            this.showAlert('Opening folder selection dialog...', 'info');
            
            const result = await window.electronAPI.selectFolder();
            console.log('📁 Folder selection result:', result);
            
            if (result.success) {
                this.selectedFolder = result.folderPath;
                this.showAlert(`✅ Selected folder: ${result.folderPath}`, 'success');
                console.log('� Folder selected:', result.folderPath);
                
                // Show the selected folder info and enable next step
                this.showSelectedFolder(result.folderPath);
                this.enableCopyButton();
                
            } else {
                if (result.message !== 'No folder selected') {
                    this.showAlert(result.message, 'error');
                    console.log('❌ Folder selection failed:', result.message);
                } else {
                    console.log('ℹ️ User cancelled folder selection');
                }
            }
        } catch (error) {
            console.error('❌ Error in selectFolder:', error);
            this.showAlert(`Error selecting folder: ${error.message}`, 'error');
        }
    }

    // Step 2: Copy to Workspace
    async copyToWorkspace() {
        if (!this.selectedFolder) {
            this.showAlert('Please select a folder first', 'error');
            return;
        }

        try {
            console.log('📋 Copying folder to workspace...');
            this.showAlert('📋 Copying project to workspace...', 'info');
            
            // Generate workspace path
            const projectName = this.selectedFolder.split('\\').pop() || this.selectedFolder.split('/').pop();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
            this.workspaceCopyPath = `C:\\00_AI_PROJECTS\\37_optqo_IDE_Cli\\analysis-workspace\\local-projects\\${projectName}-${timestamp}`;
            
            // Call the copy function through electron API
            const result = await window.electronAPI.copyProjectToWorkspace(this.selectedFolder, this.workspaceCopyPath);
            
            if (result.success) {
                this.showAlert(`✅ Project copied to: ${this.workspaceCopyPath}`, 'success');
                console.log('📁 Project copied successfully to:', this.workspaceCopyPath);
                
                // Show workspace info and enable analysis
                this.showWorkspaceCopy(this.workspaceCopyPath);
                this.enableAnalyzeButton();
                
            } else {
                this.showAlert(`❌ Copy failed: ${result.error}`, 'error');
                console.log('❌ Copy failed:', result.error);
            }
        } catch (error) {
            console.error('❌ Error copying to workspace:', error);
            this.showAlert(`Error copying to workspace: ${error.message}`, 'error');
        }
    }

    // Step 3: Run Analysis
    async runAnalysis() {
        if (!this.workspaceCopyPath) {
            this.showAlert('Please copy project to workspace first', 'error');
            return;
        }

        if (this.isAnalyzing) return;

        try {
            console.log('🔬 Starting analysis...');
            this.startAnalysis(this.workspaceCopyPath);

            const result = await window.electronAPI.analyzeProject(this.workspaceCopyPath, {
                depth: 'standard',
                output: './analysis-workspace/analysis-results'
            });

            console.log('📊 Analysis result:', result);

            if (result.success) {
                this.showAnalysisResults(result.data);
                this.showAlert('✅ Analysis completed successfully!', 'success');
                console.log('✅ Analysis completed successfully');
            } else {
                this.showAlert(`❌ Analysis failed: ${result.error}`, 'error');
                console.log('❌ Analysis failed:', result.error);
            }
        } catch (error) {
            console.error('❌ Error in analysis:', error);
            this.showAlert(`Error running analysis: ${error.message}`, 'error');
        } finally {
            this.finishAnalysis();
        }
    }

    toggleGithubInput() {
        const githubInput = document.getElementById('githubInput');
        const isVisible = githubInput.style.display !== 'none';
        
        githubInput.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            document.getElementById('githubUrl').focus();
        }
    }

    async analyzeGithubRepository() {
        const repoUrl = document.getElementById('githubUrl').value.trim();
        if (!repoUrl) {
            this.showAlert('Please enter a GitHub repository URL', 'error');
            return;
        }

        if (this.isAnalyzing) return;

        try {
            this.startAnalysis('GitHub Repository');
            
            const result = await window.electronAPI.cloneAnalyzeGithub(repoUrl, {});
            
            if (result.success) {
                this.showAlert(result.message || 'GitHub analysis completed successfully!', 'success');
                // For now, show a placeholder result since GitHub integration is not fully implemented
                this.showPlaceholderResults(repoUrl);
            } else {
                this.showAlert(`GitHub analysis failed: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showAlert(`Error analyzing GitHub repository: ${error.message}`, 'error');
        } finally {
            this.finishAnalysis();
        }
    }

    async analyzeProject(folderPath) {
        if (this.isAnalyzing) return;

        try {
            console.log('🔬 Starting analysis for:', folderPath);
            this.startAnalysis(folderPath);

            const result = await window.electronAPI.analyzeProject(folderPath, {
                depth: 'standard',
                output: './gui-analysis'
            });

            console.log('📊 Analysis result:', result);

            if (result.success) {
                this.showAnalysisResults(result.data);
                this.showAlert('Analysis completed successfully!', 'success');
                
                // Show where results are stored
                if (result.data && result.data.workspaceInfo) {
                    this.showAlert(`📂 Project copied to: ${result.data.workspaceInfo.workspacePath}`, 'info');
                    this.showAlert(`📊 Results saved in: C:\\00_AI_PROJECTS\\37_optqo_IDE_Cli\\analysis-workspace\\analysis-results`, 'info');
                }
                
                console.log('✅ Analysis completed successfully');
            } else {
                this.showAlert(`Analysis failed: ${result.error}`, 'error');
                console.log('❌ Analysis failed:', result.error);
            }
        } catch (error) {
            console.error('❌ Error in analyzeProject:', error);
            this.showAlert(`Error analyzing project: ${error.message}`, 'error');
        } finally {
            this.finishAnalysis();
        }
    }

    startAnalysis(target) {
        this.isAnalyzing = true;
        document.getElementById('progressSection').style.display = 'block';
        document.getElementById('resultsSection').style.display = 'none';
        
        // Show prominent status message
        this.showAlert(`🔍 Starting analysis of: ${target}`, 'info');
        
        this.updateStatus('analyzing', `Analyzing: ${target}`);
        this.updateProgress({ status: 'starting', message: 'Initializing analysis...' });
    }

    finishAnalysis() {
        this.isAnalyzing = false;
        document.getElementById('progressSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'block';
        
        this.updateStatus('ready', 'Analysis complete');
    }

    updateProgress(progress) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        // Simulate progress based on status
        let percentage = 0;
        switch (progress.status) {
            case 'starting': percentage = 10; break;
            case 'scanning': percentage = 30; break;
            case 'analyzing': percentage = 60; break;
            case 'cloning': percentage = 40; break;
            case 'processing': percentage = 80; break;
            case 'complete': percentage = 100; break;
            default: percentage = 50;
        }
        
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = progress.message || 'Processing...';
    }

    showAnalysisResults(data) {
        const resultsGrid = document.getElementById('resultsGrid');
        const viewReportBtn = document.getElementById('viewReportBtn');
        
        resultsGrid.innerHTML = '';

        if (!data || !data.summary) {
            this.showAlert('No analysis data received', 'error');
            return;
        }

        const metrics = [
            { label: 'Total Files', value: data.summary.totalFiles || 0 },
            { label: 'Languages Found', value: data.summary.languages?.length || 0 },
            { label: 'Total Lines', value: this.formatNumber(data.summary.totalLines || 0) },
            { label: 'Avg Complexity', value: this.formatComplexity(data.summary.averageComplexity) },
            { label: 'High Complexity Files', value: data.summary.highComplexityFiles || 0 },
            { label: 'Issues Found', value: data.summary.totalIssues || 0 }
        ];

        metrics.forEach(metric => {
            const card = this.createMetricCard(metric.label, metric.value);
            resultsGrid.appendChild(card);
        });

        // Show additional details if available
        if (data.summary.languages && data.summary.languages.length > 0) {
            this.showAlert(`Languages detected: ${data.summary.languages.join(', ')}`, 'info');
        }

        // Show HTML report button if report was generated
        if (data.htmlReport && data.htmlReport.success) {
            viewReportBtn.style.display = 'inline-block';
            this.currentReportPath = data.htmlReport.reportPath;
            this.showAlert(`📊 HTML report generated: ${data.htmlReport.filename}`, 'success');
        }
    }

    showPlaceholderResults(repoUrl) {
        const resultsGrid = document.getElementById('resultsGrid');
        resultsGrid.innerHTML = '';

        const placeholderMetrics = [
            { label: 'Repository', value: repoUrl.split('/').pop() },
            { label: 'Status', value: 'Cloned' },
            { label: 'Integration', value: 'Coming Soon' }
        ];

        placeholderMetrics.forEach(metric => {
            const card = this.createMetricCard(metric.label, metric.value);
            resultsGrid.appendChild(card);
        });
    }

    createMetricCard(label, value) {
        const card = document.createElement('div');
        card.className = 'metric-card';
        card.innerHTML = `
            <div class="metric-value">${value}</div>
            <div class="metric-label">${label}</div>
        `;
        return card;
    }

    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    formatComplexity(complexity) {
        if (isNaN(complexity)) return 'N/A';
        return parseFloat(complexity).toFixed(1);
    }

    handleAgentInitialized(data) {
        if (data.success) {
            this.updateStatus('ready', 'Ready for analysis');
            if (data.context) {
                document.getElementById('currentContext').textContent = 
                    `Context: ${data.context.name.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
            }
            
            // Show workspace information if available
            if (data.workspace) {
                this.showWorkspaceInfo(data.workspace);
            }
        } else {
            this.updateStatus('error', 'Initialization failed');
            this.showAlert(`Initialization failed: ${data.error}`, 'error');
        }
    }

    showWorkspaceInfo(workspace) {
        const workspaceInfo = document.getElementById('workspace-info');
        if (!workspaceInfo) return;
        
        // Update workspace paths
        const pathElements = {
            'local-projects-path': workspace['local-projects'],
            'github-repos-path': workspace['github-repos'], 
            'analysis-results-path': workspace['analysis-results'],
            'reports-path': workspace['reports']
        };
        
        for (const [elementId, path] of Object.entries(pathElements)) {
            const element = document.getElementById(elementId);
            if (element) {
                element.textContent = path;
            }
        }
        
        // Show the workspace info section
        workspaceInfo.style.display = 'block';
    }

    updateStatus(status, message) {
        const statusText = document.getElementById('statusText');
        
        if (statusText) {
            statusText.textContent = message;
        }
    }

    showAlert(message, type = 'info') {
        const alertContainer = document.getElementById('alertContainer');
        
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;
        
        alertContainer.appendChild(alert);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (alert.parentNode) {
                alert.parentNode.removeChild(alert);
            }
        }, 5000);
    }

    showSelectedFolder(folderPath) {
        const selectedInfo = document.getElementById('selectedFolderInfo');
        const selectedPath = document.getElementById('selectedPath');
        const selectBtn = document.getElementById('selectFolderCard');
        
        if (selectedInfo && selectedPath) {
            selectedPath.textContent = folderPath;
            selectedInfo.classList.add('visible');
        }
        
        if (selectBtn) {
            selectBtn.classList.add('completed');
            selectBtn.innerHTML = '✅ Step 1: Folder Selected';
        }
    }

    showWorkspaceCopy(workspacePath) {
        const workspaceInfo = document.getElementById('workspaceCopyInfo');
        const workspacePath_elem = document.getElementById('workspacePath');
        const copyBtn = document.getElementById('copyToWorkspaceBtn');
        
        if (workspaceInfo && workspacePath_elem) {
            workspacePath_elem.textContent = workspacePath;
            workspaceInfo.classList.add('visible');
        }
        
        if (copyBtn) {
            copyBtn.classList.add('completed');
            copyBtn.innerHTML = '✅ Step 2: Copied to Workspace';
        }
    }

    enableCopyButton() {
        console.log('🔓 Enabling copy button...');
        const copyBtn = document.getElementById('copyToWorkspaceBtn');
        console.log('🔍 Copy button element:', copyBtn);
        
        if (copyBtn) {
            console.log('🔧 Before: disabled =', copyBtn.disabled);
            copyBtn.disabled = false;
            copyBtn.classList.remove('disabled');
            copyBtn.style.opacity = '1';
            copyBtn.style.cursor = 'pointer';
            copyBtn.style.background = 'rgba(255, 255, 255, 0.1)';
            copyBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            copyBtn.style.color = '#ffffff';
            console.log('🔧 After: disabled =', copyBtn.disabled);
            console.log('✅ Copy button enabled successfully');
        } else {
            console.error('❌ Copy button not found!');
        }
    }

    enableAnalyzeButton() {
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            analyzeBtn.classList.remove('disabled');
            analyzeBtn.style.opacity = '1';
            analyzeBtn.style.cursor = 'pointer';
            analyzeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
            analyzeBtn.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            analyzeBtn.style.color = '#ffffff';
        }
    }

    resetInterface() {
        // Reset state
        this.selectedFolder = null;
        this.workspaceCopyPath = null;
        
        // Hide sections
        document.getElementById('progressSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'none';
        
        // Hide step info
        const selectedInfo = document.getElementById('selectedFolderInfo');
        const workspaceInfo = document.getElementById('workspaceCopyInfo');
        if (selectedInfo) selectedInfo.classList.remove('visible');
        if (workspaceInfo) workspaceInfo.classList.remove('visible');
        
        // Reset buttons
        const selectBtn = document.getElementById('selectFolderCard');
        const copyBtn = document.getElementById('copyToWorkspaceBtn');
        const analyzeBtn = document.getElementById('analyzeBtn');
        
        if (selectBtn) {
            selectBtn.classList.remove('completed');
            selectBtn.innerHTML = '📂 Step 1: Select Folder';
        }
        
        if (copyBtn) {
            copyBtn.classList.remove('completed');
            copyBtn.innerHTML = '📋 Step 2: Copy to Workspace';
            copyBtn.disabled = true;
        }
        
        if (analyzeBtn) {
            analyzeBtn.classList.remove('completed');
            analyzeBtn.innerHTML = '🔍 Step 3: Analyze Project';
            analyzeBtn.disabled = true;
        }
        
        // Clear inputs and alerts
        document.getElementById('githubUrl').value = '';
        document.getElementById('alertContainer').innerHTML = '';
        
        this.updateStatus('ready', 'Ready for analysis');
    }

    async openHtmlReport() {
        if (!this.currentReportPath) {
            this.showAlert('No HTML report available', 'error');
            return;
        }

        try {
            const result = await window.electronAPI.openHtmlReport(this.currentReportPath);
            if (result.success) {
                this.showAlert('📄 HTML report opened in browser', 'success');
            } else {
                this.showAlert(`Failed to open report: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showAlert(`Error opening report: ${error.message}`, 'error');
        }
    }
}

// Initialize the interface when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new AgentInterface();
});
