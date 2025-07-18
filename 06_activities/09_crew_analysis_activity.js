/**
 * Crew-Based Analysis Activity
 * Implements the comprehensive analytics codebase analysis crew system
 * Coordinates multiple specialized agents for enterprise-level code analysis
 */

import { CrewCoordinator } from './01_crew_coordinator.js';
import path from 'path';
import fs from 'fs/promises';

export class CrewAnalysisActivity {
    constructor(config = {}) {
        this.config = {
            crewSize: config.crewSize || 'full', // basic, standard, full
            outputPath: config.outputPath || './07_outputs',
            templatePath: config.templatePath || './04_templates',
            context: config.context || 'general',
            timeout: config.timeout || 600000, // 10 minutes
            ...config
        };
        
        this.coordinator = null;
        this.analysisResults = null;
    }

    /**
     * Execute crew-based codebase analysis
     */
    async execute(workspacePath, options = {}) {
        console.log('🚀 Initializing Crew-Based Analysis System...');
        console.log(`📊 Configuration: ${this.config.crewSize} crew, ${this.config.context} context`);
        
        try {
            // Initialize crew coordinator
            this.coordinator = new CrewCoordinator({
                ...this.config,
                ...options
            });
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize crew agents
            await this.coordinator.initializeCrew();
            
            // Execute comprehensive analysis
            const analysisResult = await this.coordinator.analyzeCodebase(workspacePath, options);
            
            // Store results
            this.analysisResults = analysisResult;
            
            // Generate summary report
            const summaryReport = this.generateSummaryReport(analysisResult);
            
            console.log('✅ Crew-Based Analysis Completed Successfully');
            console.log(`📋 Report generated: ${analysisResult.report.filename}`);
            console.log(`⏱️  Processing time: ${analysisResult.processingTime}s`);
            console.log(`🤖 Agents used: ${analysisResult.agentsUsed.length}`);
            
            return {
                success: true,
                type: 'crew-analysis',
                results: analysisResult,
                summary: summaryReport,
                metadata: {
                    workspacePath,
                    analysisTime: new Date().toISOString(),
                    crewConfiguration: this.config.crewSize,
                    context: this.config.context,
                    agentsUsed: analysisResult.agentsUsed
                }
            };
            
        } catch (error) {
            console.error('❌ Crew Analysis Failed:', error);
            
            return {
                success: false,
                type: 'crew-analysis',
                error: error.message,
                partialResults: this.analysisResults,
                metadata: {
                    workspacePath,
                    failureTime: new Date().toISOString(),
                    crewConfiguration: this.config.crewSize
                }
            };
        }
    }

    /**
     * Set up event listeners for crew coordination
     */
    setupEventListeners() {
        this.coordinator.on('agent-complete', (data) => {
            console.log(`  ✅ Agent completed: ${data.agentType}`);
        });
        
        this.coordinator.on('agent-error', (data) => {
            console.warn(`  ⚠️  Agent error: ${data.agentType} - ${data.error.message}`);
        });
    }

    /**
     * Generate summary report of crew analysis
     */
    generateSummaryReport(analysisResult) {
        const report = analysisResult.report;
        const reportData = report.reportData;
        
        return {
            // Executive Summary
            executiveSummary: {
                projectName: reportData.projectName,
                businessContext: reportData.businessContext,
                qualityScore: reportData.qualityScore,
                complexityScore: reportData.complexityScore,
                primaryTechnology: reportData.primaryLanguage,
                totalFiles: reportData.totalFiles,
                processingTime: reportData.processingTime
            },
            
            // Key Metrics
            keyMetrics: {
                overallQuality: this.categorizeScore(reportData.qualityScore),
                systemComplexity: this.categorizeComplexity(reportData.complexityScore),
                technologyModernity: this.assessTechnologyModernity(reportData.technologyStack),
                architectureClarity: reportData.architecture || 'Custom',
                maintainability: reportData.maintainability,
                documentationLevel: reportData.documentationLevel
            },
            
            // Critical Findings
            criticalFindings: this.extractCriticalFindings(reportData),
            
            // Strategic Recommendations
            strategicRecommendations: this.prioritizeRecommendations(reportData.recommendations),
            
            // Technology Assessment
            technologyAssessment: {
                primaryStack: reportData.technologyStack.slice(0, 5),
                languageCount: reportData.languageCount,
                modernFrameworks: this.identifyModernFrameworks(reportData.technologyStack),
                integrationComplexity: this.assessIntegrationComplexity(reportData)
            },
            
            // Business Impact
            businessImpact: {
                currentValue: reportData.businessImpact,
                improvementPotential: this.assessImprovementPotential(reportData),
                riskFactors: this.identifyRiskFactors(reportData),
                investmentPriority: this.calculateInvestmentPriority(reportData)
            },
            
            // Next Steps
            nextSteps: this.generateNextSteps(reportData),
            
            // Metadata
            analysisMetadata: {
                analysisId: reportData.analysisId,
                agentsUsed: analysisResult.agentsUsed,
                crewSize: this.config.crewSize,
                context: this.config.context,
                reportPath: report.reportPath
            }
        };
    }

    /**
     * Categorize quality score
     */
    categorizeScore(score) {
        if (score >= 85) return 'Excellent';
        if (score >= 70) return 'Good';
        if (score >= 55) return 'Fair';
        if (score >= 40) return 'Poor';
        return 'Critical';
    }

    /**
     * Categorize complexity score
     */
    categorizeComplexity(score) {
        if (score >= 80) return 'High';
        if (score >= 60) return 'Medium';
        if (score >= 40) return 'Low';
        return 'Very Low';
    }

    /**
     * Assess technology modernity
     */
    assessTechnologyModernity(technologyStack) {
        if (!Array.isArray(technologyStack)) return 'Unknown';
        
        const modernTechnologies = [
            'python', 'javascript', 'typescript', 'react', 'vue', 'angular',
            'node.js', 'django', 'flask', 'fastapi', 'express', 'go', 'rust',
            'kotlin', 'swift', 'docker', 'kubernetes', 'aws', 'azure', 'gcp'
        ];
        
        const modernCount = technologyStack.filter(tech => {
            const techName = (tech.name || tech).toLowerCase();
            return modernTechnologies.some(modern => techName.includes(modern));
        }).length;
        
        const modernRatio = modernCount / Math.max(technologyStack.length, 1);
        
        if (modernRatio >= 0.7) return 'Very Modern';
        if (modernRatio >= 0.5) return 'Modern';
        if (modernRatio >= 0.3) return 'Mixed';
        return 'Legacy';
    }

    /**
     * Extract critical findings
     */
    extractCriticalFindings(reportData) {
        const findings = [];
        
        // Quality-based findings
        if (reportData.qualityScore < 50) {
            findings.push({
                type: 'quality',
                severity: 'high',
                finding: 'Code quality below acceptable standards',
                impact: 'High maintenance costs and reliability risks'
            });
        }
        
        // Complexity-based findings
        if (reportData.complexityScore > 80) {
            findings.push({
                type: 'complexity',
                severity: 'medium',
                finding: 'High system complexity detected',
                impact: 'Increased development time and training requirements'
            });
        }
        
        // Documentation findings
        const docLevel = reportData.documentationLevel;
        if (docLevel === 'Minimal' || docLevel === 'Basic') {
            findings.push({
                type: 'documentation',
                severity: 'medium',
                finding: 'Insufficient documentation coverage',
                impact: 'Team productivity and knowledge transfer challenges'
            });
        }
        
        // Technology findings
        const techModernity = this.assessTechnologyModernity(reportData.technologyStack);
        if (techModernity === 'Legacy') {
            findings.push({
                type: 'technology',
                severity: 'high',
                finding: 'Legacy technology stack identified',
                impact: 'Security vulnerabilities and talent acquisition challenges'
            });
        }
        
        return findings;
    }

    /**
     * Prioritize recommendations
     */
    prioritizeRecommendations(recommendations) {
        if (!Array.isArray(recommendations)) return [];
        
        const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
        
        return recommendations
            .sort((a, b) => {
                const aPriority = priorityOrder[a.priority] || 1;
                const bPriority = priorityOrder[b.priority] || 1;
                return bPriority - aPriority;
            })
            .slice(0, 5) // Top 5 recommendations
            .map(rec => ({
                priority: rec.priority || 'medium',
                title: rec.title,
                businessImpact: rec.impact,
                estimatedEffort: rec.effort,
                implementationOrder: this.calculateImplementationOrder(rec)
            }));
    }

    /**
     * Calculate implementation order
     */
    calculateImplementationOrder(recommendation) {
        const priority = recommendation.priority || 'medium';
        const effort = recommendation.effort || 'medium';
        
        if (priority === 'high' && effort.includes('1')) return 'Immediate';
        if (priority === 'high') return 'Short-term (1-2 months)';
        if (priority === 'medium' && effort.includes('1')) return 'Short-term (1-2 months)';
        if (priority === 'medium') return 'Medium-term (3-6 months)';
        return 'Long-term (6+ months)';
    }

    /**
     * Identify modern frameworks
     */
    identifyModernFrameworks(technologyStack) {
        if (!Array.isArray(technologyStack)) return [];
        
        const modernFrameworks = [
            'react', 'vue', 'angular', 'svelte', 'next.js', 'nuxt.js',
            'django', 'flask', 'fastapi', 'express', 'koa', 'nest.js',
            'spring boot', 'asp.net core', 'laravel', 'rails'
        ];
        
        return technologyStack
            .filter(tech => {
                const techName = (tech.name || tech).toLowerCase();
                return modernFrameworks.some(framework => techName.includes(framework));
            })
            .map(tech => tech.name || tech);
    }

    /**
     * Assess integration complexity
     */
    assessIntegrationComplexity(reportData) {
        const languageCount = reportData.languageCount || 1;
        const techStackSize = reportData.technologyStack?.length || 1;
        
        if (languageCount === 1 && techStackSize <= 3) return 'Simple';
        if (languageCount <= 3 && techStackSize <= 8) return 'Moderate';
        if (languageCount <= 5 && techStackSize <= 15) return 'Complex';
        return 'Very Complex';
    }

    /**
     * Assess improvement potential
     */
    assessImprovementPotential(reportData) {
        const qualityScore = reportData.qualityScore || 50;
        const complexityScore = reportData.complexityScore || 50;
        
        const improvementGap = 100 - qualityScore;
        const complexityImpact = complexityScore > 70 ? 0.8 : 1.0;
        
        const potential = (improvementGap * complexityImpact) / 100;
        
        if (potential >= 0.5) return 'High';
        if (potential >= 0.3) return 'Medium';
        if (potential >= 0.1) return 'Low';
        return 'Minimal';
    }

    /**
     * Identify risk factors
     */
    identifyRiskFactors(reportData) {
        const risks = [];
        
        if (reportData.qualityScore < 60) {
            risks.push('Code quality risks affecting reliability');
        }
        
        if (reportData.documentationLevel === 'Minimal') {
            risks.push('Knowledge transfer and maintenance risks');
        }
        
        if (this.assessTechnologyModernity(reportData.technologyStack) === 'Legacy') {
            risks.push('Technology obsolescence and security risks');
        }
        
        if (reportData.complexityScore > 75) {
            risks.push('High complexity impacting development velocity');
        }
        
        return risks;
    }

    /**
     * Calculate investment priority
     */
    calculateInvestmentPriority(reportData) {
        const qualityScore = reportData.qualityScore || 50;
        const businessValue = this.assessBusinessValue(reportData.businessContext);
        const improvementPotential = this.assessImprovementPotential(reportData);
        
        let priority = 'Medium';
        
        if (qualityScore < 50 && businessValue === 'High') {
            priority = 'Critical';
        } else if (qualityScore < 60 && improvementPotential === 'High') {
            priority = 'High';
        } else if (qualityScore >= 80) {
            priority = 'Low';
        }
        
        return priority;
    }

    /**
     * Assess business value
     */
    assessBusinessValue(businessContext) {
        const highValueContexts = [
            'financial', 'healthcare', 'security', 'enterprise', 'ecommerce'
        ];
        
        const context = (businessContext || '').toLowerCase();
        
        if (highValueContexts.some(hv => context.includes(hv))) {
            return 'High';
        }
        
        if (context.includes('data') || context.includes('analytics')) {
            return 'Medium-High';
        }
        
        return 'Medium';
    }

    /**
     * Generate next steps
     */
    generateNextSteps(reportData) {
        const steps = [];
        
        // Immediate actions based on critical findings
        if (reportData.qualityScore < 60) {
            steps.push({
                timeframe: 'Immediate (1-2 weeks)',
                action: 'Implement code quality improvements',
                description: 'Focus on documentation, error handling, and best practices'
            });
        }
        
        // Short-term actions
        if (reportData.documentationLevel === 'Minimal') {
            steps.push({
                timeframe: 'Short-term (1 month)',
                action: 'Comprehensive documentation initiative',
                description: 'Create API documentation, code comments, and user guides'
            });
        }
        
        // Medium-term actions
        const techModernity = this.assessTechnologyModernity(reportData.technologyStack);
        if (techModernity === 'Legacy' || techModernity === 'Mixed') {
            steps.push({
                timeframe: 'Medium-term (3-6 months)',
                action: 'Technology stack modernization',
                description: 'Evaluate and migrate to modern frameworks and tools'
            });
        }
        
        // Long-term actions
        if (reportData.complexityScore > 75) {
            steps.push({
                timeframe: 'Long-term (6+ months)',
                action: 'Architecture refactoring',
                description: 'Simplify system architecture and reduce complexity'
            });
        }
        
        return steps;
    }

    /**
     * Get crew configuration options
     */
    static getCrewConfigurations() {
        return {
            basic: {
                agents: ['technology-detection', 'quality-assessment'],
                description: 'Quick assessment for basic projects',
                estimatedTime: '2-5 minutes',
                useCase: 'Initial evaluation, small projects'
            },
            standard: {
                agents: ['technology-detection', 'quality-assessment', 'architecture-analysis', 'file-structure'],
                description: 'Comprehensive analysis for most projects',
                estimatedTime: '5-15 minutes',
                useCase: 'Professional assessment, medium projects'
            },
            full: {
                agents: ['technology-detection', 'quality-assessment', 'architecture-analysis', 'file-structure', 'multi-language-integration', 'edge-cases-validation'],
                description: 'Enterprise-level analysis with complete evaluation',
                estimatedTime: '10-30 minutes',
                useCase: 'Executive reporting, large enterprise projects'
            }
        };
    }

    /**
     * Get analysis results
     */
    getResults() {
        return this.analysisResults;
    }

    /**
     * Get crew coordinator
     */
    getCoordinator() {
        return this.coordinator;
    }
}
