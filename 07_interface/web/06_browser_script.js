// Browser-compatible GUI Script for Modular AI Agent
class AgentInterface {
    constructor() {
        this.currentContext = 'general'; // Default context
        this.isAnalyzing = false;
        this.selectedFolder = null;
        this.workspaceCopyPath = null;
        this.initializeEventListeners();
        this.initializeBrowserMode();
    }

    initializeBrowserMode() {
        // Since we're in browser mode, show instructions for manual path entry
        this.showAlert('info', 'Browser Mode: Please enter the full path to your project folder manually', false);
        
        // Pre-populate with current project path as example
        const defaultPath = 'c:\\00_AI_PROJECTS\\37_optqo_IDE_Cli';
        this.selectedFolder = defaultPath;
        this.updateFolderDisplay(defaultPath);
        this.enableCopyToWorkspace();
    }

    initializeEventListeners() {
        // Folder selection - in browser mode, this will show a text input
        document.getElementById('selectFolderCard').addEventListener('click', () => {
            this.selectFolderBrowser();
        });

        // Copy to workspace button
        document.getElementById('copyToWorkspaceBtn').addEventListener('click', () => {
            this.copyToWorkspaceBrowser();
        });

        // Analyze button
        document.getElementById('analyzeBtn').addEventListener('click', () => {
            this.runAnalysisBrowser();
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
            this.openHtmlReportBrowser();
        });
    }

    // Browser-compatible folder selection
    selectFolderBrowser() {
        const folderPath = prompt('Enter the full path to your project folder:', this.selectedFolder || 'c:\\00_AI_PROJECTS\\37_optqo_IDE_Cli');
        
        if (folderPath && folderPath.trim()) {
            this.selectedFolder = folderPath.trim();
            this.updateFolderDisplay(this.selectedFolder);
            this.enableCopyToWorkspace();
            this.showAlert('success', `Selected folder: ${this.selectedFolder}`);
        }
    }

    updateFolderDisplay(folderPath) {
        const infoElement = document.getElementById('selectedFolderInfo');
        const pathElement = document.getElementById('selectedFolderPath');
        
        if (infoElement && pathElement) {
            infoElement.style.display = 'block';
            pathElement.textContent = folderPath;
        }
    }

    enableCopyToWorkspace() {
        const copyBtn = document.getElementById('copyToWorkspaceBtn');
        if (copyBtn) {
            copyBtn.disabled = false;
            copyBtn.style.opacity = '1';
        }
    }

    // Browser-compatible workspace copy
    copyToWorkspaceBrowser() {
        if (!this.selectedFolder) {
            this.showAlert('error', 'Please select a folder first');
            return;
        }

        // In browser mode, we'll use the selected folder directly
        this.workspaceCopyPath = this.selectedFolder;
        
        // Update workspace display
        const workspaceInfo = document.getElementById('workspaceCopyInfo');
        const workspacePath = document.getElementById('workspacePath');
        
        if (workspaceInfo && workspacePath) {
            workspaceInfo.style.display = 'block';
            workspacePath.textContent = this.workspaceCopyPath;
        }

        // Enable analyze button
        const analyzeBtn = document.getElementById('analyzeBtn');
        if (analyzeBtn) {
            analyzeBtn.disabled = false;
            analyzeBtn.style.opacity = '1';
        }

        this.showAlert('success', 'Workspace ready for analysis!');
    }

    // Browser-compatible analysis
    async runAnalysisBrowser() {
        if (!this.workspaceCopyPath) {
            this.showAlert('error', 'Please complete the workspace setup first');
            return;
        }

        if (this.isAnalyzing) {
            this.showAlert('warning', 'Analysis is already in progress');
            return;
        }

        this.isAnalyzing = true;
        this.showProgress(true);
        this.updateProgress(10, 'Initializing analysis...');

        try {
            // Simulate the analysis process with demo data
            this.showAlert('info', 'Running demo analysis with sample data...');
            
            // Simulate progress updates
            setTimeout(() => this.updateProgress(30, 'Technology Detection Agent working...'), 500);
            setTimeout(() => this.updateProgress(50, 'Quality Assessment Agent analyzing...'), 1500);
            setTimeout(() => this.updateProgress(70, 'Architecture Analysis Agent reviewing...'), 2500);
            setTimeout(() => this.updateProgress(90, 'Report Generation Agent finalizing...'), 3500);
            
            // Complete after 4 seconds
            setTimeout(() => {
                this.completeDemoAnalysis();
            }, 4000);

        } catch (error) {
            console.error('❌ Error in analysis:', error);
            this.showAlert('error', `Analysis failed: ${error.message}`);
            this.isAnalyzing = false;
            this.showProgress(false);
        }
    }

    completeDemoAnalysis() {
        this.updateProgress(100, 'Analysis complete!');
        this.isAnalyzing = false;
        
        // Show demo results
        const demoResults = {
            technology: {
                primaryLanguage: 'JavaScript',
                languages: ['JavaScript', 'HTML', 'CSS', 'JSON'],
                frameworks: ['Node.js', 'Express.js', 'Electron'],
                totalFiles: 156
            },
            quality: {
                overallScore: 78,
                codeQuality: 82,
                documentation: 71,
                testing: 65
            },
            analysis: {
                linesOfCode: 12500,
                complexity: 'Medium',
                maintainability: 'Good'
            }
        };

        this.displayResults(demoResults);
        this.showAlert('success', 'Demo analysis completed! In full mode, this would analyze your actual project.');
        
        setTimeout(() => {
            this.showProgress(false);
        }, 1000);
    }

    async analyzeGithubRepository() {
        const repoUrl = document.getElementById('githubUrl').value.trim();
        
        if (!repoUrl) {
            this.showAlert('error', 'Please enter a GitHub repository URL');
            return;
        }

        this.showAlert('info', 'GitHub analysis not available in browser mode. Please use the desktop version for full functionality.');
    }

    openHtmlReportBrowser() {
        this.showAlert('info', 'In full mode, this would open the generated HTML report. For now, check the results displayed above.');
    }

    displayResults(results) {
        const resultsSection = document.getElementById('resultsSection');
        const resultsGrid = document.getElementById('resultsGrid');
        
        if (!resultsSection || !resultsGrid) return;

        resultsSection.style.display = 'block';
        
        resultsGrid.innerHTML = `
            <div class="result-card">
                <div class="result-title">🔧 Technology Stack</div>
                <div class="result-content">
                    <div class="result-item">
                        <span class="result-label">Primary Language:</span>
                        <span class="result-value">${results.technology.primaryLanguage}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Total Files:</span>
                        <span class="result-value">${results.technology.totalFiles}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Languages:</span>
                        <span class="result-value">${results.technology.languages.join(', ')}</span>
                    </div>
                </div>
            </div>
            
            <div class="result-card">
                <div class="result-title">📊 Quality Metrics</div>
                <div class="result-content">
                    <div class="result-item">
                        <span class="result-label">Overall Score:</span>
                        <span class="result-value quality-score">${results.quality.overallScore}%</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Code Quality:</span>
                        <span class="result-value">${results.quality.codeQuality}%</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Documentation:</span>
                        <span class="result-value">${results.quality.documentation}%</span>
                    </div>
                </div>
            </div>
            
            <div class="result-card">
                <div class="result-title">🏗️ Code Analysis</div>
                <div class="result-content">
                    <div class="result-item">
                        <span class="result-label">Lines of Code:</span>
                        <span class="result-value">${results.analysis.linesOfCode.toLocaleString()}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Complexity:</span>
                        <span class="result-value">${results.analysis.complexity}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">Maintainability:</span>
                        <span class="result-value">${results.analysis.maintainability}</span>
                    </div>
                </div>
            </div>
        `;

        // Add some additional CSS for results
        if (!document.querySelector('#resultsStyles')) {
            const style = document.createElement('style');
            style.id = 'resultsStyles';
            style.textContent = `
                .results-section {
                    margin-top: 30px;
                    width: 100%;
                }
                
                .results-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                    margin-top: 20px;
                }
                
                .result-card {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    padding: 20px;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .result-title {
                    font-size: 18px;
                    font-weight: 600;
                    margin-bottom: 15px;
                    color: rgba(255, 255, 255, 0.9);
                }
                
                .result-content {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                
                .result-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .result-label {
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 14px;
                }
                
                .result-value {
                    color: rgba(255, 255, 255, 0.9);
                    font-weight: 500;
                    font-size: 14px;
                }
                
                .quality-score {
                    background: linear-gradient(135deg, #4caf50, #45a049);
                    padding: 4px 8px;
                    border-radius: 6px;
                    color: white;
                    font-weight: 600;
                }
            `;
            document.head.appendChild(style);
        }
    }

    showProgress(show) {
        const progressSection = document.getElementById('progressSection');
        if (progressSection) {
            progressSection.style.display = show ? 'block' : 'none';
        }
    }

    updateProgress(percentage, text) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = text;
        }
    }

    showAlert(type, message, autoHide = true) {
        const alertContainer = document.getElementById('alertContainer');
        if (!alertContainer) return;

        const alertId = `alert-${Date.now()}`;
        const alertClass = {
            'success': 'alert-success',
            'error': 'alert-error',
            'warning': 'alert-warning',
            'info': 'alert-info'
        }[type] || 'alert-info';

        const alertHTML = `
            <div id="${alertId}" class="alert ${alertClass}">
                <span class="alert-message">${message}</span>
                <button class="alert-close" onclick="this.parentElement.remove()">&times;</button>
            </div>
        `;

        alertContainer.insertAdjacentHTML('beforeend', alertHTML);

        // Add alert styles if not present
        if (!document.querySelector('#alertStyles')) {
            const style = document.createElement('style');
            style.id = 'alertStyles';
            style.textContent = `
                #alertContainer {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                    max-width: 400px;
                }
                
                .alert {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 16px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    animation: slideIn 0.3s ease-out;
                }
                
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                .alert-success {
                    background: rgba(76, 175, 80, 0.2);
                    border-color: #4caf50;
                    color: #4caf50;
                }
                
                .alert-error {
                    background: rgba(244, 67, 54, 0.2);
                    border-color: #f44336;
                    color: #f44336;
                }
                
                .alert-warning {
                    background: rgba(255, 193, 7, 0.2);
                    border-color: #ffc107;
                    color: #ffc107;
                }
                
                .alert-info {
                    background: rgba(33, 150, 243, 0.2);
                    border-color: #2196f3;
                    color: #2196f3;
                }
                
                .alert-message {
                    flex: 1;
                    font-size: 14px;
                }
                
                .alert-close {
                    background: none;
                    border: none;
                    color: inherit;
                    font-size: 18px;
                    cursor: pointer;
                    padding: 0;
                    margin-left: 10px;
                    opacity: 0.7;
                }
                
                .alert-close:hover {
                    opacity: 1;
                }
            `;
            document.head.appendChild(style);
        }

        if (autoHide) {
            setTimeout(() => {
                const alertElement = document.getElementById(alertId);
                if (alertElement) {
                    alertElement.remove();
                }
            }, 5000);
        }
    }
}

// Initialize the interface when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.agentInterface = new AgentInterface();
    console.log('🌐 optqo Platform GUI initialized in browser mode');
});
