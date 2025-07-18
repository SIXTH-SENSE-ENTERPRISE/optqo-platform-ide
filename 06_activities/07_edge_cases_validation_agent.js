/**
 * Edge Cases Validation Agent
 * Role: Quality Assurance Specialist & Unknown Handler
 * Validates system robustness and handles edge cases
 */

import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';

export class EdgeCasesValidationAgent extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = config;
        
        // Edge case patterns and indicators
        this.edgeCasePatterns = {
            // Error handling patterns
            'ERROR_HANDLING': {
                good: [/try.*catch|try.*except/gi, /error.*handling|exception.*handling/gi],
                missing: [/throw.*Error|raise.*Exception/gi],
                weight: 'critical'
            },
            
            // Input validation
            'INPUT_VALIDATION': {
                good: [/validate.*input|sanitize.*input/gi, /check.*params|verify.*arguments/gi],
                missing: [/direct.*access|unchecked.*input/gi],
                weight: 'high'
            },
            
            // Null/undefined checks
            'NULL_SAFETY': {
                good: [/if.*null|if.*undefined/gi, /null.*check|undefined.*check/gi],
                missing: [/\..*\.|direct.*property.*access/gi],
                weight: 'high'
            },
            
            // Resource management
            'RESOURCE_MANAGEMENT': {
                good: [/finally.*close|with.*open/gi, /dispose|cleanup/gi],
                missing: [/open.*file.*no.*close/gi],
                weight: 'medium'
            },
            
            // Boundary conditions
            'BOUNDARY_CONDITIONS': {
                good: [/edge.*case|boundary.*check/gi, /min.*max.*validation/gi],
                missing: [/array.*index.*no.*check/gi],
                weight: 'medium'
            },
            
            // Async handling
            'ASYNC_HANDLING': {
                good: [/await.*catch|promise.*catch/gi, /async.*error.*handling/gi],
                missing: [/async.*no.*await|promise.*no.*catch/gi],
                weight: 'high'
            }
        };
        
        // File type analysis patterns
        this.fileTypeValidation = {
            'BINARY_FILES': {
                extensions: ['.exe', '.dll', '.so', '.dylib', '.bin', '.dat'],
                analysis: 'binary_content'
            },
            'CONFIG_FILES': {
                extensions: ['.json', '.yaml', '.yml', '.toml', '.ini', '.env'],
                analysis: 'configuration_validation'
            },
            'DOCUMENTATION': {
                extensions: ['.md', '.txt', '.rst', '.pdf', '.doc'],
                analysis: 'documentation_completeness'
            },
            'UNKNOWN_EXTENSIONS': {
                analysis: 'unknown_file_analysis'
            }
        };
        
        // Quality validation criteria
        this.qualityValidation = {
            'CODE_COVERAGE': {
                patterns: [/test.*coverage|coverage.*report/gi],
                threshold: 0.8
            },
            'DOCUMENTATION_COVERAGE': {
                patterns: [/\/\*\*|\#\#\#|'''|"""/gi],
                threshold: 0.6
            },
            'ERROR_LOGGING': {
                patterns: [/console\.log|print\(|logger\./gi],
                threshold: 0.3
            }
        };
    }

    /**
     * Main edge cases validation analysis
     */
    async analyze(workspacePath, options = {}) {
        console.log('🔍 Edge Cases Validation Agent analyzing...');
        
        try {
            const fileAnalysis = await this.analyzeFileStructure(workspacePath);
            const codeQuality = await this.validateCodeQuality(workspacePath, fileAnalysis);
            const errorHandling = await this.validateErrorHandling(workspacePath, fileAnalysis);
            const unknownElements = await this.identifyUnknownElements(workspacePath, fileAnalysis);
            const robustnessScore = this.calculateRobustnessScore(codeQuality, errorHandling);
            
            const result = {
                // Core Validation Data
                validation: {
                    totalFiles: fileAnalysis.totalFiles,
                    analyzedFiles: fileAnalysis.analyzedFiles,
                    skippedFiles: fileAnalysis.skippedFiles,
                    fileTypes: fileAnalysis.fileTypes,
                    analysisTimestamp: new Date().toISOString()
                },
                
                // Edge Case Analysis
                edgeCaseHandling: {
                    score: codeQuality.edgeCaseScore,
                    patterns: codeQuality.patterns,
                    coverage: codeQuality.coverage,
                    goodPractices: codeQuality.goodPractices,
                    missingPractices: codeQuality.missingPractices
                },
                
                // Error Handling Assessment
                errorHandling: {
                    score: errorHandling.score,
                    rating: errorHandling.rating,
                    patterns: errorHandling.patterns,
                    issues: errorHandling.issues,
                    recommendations: errorHandling.recommendations
                },
                
                // Unknown Elements
                unknownElements: {
                    files: unknownElements.files,
                    extensions: unknownElements.extensions,
                    languages: unknownElements.languages,
                    patterns: unknownElements.patterns,
                    handlingStrategy: unknownElements.strategy
                },
                
                // Quality Metrics
                qualityMetrics: {
                    robustnessScore: robustnessScore.score,
                    robustnessRating: robustnessScore.rating,
                    testCoverage: codeQuality.testCoverage,
                    documentationCoverage: codeQuality.documentationCoverage,
                    errorLogging: codeQuality.errorLogging
                },
                
                // Risk Assessment
                riskAssessment: this.assessRisks(codeQuality, errorHandling, unknownElements),
                
                // Validation Issues
                validationIssues: this.identifyValidationIssues(codeQuality, errorHandling, unknownElements),
                
                // Improvement Recommendations
                recommendations: this.generateRecommendations(codeQuality, errorHandling, unknownElements, robustnessScore),
                
                // Key Findings
                keyFindings: this.generateKeyFindings(codeQuality, errorHandling, unknownElements, robustnessScore),
                insights: this.generateInsights(codeQuality, errorHandling, robustnessScore)
            };
            
            this.emit('analysis-complete', result);
            return result;
            
        } catch (error) {
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Analyze file structure for validation
     */
    async analyzeFileStructure(workspacePath) {
        const fileAnalysis = {
            totalFiles: 0,
            analyzedFiles: 0,
            skippedFiles: [],
            fileTypes: new Map(),
            codeFiles: [],
            configFiles: [],
            documentationFiles: [],
            binaryFiles: [],
            unknownFiles: []
        };
        
        await this.scanFiles(workspacePath, fileAnalysis, 0);
        
        return fileAnalysis;
    }

    /**
     * Scan files for analysis
     */
    async scanFiles(dirPath, fileAnalysis, depth = 0) {
        try {
            // Limit scanning depth to prevent performance issues
            if (depth > 4) return;
            
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            // Limit entries processed to prevent timeout on large directories
            const limitedEntries = entries.slice(0, 150);
            
            for (const entry of limitedEntries) {
                const fullPath = path.join(dirPath, entry.name);
                
                if (entry.isDirectory()) {
                    // Enhanced skip directories list for better performance
                    const skipDirs = [
                        'node_modules', '.git', '__pycache__', '.vscode', 'venv', 'env', 
                        'build', 'dist', 'target', 'bin', 'obj', '.vs', '.idea',
                        'coverage', 'test-results', 'logs', 'tmp', 'temp',
                        '.gradle', '.maven', 'vendor', 'packages', '.next'
                    ];
                    if (!skipDirs.includes(entry.name) && !entry.name.startsWith('.')) {
                        await this.scanFiles(fullPath, fileAnalysis, depth + 1);
                    }
                } else if (entry.isFile()) {
                    fileAnalysis.totalFiles++;
                    
                    // Skip processing if we've already analyzed enough files
                    if (fileAnalysis.totalFiles > 1000) return;
                    
                    const extension = path.extname(entry.name).toLowerCase();
                    const fileCategory = this.categorizeFile(entry.name, extension);
                    
                    // Track file types
                    const count = fileAnalysis.fileTypes.get(extension) || 0;
                    fileAnalysis.fileTypes.set(extension, count + 1);
                    
                    // Categorize files with limits to prevent memory issues
                    switch (fileCategory) {
                        case 'code':
                            if (fileAnalysis.codeFiles.length < 100) {
                                fileAnalysis.codeFiles.push(fullPath);
                                fileAnalysis.analyzedFiles++;
                            }
                            break;
                        case 'config':
                            if (fileAnalysis.configFiles.length < 50) {
                                fileAnalysis.configFiles.push(fullPath);
                                fileAnalysis.analyzedFiles++;
                            }
                            break;
                        case 'documentation':
                            if (fileAnalysis.documentationFiles.length < 30) {
                                fileAnalysis.documentationFiles.push(fullPath);
                                fileAnalysis.analyzedFiles++;
                            }
                            break;
                        case 'binary':
                            if (fileAnalysis.binaryFiles.length < 20) {
                                fileAnalysis.binaryFiles.push(fullPath);
                            }
                            break;
                        case 'unknown':
                            if (fileAnalysis.unknownFiles.length < 30) {
                                fileAnalysis.unknownFiles.push(fullPath);
                            }
                            break;
                        default:
                            if (fileAnalysis.skippedFiles.length < 50) {
                                fileAnalysis.skippedFiles.push(fullPath);
                            }
                    }
                }
            }
        } catch (error) {
            // Skip inaccessible directories
        }
    }

    /**
     * Categorize file by extension and name
     */
    categorizeFile(fileName, extension) {
        const codeExtensions = ['.py', '.js', '.ts', '.java', '.cs', '.cpp', '.c', '.h', '.r', '.m', '.php', '.go', '.rb', '.swift', '.kt'];
        const configExtensions = ['.json', '.yaml', '.yml', '.toml', '.ini', '.env', '.config'];
        const docExtensions = ['.md', '.txt', '.rst', '.doc', '.docx', '.pdf'];
        const binaryExtensions = ['.exe', '.dll', '.so', '.dylib', '.bin', '.dat', '.img', '.zip', '.tar', '.gz'];
        
        if (codeExtensions.includes(extension)) return 'code';
        if (configExtensions.includes(extension)) return 'config';
        if (docExtensions.includes(extension)) return 'documentation';
        if (binaryExtensions.includes(extension)) return 'binary';
        
        // Special file name patterns
        if (fileName.toLowerCase().includes('readme')) return 'documentation';
        if (fileName.toLowerCase().includes('license')) return 'documentation';
        if (fileName.toLowerCase().includes('makefile')) return 'config';
        
        return 'unknown';
    }

    /**
     * Validate code quality patterns
     */
    async validateCodeQuality(workspacePath, fileAnalysis) {
        const codeQuality = {
            edgeCaseScore: 0,
            patterns: {},
            coverage: {},
            goodPractices: [],
            missingPractices: [],
            testCoverage: 0,
            documentationCoverage: 0,
            errorLogging: 0
        };
        
        let totalFiles = fileAnalysis.codeFiles.length;
        let analyzedPatterns = {};
        
        // Initialize pattern tracking
        for (const patternName of Object.keys(this.edgeCasePatterns)) {
            analyzedPatterns[patternName] = {
                good: 0,
                missing: 0,
                total: 0
            };
        }
        
        // Analyze code files
        for (const filePath of fileAnalysis.codeFiles.slice(0, 20)) { // Limit to 20 files for performance
            await this.analyzeCodeFile(filePath, analyzedPatterns);
        }
        
        // Calculate scores and coverage
        for (const [patternName, pattern] of Object.entries(this.edgeCasePatterns)) {
            const analysis = analyzedPatterns[patternName];
            const coverage = analysis.total > 0 ? analysis.good / analysis.total : 0;
            
            codeQuality.patterns[patternName] = analysis;
            codeQuality.coverage[patternName] = Math.round(coverage * 100);
            
            if (coverage >= 0.7) {
                codeQuality.goodPractices.push(patternName);
            } else if (coverage < 0.3) {
                codeQuality.missingPractices.push(patternName);
            }
        }
        
        // Calculate overall edge case score
        const weights = {
            'critical': 30,
            'high': 20,
            'medium': 10
        };
        
        let weightedScore = 0;
        let totalWeight = 0;
        
        for (const [patternName, pattern] of Object.entries(this.edgeCasePatterns)) {
            const coverage = codeQuality.coverage[patternName] / 100;
            const weight = weights[pattern.weight] || 10;
            
            weightedScore += coverage * weight;
            totalWeight += weight;
        }
        
        codeQuality.edgeCaseScore = totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
        
        // Assess quality metrics
        codeQuality.testCoverage = this.assessTestCoverage(fileAnalysis);
        codeQuality.documentationCoverage = this.assessDocumentationCoverage(fileAnalysis);
        codeQuality.errorLogging = this.assessErrorLogging(analyzedPatterns);
        
        return codeQuality;
    }

    /**
     * Analyze individual code file
     */
    async analyzeCodeFile(filePath, analyzedPatterns) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            
            for (const [patternName, pattern] of Object.entries(this.edgeCasePatterns)) {
                let hasGoodPractices = false;
                let hasMissingPractices = false;
                
                // Check for good practices
                for (const goodPattern of pattern.good) {
                    if (goodPattern.test(content)) {
                        hasGoodPractices = true;
                        break;
                    }
                }
                
                // Check for missing practices
                for (const missingPattern of pattern.missing) {
                    if (missingPattern.test(content)) {
                        hasMissingPractices = true;
                        break;
                    }
                }
                
                analyzedPatterns[patternName].total++;
                if (hasGoodPractices) {
                    analyzedPatterns[patternName].good++;
                }
                if (hasMissingPractices) {
                    analyzedPatterns[patternName].missing++;
                }
            }
            
        } catch (error) {
            // Skip files that can't be read
        }
    }

    /**
     * Validate error handling patterns
     */
    async validateErrorHandling(workspacePath, fileAnalysis) {
        const errorHandling = {
            score: 50,
            rating: 'Fair',
            patterns: [],
            issues: [],
            recommendations: []
        };
        
        let errorHandlingFiles = 0;
        let totalCodeFiles = fileAnalysis.codeFiles.length;
        
        // Sample analysis of code files
        for (const filePath of fileAnalysis.codeFiles.slice(0, 10)) {
            const hasErrorHandling = await this.checkFileErrorHandling(filePath);
            if (hasErrorHandling) {
                errorHandlingFiles++;
            }
        }
        
        // Calculate error handling score
        if (totalCodeFiles > 0) {
            const sampledFiles = Math.min(10, totalCodeFiles);
            const errorHandlingRatio = errorHandlingFiles / sampledFiles;
            errorHandling.score = Math.round(errorHandlingRatio * 100);
        }
        
        // Determine rating
        if (errorHandling.score >= 80) {
            errorHandling.rating = 'Excellent';
        } else if (errorHandling.score >= 60) {
            errorHandling.rating = 'Good';
        } else if (errorHandling.score >= 40) {
            errorHandling.rating = 'Fair';
        } else {
            errorHandling.rating = 'Poor';
        }
        
        // Generate issues and recommendations
        if (errorHandling.score < 60) {
            errorHandling.issues.push('Insufficient error handling coverage');
            errorHandling.recommendations.push('Implement comprehensive error handling');
        }
        
        return errorHandling;
    }

    /**
     * Check file for error handling
     */
    async checkFileErrorHandling(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            
            const errorPatterns = [
                /try.*catch/gi,
                /try.*except/gi,
                /error.*handling/gi,
                /exception.*handling/gi,
                /\.catch\(/gi,
                /catch.*error/gi
            ];
            
            return errorPatterns.some(pattern => pattern.test(content));
            
        } catch (error) {
            return false;
        }
    }

    /**
     * Identify unknown elements
     */
    async identifyUnknownElements(workspacePath, fileAnalysis) {
        const unknownElements = {
            files: fileAnalysis.unknownFiles,
            extensions: [],
            languages: [],
            patterns: [],
            strategy: this.determineHandlingStrategy(fileAnalysis.unknownFiles)
        };
        
        // Analyze unknown file extensions
        for (const [extension, count] of fileAnalysis.fileTypes.entries()) {
            if (!this.isKnownExtension(extension)) {
                unknownElements.extensions.push({
                    extension,
                    count,
                    category: this.guessFileCategory(extension)
                });
            }
        }
        
        // Analyze unknown files for patterns
        for (const filePath of fileAnalysis.unknownFiles.slice(0, 5)) {
            const patterns = await this.analyzeUnknownFile(filePath);
            unknownElements.patterns.push(...patterns);
        }
        
        return unknownElements;
    }

    /**
     * Check if extension is known
     */
    isKnownExtension(extension) {
        const knownExtensions = [
            '.py', '.js', '.ts', '.java', '.cs', '.cpp', '.c', '.h', '.r', '.m', '.php', '.go', '.rb', '.swift', '.kt',
            '.json', '.yaml', '.yml', '.toml', '.ini', '.env', '.config',
            '.md', '.txt', '.rst', '.doc', '.docx', '.pdf',
            '.exe', '.dll', '.so', '.dylib', '.bin', '.dat', '.img', '.zip', '.tar', '.gz',
            '.html', '.css', '.scss', '.sass', '.xml', '.svg'
        ];
        
        return knownExtensions.includes(extension.toLowerCase());
    }

    /**
     * Guess file category from extension
     */
    guessFileCategory(extension) {
        // Simple heuristics for unknown extensions
        if (extension.length <= 2) return 'possibly_config';
        if (extension.includes('log')) return 'log_file';
        if (extension.includes('tmp') || extension.includes('temp')) return 'temporary_file';
        if (extension.includes('bak') || extension.includes('backup')) return 'backup_file';
        
        return 'unknown';
    }

    /**
     * Analyze unknown file
     */
    async analyzeUnknownFile(filePath) {
        const patterns = [];
        
        try {
            const stats = await fs.stat(filePath);
            const fileName = path.basename(filePath);
            
            patterns.push({
                file: fileName,
                size: stats.size,
                type: stats.size > 1024 * 1024 ? 'large_file' : 'small_file',
                analysis: 'requires_manual_inspection'
            });
            
        } catch (error) {
            patterns.push({
                file: path.basename(filePath),
                type: 'inaccessible',
                analysis: 'permission_or_corruption_issue'
            });
        }
        
        return patterns;
    }

    /**
     * Determine handling strategy for unknown elements
     */
    determineHandlingStrategy(unknownFiles) {
        if (unknownFiles.length === 0) {
            return 'no_unknown_elements';
        } else if (unknownFiles.length <= 5) {
            return 'manual_inspection_recommended';
        } else {
            return 'batch_analysis_required';
        }
    }

    /**
     * Calculate robustness score
     */
    calculateRobustnessScore(codeQuality, errorHandling) {
        const weights = {
            edgeCaseHandling: 0.4,
            errorHandling: 0.3,
            testCoverage: 0.2,
            documentation: 0.1
        };
        
        const score = Math.round(
            codeQuality.edgeCaseScore * weights.edgeCaseHandling +
            errorHandling.score * weights.errorHandling +
            codeQuality.testCoverage * weights.testCoverage +
            codeQuality.documentationCoverage * weights.documentation
        );
        
        let rating;
        if (score >= 85) rating = 'Excellent';
        else if (score >= 70) rating = 'Good';
        else if (score >= 55) rating = 'Fair';
        else rating = 'Poor';
        
        return { score, rating };
    }

    /**
     * Assess test coverage
     */
    assessTestCoverage(fileAnalysis) {
        const testPatterns = [/test_|_test\.|spec\.|\.test\.|\.spec\./i];
        const testFiles = fileAnalysis.codeFiles.filter(filePath => 
            testPatterns.some(pattern => pattern.test(path.basename(filePath)))
        );
        
        const totalCodeFiles = fileAnalysis.codeFiles.length;
        return totalCodeFiles > 0 ? Math.round((testFiles.length / totalCodeFiles) * 100) : 0;
    }

    /**
     * Assess documentation coverage
     */
    assessDocumentationCoverage(fileAnalysis) {
        const totalFiles = fileAnalysis.totalFiles;
        const docFiles = fileAnalysis.documentationFiles.length;
        
        return totalFiles > 0 ? Math.round((docFiles / totalFiles) * 100) : 0;
    }

    /**
     * Assess error logging
     */
    assessErrorLogging(analyzedPatterns) {
        const errorLoggingPattern = analyzedPatterns['ERROR_HANDLING'];
        if (!errorLoggingPattern || errorLoggingPattern.total === 0) return 0;
        
        return Math.round((errorLoggingPattern.good / errorLoggingPattern.total) * 100);
    }

    /**
     * Assess risks
     */
    assessRisks(codeQuality, errorHandling, unknownElements) {
        const risks = [];
        
        // Code quality risks
        if (codeQuality.edgeCaseScore < 50) {
            risks.push({
                type: 'quality',
                severity: 'high',
                risk: 'Insufficient edge case handling',
                probability: 'high',
                impact: 'System failures in unexpected scenarios'
            });
        }
        
        // Error handling risks
        if (errorHandling.score < 60) {
            risks.push({
                type: 'reliability',
                severity: 'medium',
                risk: 'Poor error handling coverage',
                probability: 'medium',
                impact: 'Unhandled exceptions and system crashes'
            });
        }
        
        // Unknown elements risks
        if (unknownElements.files.length > 10) {
            risks.push({
                type: 'security',
                severity: 'medium',
                risk: 'Many unanalyzed files present',
                probability: 'low',
                impact: 'Potential security vulnerabilities or hidden functionality'
            });
        }
        
        return risks;
    }

    /**
     * Identify validation issues
     */
    identifyValidationIssues(codeQuality, errorHandling, unknownElements) {
        const issues = [];
        
        // Missing critical practices
        for (const practice of codeQuality.missingPractices) {
            issues.push({
                type: 'quality',
                severity: 'medium',
                issue: `Missing ${practice.replace('_', ' ').toLowerCase()}`,
                recommendation: `Implement ${practice.replace('_', ' ').toLowerCase()} patterns`
            });
        }
        
        // Low error handling
        if (errorHandling.score < 50) {
            issues.push({
                type: 'reliability',
                severity: 'high',
                issue: 'Inadequate error handling',
                recommendation: 'Add comprehensive error handling and logging'
            });
        }
        
        // Unknown files
        if (unknownElements.files.length > 0) {
            issues.push({
                type: 'completeness',
                severity: 'low',
                issue: `${unknownElements.files.length} unknown files detected`,
                recommendation: 'Review and categorize unknown files'
            });
        }
        
        return issues;
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(codeQuality, errorHandling, unknownElements, robustnessScore) {
        const recommendations = [];
        
        // Edge case handling recommendations
        if (codeQuality.edgeCaseScore < 70) {
            recommendations.push({
                priority: 'high',
                title: 'Improve Edge Case Handling',
                description: 'Implement comprehensive edge case validation and handling',
                impact: 'Reduced system failures and improved reliability'
            });
        }
        
        // Error handling recommendations
        if (errorHandling.score < 70) {
            recommendations.push({
                priority: 'high',
                title: 'Enhance Error Handling',
                description: 'Add try-catch blocks and error logging throughout the codebase',
                impact: 'Better error recovery and debugging capabilities'
            });
        }
        
        // Testing recommendations
        if (codeQuality.testCoverage < 50) {
            recommendations.push({
                priority: 'medium',
                title: 'Increase Test Coverage',
                description: 'Add unit tests and edge case testing',
                impact: 'Earlier detection of issues and improved code quality'
            });
        }
        
        // Unknown elements recommendations
        if (unknownElements.files.length > 0) {
            recommendations.push({
                priority: 'low',
                title: 'Review Unknown Files',
                description: 'Analyze and categorize unknown file types',
                impact: 'Complete system understanding and security assurance'
            });
        }
        
        return recommendations;
    }

    /**
     * Generate key findings
     */
    generateKeyFindings(codeQuality, errorHandling, unknownElements, robustnessScore) {
        const findings = [];
        
        findings.push(`System robustness assessed as ${robustnessScore.rating} (${robustnessScore.score}%)`);
        findings.push(`Edge case handling coverage: ${codeQuality.edgeCaseScore}%`);
        findings.push(`Error handling coverage: ${errorHandling.score}%`);
        
        if (codeQuality.goodPractices.length > 0) {
            findings.push(`Good practices found: ${codeQuality.goodPractices.join(', ')}`);
        }
        
        if (unknownElements.files.length > 0) {
            findings.push(`${unknownElements.files.length} unknown files require review`);
        }
        
        return findings;
    }

    /**
     * Generate insights
     */
    generateInsights(codeQuality, errorHandling, robustnessScore) {
        const insights = [];
        
        // Robustness insights
        if (robustnessScore.score >= 80) {
            insights.push('High system robustness indicates good development practices and quality assurance');
        } else if (robustnessScore.score >= 60) {
            insights.push('Moderate robustness with room for improvement in edge case handling');
        } else {
            insights.push('Low robustness score suggests need for systematic quality improvements');
        }
        
        // Error handling insights
        if (errorHandling.score >= 70) {
            insights.push('Good error handling practices support system reliability');
        } else {
            insights.push('Improving error handling will significantly enhance system stability');
        }
        
        // Quality pattern insights
        const practiceCount = codeQuality.goodPractices.length;
        if (practiceCount >= 4) {
            insights.push('Strong adherence to quality practices across multiple areas');
        } else if (practiceCount >= 2) {
            insights.push('Some quality practices in place but gaps remain');
        } else {
            insights.push('Limited quality practices detected - systematic improvement needed');
        }
        
        return insights;
    }

    /**
     * Validate final report for completeness and accuracy
     */
    async validateFinalReport(reportData, agentResults) {
        console.log('🔍 Validating final report completeness and accuracy...');
        
        const validation = {
            isValid: true,
            issues: [],
            warnings: [],
            completenessScore: 100,
            validationTimestamp: new Date().toISOString()
        };
        
        try {
            // Check report completeness
            const requiredSections = [
                'analysisTimestamp',
                'technology',
                'qualityMetrics',
                'architecture',
                'fileStructure',
                'integration',
                'validation'
            ];
            
            for (const section of requiredSections) {
                if (!reportData[section]) {
                    validation.issues.push(`Missing required section: ${section}`);
                    validation.completenessScore -= 15;
                }
            }
            
            // Check data consistency
            if (agentResults) {
                // Validate technology data
                if (agentResults['technology-detection'] && reportData.technology) {
                    const techData = agentResults['technology-detection'];
                    if (techData.primaryLanguage !== reportData.technology.primaryLanguage) {
                        validation.warnings.push('Technology data inconsistency detected');
                    }
                }
                
                // Validate quality metrics
                if (agentResults['quality-assessment'] && reportData.qualityMetrics) {
                    const qualityData = agentResults['quality-assessment'];
                    if (Math.abs(qualityData.overallScore - reportData.qualityMetrics.overallScore) > 5) {
                        validation.warnings.push('Quality score inconsistency detected');
                    }
                }
            }
            
            // Check for empty or placeholder values
            const checkForPlaceholders = (obj, path = '') => {
                for (const [key, value] of Object.entries(obj)) {
                    const currentPath = path ? `${path}.${key}` : key;
                    if (value === null || value === undefined || value === '' || value === 'N/A') {
                        validation.warnings.push(`Placeholder value found at: ${currentPath}`);
                    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                        checkForPlaceholders(value, currentPath);
                    }
                }
            };
            
            checkForPlaceholders(reportData);
            
            // Determine overall validity
            validation.isValid = validation.issues.length === 0;
            validation.completenessScore = Math.max(0, validation.completenessScore);
            
            console.log(`✅ Report validation complete. Score: ${validation.completenessScore}%`);
            
            return validation;
            
        } catch (error) {
            validation.isValid = false;
            validation.issues.push(`Validation error: ${error.message}`);
            validation.completenessScore = 0;
            
            console.error('❌ Report validation failed:', error.message);
            return validation;
        }
    }
}
