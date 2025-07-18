/**
 * File Structure Agent
 * Role: File Organization Specialist & Structure Analyst
 * Evaluates file organization, naming conventions, and project structure
 */

import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';

export class FileStructureAgent extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = config;
    }

    /**
     * Main file structure analysis
     */
    async analyze(workspacePath, options = {}) {
        console.log('📁 File Structure Agent analyzing...');
        
        try {
            const projectStructure = await this.analyzeProjectStructure(workspacePath);
            const namingAnalysis = this.analyzeNamingConventions(projectStructure);
            const organizationScore = this.calculateOrganizationScore(projectStructure, namingAnalysis);
            const modularity = this.assessModularity(projectStructure);
            
            const result = {
                // Core Structure Data
                structure: {
                    totalDirectories: projectStructure.directories.length,
                    totalFiles: projectStructure.files.length,
                    maxDepth: projectStructure.maxDepth,
                    avgFilesPerDirectory: Math.round(projectStructure.files.length / Math.max(projectStructure.directories.length, 1))
                },
                
                // Organization Assessment
                organizationScore,
                namingConsistency: namingAnalysis.consistencyScore,
                modularity: modularity.rating,
                
                // File Analysis
                fileTypes: projectStructure.fileTypes,
                largestFiles: projectStructure.largestFiles,
                configurationFiles: projectStructure.configFiles,
                
                // Structure Quality
                structureIssues: this.identifyStructureIssues(projectStructure, namingAnalysis),
                recommendations: this.generateRecommendations(projectStructure, namingAnalysis, modularity),
                
                // Key Findings
                keyFindings: this.generateKeyFindings(projectStructure, namingAnalysis, organizationScore),
                insights: this.generateInsights(projectStructure, modularity),
                
                // Additional Metrics
                totalFiles: projectStructure.files.length,
                linesOfCode: projectStructure.totalLines,
                
                // Metadata
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
     * Analyze complete project structure
     */
    async analyzeProjectStructure(workspacePath) {
        const structure = {
            directories: [],
            files: [],
            fileTypes: {},
            largestFiles: [],
            configFiles: [],
            maxDepth: 0,
            totalLines: 0
        };
        
        await this.scanDirectory(workspacePath, structure, 0);
        
        // Calculate largest files
        structure.largestFiles = structure.files
            .sort((a, b) => b.size - a.size)
            .slice(0, 10);
        
        return structure;
    }

    /**
     * Recursively scan directory structure
     */
    async scanDirectory(dirPath, structure, depth) {
        try {
            structure.maxDepth = Math.max(structure.maxDepth, depth);
            
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                
                if (entry.isDirectory()) {
                    // Skip common directories to ignore
                    const skipDirs = ['node_modules', '.git', '__pycache__', '.vscode', 'venv', 'env'];
                    if (!skipDirs.includes(entry.name)) {
                        structure.directories.push({
                            name: entry.name,
                            path: fullPath,
                            depth
                        });
                        await this.scanDirectory(fullPath, structure, depth + 1);
                    }
                } else if (entry.isFile()) {
                    const stats = await fs.stat(fullPath);
                    const extension = path.extname(entry.name).toLowerCase();
                    
                    const fileInfo = {
                        name: entry.name,
                        path: fullPath,
                        extension,
                        size: stats.size,
                        depth
                    };
                    
                    structure.files.push(fileInfo);
                    
                    // Count file types
                    if (!structure.fileTypes[extension]) {
                        structure.fileTypes[extension] = 0;
                    }
                    structure.fileTypes[extension]++;
                    
                    // Identify configuration files
                    if (this.isConfigurationFile(entry.name)) {
                        structure.configFiles.push(fileInfo);
                    }
                    
                    // Count lines for code files
                    if (this.isCodeFile(extension) && stats.size < 100000) { // 100KB limit
                        try {
                            const content = await fs.readFile(fullPath, 'utf-8');
                            structure.totalLines += content.split('\n').length;
                        } catch (error) {
                            // Skip files that can't be read
                        }
                    }
                }
            }
        } catch (error) {
            // Skip inaccessible directories
        }
    }

    /**
     * Check if file is a configuration file
     */
    isConfigurationFile(filename) {
        const configFiles = [
            'package.json', 'requirements.txt', 'pom.xml', 'build.gradle',
            'Dockerfile', 'docker-compose.yml', '.env', 'config.json',
            'webpack.config.js', 'babel.config.js', '.gitignore', 'README.md'
        ];
        
        return configFiles.includes(filename) ||
               filename.endsWith('.config') ||
               filename.endsWith('.conf') ||
               filename.endsWith('.properties') ||
               filename.endsWith('.yml') ||
               filename.endsWith('.yaml');
    }

    /**
     * Check if file is a code file
     */
    isCodeFile(extension) {
        const codeExtensions = [
            '.py', '.js', '.ts', '.java', '.cs', '.cpp', '.c', '.h',
            '.r', '.R', '.m', '.sql', '.php', '.go', '.scala', '.jl'
        ];
        
        return codeExtensions.includes(extension);
    }

    /**
     * Analyze naming conventions
     */
    analyzeNamingConventions(projectStructure) {
        const analysis = {
            consistencyScore: 0,
            patterns: {
                camelCase: 0,
                snakeCase: 0,
                kebabCase: 0,
                pascalCase: 0,
                mixed: 0
            },
            issues: []
        };
        
        // Analyze file naming patterns
        for (const file of projectStructure.files) {
            const baseName = path.basename(file.name, file.extension);
            const pattern = this.identifyNamingPattern(baseName);
            analysis.patterns[pattern]++;
        }
        
        // Analyze directory naming patterns
        for (const dir of projectStructure.directories) {
            const pattern = this.identifyNamingPattern(dir.name);
            analysis.patterns[pattern]++;
        }
        
        // Calculate consistency score
        const totalItems = projectStructure.files.length + projectStructure.directories.length;
        if (totalItems > 0) {
            const maxPattern = Math.max(...Object.values(analysis.patterns));
            analysis.consistencyScore = Math.round((maxPattern / totalItems) * 100);
        }
        
        // Identify naming issues
        if (analysis.patterns.mixed > totalItems * 0.3) {
            analysis.issues.push('High inconsistency in naming conventions');
        }
        
        if (analysis.consistencyScore < 60) {
            analysis.issues.push('Poor naming convention consistency');
        }
        
        return analysis;
    }

    /**
     * Identify naming pattern
     */
    identifyNamingPattern(name) {
        if (/^[a-z]+([A-Z][a-z]*)*$/.test(name)) return 'camelCase';
        if (/^[a-z]+(_[a-z]+)*$/.test(name)) return 'snakeCase';
        if (/^[a-z]+(-[a-z]+)*$/.test(name)) return 'kebabCase';
        if (/^[A-Z][a-z]*([A-Z][a-z]*)*$/.test(name)) return 'pascalCase';
        return 'mixed';
    }

    /**
     * Calculate organization score
     */
    calculateOrganizationScore(projectStructure, namingAnalysis) {
        let score = 50; // Base score
        
        // Directory structure bonus
        const avgDepth = projectStructure.maxDepth;
        if (avgDepth >= 2 && avgDepth <= 4) score += 20; // Good depth
        else if (avgDepth > 6) score -= 15; // Too deep
        
        // File distribution bonus
        const avgFilesPerDir = projectStructure.files.length / Math.max(projectStructure.directories.length, 1);
        if (avgFilesPerDir >= 3 && avgFilesPerDir <= 15) score += 15; // Good distribution
        else if (avgFilesPerDir > 25) score -= 10; // Too many files per directory
        
        // Naming consistency bonus
        score += (namingAnalysis.consistencyScore - 50) * 0.3;
        
        // Configuration files bonus
        if (projectStructure.configFiles.length > 0) score += 10;
        
        // File type diversity
        const fileTypeCount = Object.keys(projectStructure.fileTypes).length;
        if (fileTypeCount >= 3 && fileTypeCount <= 8) score += 10;
        
        return Math.min(100, Math.max(0, Math.round(score)));
    }

    /**
     * Assess modularity
     */
    assessModularity(projectStructure) {
        let rating = 'Fair';
        let score = 50;
        
        // Check for common modular patterns
        const moduleIndicators = projectStructure.directories.filter(dir => {
            const name = dir.name.toLowerCase();
            return ['src', 'lib', 'modules', 'components', 'services', 'utils', 'helpers'].includes(name);
        });
        
        if (moduleIndicators.length >= 3) {
            score += 30;
            rating = 'Good';
        } else if (moduleIndicators.length >= 1) {
            score += 15;
        }
        
        // Check for separation of concerns
        const concernDirs = projectStructure.directories.filter(dir => {
            const name = dir.name.toLowerCase();
            return ['models', 'views', 'controllers', 'data', 'business', 'presentation'].includes(name);
        });
        
        if (concernDirs.length >= 2) {
            score += 20;
            if (rating === 'Good') rating = 'Excellent';
        }
        
        // Penalty for too flat structure
        if (projectStructure.maxDepth <= 1 && projectStructure.files.length > 10) {
            score -= 20;
            rating = 'Poor';
        }
        
        return {
            rating,
            score: Math.min(100, Math.max(0, score)),
            moduleIndicators: moduleIndicators.length,
            concernSeparation: concernDirs.length
        };
    }

    /**
     * Identify structure issues
     */
    identifyStructureIssues(projectStructure, namingAnalysis) {
        const issues = [];
        
        // Deep nesting issue
        if (projectStructure.maxDepth > 6) {
            issues.push({
                type: 'structure',
                severity: 'medium',
                issue: 'Very deep directory nesting detected',
                recommendation: 'Consider flattening directory structure'
            });
        }
        
        // Too many files in root
        const rootFiles = projectStructure.files.filter(f => f.depth === 0).length;
        if (rootFiles > 15) {
            issues.push({
                type: 'organization',
                severity: 'medium',
                issue: 'Too many files in root directory',
                recommendation: 'Organize files into subdirectories'
            });
        }
        
        // Large files
        const largeFiles = projectStructure.files.filter(f => f.size > 100000); // 100KB
        if (largeFiles.length > 0) {
            issues.push({
                type: 'file-size',
                severity: 'low',
                issue: `${largeFiles.length} large files detected`,
                recommendation: 'Consider breaking down large files'
            });
        }
        
        // Naming inconsistency
        if (namingAnalysis.consistencyScore < 60) {
            issues.push({
                type: 'naming',
                severity: 'medium',
                issue: 'Inconsistent naming conventions',
                recommendation: 'Standardize naming conventions across project'
            });
        }
        
        return issues;
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(projectStructure, namingAnalysis, modularity) {
        const recommendations = [];
        
        if (namingAnalysis.consistencyScore < 70) {
            recommendations.push({
                priority: 'medium',
                title: 'Standardize Naming Conventions',
                description: 'Implement consistent naming patterns across files and directories',
                effort: '1-2 weeks'
            });
        }
        
        if (modularity.rating === 'Poor' || modularity.rating === 'Fair') {
            recommendations.push({
                priority: 'high',
                title: 'Improve Code Modularity',
                description: 'Organize code into logical modules and separate concerns',
                effort: '2-4 weeks'
            });
        }
        
        if (projectStructure.maxDepth > 5) {
            recommendations.push({
                priority: 'medium',
                title: 'Flatten Directory Structure',
                description: 'Reduce excessive directory nesting for better navigation',
                effort: '1 week'
            });
        }
        
        if (projectStructure.configFiles.length === 0) {
            recommendations.push({
                priority: 'low',
                title: 'Add Configuration Management',
                description: 'Implement proper configuration file structure',
                effort: '1-2 days'
            });
        }
        
        return recommendations;
    }

    /**
     * Generate key findings
     */
    generateKeyFindings(projectStructure, namingAnalysis, organizationScore) {
        const findings = [];
        
        findings.push(`Project contains ${projectStructure.files.length} files in ${projectStructure.directories.length} directories`);
        findings.push(`Maximum directory depth: ${projectStructure.maxDepth} levels`);
        findings.push(`Organization score: ${organizationScore}%`);
        findings.push(`Naming consistency: ${namingAnalysis.consistencyScore}%`);
        
        if (projectStructure.totalLines > 0) {
            findings.push(`Total lines of code: ${projectStructure.totalLines.toLocaleString()}`);
        }
        
        const fileTypeCount = Object.keys(projectStructure.fileTypes).length;
        findings.push(`${fileTypeCount} different file types detected`);
        
        return findings;
    }

    /**
     * Generate insights
     */
    generateInsights(projectStructure, modularity) {
        const insights = [];
        
        if (modularity.rating === 'Excellent' || modularity.rating === 'Good') {
            insights.push('Well-organized modular structure supports maintainability');
        }
        
        if (projectStructure.maxDepth >= 3 && projectStructure.maxDepth <= 5) {
            insights.push('Balanced directory hierarchy facilitates navigation');
        }
        
        if (projectStructure.configFiles.length > 0) {
            insights.push('Configuration files present indicate mature project setup');
        }
        
        const avgFileSize = projectStructure.files.reduce((sum, f) => sum + f.size, 0) / projectStructure.files.length;
        if (avgFileSize < 10000) { // 10KB average
            insights.push('Small average file size suggests good code decomposition');
        }
        
        return insights;
    }
}
