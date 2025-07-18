/**
 * Multi-Language Integration Agent
 * Role: Polyglot Systems Specialist & Integration Analyst
 * Analyzes multi-language projects and assesses integration quality
 */

import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';

export class MultiLanguageIntegrationAgent extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = config;
        
        // Language interaction patterns
        this.interactionPatterns = {
            // Python interactions
            'PYTHON_JAVASCRIPT': {
                indicators: [/subprocess.*node|os\.system.*node/g, /exec.*npm|exec.*node/g],
                type: 'Process Communication',
                complexity: 'Medium'
            },
            'PYTHON_SQL': {
                indicators: [/import.*sql|from.*sql/g, /connect.*database|cursor.*execute/g],
                type: 'Database Integration',
                complexity: 'Low'
            },
            'PYTHON_R': {
                indicators: [/rpy2|subprocess.*Rscript/g, /r\[.*\]|ro\./g],
                type: 'Statistical Computing Bridge',
                complexity: 'High'
            },
            
            // JavaScript interactions
            'JAVASCRIPT_PYTHON': {
                indicators: [/spawn.*python|exec.*python/g, /python-shell|child_process/g],
                type: 'Process Communication',
                complexity: 'Medium'
            },
            'JAVASCRIPT_SQL': {
                indicators: [/require.*mysql|require.*postgres/g, /query.*sql|execute.*sql/g],
                type: 'Database Integration',
                complexity: 'Low'
            },
            
            // Java interactions
            'JAVA_PYTHON': {
                indicators: [/ProcessBuilder.*python|Runtime.*python/g, /Jython|JPython/g],
                type: 'Process/Runtime Integration',
                complexity: 'High'
            },
            'JAVA_SQL': {
                indicators: [/import java\.sql|jdbc:/g, /Connection.*Statement|PreparedStatement/g],
                type: 'Database Integration',
                complexity: 'Low'
            },
            
            // Data exchange patterns
            'JSON_EXCHANGE': {
                indicators: [/json\.loads|json\.dumps/g, /JSON\.parse|JSON\.stringify/g],
                type: 'JSON Data Exchange',
                complexity: 'Low'
            },
            'CSV_EXCHANGE': {
                indicators: [/csv\.reader|csv\.writer/g, /fs\.createReadStream.*csv/g],
                type: 'CSV Data Exchange',
                complexity: 'Low'
            },
            'XML_EXCHANGE': {
                indicators: [/xml\.etree|BeautifulSoup/g, /DOMParser|XMLHttpRequest/g],
                type: 'XML Data Exchange',
                complexity: 'Medium'
            },
            
            // API communication
            'REST_API': {
                indicators: [/requests\.get|requests\.post/g, /fetch\(|axios\./g],
                type: 'REST API Communication',
                complexity: 'Low'
            },
            'WEBSOCKET': {
                indicators: [/websocket|socket\.io/g, /WebSocket\(|ws:/g],
                type: 'Real-time Communication',
                complexity: 'Medium'
            }
        };
        
        // Language affinity matrix (how well languages work together)
        this.languageAffinity = {
            'PYTHON': {
                'JAVASCRIPT': 0.7,
                'SQL': 0.9,
                'R': 0.8,
                'JAVA': 0.6,
                'SHELL': 0.8
            },
            'JAVASCRIPT': {
                'PYTHON': 0.7,
                'SQL': 0.8,
                'HTML': 0.95,
                'CSS': 0.95,
                'JAVA': 0.5
            },
            'JAVA': {
                'PYTHON': 0.6,
                'JAVASCRIPT': 0.5,
                'SQL': 0.9,
                'SCALA': 0.9
            },
            'R': {
                'PYTHON': 0.8,
                'SQL': 0.8,
                'JAVASCRIPT': 0.6
            }
        };
    }

    /**
     * Main multi-language integration analysis
     */
    async analyze(workspacePath, options = {}) {
        console.log('🌐 Multi-Language Integration Agent analyzing...');
        console.log(`📂 Scanning workspace: ${workspacePath}`);
        
        try {
            const languageAnalysis = await this.detectLanguages(workspacePath);
            console.log(`✅ Language detection complete. Found ${languageAnalysis.languages.length} languages`);
            
            const interactionAnalysis = await this.analyzeInteractions(workspacePath, languageAnalysis);
            console.log(`✅ Interaction analysis complete. Found ${interactionAnalysis.patterns.length} patterns`);
            
            const integrationQuality = this.assessIntegrationQuality(languageAnalysis, interactionAnalysis);
            const maintenanceComplexity = this.assessMaintenanceComplexity(languageAnalysis, interactionAnalysis);
            console.log(`✅ Quality assessment complete. Score: ${integrationQuality.score}%`);
            
            const result = {
                // Core Integration Data
                integration: {
                    languagesDetected: languageAnalysis.languages,
                    languageDistribution: languageAnalysis.distribution,
                    primaryLanguage: languageAnalysis.primary,
                    secondaryLanguages: languageAnalysis.secondary,
                    totalLanguages: languageAnalysis.languages.length
                },
                
                // Interaction Analysis
                communicationPatterns: interactionAnalysis.patterns,
                integrationPoints: interactionAnalysis.integrationPoints,
                dataExchangeFormats: interactionAnalysis.dataFormats,
                
                // Quality Assessment
                integrationQuality: integrationQuality.score,
                qualityRating: integrationQuality.rating,
                affinityScore: integrationQuality.affinityScore,
                
                // Maintenance Assessment
                maintenanceComplexity: maintenanceComplexity.level,
                complexityFactors: maintenanceComplexity.factors,
                teamRequirements: maintenanceComplexity.teamRequirements,
                
                // Issues and Recommendations
                integrationIssues: this.identifyIntegrationIssues(languageAnalysis, interactionAnalysis),
                recommendations: this.generateRecommendations(languageAnalysis, interactionAnalysis, integrationQuality),
                
                // Key Findings
                keyFindings: this.generateKeyFindings(languageAnalysis, interactionAnalysis, integrationQuality),
                insights: this.generateInsights(languageAnalysis, interactionAnalysis, maintenanceComplexity),
                
                // Unknown Languages Handling
                unknownLanguages: languageAnalysis.unknown || [],
                
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
     * Detect all languages in the project
     */
    async detectLanguages(workspacePath) {
        const languageFiles = new Map();
        const fileExtensions = new Map();
        
        await this.scanForLanguages(workspacePath, languageFiles, fileExtensions, 0);
        
        // Calculate language distribution
        const totalFiles = Array.from(languageFiles.values()).reduce((sum, files) => sum + files.length, 0);
        const distribution = {};
        const languages = [];
        
        for (const [language, files] of languageFiles.entries()) {
            const percentage = Math.round((files.length / totalFiles) * 100);
            distribution[language] = {
                fileCount: files.length,
                percentage,
                files: files.slice(0, 5) // Sample files
            };
            languages.push(language);
        }
        
        // Identify primary and secondary languages
        const sortedLanguages = languages.sort((a, b) => 
            distribution[b].fileCount - distribution[a].fileCount
        );
        
        const primary = sortedLanguages[0] || 'Unknown';
        const secondary = sortedLanguages.slice(1, 4);
        
        // Check for unknown extensions
        const knownExtensions = ['.py', '.js', '.ts', '.java', '.cs', '.cpp', '.c', '.h', '.r', '.R', '.m', '.sql', '.php', '.go', '.scala', '.jl', '.rb', '.swift', '.kt'];
        const unknown = Array.from(fileExtensions.keys()).filter(ext => !knownExtensions.includes(ext));
        
        return {
            languages,
            distribution,
            primary,
            secondary,
            unknown,
            totalFiles
        };
    }

    /**
     * Scan workspace for language files
     */
    async scanForLanguages(dirPath, languageFiles, fileExtensions, depth = 0) {
        try {
            // Limit scanning depth to prevent performance issues
            if (depth > 5) return;
            
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            // Limit the number of entries processed to prevent timeout
            const limitedEntries = entries.slice(0, 200);
            
            for (const entry of limitedEntries) {
                const fullPath = path.join(dirPath, entry.name);
                
                if (entry.isDirectory()) {
                    // Enhanced skip directories list for performance
                    const skipDirs = [
                        'node_modules', '.git', '__pycache__', '.vscode', 'venv', 'env',
                        'build', 'dist', 'target', 'bin', 'obj', '.vs', '.idea',
                        'coverage', 'test-results', 'logs', 'tmp', 'temp',
                        '.gradle', '.maven', 'vendor', 'packages'
                    ];
                    if (!skipDirs.includes(entry.name) && !entry.name.startsWith('.')) {
                        await this.scanForLanguages(fullPath, languageFiles, fileExtensions, depth + 1);
                    }
                } else if (entry.isFile()) {
                    const extension = path.extname(entry.name).toLowerCase();
                    const language = this.detectLanguageFromExtension(extension);
                    
                    // Track file extensions
                    if (extension) {
                        fileExtensions.set(extension, (fileExtensions.get(extension) || 0) + 1);
                    }
                    
                    if (language && language !== 'UNKNOWN') {
                        if (!languageFiles.has(language)) {
                            languageFiles.set(language, []);
                        }
                        // Limit files tracked per language for performance
                        if (languageFiles.get(language).length < 50) {
                            languageFiles.get(language).push(entry.name);
                        }
                    }
                }
            }
        } catch (error) {
            // Skip inaccessible directories
        }
    }

    /**
     * Detect language from file extension
     */
    detectLanguageFromExtension(extension) {
        const extensionMap = {
            '.py': 'PYTHON',
            '.js': 'JAVASCRIPT',
            '.ts': 'TYPESCRIPT',
            '.jsx': 'JAVASCRIPT',
            '.tsx': 'TYPESCRIPT',
            '.java': 'JAVA',
            '.cs': 'CSHARP',
            '.cpp': 'CPP',
            '.cc': 'CPP',
            '.cxx': 'CPP',
            '.c': 'C',
            '.h': 'C',
            '.hpp': 'CPP',
            '.r': 'R',
            '.R': 'R',
            '.m': 'MATLAB',
            '.sql': 'SQL',
            '.php': 'PHP',
            '.go': 'GO',
            '.scala': 'SCALA',
            '.jl': 'JULIA',
            '.rb': 'RUBY',
            '.swift': 'SWIFT',
            '.kt': 'KOTLIN',
            '.dart': 'DART',
            '.html': 'HTML',
            '.css': 'CSS',
            '.scss': 'SCSS',
            '.sass': 'SASS',
            '.sh': 'SHELL',
            '.bash': 'SHELL',
            '.ps1': 'POWERSHELL'
        };
        
        return extensionMap[extension] || 'UNKNOWN';
    }

    /**
     * Analyze language interactions
     */
    async analyzeInteractions(workspacePath, languageAnalysis) {
        const interactions = {
            patterns: [],
            integrationPoints: [],
            dataFormats: new Set(),
            complexityScore: 0
        };
        
        // Scan code files for interaction patterns
        for (const language of languageAnalysis.languages) {
            const files = languageAnalysis.distribution[language].files;
            for (const fileName of files.slice(0, 3)) { // Sample 3 files per language
                await this.analyzeFileInteractions(workspacePath, fileName, language, interactions);
            }
        }
        
        // Convert data formats set to array
        interactions.dataFormats = Array.from(interactions.dataFormats);
        
        // Calculate complexity score
        interactions.complexityScore = this.calculateInteractionComplexity(interactions);
        
        return interactions;
    }

    /**
     * Analyze individual file for interactions
     */
    async analyzeFileInteractions(workspacePath, fileName, language, interactions) {
        try {
            // Find the file in the workspace
            const filePath = await this.findFile(workspacePath, fileName);
            if (!filePath) return;
            
            const content = await fs.readFile(filePath, 'utf-8');
            
            // Check for interaction patterns
            for (const [patternName, pattern] of Object.entries(this.interactionPatterns)) {
                for (const indicator of pattern.indicators) {
                    const matches = content.match(indicator);
                    if (matches && matches.length > 0) {
                        const existingPattern = interactions.patterns.find(p => p.name === patternName);
                        if (existingPattern) {
                            existingPattern.occurrences += matches.length;
                            existingPattern.files.add(fileName);
                        } else {
                            interactions.patterns.push({
                                name: patternName,
                                type: pattern.type,
                                complexity: pattern.complexity,
                                occurrences: matches.length,
                                files: new Set([fileName]),
                                language
                            });
                        }
                    }
                }
            }
            
            // Detect data exchange formats
            if (content.includes('json') || content.includes('JSON')) {
                interactions.dataFormats.add('JSON');
            }
            if (content.includes('csv') || content.includes('CSV')) {
                interactions.dataFormats.add('CSV');
            }
            if (content.includes('xml') || content.includes('XML')) {
                interactions.dataFormats.add('XML');
            }
            if (content.includes('yaml') || content.includes('YAML')) {
                interactions.dataFormats.add('YAML');
            }
            
        } catch (error) {
            // Skip files that can't be read
        }
    }

    /**
     * Find file in workspace
     */
    async findFile(workspacePath, fileName) {
        async function searchDirectory(dir) {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    
                    if (entry.isFile() && entry.name === fileName) {
                        return fullPath;
                    } else if (entry.isDirectory()) {
                        const skipDirs = ['node_modules', '.git', '__pycache__'];
                        if (!skipDirs.includes(entry.name)) {
                            const found = await searchDirectory(fullPath);
                            if (found) return found;
                        }
                    }
                }
            } catch (error) {
                // Skip inaccessible directories
            }
            return null;
        }
        
        return await searchDirectory(workspacePath);
    }

    /**
     * Calculate interaction complexity
     */
    calculateInteractionComplexity(interactions) {
        let score = 0;
        
        for (const pattern of interactions.patterns) {
            const complexityWeight = {
                'Low': 1,
                'Medium': 3,
                'High': 5
            };
            
            score += (complexityWeight[pattern.complexity] || 1) * pattern.occurrences;
        }
        
        return Math.min(100, score);
    }

    /**
     * Assess integration quality
     */
    assessIntegrationQuality(languageAnalysis, interactionAnalysis) {
        let score = 50; // Base score
        let rating = 'Fair';
        
        const languageCount = languageAnalysis.languages.length;
        
        // Single language bonus
        if (languageCount === 1) {
            score += 30;
            rating = 'Excellent';
        }
        // Good diversity bonus
        else if (languageCount <= 3) {
            score += 20;
            rating = 'Good';
        }
        // Moderate diversity
        else if (languageCount <= 5) {
            score += 10;
        }
        // Too many languages penalty
        else if (languageCount > 8) {
            score -= 20;
            rating = 'Poor';
        }
        
        // Language affinity bonus
        const affinityScore = this.calculateLanguageAffinity(languageAnalysis.languages);
        score += (affinityScore - 50) * 0.4;
        
        // Clean integration patterns bonus
        const cleanPatterns = interactionAnalysis.patterns.filter(p => p.complexity === 'Low').length;
        const totalPatterns = interactionAnalysis.patterns.length;
        
        if (totalPatterns > 0) {
            const cleanRatio = cleanPatterns / totalPatterns;
            score += cleanRatio * 15;
        }
        
        // Data format standardization bonus
        if (interactionAnalysis.dataFormats.includes('JSON')) score += 10;
        if (interactionAnalysis.dataFormats.length <= 2) score += 5; // Few formats is good
        
        return {
            score: Math.min(100, Math.max(0, Math.round(score))),
            rating: this.determineQualityRating(score),
            affinityScore
        };
    }

    /**
     * Calculate language affinity score
     */
    calculateLanguageAffinity(languages) {
        if (languages.length <= 1) return 90; // Single language = excellent affinity
        
        let totalAffinity = 0;
        let pairCount = 0;
        
        for (let i = 0; i < languages.length; i++) {
            for (let j = i + 1; j < languages.length; j++) {
                const lang1 = languages[i];
                const lang2 = languages[j];
                
                const affinity = this.languageAffinity[lang1]?.[lang2] || 
                               this.languageAffinity[lang2]?.[lang1] || 
                               0.5; // Default neutral affinity
                
                totalAffinity += affinity;
                pairCount++;
            }
        }
        
        const avgAffinity = pairCount > 0 ? totalAffinity / pairCount : 0.5;
        return Math.round(avgAffinity * 100);
    }

    /**
     * Determine quality rating from score
     */
    determineQualityRating(score) {
        if (score >= 85) return 'Excellent';
        if (score >= 70) return 'Good';
        if (score >= 55) return 'Fair';
        return 'Poor';
    }

    /**
     * Assess maintenance complexity
     */
    assessMaintenanceComplexity(languageAnalysis, interactionAnalysis) {
        const factors = [];
        let complexity = 'Low';
        
        // Language count factor
        const langCount = languageAnalysis.languages.length;
        if (langCount > 5) {
            factors.push('High language diversity increases team expertise requirements');
            complexity = 'High';
        } else if (langCount > 3) {
            factors.push('Moderate language diversity requires cross-language expertise');
            complexity = 'Medium';
        }
        
        // Interaction complexity factor
        const highComplexityPatterns = interactionAnalysis.patterns.filter(p => p.complexity === 'High').length;
        if (highComplexityPatterns > 0) {
            factors.push('Complex integration patterns require specialized knowledge');
            complexity = complexity === 'Low' ? 'Medium' : 'High';
        }
        
        // Data format diversity
        if (interactionAnalysis.dataFormats.length > 3) {
            factors.push('Multiple data formats increase integration complexity');
            complexity = complexity === 'Low' ? 'Medium' : complexity;
        }
        
        // Team requirements assessment
        const teamRequirements = this.assessTeamRequirements(languageAnalysis, complexity);
        
        return {
            level: complexity,
            factors,
            teamRequirements
        };
    }

    /**
     * Assess team requirements
     */
    assessTeamRequirements(languageAnalysis, complexity) {
        const requirements = {
            minTeamSize: 1,
            skillsets: [],
            specialistNeeded: false
        };
        
        const langCount = languageAnalysis.languages.length;
        
        if (langCount <= 2) {
            requirements.minTeamSize = 1;
            requirements.skillsets = languageAnalysis.languages;
        } else if (langCount <= 4) {
            requirements.minTeamSize = 2;
            requirements.skillsets = languageAnalysis.languages;
        } else {
            requirements.minTeamSize = 3;
            requirements.skillsets = languageAnalysis.languages;
            requirements.specialistNeeded = true;
        }
        
        if (complexity === 'High') {
            requirements.specialistNeeded = true;
            requirements.skillsets.push('Integration Architecture');
        }
        
        return requirements;
    }

    /**
     * Identify integration issues
     */
    identifyIntegrationIssues(languageAnalysis, interactionAnalysis) {
        const issues = [];
        
        // Too many languages
        if (languageAnalysis.languages.length > 6) {
            issues.push({
                type: 'complexity',
                severity: 'high',
                issue: 'Excessive language diversity',
                impact: 'High maintenance burden and team coordination challenges'
            });
        }
        
        // Complex interaction patterns
        const complexPatterns = interactionAnalysis.patterns.filter(p => p.complexity === 'High');
        if (complexPatterns.length > 0) {
            issues.push({
                type: 'integration',
                severity: 'medium',
                issue: 'Complex inter-language communication patterns',
                impact: 'Increased debugging difficulty and system fragility'
            });
        }
        
        // Missing standard data formats
        if (interactionAnalysis.dataFormats.length > 0 && !interactionAnalysis.dataFormats.includes('JSON')) {
            issues.push({
                type: 'standardization',
                severity: 'low',
                issue: 'No JSON data exchange detected',
                impact: 'Missing modern data interchange standards'
            });
        }
        
        // Unknown languages
        if (languageAnalysis.unknown && languageAnalysis.unknown.length > 0) {
            issues.push({
                type: 'unknown',
                severity: 'medium',
                issue: `Unknown file types detected: ${languageAnalysis.unknown.join(', ')}`,
                impact: 'Requires manual analysis of unknown technologies'
            });
        }
        
        return issues;
    }

    /**
     * Generate recommendations
     */
    generateRecommendations(languageAnalysis, interactionAnalysis, integrationQuality) {
        const recommendations = [];
        
        // Language consolidation
        if (languageAnalysis.languages.length > 5) {
            recommendations.push({
                priority: 'high',
                title: 'Consider Language Consolidation',
                description: 'Evaluate opportunities to reduce language diversity',
                impact: 'Reduced maintenance complexity and team coordination overhead'
            });
        }
        
        // Integration standardization
        const complexPatterns = interactionAnalysis.patterns.filter(p => p.complexity === 'High').length;
        if (complexPatterns > 0) {
            recommendations.push({
                priority: 'medium',
                title: 'Standardize Integration Patterns',
                description: 'Implement consistent communication protocols',
                impact: 'Improved system reliability and maintainability'
            });
        }
        
        // Data format standardization
        if (interactionAnalysis.dataFormats.length > 3) {
            recommendations.push({
                priority: 'medium',
                title: 'Standardize Data Exchange Formats',
                description: 'Adopt consistent data formats (e.g., JSON) across integrations',
                impact: 'Simplified data processing and reduced conversion overhead'
            });
        }
        
        // Team development
        if (languageAnalysis.languages.length > 3) {
            recommendations.push({
                priority: 'low',
                title: 'Develop Cross-Language Expertise',
                description: 'Train team members in multiple languages used in the project',
                impact: 'Improved team flexibility and knowledge distribution'
            });
        }
        
        return recommendations;
    }

    /**
     * Generate key findings
     */
    generateKeyFindings(languageAnalysis, interactionAnalysis, integrationQuality) {
        const findings = [];
        
        findings.push(`${languageAnalysis.languages.length} programming languages detected in project`);
        findings.push(`Primary language: ${languageAnalysis.primary} (${languageAnalysis.distribution[languageAnalysis.primary]?.percentage}%)`);
        
        if (languageAnalysis.secondary.length > 0) {
            findings.push(`Secondary languages: ${languageAnalysis.secondary.join(', ')}`);
        }
        
        findings.push(`Integration quality assessed as ${integrationQuality.rating} (${integrationQuality.score}%)`);
        
        if (interactionAnalysis.patterns.length > 0) {
            findings.push(`${interactionAnalysis.patterns.length} inter-language communication patterns identified`);
        }
        
        if (interactionAnalysis.dataFormats.length > 0) {
            findings.push(`Data exchange formats: ${interactionAnalysis.dataFormats.join(', ')}`);
        }
        
        return findings;
    }

    /**
     * Generate insights
     */
    generateInsights(languageAnalysis, interactionAnalysis, maintenanceComplexity) {
        const insights = [];
        
        // Language diversity insights
        if (languageAnalysis.languages.length === 1) {
            insights.push('Single-language project ensures excellent maintainability and team efficiency');
        } else if (languageAnalysis.languages.length <= 3) {
            insights.push('Moderate language diversity balances functionality with maintainability');
        } else {
            insights.push('High language diversity requires careful team coordination and expertise management');
        }
        
        // Integration pattern insights
        const cleanPatterns = interactionAnalysis.patterns.filter(p => p.complexity === 'Low').length;
        const totalPatterns = interactionAnalysis.patterns.length;
        
        if (totalPatterns > 0) {
            const cleanRatio = cleanPatterns / totalPatterns;
            if (cleanRatio >= 0.7) {
                insights.push('Clean integration patterns support system reliability and debugging');
            } else {
                insights.push('Complex integration patterns may require additional monitoring and error handling');
            }
        }
        
        // Data format insights
        if (interactionAnalysis.dataFormats.includes('JSON')) {
            insights.push('JSON data exchange indicates modern integration practices');
        }
        
        // Maintenance insights
        if (maintenanceComplexity.level === 'Low') {
            insights.push('Low maintenance complexity enables rapid development and deployment');
        } else if (maintenanceComplexity.level === 'High') {
            insights.push('High maintenance complexity requires investment in tooling and documentation');
        }
        
        return insights;
    }
}
