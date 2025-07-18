/**
 * Quality Assessment Agent
 * Role: Code Quality Analyst & Best Practices Auditor
 * Evaluates code quality across all dimensions and provides scored assessments
 */

import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';

export class QualityAssessmentAgent extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = config;
        
        // Platform-specific quality standards
        this.qualityStandards = {
            'PYTHON': {
                bestPractices: {
                    imports: /^from.*import|^import/gm,
                    docstrings: /"""[\s\S]*?"""/g,
                    typeHints: /:\s*\w+\s*->/g,
                    pep8: /^class\s+[A-Z][a-zA-Z]*|^def\s+[a-z_]/gm
                },
                errorPatterns: /try:\s*[\s\S]*?except/gm,
                complexity: /if|for|while|elif|except|with/g
            },
            'JAVASCRIPT': {
                bestPractices: {
                    es6: /const|let|=>|import.*from/g,
                    jsdoc: /\/\*\*[\s\S]*?\*\//g,
                    modules: /export|import/g,
                    strict: /"use strict"|'use strict'/g
                },
                errorPatterns: /try\s*\{[\s\S]*?\}\s*catch/g,
                complexity: /if|for|while|switch|catch/g
            },
            'JAVA': {
                bestPractices: {
                    javadoc: /\/\*\*[\s\S]*?\*\//g,
                    annotations: /@\w+/g,
                    generics: /<[\w\s,<>]*>/g,
                    interfaces: /implements\s+\w+/g
                },
                errorPatterns: /try\s*\{[\s\S]*?\}\s*catch/g,
                complexity: /if|for|while|switch|catch/g
            },
            'R': {
                bestPractices: {
                    functions: /\w+\s*<-\s*function/g,
                    documentation: /#'.*@/g,
                    vectorization: /sapply|lapply|apply/g
                },
                errorPatterns: /tryCatch|try/g,
                complexity: /if|for|while|repeat/g
            },
            'MATLAB': {
                bestPractices: {
                    functions: /function.*=.*\(/g,
                    comments: /%[^%]/g,
                    vectorization: /\.\*|\.\^|\.\//g
                },
                errorPatterns: /try[\s\S]*?catch/g,
                complexity: /if|for|while|switch/g
            }
        };
        
        // Quality metrics framework (0-100 scale)
        this.metrics = {
            functionality: 0,      // Operational effectiveness
            organization: 0,       // Structure and modularity  
            documentation: 0,      // Comments and clarity
            bestPractices: 0,      // Platform-specific standards
            errorHandling: 0,      // Exception management
            performance: 0         // Computational efficiency
        };
    }

    /**
     * Main quality analysis method
     */
    async analyze(workspacePath, options = {}) {
        console.log('📊 Quality Assessment Agent analyzing...');
        
        try {
            const files = await this.scanCodeFiles(workspacePath);
            const analysisResults = await this.performQualityAnalysis(files);
            
            const result = {
                // Core Quality Scores
                qualityScores: this.metrics,
                overallQualityScore: this.calculateOverallScore(),
                
                // Detailed Analysis
                fileAnalysis: analysisResults.fileAnalysis,
                criticalIssues: analysisResults.criticalIssues,
                recommendations: analysisResults.recommendations,
                
                // Quality Breakdown
                qualityBreakdown: this.generateQualityBreakdown(),
                codeHealthMetrics: this.generateCodeHealthMetrics(analysisResults),
                
                // Key Findings
                keyFindings: this.generateKeyFindings(),
                insights: this.generateInsights(),
                
                // Metadata
                totalLinesAnalyzed: analysisResults.totalLines,
                filesAnalyzed: files.length,
                analysisTimestamp: new Date().toISOString()
            };
            
            this.emit('analysis-complete', result);
            return result;
            
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Scan workspace for code files
     */
    async scanCodeFiles(workspacePath) {
        const codeFiles = [];
        
        async function scanDirectory(dir) {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    
                    if (entry.isDirectory()) {
                        const skipDirs = ['node_modules', '.git', '__pycache__', '.vscode', 'venv', 'env'];
                        if (!skipDirs.includes(entry.name)) {
                            await scanDirectory(fullPath);
                        }
                    } else if (entry.isFile()) {
                        const ext = path.extname(entry.name).toLowerCase();
                        const codeExtensions = ['.py', '.js', '.ts', '.java', '.cs', '.cpp', '.c', '.h', 
                                              '.r', '.m', '.sas', '.sql', '.php', '.go', '.scala', '.jl'];
                        
                        if (codeExtensions.includes(ext)) {
                            const stats = await fs.stat(fullPath);
                            codeFiles.push({
                                path: fullPath,
                                name: entry.name,
                                extension: ext,
                                size: stats.size,
                                language: this.detectLanguage(ext)
                            });
                        }
                    }
                }
            } catch (error) {
                // Skip inaccessible directories
            }
        }
        
        await scanDirectory(workspacePath);
        return codeFiles;
    }

    /**
     * Detect language from extension
     */
    detectLanguage(extension) {
        const extensionMap = {
            '.py': 'PYTHON',
            '.js': 'JAVASCRIPT',
            '.ts': 'JAVASCRIPT',
            '.java': 'JAVA',
            '.cs': 'CSHARP',
            '.cpp': 'CPP',
            '.c': 'C',
            '.h': 'C',
            '.r': 'R',
            '.R': 'R',
            '.m': 'MATLAB',
            '.sas': 'SAS',
            '.sql': 'SQL',
            '.php': 'PHP',
            '.go': 'GO',
            '.scala': 'SCALA',
            '.jl': 'JULIA'
        };
        
        return extensionMap[extension] || 'UNKNOWN';
    }

    /**
     * Perform comprehensive quality analysis
     */
    async performQualityAnalysis(files) {
        let totalLines = 0;
        const fileAnalysis = [];
        const criticalIssues = [];
        const recommendations = [];
        
        // Initialize metrics
        this.resetMetrics();
        
        // Analyze each file
        for (const file of files.slice(0, 50)) { // Limit for performance
            try {
                const content = await fs.readFile(file.path, 'utf-8');
                const lines = content.split('\n');
                totalLines += lines.length;
                
                const analysis = await this.analyzeFile(file, content, lines);
                fileAnalysis.push(analysis);
                
                // Aggregate metrics
                this.aggregateFileMetrics(analysis);
                
                // Collect issues and recommendations
                if (analysis.issues.length > 0) {
                    criticalIssues.push(...analysis.issues);
                }
                
                if (analysis.recommendations.length > 0) {
                    recommendations.push(...analysis.recommendations);
                }
                
            } catch (error) {
                console.warn(`Failed to analyze ${file.name}:`, error.message);
            }
        }
        
        // Calculate final scores
        this.calculateFinalScores(files.length);
        
        // Generate top recommendations
        const topRecommendations = this.generateTopRecommendations(recommendations);
        
        return {
            fileAnalysis,
            criticalIssues: criticalIssues.slice(0, 10), // Top 10 critical issues
            recommendations: topRecommendations,
            totalLines
        };
    }

    /**
     * Analyze individual file
     */
    async analyzeFile(file, content, lines) {
        const language = file.language;
        const standards = this.qualityStandards[language] || this.qualityStandards['JAVASCRIPT'];
        
        const analysis = {
            fileName: file.name,
            language,
            linesOfCode: lines.length,
            size: file.size,
            metrics: {},
            issues: [],
            recommendations: [],
            complexity: 'Low'
        };
        
        // 1. Functionality Assessment
        analysis.metrics.functionality = this.assessFunctionality(content, lines, language);
        
        // 2. Code Organization Assessment
        analysis.metrics.organization = this.assessOrganization(content, lines, language);
        
        // 3. Documentation Assessment
        analysis.metrics.documentation = this.assessDocumentation(content, lines, language, standards);
        
        // 4. Best Practices Assessment
        analysis.metrics.bestPractices = this.assessBestPractices(content, language, standards);
        
        // 5. Error Handling Assessment
        analysis.metrics.errorHandling = this.assessErrorHandling(content, language, standards);
        
        // 6. Performance Assessment
        analysis.metrics.performance = this.assessPerformance(content, lines, language);
        
        // Calculate complexity
        analysis.complexity = this.calculateComplexity(content, standards);
        
        // Identify issues
        analysis.issues = this.identifyIssues(analysis);
        
        // Generate recommendations
        analysis.recommendations = this.generateFileRecommendations(analysis);
        
        return analysis;
    }

    /**
     * Assess functionality (operational effectiveness)
     */
    assessFunctionality(content, lines, language) {
        let score = 70; // Base score
        
        // Check for functions/methods
        const functionPatterns = {
            'PYTHON': /def\s+\w+\(/g,
            'JAVASCRIPT': /function\s+\w+|const\s+\w+\s*=\s*\(/g,
            'JAVA': /public\s+\w+\s+\w+\(/g,
            'R': /\w+\s*<-\s*function/g,
            'MATLAB': /function.*=.*\(/g
        };
        
        const pattern = functionPatterns[language] || functionPatterns['JAVASCRIPT'];
        const functions = (content.match(pattern) || []).length;
        
        if (functions > 0) {
            score += Math.min(20, functions * 2); // Bonus for functions
        }
        
        // Check for imports/includes (external functionality)
        const importPatterns = /import|include|require|using|library/gi;
        const imports = (content.match(importPatterns) || []).length;
        
        if (imports > 0) {
            score += Math.min(10, imports);
        }
        
        // Check for main execution blocks
        if (content.includes('main') || content.includes('__name__') || content.includes('exports')) {
            score += 5;
        }
        
        return Math.min(100, score);
    }

    /**
     * Assess code organization (structure and modularity)
     */
    assessOrganization(content, lines, language) {
        let score = 50; // Base score
        
        // Check file size (organization factor)
        if (lines.length < 100) score += 20;
        else if (lines.length < 300) score += 10;
        else if (lines.length > 1000) score -= 20;
        
        // Check for classes (OOP organization)
        const classPatterns = {
            'PYTHON': /class\s+\w+/g,
            'JAVASCRIPT': /class\s+\w+/g,
            'JAVA': /class\s+\w+/g,
            'CSHARP': /class\s+\w+/g
        };
        
        const pattern = classPatterns[language];
        if (pattern) {
            const classes = (content.match(pattern) || []).length;
            if (classes > 0) score += 15;
        }
        
        // Check for consistent indentation
        const indentationConsistency = this.checkIndentationConsistency(lines);
        score += indentationConsistency * 15;
        
        // Check for separation of concerns (multiple sections)
        const sections = content.split(/\n\s*\n/).length;
        if (sections > 3) score += 10;
        
        return Math.min(100, score);
    }

    /**
     * Assess documentation (comments and clarity)
     */
    assessDocumentation(content, lines, language, standards) {
        let score = 20; // Base score (pessimistic for documentation)
        
        // Count comment lines
        const commentPatterns = {
            'PYTHON': /#.*$|"""[\s\S]*?"""/gm,
            'JAVASCRIPT': /\/\/.*$|\/\*[\s\S]*?\*\//gm,
            'JAVA': /\/\/.*$|\/\*[\s\S]*?\*\//gm,
            'R': /#.*$/gm,
            'MATLAB': /%.*$/gm
        };
        
        const commentPattern = commentPatterns[language] || commentPatterns['JAVASCRIPT'];
        const comments = (content.match(commentPattern) || []).length;
        const commentRatio = comments / lines.length;
        
        // Documentation scoring
        if (commentRatio > 0.2) score += 40; // Excellent documentation
        else if (commentRatio > 0.1) score += 30; // Good documentation
        else if (commentRatio > 0.05) score += 20; // Fair documentation
        else if (commentRatio > 0.02) score += 10; // Minimal documentation
        
        // Check for structured documentation
        if (standards.bestPractices?.docstrings) {
            const structuredDocs = (content.match(standards.bestPractices.docstrings) || []).length;
            if (structuredDocs > 0) score += 20;
        }
        
        // Check for README or similar documentation files
        if (content.includes('README') || content.includes('documentation')) {
            score += 10;
        }
        
        return Math.min(100, score);
    }

    /**
     * Assess best practices (platform-specific standards)
     */
    assessBestPractices(content, language, standards) {
        let score = 50; // Base score
        
        if (!standards.bestPractices) return score;
        
        const practices = standards.bestPractices;
        let practicesFound = 0;
        const totalPractices = Object.keys(practices).length;
        
        for (const [practice, pattern] of Object.entries(practices)) {
            if (pattern.test(content)) {
                practicesFound++;
            }
        }
        
        const practiceRatio = practicesFound / totalPractices;
        score += practiceRatio * 50;
        
        // Language-specific bonuses
        if (language === 'PYTHON') {
            if (content.includes('if __name__ == "__main__"')) score += 5;
            if (content.includes('typing') || content.includes('Type')) score += 5;
        }
        
        if (language === 'JAVASCRIPT') {
            if (content.includes('const') || content.includes('let')) score += 10;
            if (content.includes('=>')) score += 5; // Arrow functions
        }
        
        return Math.min(100, score);
    }

    /**
     * Assess error handling (exception management)
     */
    assessErrorHandling(content, language, standards) {
        let score = 30; // Base score (pessimistic for error handling)
        
        if (!standards.errorPatterns) return score;
        
        const errorBlocks = (content.match(standards.errorPatterns) || []).length;
        const functionPattern = /function|def|proc|sub/gi;
        const functions = (content.match(functionPattern) || []).length;
        
        if (functions > 0) {
            const errorRatio = errorBlocks / functions;
            
            if (errorRatio > 0.8) score += 50; // Excellent error handling
            else if (errorRatio > 0.5) score += 35; // Good error handling
            else if (errorRatio > 0.3) score += 25; // Fair error handling
            else if (errorRatio > 0.1) score += 15; // Minimal error handling
        }
        
        // Check for specific error handling patterns
        const advancedPatterns = {
            'PYTHON': /except\s+\w+Exception|finally:|raise/g,
            'JAVASCRIPT': /catch\s*\(\w+\)|throw\s+new/g,
            'JAVA': /catch\s*\(\w+.*Exception\)|finally|throws/g
        };
        
        const advancedPattern = advancedPatterns[language];
        if (advancedPattern) {
            const advanced = (content.match(advancedPattern) || []).length;
            if (advanced > 0) score += 15;
        }
        
        return Math.min(100, score);
    }

    /**
     * Assess performance (computational efficiency)
     */
    assessPerformance(content, lines, language) {
        let score = 60; // Base score
        
        // File size penalty for performance
        if (lines.length > 1000) score -= 15;
        else if (lines.length > 500) score -= 5;
        
        // Check for performance-oriented patterns
        const performancePatterns = {
            'PYTHON': /numpy|pandas|vectoriz|list comprehension|\[.*for.*in.*\]/gi,
            'JAVASCRIPT': /async|await|Promise|map\(|filter\(|reduce\(/gi,
            'JAVA': /stream\(\)|parallel|concurrent|thread/gi,
            'R': /apply|sapply|lapply|vectoriz/gi,
            'MATLAB': /vectoriz|\.\*|\.\^|\.\//gi
        };
        
        const pattern = performancePatterns[language];
        if (pattern) {
            const performanceIndicators = (content.match(pattern) || []).length;
            score += Math.min(25, performanceIndicators * 3);
        }
        
        // Check for potential performance issues
        const inefficientPatterns = {
            'PYTHON': /for.*in.*range\(len\(/gi,
            'JAVASCRIPT': /for.*in.*length/gi
        };
        
        const inefficientPattern = inefficientPatterns[language];
        if (inefficientPattern) {
            const inefficiencies = (content.match(inefficientPattern) || []).length;
            score -= inefficiencies * 5;
        }
        
        return Math.min(100, Math.max(0, score));
    }

    /**
     * Calculate code complexity
     */
    calculateComplexity(content, standards) {
        if (!standards.complexity) return 'Low';
        
        const complexityIndicators = (content.match(standards.complexity) || []).length;
        const lines = content.split('\n').length;
        const complexityRatio = complexityIndicators / lines;
        
        if (complexityRatio > 0.1) return 'High';
        if (complexityRatio > 0.05) return 'Medium';
        return 'Low';
    }

    /**
     * Check indentation consistency
     */
    checkIndentationConsistency(lines) {
        const indentedLines = lines.filter(line => line.match(/^\s+/));
        if (indentedLines.length === 0) return 1;
        
        const spaceIndents = indentedLines.filter(line => line.startsWith(' ')).length;
        const tabIndents = indentedLines.filter(line => line.startsWith('\t')).length;
        
        const consistency = Math.max(spaceIndents, tabIndents) / indentedLines.length;
        return consistency;
    }

    /**
     * Reset metrics for new analysis
     */
    resetMetrics() {
        for (const key of Object.keys(this.metrics)) {
            this.metrics[key] = 0;
        }
    }

    /**
     * Aggregate file metrics into overall metrics
     */
    aggregateFileMetrics(fileAnalysis) {
        for (const [metric, value] of Object.entries(fileAnalysis.metrics)) {
            this.metrics[metric] += value;
        }
    }

    /**
     * Calculate final scores
     */
    calculateFinalScores(fileCount) {
        if (fileCount === 0) return;
        
        for (const key of Object.keys(this.metrics)) {
            this.metrics[key] = Math.round(this.metrics[key] / fileCount);
        }
    }

    /**
     * Calculate overall quality score
     */
    calculateOverallScore() {
        const weights = {
            functionality: 0.25,
            organization: 0.20,
            documentation: 0.15,
            bestPractices: 0.20,
            errorHandling: 0.10,
            performance: 0.10
        };
        
        let weightedSum = 0;
        for (const [metric, score] of Object.entries(this.metrics)) {
            weightedSum += score * (weights[metric] || 0);
        }
        
        return Math.round(weightedSum);
    }

    /**
     * Identify critical issues
     */
    identifyIssues(analysis) {
        const issues = [];
        
        if (analysis.metrics.documentation < 40) {
            issues.push(`Poor documentation in ${analysis.fileName}`);
        }
        
        if (analysis.metrics.errorHandling < 30) {
            issues.push(`Weak error handling in ${analysis.fileName}`);
        }
        
        if (analysis.metrics.organization < 40) {
            issues.push(`Poor code organization in ${analysis.fileName}`);
        }
        
        if (analysis.complexity === 'High') {
            issues.push(`High complexity detected in ${analysis.fileName}`);
        }
        
        return issues;
    }

    /**
     * Generate file recommendations
     */
    generateFileRecommendations(analysis) {
        const recommendations = [];
        
        if (analysis.metrics.documentation < 60) {
            recommendations.push(`Add comprehensive documentation to ${analysis.fileName}`);
        }
        
        if (analysis.metrics.errorHandling < 60) {
            recommendations.push(`Implement robust error handling in ${analysis.fileName}`);
        }
        
        if (analysis.metrics.bestPractices < 70) {
            recommendations.push(`Follow ${analysis.language} best practices in ${analysis.fileName}`);
        }
        
        return recommendations;
    }

    /**
     * Generate top recommendations
     */
    generateTopRecommendations(allRecommendations) {
        const priorityMap = {
            'documentation': 'high',
            'error handling': 'high',
            'organization': 'medium',
            'best practices': 'medium',
            'performance': 'low'
        };
        
        const categorized = allRecommendations.reduce((acc, rec) => {
            let priority = 'medium';
            for (const [key, value] of Object.entries(priorityMap)) {
                if (rec.toLowerCase().includes(key)) {
                    priority = value;
                    break;
                }
            }
            
            if (!acc[priority]) acc[priority] = [];
            acc[priority].push(rec);
            return acc;
        }, {});
        
        const top = [];
        ['high', 'medium', 'low'].forEach(priority => {
            if (categorized[priority]) {
                top.push(...categorized[priority].slice(0, 3));
            }
        });
        
        return top.slice(0, 8);
    }

    /**
     * Generate quality breakdown
     */
    generateQualityBreakdown() {
        return Object.entries(this.metrics).map(([metric, score]) => ({
            name: metric.charAt(0).toUpperCase() + metric.slice(1),
            score,
            level: this.getQualityLevel(score),
            description: this.getMetricDescription(metric, score)
        }));
    }

    /**
     * Get quality level
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
     * Generate code health metrics
     */
    generateCodeHealthMetrics(analysisResults) {
        const totalFiles = analysisResults.fileAnalysis.length;
        const totalIssues = analysisResults.criticalIssues.length;
        const averageComplexity = this.calculateAverageComplexity(analysisResults.fileAnalysis);
        
        return {
            totalFiles,
            totalIssues,
            averageComplexity,
            healthScore: this.calculateOverallScore(),
            technicalDebt: totalIssues > 10 ? 'High' : totalIssues > 5 ? 'Medium' : 'Low'
        };
    }

    /**
     * Calculate average complexity
     */
    calculateAverageComplexity(fileAnalysis) {
        const complexityMap = { 'Low': 1, 'Medium': 2, 'High': 3 };
        const total = fileAnalysis.reduce((sum, file) => sum + (complexityMap[file.complexity] || 1), 0);
        const average = total / fileAnalysis.length;
        
        if (average >= 2.5) return 'High';
        if (average >= 1.5) return 'Medium';
        return 'Low';
    }

    /**
     * Generate key findings
     */
    generateKeyFindings() {
        const findings = [];
        const scores = this.metrics;
        
        // Identify strengths
        const strengths = Object.entries(scores)
            .filter(([_, score]) => score >= 75)
            .map(([metric, score]) => `${metric}: ${score}%`);
        
        if (strengths.length > 0) {
            findings.push(`Strong performance in: ${strengths.join(', ')}`);
        }
        
        // Identify weaknesses
        const weaknesses = Object.entries(scores)
            .filter(([_, score]) => score < 60)
            .map(([metric, _]) => metric);
        
        if (weaknesses.length > 0) {
            findings.push(`Improvement needed in: ${weaknesses.join(', ')}`);
        }
        
        // Overall assessment
        const overall = this.calculateOverallScore();
        if (overall >= 80) {
            findings.push('High-quality codebase with excellent standards');
        } else if (overall >= 65) {
            findings.push('Good quality codebase with minor improvement areas');
        } else {
            findings.push('Moderate quality requiring focused improvements');
        }
        
        return findings;
    }

    /**
     * Generate insights
     */
    generateInsights() {
        const insights = [];
        const scores = this.metrics;
        
        if (scores.documentation < 50 && scores.bestPractices > 70) {
            insights.push('Good coding practices but documentation lags behind implementation');
        }
        
        if (scores.functionality > 80 && scores.performance < 60) {
            insights.push('Feature-rich implementation with optimization opportunities');
        }
        
        if (scores.errorHandling < 50) {
            insights.push('Error handling improvement critical for production readiness');
        }
        
        if (scores.organization > 75) {
            insights.push('Well-organized codebase supports team collaboration and maintenance');
        }
        
        return insights;
    }
}
