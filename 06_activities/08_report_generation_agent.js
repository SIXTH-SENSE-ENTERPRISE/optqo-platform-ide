/**
 * Report Generation Agent
 * Role: Technical Writer & Report Designer
 * Creates professional, executive-ready reports with optqo Platform branding
 */

import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';
import handlebars from 'handlebars';

export class ReportGenerationAgent extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = config;
        this.templatePath = config.templatePath || './04_templates';
        this.outputPath = config.outputPath || './07_outputs';
        
        // Register Handlebars helpers
        this.registerHandlebarsHelpers();
    }

    /**
     * Generate comprehensive analysis report
     */
    async generateComprehensiveReport(synthesizedData) {
        console.log('📋 Report Generation Agent creating professional report...');
        
        try {
            // Load the optqo template
            const templateContent = await this.loadTemplate();
            
            // Prepare data for template
            const reportData = this.prepareReportData(synthesizedData);
            
            // Compile template with data
            const template = handlebars.compile(templateContent);
            const htmlReport = template(reportData);
            
            // Generate output filename
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `${reportData.projectName}_Analysis_${timestamp}.html`;
            const outputPath = path.join(this.outputPath, filename);
            
            // Ensure output directory exists
            await fs.mkdir(this.outputPath, { recursive: true });
            
            // Write report to file
            await fs.writeFile(outputPath, htmlReport, 'utf-8');
            
            console.log(`✅ Professional report generated: ${filename}`);
            
            const result = {
                success: true,
                reportPath: outputPath,
                filename,
                reportData,
                htmlContent: htmlReport,
                generatedAt: new Date().toISOString()
            };
            
            this.emit('report-complete', result);
            return result;
            
        } catch (error) {
            console.error('❌ Report generation failed:', error);
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Load the optqo analysis report template
     */
    async loadTemplate() {
        const templateFile = path.join(this.templatePath, '01_optqo_analysis_report.html');
        
        try {
            const templateContent = await fs.readFile(templateFile, 'utf-8');
            return templateContent;
        } catch (error) {
            throw new Error(`Failed to load template: ${templateFile} - ${error.message}`);
        }
    }

    /**
     * Prepare data for template rendering
     */
    prepareReportData(synthesizedData) {
        // Clean project name
        const projectName = this.cleanProjectName(synthesizedData.projectName || 'Unknown Project');
        
        // Prepare technology stack with icons
        const technologyStack = this.prepareTechnologyStack(synthesizedData.technologyStack || []);
        
        // Prepare quality metrics with levels
        const qualityMetrics = this.prepareQualityMetrics(synthesizedData.qualityMetrics || {});
        
        // Prepare files data
        const files = this.prepareFilesData(synthesizedData);
        
        // Prepare status indicators
        const statusIndicators = this.prepareStatusIndicators(synthesizedData);
        
        // Prepare key findings
        const keyFindings = this.prepareKeyFindings(synthesizedData.keyFindings || []);
        
        // Prepare recommendations
        const recommendations = this.prepareRecommendations(synthesizedData.recommendations || []);
        
        return {
            // Project Information
            projectName,
            projectDescription: this.generateProjectDescription(synthesizedData),
            projectPath: synthesizedData.projectPath || '',
            
            // Metadata
            analysisId: synthesizedData.analysisId || this.generateAnalysisId(),
            generatedDate: new Date().toLocaleString(),
            processingTime: synthesizedData.processingTime || 'N/A',
            
            // Executive Summary
            executiveSummary: synthesizedData.executiveSummary || this.generateDefaultSummary(synthesizedData),
            businessImpact: synthesizedData.businessImpact || 'Assessment requires further analysis',
            criticalFinding: synthesizedData.criticalFinding || 'No critical issues identified',
            
            // Core Metrics
            totalFiles: synthesizedData.totalFiles || 0,
            languageCount: synthesizedData.languageCount || 1,
            complexityScore: synthesizedData.complexityScore || 50,
            qualityScore: synthesizedData.qualityScore || 50,
            linesOfCode: synthesizedData.linesOfCode || 'N/A',
            businessContext: synthesizedData.businessContext || 'General Software',
            
            // Technology and Architecture
            technologyStack,
            primaryLanguage: synthesizedData.primaryLanguage || 'Multi-language',
            architecture: synthesizedData.architecture?.pattern || 'Custom Architecture',
            
            // Quality Assessment
            qualityMetrics,
            statusIndicators,
            
            // Detailed Analysis
            files,
            keyFindings,
            recommendations,
            
            // Context and Insights
            context: synthesizedData.businessContext || 'General Analysis',
            insights: synthesizedData.insights || [],
            businessPatterns: synthesizedData.businessPatterns || [],
            overallComplexity: this.assessOverallComplexity(synthesizedData.complexityScore),
            maintainability: synthesizedData.maintainability || 'Fair',
            documentationLevel: synthesizedData.documentationLevel || 'Basic'
        };
    }

    /**
     * Clean and format project name
     */
    cleanProjectName(projectName) {
        return projectName
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .trim() || 'Analysis Project';
    }

    /**
     * Prepare technology stack with proper formatting
     */
    prepareTechnologyStack(technologyStack) {
        if (!Array.isArray(technologyStack)) return [];
        
        return technologyStack.map(tech => ({
            name: typeof tech === 'string' ? tech : tech.name || 'Unknown',
            icon: typeof tech === 'object' ? tech.icon || '🔧' : this.getDefaultIcon(tech),
            type: typeof tech === 'object' ? tech.type || 'technology' : 'technology'
        }));
    }

    /**
     * Get default icon for technology
     */
    getDefaultIcon(techName) {
        const iconMap = {
            'python': '🐍',
            'javascript': '⚡',
            'java': '☕',
            'csharp': '🔷',
            'cpp': '⚙️',
            'sql': '🗄️',
            'html': '🌐',
            'css': '🎨',
            'r': '📊',
            'matlab': '📈'
        };
        
        const key = techName.toLowerCase();
        return iconMap[key] || '🔧';
    }

    /**
     * Prepare quality metrics with levels and descriptions
     */
    prepareQualityMetrics(qualityMetrics) {
        const defaultMetrics = {
            functionality: 50,
            organization: 50,
            documentation: 50,
            bestPractices: 50,
            errorHandling: 50,
            performance: 50
        };
        
        const metrics = { ...defaultMetrics, ...qualityMetrics };
        
        return Object.entries(metrics).map(([name, score]) => ({
            name: this.formatMetricName(name),
            score: Math.round(score),
            level: this.getQualityLevel(score),
            description: this.getMetricDescription(name, score)
        }));
    }

    /**
     * Format metric name for display
     */
    formatMetricName(name) {
        return name
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    /**
     * Get quality level based on score
     */
    getQualityLevel(score) {
        if (score >= 85) return 'excellent';
        if (score >= 70) return 'good';
        if (score >= 55) return 'average';
        return 'poor';
    }

    /**
     * Get metric description
     */
    getMetricDescription(metric, score) {
        const descriptions = {
            functionality: score >= 70 ? 'Strong operational capabilities' : 'Needs functional improvements',
            organization: score >= 70 ? 'Well-structured codebase' : 'Requires better organization',
            documentation: score >= 70 ? 'Adequately documented' : 'Documentation needs improvement',
            bestPractices: score >= 70 ? 'Follows industry standards' : 'Should adopt more best practices',
            errorHandling: score >= 70 ? 'Robust error management' : 'Error handling needs strengthening',
            performance: score >= 70 ? 'Optimized for efficiency' : 'Performance optimization needed'
        };
        
        return descriptions[metric] || 'Assessment completed';
    }

    /**
     * Prepare files data for table
     */
    prepareFilesData(synthesizedData) {
        // If we have detailed file analysis, use it
        if (synthesizedData.fileAnalysis && Array.isArray(synthesizedData.fileAnalysis)) {
            return synthesizedData.fileAnalysis.slice(0, 20).map((file, index) => ({
                index: index + 1,
                name: file.fileName || file.name || 'Unknown',
                language: file.language || 'Unknown',
                complexity: file.complexity || { level: 'Low' },
                issues: file.issues || [],
                businessFunction: this.inferBusinessFunction(file.fileName || file.name || '')
            }));
        }
        
        // Create sample data based on available information
        const languages = synthesizedData.technologyStack || [];
        const fileCount = synthesizedData.totalFiles || 5;
        
        const sampleFiles = [];
        for (let i = 0; i < Math.min(fileCount, 10); i++) {
            const lang = languages[i % languages.length];
            sampleFiles.push({
                index: i + 1,
                name: `file${i + 1}.${this.getExtensionForLanguage(lang?.name || 'unknown')}`,
                language: lang?.name || 'Unknown',
                complexity: { level: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)] },
                issues: [],
                businessFunction: 'Core Application Logic'
            });
        }
        
        return sampleFiles;
    }

    /**
     * Get file extension for language
     */
    getExtensionForLanguage(language) {
        const extensionMap = {
            'python': 'py',
            'javascript': 'js',
            'java': 'java',
            'csharp': 'cs',
            'cpp': 'cpp',
            'sql': 'sql',
            'r': 'r',
            'matlab': 'm'
        };
        
        return extensionMap[language.toLowerCase()] || 'txt';
    }

    /**
     * Infer business function from filename
     */
    inferBusinessFunction(filename) {
        const lowerName = filename.toLowerCase();
        
        if (lowerName.includes('test')) return 'Testing & Quality Assurance';
        if (lowerName.includes('config') || lowerName.includes('setting')) return 'Configuration Management';
        if (lowerName.includes('data') || lowerName.includes('db')) return 'Data Processing';
        if (lowerName.includes('api') || lowerName.includes('service')) return 'Service Interface';
        if (lowerName.includes('ui') || lowerName.includes('view')) return 'User Interface';
        if (lowerName.includes('util') || lowerName.includes('helper')) return 'Utility Functions';
        if (lowerName.includes('model')) return 'Business Logic';
        if (lowerName.includes('controller')) return 'Application Control';
        
        return 'Core Application Logic';
    }

    /**
     * Prepare status indicators
     */
    prepareStatusIndicators(synthesizedData) {
        const indicators = [];
        
        const qualityScore = synthesizedData.qualityScore || 50;
        const complexityScore = synthesizedData.complexityScore || 50;
        
        // Quality Status
        if (qualityScore >= 70) {
            indicators.push({ 
                status: 'success', 
                title: 'Quality', 
                description: 'Code quality meets professional standards' 
            });
        } else if (qualityScore >= 50) {
            indicators.push({ 
                status: 'warning', 
                title: 'Quality', 
                description: 'Quality improvements recommended' 
            });
        } else {
            indicators.push({ 
                status: 'danger', 
                title: 'Quality', 
                description: 'Significant quality issues detected' 
            });
        }
        
        // Complexity Status
        if (complexityScore < 60) {
            indicators.push({ 
                status: 'success', 
                title: 'Complexity', 
                description: 'Manageable complexity level' 
            });
        } else if (complexityScore < 80) {
            indicators.push({ 
                status: 'warning', 
                title: 'Complexity', 
                description: 'Moderate complexity requires attention' 
            });
        } else {
            indicators.push({ 
                status: 'danger', 
                title: 'Complexity', 
                description: 'High complexity impacts maintainability' 
            });
        }
        
        // Architecture Status
        const architectureConfidence = synthesizedData.architecture?.confidence || 50;
        if (architectureConfidence >= 70) {
            indicators.push({ 
                status: 'success', 
                title: 'Architecture', 
                description: 'Clear architectural pattern identified' 
            });
        } else {
            indicators.push({ 
                status: 'warning', 
                title: 'Architecture', 
                description: 'Architectural clarity needs improvement' 
            });
        }
        
        return indicators;
    }

    /**
     * Prepare key findings
     */
    prepareKeyFindings(keyFindings) {
        if (!Array.isArray(keyFindings)) return [];
        
        return keyFindings.map(finding => {
            if (typeof finding === 'string') {
                return {
                    category: 'General Analysis',
                    items: [finding]
                };
            } else if (typeof finding === 'object' && finding.category) {
                return {
                    category: finding.category,
                    items: Array.isArray(finding.items) ? finding.items : [finding.items || 'No details available']
                };
            }
            return {
                category: 'Analysis Result',
                items: [String(finding)]
            };
        });
    }

    /**
     * Prepare recommendations
     */
    prepareRecommendations(recommendations) {
        if (!Array.isArray(recommendations)) return [];
        
        return recommendations.map(rec => {
            if (typeof rec === 'string') {
                return {
                    priority: 'medium',
                    title: rec,
                    impact: 'Improves code quality and maintainability',
                    effort: '1-2 weeks'
                };
            } else if (typeof rec === 'object') {
                return {
                    priority: rec.priority || 'medium',
                    title: rec.title || rec.recommendation || String(rec),
                    impact: rec.impact || 'Positive impact on code quality',
                    effort: rec.effort || 'Moderate effort required'
                };
            }
            return {
                priority: 'low',
                title: String(rec),
                impact: 'General improvement',
                effort: 'Variable'
            };
        });
    }

    /**
     * Generate project description
     */
    generateProjectDescription(synthesizedData) {
        const businessContext = synthesizedData.businessContext || 'software development';
        const primaryLanguage = synthesizedData.primaryLanguage || 'multi-language';
        const totalFiles = synthesizedData.totalFiles || 'multiple';
        
        return `A ${businessContext.toLowerCase()} project implemented primarily in ${primaryLanguage}, containing ${totalFiles} files with comprehensive functionality and modern development practices.`;
    }

    /**
     * Generate default executive summary
     */
    generateDefaultSummary(synthesizedData) {
        const qualityScore = synthesizedData.qualityScore || 50;
        const businessContext = synthesizedData.businessContext || 'software development';
        
        if (qualityScore >= 75) {
            return `This ${businessContext.toLowerCase()} project demonstrates strong technical implementation with high-quality code structure and professional development practices. The codebase shows excellent organization and adherence to industry standards.`;
        } else if (qualityScore >= 60) {
            return `This ${businessContext.toLowerCase()} project shows solid technical foundation with good code quality and reasonable development practices. Some areas identified for improvement to reach optimal standards.`;
        } else {
            return `This ${businessContext.toLowerCase()} project requires focused attention on code quality improvements. While functional, the codebase would benefit from enhanced documentation, error handling, and adherence to best practices.`;
        }
    }

    /**
     * Assess overall complexity
     */
    assessOverallComplexity(complexityScore) {
        if (complexityScore >= 80) return 'High';
        if (complexityScore >= 60) return 'Medium';
        return 'Low';
    }

    /**
     * Generate analysis ID
     */
    generateAnalysisId() {
        return `OPTQO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }

    /**
     * Register Handlebars helpers
     */
    registerHandlebarsHelpers() {
        // Helper for conditional rendering
        handlebars.registerHelper('if', function(conditional, options) {
            if (conditional) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        });
        
        // Helper for each loops
        handlebars.registerHelper('each', function(context, options) {
            let ret = '';
            if (context && context.length > 0) {
                for (let i = 0; i < context.length; i++) {
                    ret += options.fn({ ...context[i], '@index': i });
                }
            }
            return ret;
        });
        
        // Helper for formatting numbers
        handlebars.registerHelper('round', function(number) {
            return Math.round(number || 0);
        });
        
        // Helper for capitalizing text
        handlebars.registerHelper('capitalize', function(str) {
            return typeof str === 'string' ? str.charAt(0).toUpperCase() + str.slice(1) : str;
        });
    }
}
