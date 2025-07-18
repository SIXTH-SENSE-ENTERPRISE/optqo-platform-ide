import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CrewAnalysisActivity } from '../02_activities/09_crew_analysis_activity.js';
import { workspaceManager } from '../09_workspace/workspace-manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Modular AI Agent - Configuration-Driven Architecture
 * 
 * Core orchestrator that manages contexts, activities, and templates
 * through external configuration files. Now supports crew-based analysis.
 */
export default class ModularAIAgent {
    constructor() {
        this.currentContext = null;
        this.contexts = null;
        this.promptLoader = new PromptLoader();
        this.templateEngine = new TemplateEngine();
        this.contextManager = new ContextManager();
        this.pipelineManager = new PipelineManager();
        this.crewManager = new CrewManager(); // New crew management
        this.workspaceManager = workspaceManager; // Workspace isolation
        this.currentWorkspace = null; // Active workspace
        this.baseDir = path.resolve(__dirname, '..');
        this.analysisMode = 'standard'; // 'standard' or 'crew'
    }

    /**
     * Initialize the agent with a specific context and analysis mode
     */
    async initialize(contextName = 'general-analyst', analysisMode = 'crew') {
        try {
            console.log('🚀 Initializing Modular AI Agent...');
            console.log(`📊 Analysis Mode: ${analysisMode}`);
            
            this.analysisMode = analysisMode;
            
            // Load all available contexts
            await this.loadContexts();
            
            // Set initial context
            await this.switchContext(contextName);
            
            // Initialize crew system if using crew mode
            if (analysisMode === 'crew') {
                await this.initializeCrewSystem();
            }
            
            console.log(`✅ Agent initialized with context: ${this.currentContext.name}`);
            console.log(`🤖 Analysis mode: ${this.analysisMode}`);
            return true;
        } catch (error) {
            console.error('❌ Initialization failed:', error.message);
            return false;
        }
    }

    /**
     * Initialize crew-based analysis system
     */
    async initializeCrewSystem() {
        console.log('🚀 Initializing Crew-Based Analysis System...');
        
        // Load crew configuration based on context
        const crewConfig = this.getCrewConfigForContext(this.currentContext);
        
        this.crewManager.configure(crewConfig);
        console.log(`✅ Crew system configured: ${crewConfig.size} crew`);
    }

    /**
     * Get crew configuration based on context
     */
    getCrewConfigForContext(context) {
        const contextCrewMap = {
            'data-scientist': { size: 'full', focus: 'analytics' },
            'data-engineer': { size: 'full', focus: 'data-infrastructure' },
            'analytics-professional': { size: 'standard', focus: 'business-intelligence' },
            'financial-analyst': { size: 'full', focus: 'financial-systems' },
            'enterprise-architect': { size: 'full', focus: 'enterprise-patterns' },
            'startup-cto': { size: 'standard', focus: 'modern-stack' },
            'general-analyst': { size: 'standard', focus: 'general' }
        };
        
        const config = contextCrewMap[context.name] || contextCrewMap['general-analyst'];
        
        return {
            crewSize: config.size,
            context: context.name,
            focus: config.focus,
            outputPath: path.join(this.baseDir, '07_outputs'),
            templatePath: path.join(this.baseDir, '04_templates')
        };
    }

    /**
     * Load context configurations from JSON file
     */
    async loadContexts() {
        const contextPath = path.join(this.baseDir, '05_config', 'agent-contexts.json');
        
        if (!fs.existsSync(contextPath)) {
            throw new Error('Context configuration file not found');
        }
        
        const contextData = JSON.parse(fs.readFileSync(contextPath, 'utf8'));
        this.contexts = contextData;
    }

    /**
     * Switch to a different context
     */
    async switchContext(contextName) {
        if (!this.contexts || !this.contexts[contextName]) {
            throw new Error(`Context '${contextName}' not found`);
        }
        
        this.currentContext = this.contexts[contextName];
        
        // Load context-specific prompts
        if (this.currentContext.promptsFile) {
            await this.promptLoader.loadPrompts(
                path.join(this.baseDir, this.currentContext.promptsFile)
            );
        }
        
        console.log(`🔄 Switched to context: ${contextName}`);
    }

    /**
     * Get available contexts
     */
    getAvailableContexts() {
        if (!this.contexts) return [];
        
        return Object.values(this.contexts).map(context => ({
            name: context.name,
            description: context.description,
            focus: context.focus
        }));
    }

    /**
     * Get current context
     */
    getCurrentContext() {
        return this.currentContext;
    }

    /**
     * Create a new project workspace
     */
    async createProjectWorkspace(projectName, projectType = 'analysis') {
        try {
            this.currentWorkspace = await this.workspaceManager.createWorkspace(projectName, projectType);
            console.log(`🏗️ Created workspace: ${this.currentWorkspace.id}`);
            return this.currentWorkspace;
        } catch (error) {
            console.error('❌ Failed to create workspace:', error);
            throw error;
        }
    }

    /**
     * Switch to an existing workspace
     */
    async switchWorkspace(workspaceId) {
        try {
            this.currentWorkspace = await this.workspaceManager.getWorkspace(workspaceId);
            if (!this.currentWorkspace) {
                throw new Error(`Workspace ${workspaceId} not found`);
            }
            console.log(`🔄 Switched to workspace: ${this.currentWorkspace.id}`);
            return this.currentWorkspace;
        } catch (error) {
            console.error('❌ Failed to switch workspace:', error);
            throw error;
        }
    }

    /**
     * Get current output path (workspace-specific or global)
     */
    getOutputPath() {
        if (this.currentWorkspace) {
            return this.currentWorkspace.outputsPath;
        }
        return path.join(this.baseDir, '07_outputs'); // Fallback to global
    }

    /**
     * Run a specific activity
     */
    async runActivity(activityName, inputPath, options = {}) {
        if (!this.currentContext) {
            throw new Error('Agent not initialized. Call initialize() first.');
        }

        if (!this.currentContext.enabledActivities.includes(activityName)) {
            throw new Error(`Activity '${activityName}' not enabled for context '${this.currentContext.name}'`);
        }

        console.log(`⚡ Running ${activityName} activity...`);

        try {
            // Dynamic import of activity module
            const activityPath = path.join(this.baseDir, '02_activities', `${activityName}.js`);
            
            if (!fs.existsSync(activityPath)) {
                throw new Error(`Activity module '${activityName}.js' not found`);
            }

            // Convert to file URL for Windows compatibility
            const activityUrl = `file:///${activityPath.replace(/\\/g, '/')}`;
            const ActivityModule = await import(activityUrl);
            const ActivityClass = ActivityModule.default;
            
            const activity = new ActivityClass();
            
            // Execute activity with context and options
            const result = await activity.execute(inputPath, options, {
                context: this.currentContext.name,
                prompts: this.promptLoader.getPrompts(),
                templateEngine: this.templateEngine,
                focus: this.currentContext.focus
            });

            console.log(`✅ ${activityName} completed`);
            return result;
            
        } catch (error) {
            console.error(`❌ Activity '${activityName}' failed:`, error.message);
            throw error;
        }
    }

    /**
     * Run complete pipeline of activities
     */
    async runPipeline(inputPath, options = {}) {
        if (!this.currentContext) {
            throw new Error('Agent not initialized. Call initialize() first.');
        }

        console.log('🔄 Starting pipeline execution...');
        
        const results = {};
        const activities = this.currentContext.enabledActivities;

        for (const activityName of activities) {
            try {
                const result = await this.runActivity(activityName, inputPath, {
                    ...options,
                    previousResults: results
                });
                
                results[activityName] = result;
                
                if (options.stopOnError && !result.success) {
                    console.log(`⚠️ Pipeline stopped due to error in ${activityName}`);
                    break;
                }
                
            } catch (error) {
                console.error(`❌ Pipeline failed at ${activityName}:`, error.message);
                
                if (options.stopOnError) {
                    throw error;
                }
                
                results[activityName] = { success: false, error: error.message };
            }
        }

        console.log('🎉 Pipeline execution completed');
        return results;
    }

    /**
     * Run crew-based analysis
     */
    async runCrewAnalysis(workspacePath, options = {}) {
        if (!this.currentContext) {
            throw new Error('Agent not initialized. Call initialize() first.');
        }

        if (this.analysisMode !== 'crew') {
            throw new Error('Crew analysis mode not enabled. Initialize with analysisMode="crew".');
        }

        console.log(`🚀 Starting Crew-Based Analysis for context: ${this.currentContext.name}`);

        try {
            // Get crew configuration for current context
            const crewConfig = this.getCrewConfigForContext(this.currentContext);
            
            // Create crew analysis activity
            const crewActivity = new CrewAnalysisActivity({
                ...crewConfig,
                ...options
            });

            // Execute crew analysis
            const result = await crewActivity.execute(workspacePath, {
                context: this.currentContext.name,
                focus: this.currentContext.focus,
                prompts: this.promptLoader.getPrompts(),
                ...options
            });

            console.log(`✅ Crew Analysis completed for ${this.currentContext.name} context`);
            return result;
            
        } catch (error) {
            console.error(`❌ Crew Analysis failed:`, error.message);
            throw error;
        }
    }

    /**
     * Get crew analysis configurations
     */
    getCrewConfigurations() {
        return CrewAnalysisActivity.getCrewConfigurations();
    }

    /**
     * Run analysis (automatically chooses method based on mode)
     */
    async analyze(workspacePath, options = {}) {
        if (this.analysisMode === 'crew') {
            return await this.runCrewAnalysis(workspacePath, options);
        } else {
            // Fallback to standard pipeline analysis
            return await this.runPipeline(workspacePath, options);
        }
    }
}

/**
 * Prompt Loader - Manages external AI prompts
 */
class PromptLoader {
    constructor() {
        this.prompts = {};
    }

    async loadPrompts(promptsPath) {
        if (!fs.existsSync(promptsPath)) {
            console.warn(`⚠️ Prompts file not found: ${promptsPath}`);
            return;
        }

        const promptData = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));
        this.prompts = promptData;
        console.log('📝 Prompts loaded');
    }

    getPrompts() {
        return this.prompts;
    }

    getPrompt(key) {
        return this.prompts[key] || '';
    }
}

/**
 * Template Engine - Handles template processing
 */
class TemplateEngine {
    constructor() {
        // Simple template engine using basic string replacement
        // Can be extended to use Handlebars or other engines
    }

    processTemplate(template, variables) {
        let result = template;
        
        // Simple variable substitution {{variable}}
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
            result = result.replace(regex, value);
        }
        
        // Simple conditional {{#if condition}}content{{else}}alt{{/if}}
        result = result.replace(/{{#if\s+(\w+)}}(.*?){{else}}(.*?){{\/if}}/gs, (match, condition, ifContent, elseContent) => {
            return variables[condition] ? ifContent : elseContent;
        });
        
        result = result.replace(/{{#if\s+(\w+)}}(.*?){{\/if}}/gs, (match, condition, content) => {
            return variables[condition] ? content : '';
        });
        
        return result;
    }

    async loadTemplate(templatePath) {
        if (!fs.existsSync(templatePath)) {
            throw new Error(`Template not found: ${templatePath}`);
        }
        
        return fs.readFileSync(templatePath, 'utf8');
    }
}

/**
 * Context Manager - Handles context switching and validation
 */
class ContextManager {
    constructor() {
        this.contexts = new Map();
    }

    registerContext(name, config) {
        this.contexts.set(name, config);
    }

    getContext(name) {
        return this.contexts.get(name);
    }

    listContexts() {
        return Array.from(this.contexts.keys());
    }
}

/**
 * Pipeline Manager - Orchestrates activity execution
 */
class PipelineManager {
    constructor() {
        this.activities = new Map();
    }

    registerActivity(name, activityClass) {
        this.activities.set(name, activityClass);
    }

    async executeActivity(name, ...args) {
        const ActivityClass = this.activities.get(name);
        if (!ActivityClass) {
            throw new Error(`Activity '${name}' not registered`);
        }
        
        const activity = new ActivityClass();
        return await activity.execute(...args);
    }
}

/**
 * Crew Manager - Manages crew-based analysis configuration
 */
class CrewManager {
    constructor() {
        this.config = null;
    }

    configure(config) {
        this.config = config;
    }

    getConfig() {
        return this.config;
    }
}
