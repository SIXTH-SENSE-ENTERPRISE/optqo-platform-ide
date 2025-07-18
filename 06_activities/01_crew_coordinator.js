/**
 * Analytics Codebase Analysis Crew System - Main Coordinator
 * Role: Senior Analytics Consultant & Project Coordinator
 * Orchestrates comprehensive analytical codebase analysis
 */

import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';

export class CrewCoordinator extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = {
            crewSize: 'full', // basic, standard, full
            outputPath: config.outputPath || './07_outputs',
            templatePath: config.templatePath || './04_templates',
            timeout: config.timeout || 300000, // 5 minutes
            ...config
        };
        
        this.agents = new Map();
        this.analysisResults = new Map();
        this.executionPhase = null;
        this.startTime = null;
    }

    /**
     * Initialize and configure crew agents based on deployment scenario
     */
    async initializeCrew() {
        console.log(`🚀 Initializing ${this.config.crewSize} analysis crew...`);
        
        const crewConfigs = {
            basic: ['technology-detection', 'quality-assessment'],
            standard: ['technology-detection', 'quality-assessment', 'architecture-analysis', 'file-structure'],
            full: ['technology-detection', 'quality-assessment', 'architecture-analysis', 
                   'file-structure', 'multi-language-integration', 'edge-cases-validation']
        };

        const agentList = crewConfigs[this.config.crewSize] || crewConfigs.full;
        
        // Dynamic import of agent modules
        for (const agentType of agentList) {
            try {
                const AgentClass = await this.importAgent(agentType);
                const agent = new AgentClass(this.config);
                this.agents.set(agentType, agent);
                
                // Set up event listeners for agent communication
                agent.on('analysis-complete', (data) => {
                    this.handleAgentResult(agentType, data);
                });
                
                agent.on('error', (error) => {
                    this.handleAgentError(agentType, error);
                });
                
                console.log(`✅ Initialized ${agentType} agent`);
            } catch (error) {
                console.warn(`⚠️  Failed to load ${agentType} agent:`, error.message);
            }
        }
        
        console.log(`🎯 Crew initialized with ${this.agents.size} active agents`);
    }

    /**
     * Dynamic agent module import
     */
    async importAgent(agentType) {
        const agentMap = {
            'technology-detection': () => import('./02_technology_detection_agent.js').then(m => m.TechnologyDetectionAgent),
            'quality-assessment': () => import('./03_quality_assessment_agent.js').then(m => m.QualityAssessmentAgent),
            'architecture-analysis': () => import('./04_architecture_analysis_agent.js').then(m => m.ArchitectureAnalysisAgent),
            'file-structure': () => import('./05_file_structure_agent.js').then(m => m.FileStructureAgent),
            'multi-language-integration': () => import('./06_multi_language_integration_agent.js').then(m => m.MultiLanguageIntegrationAgent),
            'edge-cases-validation': () => import('./07_edge_cases_validation_agent.js').then(m => m.EdgeCasesValidationAgent)
        };
        
        return await agentMap[agentType]();
    }

    /**
     * Execute comprehensive codebase analysis using crew coordination
     */
    async analyzeCodebase(workspacePath, options = {}) {
        this.startTime = Date.now();
        console.log(`🔍 Starting comprehensive analysis of: ${workspacePath}`);
        
        try {
            // Phase 1: Initial Parallel Analysis
            await this.executePhase1(workspacePath, options);
            
            // Phase 2: Integration Analysis
            await this.executePhase2(workspacePath, options);
            
            // Phase 3: Report Generation and Validation
            const finalReport = await this.executePhase3(workspacePath, options);
            
            const processingTime = Math.round((Date.now() - this.startTime) / 1000);
            console.log(`✅ Analysis completed in ${processingTime} seconds`);
            
            return {
                success: true,
                report: finalReport,
                processingTime,
                agentsUsed: Array.from(this.agents.keys()),
                analysisId: this.generateAnalysisId()
            };
            
        } catch (error) {
            console.error('❌ Crew analysis failed:', error);
            throw error;
        }
    }

    /**
     * Phase 1: Initial Analysis (Parallel Execution)
     */
    async executePhase1(workspacePath, options) {
        this.executionPhase = 'initial-analysis';
        console.log('📊 Phase 1: Initial Parallel Analysis');
        
        const parallelAgents = ['technology-detection', 'quality-assessment', 'architecture-analysis', 'file-structure'];
        const promises = [];
        
        for (const agentType of parallelAgents) {
            const agent = this.agents.get(agentType);
            if (agent) {
                promises.push(this.executeAgentAnalysis(agent, agentType, workspacePath, options));
            }
        }
        
        await Promise.allSettled(promises);
        console.log('✅ Phase 1 completed');
    }

    /**
     * Phase 2: Integration Analysis (Sequential Execution)
     */
    async executePhase2(workspacePath, options) {
        this.executionPhase = 'integration-analysis';
        console.log('🔗 Phase 2: Integration Analysis');
        
        const sequentialAgents = ['multi-language-integration', 'edge-cases-validation'];
        
        for (const agentType of sequentialAgents) {
            const agent = this.agents.get(agentType);
            if (agent) {
                await this.executeAgentAnalysis(agent, agentType, workspacePath, options);
            }
        }
        
        console.log('✅ Phase 2 completed');
    }

    /**
     * Phase 3: Report Generation and Final Validation
     */
    async executePhase3(workspacePath, options) {
        this.executionPhase = 'report-generation';
        console.log('📋 Phase 3: Report Generation');
        
        // Synthesize all findings
        const synthesizedData = this.synthesizeFindings(workspacePath, options);
        
        // Generate professional report
        const { ReportGenerationAgent } = await import('./08_report_generation_agent.js');
        const reportAgent = new ReportGenerationAgent(this.config);
        
        const finalReport = await reportAgent.generateComprehensiveReport(synthesizedData);
        
        // Final validation
        const validationAgent = this.agents.get('edge-cases-validation');
        if (validationAgent) {
            await validationAgent.validateFinalReport(finalReport);
        }
        
        console.log('✅ Phase 3 completed');
        return finalReport;
    }

    /**
     * Execute individual agent analysis with error handling
     */
    async executeAgentAnalysis(agent, agentType, workspacePath, options) {
        try {
            console.log(`  🤖 Running ${agentType} analysis...`);
            const result = await agent.analyze(workspacePath, options);
            this.analysisResults.set(agentType, result);
            console.log(`  ✅ ${agentType} completed`);
            return result;
        } catch (error) {
            console.warn(`  ⚠️  ${agentType} failed:`, error.message);
            this.analysisResults.set(agentType, { error: error.message, partial: true });
            return null;
        }
    }

    /**
     * Synthesize findings from all crew agents
     */
    synthesizeFindings(workspacePath, options) {
        const processingTime = Math.round((Date.now() - this.startTime) / 1000);
        
        return {
            // Metadata
            projectName: path.basename(workspacePath),
            projectPath: workspacePath,
            analysisId: this.generateAnalysisId(),
            generatedDate: new Date().toLocaleString(),
            processingTime: `${processingTime}s`,
            agentsUsed: Array.from(this.agents.keys()),
            
            // Core Analysis Data
            technologyStack: this.analysisResults.get('technology-detection')?.technologyStack || [],
            qualityMetrics: this.analysisResults.get('quality-assessment')?.qualityScores || {},
            architecture: this.analysisResults.get('architecture-analysis')?.architecture || {},
            fileStructure: this.analysisResults.get('file-structure')?.structure || {},
            languageIntegration: this.analysisResults.get('multi-language-integration')?.integration || {},
            validation: this.analysisResults.get('edge-cases-validation')?.validation || {},
            
            // Executive Summary Data
            executiveSummary: this.generateExecutiveSummary(),
            businessImpact: this.assessBusinessImpact(),
            criticalFinding: this.identifyCriticalFinding(),
            statusIndicators: this.generateStatusIndicators(),
            recommendations: this.generateRecommendations(),
            
            // Calculated Metrics
            totalFiles: this.calculateTotalFiles(),
            languageCount: this.calculateLanguageCount(),
            complexityScore: this.calculateComplexityScore(),
            qualityScore: this.calculateOverallQualityScore(),
            linesOfCode: this.calculateLinesOfCode(),
            businessContext: this.identifyBusinessContext(),
            
            // Advanced Analysis
            keyFindings: this.extractKeyFindings(),
            insights: this.generateInsights(),
            businessPatterns: this.identifyBusinessPatterns(),
            primaryLanguage: this.identifyPrimaryLanguage(),
            overallComplexity: this.assessOverallComplexity(),
            maintainability: this.assessMaintainability(),
            documentationLevel: this.assessDocumentationLevel()
        };
    }

    /**
     * Handle agent result reception
     */
    handleAgentResult(agentType, data) {
        this.analysisResults.set(agentType, data);
        this.emit('agent-complete', { agentType, data });
    }

    /**
     * Handle agent errors
     */
    handleAgentError(agentType, error) {
        console.error(`Agent ${agentType} error:`, error);
        this.emit('agent-error', { agentType, error });
    }

    /**
     * Generate unique analysis ID
     */
    generateAnalysisId() {
        return `OPTQO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }

    /**
     * Generate executive summary
     */
    generateExecutiveSummary() {
        const tech = this.analysisResults.get('technology-detection');
        const quality = this.analysisResults.get('quality-assessment');
        
        if (!tech || !quality) {
            return "Analysis completed with limited agent data. Professional assessment available upon full crew execution.";
        }
        
        return `This ${tech.projectType || 'software project'} demonstrates ${quality.overallQualityScore >= 70 ? 'strong' : 'developing'} technical implementation with ${tech.primaryPlatform || 'multiple technologies'}. Key strengths include ${this.identifyTopStrengths()} while areas for improvement focus on ${this.identifyTopImprovements()}.`;
    }

    /**
     * Assess business impact
     */
    assessBusinessImpact() {
        const quality = this.analysisResults.get('quality-assessment');
        if (!quality) return "Impact assessment requires quality analysis completion.";
        
        const score = quality.overallQualityScore || 50;
        if (score >= 80) return "High-impact system with strong business value delivery potential";
        if (score >= 60) return "Moderate business impact with optimization opportunities";
        return "Significant improvement needed to maximize business value";
    }

    /**
     * Identify critical finding
     */
    identifyCriticalFinding() {
        const results = Array.from(this.analysisResults.values());
        const issues = results.flatMap(r => r.criticalIssues || []);
        
        if (issues.length === 0) return "No critical issues identified - system appears stable";
        return `Critical attention needed: ${issues[0]}`;
    }

    /**
     * Generate status indicators
     */
    generateStatusIndicators() {
        const quality = this.analysisResults.get('quality-assessment');
        const tech = this.analysisResults.get('technology-detection');
        
        const indicators = [];
        
        if (quality?.overallQualityScore >= 70) {
            indicators.push({ status: 'success', title: 'Quality', description: 'Code quality meets standards' });
        } else {
            indicators.push({ status: 'warning', title: 'Quality', description: 'Quality improvements needed' });
        }
        
        if (tech?.technologyStackScore >= 75) {
            indicators.push({ status: 'success', title: 'Technology', description: 'Modern tech stack' });
        } else {
            indicators.push({ status: 'warning', title: 'Technology', description: 'Tech stack review recommended' });
        }
        
        return indicators;
    }

    /**
     * Generate strategic recommendations
     */
    generateRecommendations() {
        const recommendations = [];
        const quality = this.analysisResults.get('quality-assessment');
        
        if (quality?.qualityScores?.documentation < 60) {
            recommendations.push({
                priority: 'high',
                title: 'Improve Documentation',
                impact: 'Enhanced maintainability and team productivity',
                effort: '2-3 weeks'
            });
        }
        
        if (quality?.qualityScores?.errorHandling < 70) {
            recommendations.push({
                priority: 'medium',
                title: 'Strengthen Error Handling',
                impact: 'Improved system reliability and user experience',
                effort: '1-2 weeks'
            });
        }
        
        return recommendations;
    }

    // Additional helper methods for metric calculations
    calculateTotalFiles() {
        return this.analysisResults.get('file-structure')?.totalFiles || 0;
    }

    calculateLanguageCount() {
        return this.analysisResults.get('technology-detection')?.languageCount || 1;
    }

    calculateComplexityScore() {
        return this.analysisResults.get('architecture-analysis')?.complexityScore || 50;
    }

    calculateOverallQualityScore() {
        return this.analysisResults.get('quality-assessment')?.overallQualityScore || 50;
    }

    calculateLinesOfCode() {
        return this.analysisResults.get('file-structure')?.linesOfCode || 'N/A';
    }

    identifyBusinessContext() {
        return this.analysisResults.get('technology-detection')?.businessContext || 'General Software';
    }

    extractKeyFindings() {
        const findings = [];
        
        this.analysisResults.forEach((result, agentType) => {
            if (result.keyFindings) {
                findings.push({
                    category: agentType.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    items: result.keyFindings
                });
            }
        });
        
        return findings;
    }

    generateInsights() {
        const insights = [];
        
        this.analysisResults.forEach(result => {
            if (result.insights) {
                insights.push(...result.insights);
            }
        });
        
        return insights.slice(0, 5); // Top 5 insights
    }

    identifyBusinessPatterns() {
        return this.analysisResults.get('architecture-analysis')?.businessPatterns || ['Standard software patterns detected'];
    }

    identifyPrimaryLanguage() {
        return this.analysisResults.get('technology-detection')?.primaryPlatform || 'Multi-language';
    }

    assessOverallComplexity() {
        const score = this.calculateComplexityScore();
        if (score >= 80) return 'High';
        if (score >= 60) return 'Medium';
        return 'Low';
    }

    assessMaintainability() {
        const quality = this.calculateOverallQualityScore();
        if (quality >= 75) return 'Excellent';
        if (quality >= 60) return 'Good';
        if (quality >= 45) return 'Fair';
        return 'Needs Improvement';
    }

    assessDocumentationLevel() {
        const docScore = this.analysisResults.get('quality-assessment')?.qualityScores?.documentation || 50;
        if (docScore >= 80) return 'Comprehensive';
        if (docScore >= 60) return 'Adequate';
        if (docScore >= 40) return 'Basic';
        return 'Minimal';
    }

    identifyTopStrengths() {
        const quality = this.analysisResults.get('quality-assessment')?.qualityScores || {};
        const strengths = Object.entries(quality)
            .filter(([_, score]) => score >= 75)
            .map(([metric, _]) => metric.replace(/([A-Z])/g, ' $1').toLowerCase())
            .slice(0, 2);
        
        return strengths.length > 0 ? strengths.join(' and ') : 'technical implementation';
    }

    identifyTopImprovements() {
        const quality = this.analysisResults.get('quality-assessment')?.qualityScores || {};
        const improvements = Object.entries(quality)
            .filter(([_, score]) => score < 60)
            .map(([metric, _]) => metric.replace(/([A-Z])/g, ' $1').toLowerCase())
            .slice(0, 2);
        
        return improvements.length > 0 ? improvements.join(' and ') : 'optimization opportunities';
    }
}
