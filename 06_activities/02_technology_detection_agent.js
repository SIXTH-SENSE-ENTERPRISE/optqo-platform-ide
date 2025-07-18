/**
 * Technology Detection Agent
 * Role: Technology Stack Specialist & Platform Expert
 * Identifies and catalogs all technologies, frameworks, and platforms in the codebase
 */

import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';

export class TechnologyDetectionAgent extends EventEmitter {
    constructor(config = {}) {
        super();
        this.config = config;
        
        // Specialized knowledge base for analytical platforms
        this.technologySignatures = {
            // Primary Analytical Platforms
            'MATLAB': {
                extensions: ['.m', '.mlx', '.mat', '.slx'],
                patterns: [/function.*=.*\(/g, /clear all/g, /%.*comment/g],
                icon: '📊',
                businessContext: 'Scientific Computing'
            },
            'PYTHON': {
                extensions: ['.py', '.pyx', '.ipynb'],
                patterns: [/import pandas/g, /import numpy/g, /def.*:/g, /if __name__/g],
                icon: '🐍',
                businessContext: 'Data Science'
            },
            'R': {
                extensions: ['.r', '.R', '.rmd', '.Rmd'],
                patterns: [/library\(/g, /<-/g, /data\.frame/g],
                icon: '📈',
                businessContext: 'Statistical Analysis'
            },
            'JULIA': {
                extensions: ['.jl'],
                patterns: [/using /g, /function.*end/g, /::.*=/g],
                icon: '⚡',
                businessContext: 'High-Performance Computing'
            },
            'SAS': {
                extensions: ['.sas', '.sas7bdat'],
                patterns: [/data.*set/g, /proc.*run/g, /%macro/g],
                icon: '📋',
                businessContext: 'Enterprise Analytics'
            },
            'SPSS': {
                extensions: ['.sps', '.spv', '.sav'],
                patterns: [/COMPUTE/g, /FREQUENCIES/g, /REGRESSION/g],
                icon: '📊',
                businessContext: 'Statistical Analysis'
            },
            'SQL': {
                extensions: ['.sql', '.ddl', '.dml'],
                patterns: [/SELECT.*FROM/g, /CREATE TABLE/g, /INSERT INTO/g],
                icon: '🗄️',
                businessContext: 'Data Management'
            },
            
            // Secondary Languages
            'JAVASCRIPT': {
                extensions: ['.js', '.mjs', '.ts', '.jsx', '.tsx'],
                patterns: [/function.*\{/g, /const.*=/g, /import.*from/g],
                icon: '⚡',
                businessContext: 'Web Development'
            },
            'JAVA': {
                extensions: ['.java', '.class', '.jar'],
                patterns: [/public class/g, /import java/g, /public static void main/g],
                icon: '☕',
                businessContext: 'Enterprise Applications'
            },
            'C_CPP': {
                extensions: ['.c', '.cpp', '.cc', '.cxx', '.h', '.hpp'],
                patterns: [/#include/g, /int main/g, /void.*\(/g],
                icon: '⚙️',
                businessContext: 'System Programming'
            },
            'CSHARP': {
                extensions: ['.cs', '.csx'],
                patterns: [/using System/g, /namespace/g, /public class/g],
                icon: '🔷',
                businessContext: 'Enterprise Development'
            },
            'GO': {
                extensions: ['.go'],
                patterns: [/package main/g, /func main/g, /import/g],
                icon: '🚀',
                businessContext: 'Cloud Services'
            },
            'SCALA': {
                extensions: ['.scala', '.sc'],
                patterns: [/object.*extends/g, /def.*=/g, /import scala/g],
                icon: '🎯',
                businessContext: 'Big Data Processing'
            },
            'PHP': {
                extensions: ['.php', '.phtml'],
                patterns: [/<\?php/g, /function.*\(/g, /\$.*=/g],
                icon: '🌐',
                businessContext: 'Web Development'
            },
            'SHELL': {
                extensions: ['.sh', '.bash', '.zsh', '.fish'],
                patterns: [/#!/g, /echo/g, /if.*then/g],
                icon: '💻',
                businessContext: 'System Administration'
            },
            'POWERSHELL': {
                extensions: ['.ps1', '.psm1'],
                patterns: [/Get-/g, /Set-/g, /\$.*=/g],
                icon: '🔵',
                businessContext: 'Windows Administration'
            },
            'VBA': {
                extensions: ['.vba', '.bas', '.cls'],
                patterns: [/Sub.*\(/g, /Function.*\(/g, /Dim.*As/g],
                icon: '📝',
                businessContext: 'Office Automation'
            },
            
            // Configuration and Data
            'JSON': {
                extensions: ['.json', '.jsonl'],
                patterns: [/\{.*".*":/g],
                icon: '📋',
                businessContext: 'Configuration'
            },
            'XML': {
                extensions: ['.xml', '.xsd', '.xsl'],
                patterns: [/<\?xml/g, /<.*>/g],
                icon: '📄',
                businessContext: 'Data Exchange'
            },
            'YAML': {
                extensions: ['.yml', '.yaml'],
                patterns: [/.*:.*\n/g, /---/g],
                icon: '⚙️',
                businessContext: 'Configuration'
            },
            'MARKDOWN': {
                extensions: ['.md', '.markdown'],
                patterns: [/^#.*$/g, /\[.*\]\(.*\)/g],
                icon: '📝',
                businessContext: 'Documentation'
            },
            'LATEX': {
                extensions: ['.tex', '.latex'],
                patterns: [/\\documentclass/g, /\\begin\{/g, /\\end\{/g],
                icon: '📖',
                businessContext: 'Academic Publishing'
            }
        };
        
        this.frameworkPatterns = {
            // Data Science Frameworks
            'pandas': /import pandas|from pandas/g,
            'numpy': /import numpy|from numpy/g,
            'scikit-learn': /from sklearn|import sklearn/g,
            'tensorflow': /import tensorflow|from tensorflow/g,
            'pytorch': /import torch|from torch/g,
            'matplotlib': /import matplotlib|from matplotlib/g,
            'seaborn': /import seaborn/g,
            'plotly': /import plotly/g,
            
            // Web Frameworks
            'flask': /from flask|import flask/g,
            'django': /from django|import django/g,
            'fastapi': /from fastapi|import fastapi/g,
            'express': /require\(.*express|import.*express/g,
            'react': /import.*react|from.*react/g,
            'vue': /import.*vue|from.*vue/g,
            'angular': /@angular|import.*angular/g,
            
            // Data Processing
            'spark': /from pyspark|import pyspark/g,
            'dask': /import dask|from dask/g,
            'airflow': /from airflow|import airflow/g,
            
            // Database
            'sqlalchemy': /from sqlalchemy|import sqlalchemy/g,
            'mongodb': /import pymongo|from pymongo/g,
            'redis': /import redis/g
        };
    }

    /**
     * Main analysis method
     */
    async analyze(workspacePath, options = {}) {
        console.log('🔍 Technology Detection Agent analyzing...');
        
        try {
            const files = await this.scanWorkspace(workspacePath);
            const languageDistribution = await this.analyzeLanguageDistribution(files);
            const frameworks = await this.detectFrameworks(files);
            const projectType = this.determineProjectType(languageDistribution, frameworks);
            const technologyStack = this.buildTechnologyStack(languageDistribution, frameworks);
            
            const result = {
                // Core Technology Data
                primaryPlatform: this.identifyPrimaryPlatform(languageDistribution),
                secondaryLanguages: this.identifySecondaryLanguages(languageDistribution),
                frameworks,
                projectType,
                technologyStack,
                languageDistribution,
                languageCount: Object.keys(languageDistribution).length,
                
                // Scoring
                technologyStackScore: this.calculateTechnologyScore(languageDistribution, frameworks),
                integrationQuality: this.assessIntegrationQuality(languageDistribution),
                
                // Business Context
                businessContext: this.identifyBusinessContext(languageDistribution, frameworks),
                
                // Additional Insights
                keyFindings: this.generateKeyFindings(languageDistribution, frameworks),
                insights: this.generateInsights(languageDistribution, frameworks, projectType),
                
                // Metadata
                totalFilesScanned: files.length,
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
     * Scan workspace for all files
     */
    async scanWorkspace(workspacePath) {
        const files = [];
        
        async function scanDirectory(dir) {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    
                    // Skip common directories to ignore
                    if (entry.isDirectory()) {
                        const skipDirs = ['node_modules', '.git', '__pycache__', '.vscode', 'venv', 'env'];
                        if (!skipDirs.includes(entry.name)) {
                            await scanDirectory(fullPath);
                        }
                    } else if (entry.isFile()) {
                        files.push({
                            path: fullPath,
                            name: entry.name,
                            extension: path.extname(entry.name).toLowerCase(),
                            size: (await fs.stat(fullPath)).size
                        });
                    }
                }
            } catch (error) {
                // Silently skip inaccessible directories
            }
        }
        
        await scanDirectory(workspacePath);
        return files;
    }

    /**
     * Analyze language distribution
     */
    async analyzeLanguageDistribution(files) {
        const distribution = {};
        const languageFiles = {};
        
        for (const file of files) {
            const language = this.identifyLanguage(file);
            if (language && language !== 'UNKNOWN') {
                if (!distribution[language]) {
                    distribution[language] = 0;
                    languageFiles[language] = [];
                }
                distribution[language]++;
                languageFiles[language].push(file.name);
            }
        }
        
        // Calculate percentages
        const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
        const percentages = {};
        
        for (const [language, count] of Object.entries(distribution)) {
            percentages[language] = Math.round((count / total) * 100);
        }
        
        return {
            counts: distribution,
            percentages,
            files: languageFiles,
            total
        };
    }

    /**
     * Identify language from file
     */
    identifyLanguage(file) {
        for (const [language, signature] of Object.entries(this.technologySignatures)) {
            if (signature.extensions.includes(file.extension)) {
                return language;
            }
        }
        
        // Handle special cases
        if (file.name.toLowerCase().includes('makefile')) return 'MAKEFILE';
        if (file.name.toLowerCase().includes('dockerfile')) return 'DOCKER';
        if (file.extension === '.env') return 'CONFIG';
        
        return 'UNKNOWN';
    }

    /**
     * Detect frameworks and libraries
     */
    async detectFrameworks(files) {
        const detectedFrameworks = new Set();
        
        // Check specific configuration files
        for (const file of files) {
            if (file.name === 'package.json') {
                const frameworks = await this.analyzePackageJson(file.path);
                frameworks.forEach(f => detectedFrameworks.add(f));
            } else if (file.name === 'requirements.txt') {
                const frameworks = await this.analyzeRequirementsTxt(file.path);
                frameworks.forEach(f => detectedFrameworks.add(f));
            } else if (file.name === 'pom.xml') {
                detectedFrameworks.add('Maven');
            } else if (file.name === 'build.gradle') {
                detectedFrameworks.add('Gradle');
            }
        }
        
        // Check source code patterns
        const codeFiles = files.filter(f => ['.py', '.js', '.ts', '.java', '.cs'].includes(f.extension));
        for (const file of codeFiles.slice(0, 20)) { // Sample first 20 files for performance
            try {
                const content = await fs.readFile(file.path, 'utf-8');
                for (const [framework, pattern] of Object.entries(this.frameworkPatterns)) {
                    if (pattern.test(content)) {
                        detectedFrameworks.add(framework);
                    }
                }
            } catch (error) {
                // Skip files that can't be read
            }
        }
        
        return Array.from(detectedFrameworks);
    }

    /**
     * Analyze package.json for JavaScript frameworks
     */
    async analyzePackageJson(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const packageData = JSON.parse(content);
            const frameworks = [];
            
            const allDeps = {
                ...packageData.dependencies,
                ...packageData.devDependencies
            };
            
            const frameworkMap = {
                'react': 'React',
                'vue': 'Vue.js',
                'angular': 'Angular',
                'express': 'Express.js',
                'next': 'Next.js',
                'nuxt': 'Nuxt.js',
                'svelte': 'Svelte',
                'electron': 'Electron'
            };
            
            for (const [dep, framework] of Object.entries(frameworkMap)) {
                if (allDeps[dep]) {
                    frameworks.push(framework);
                }
            }
            
            return frameworks;
        } catch (error) {
            return [];
        }
    }

    /**
     * Analyze requirements.txt for Python frameworks
     */
    async analyzeRequirementsTxt(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const frameworks = [];
            
            const frameworkMap = {
                'django': 'Django',
                'flask': 'Flask',
                'fastapi': 'FastAPI',
                'pandas': 'Pandas',
                'numpy': 'NumPy',
                'tensorflow': 'TensorFlow',
                'torch': 'PyTorch',
                'scikit-learn': 'Scikit-learn',
                'matplotlib': 'Matplotlib',
                'plotly': 'Plotly',
                'streamlit': 'Streamlit',
                'jupyter': 'Jupyter'
            };
            
            for (const [packageName, framework] of Object.entries(frameworkMap)) {
                if (content.toLowerCase().includes(packageName)) {
                    frameworks.push(framework);
                }
            }
            
            return frameworks;
        } catch (error) {
            return [];
        }
    }

    /**
     * Determine project type based on analysis
     */
    determineProjectType(languageDistribution, frameworks) {
        const languages = Object.keys(languageDistribution.counts);
        const hasFramework = (name) => frameworks.some(f => f.toLowerCase().includes(name.toLowerCase()));
        
        // Data Science Projects
        if (languages.includes('PYTHON') && (hasFramework('pandas') || hasFramework('numpy') || hasFramework('jupyter'))) {
            return 'Data Science Pipeline';
        }
        
        if (languages.includes('R') || languages.includes('MATLAB')) {
            return 'Statistical Analysis Platform';
        }
        
        if (languages.includes('JULIA')) {
            return 'High-Performance Computing';
        }
        
        if (languages.includes('SAS') || languages.includes('SPSS')) {
            return 'Enterprise Analytics Platform';
        }
        
        // Web Applications
        if (hasFramework('react') || hasFramework('vue') || hasFramework('angular')) {
            return 'Web Application';
        }
        
        if (hasFramework('express') || hasFramework('flask') || hasFramework('django')) {
            return 'Web API/Backend Service';
        }
        
        // Desktop Applications
        if (hasFramework('electron') || languages.includes('CSHARP') || languages.includes('JAVA')) {
            return 'Desktop Application';
        }
        
        // Mobile Applications
        if (hasFramework('react native') || hasFramework('flutter')) {
            return 'Mobile Application';
        }
        
        // Default categorization
        if (languages.includes('SQL')) {
            return 'Database Application';
        }
        
        if (languages.includes('SHELL') || languages.includes('POWERSHELL')) {
            return 'System Administration';
        }
        
        return 'Multi-Purpose Software Project';
    }

    /**
     * Build technology stack with icons
     */
    buildTechnologyStack(languageDistribution, frameworks) {
        const stack = [];
        
        // Add languages
        for (const language of Object.keys(languageDistribution.counts)) {
            const signature = this.technologySignatures[language];
            if (signature) {
                stack.push({
                    name: language,
                    icon: signature.icon,
                    type: 'language',
                    percentage: languageDistribution.percentages[language]
                });
            }
        }
        
        // Add frameworks
        for (const framework of frameworks) {
            stack.push({
                name: framework,
                icon: this.getFrameworkIcon(framework),
                type: 'framework'
            });
        }
        
        return stack;
    }

    /**
     * Get framework icon
     */
    getFrameworkIcon(framework) {
        const iconMap = {
            'React': '⚛️',
            'Vue.js': '💚',
            'Angular': '🔺',
            'Django': '🎸',
            'Flask': '🌶️',
            'FastAPI': '🚀',
            'Express.js': '📦',
            'TensorFlow': '🧠',
            'PyTorch': '🔥',
            'Pandas': '🐼',
            'NumPy': '🔢',
            'Matplotlib': '📊',
            'Jupyter': '📓',
            'Electron': '⚡'
        };
        
        return iconMap[framework] || '🔧';
    }

    /**
     * Identify primary platform
     */
    identifyPrimaryPlatform(languageDistribution) {
        const counts = languageDistribution.counts;
        if (Object.keys(counts).length === 0) return 'Unknown';
        
        return Object.entries(counts)
            .sort(([,a], [,b]) => b - a)[0][0];
    }

    /**
     * Identify secondary languages
     */
    identifySecondaryLanguages(languageDistribution) {
        const sorted = Object.entries(languageDistribution.counts)
            .sort(([,a], [,b]) => b - a)
            .slice(1, 4) // Top 3 secondary languages
            .map(([lang,]) => lang);
        
        return sorted;
    }

    /**
     * Calculate technology score
     */
    calculateTechnologyScore(languageDistribution, frameworks) {
        let score = 50; // Base score
        
        // Modern languages bonus
        const modernLanguages = ['PYTHON', 'JAVASCRIPT', 'TYPESCRIPT', 'GO', 'JULIA'];
        const hasModernLang = Object.keys(languageDistribution.counts)
            .some(lang => modernLanguages.includes(lang));
        
        if (hasModernLang) score += 20;
        
        // Framework usage bonus
        if (frameworks.length > 0) score += 15;
        if (frameworks.length > 3) score += 10;
        
        // Language diversity consideration
        const langCount = Object.keys(languageDistribution.counts).length;
        if (langCount === 1) score += 10; // Single language simplicity
        if (langCount >= 2 && langCount <= 4) score += 15; // Good diversity
        if (langCount > 6) score -= 10; // Too complex
        
        return Math.min(100, Math.max(0, score));
    }

    /**
     * Assess integration quality
     */
    assessIntegrationQuality(languageDistribution) {
        const langCount = Object.keys(languageDistribution.counts).length;
        
        if (langCount === 1) return 95; // Single language - excellent integration
        if (langCount <= 3) return 85; // Few languages - good integration
        if (langCount <= 5) return 70; // Moderate languages - fair integration
        return 55; // Many languages - challenging integration
    }

    /**
     * Identify business context
     */
    identifyBusinessContext(languageDistribution, frameworks) {
        const languages = Object.keys(languageDistribution.counts);
        
        // Analytics/Data Science contexts
        if (languages.includes('PYTHON') && frameworks.some(f => ['Pandas', 'NumPy', 'TensorFlow', 'PyTorch'].includes(f))) {
            return 'Data Science & Analytics';
        }
        
        if (languages.includes('R') || languages.includes('MATLAB')) {
            return 'Statistical Research';
        }
        
        if (languages.includes('SAS') || languages.includes('SPSS')) {
            return 'Enterprise Analytics';
        }
        
        // Web Development contexts
        if (frameworks.some(f => ['React', 'Vue.js', 'Angular'].includes(f))) {
            return 'Web Application Development';
        }
        
        // Default contexts based on primary language
        const primary = this.identifyPrimaryPlatform(languageDistribution);
        const signature = this.technologySignatures[primary];
        
        return signature?.businessContext || 'General Software Development';
    }

    /**
     * Generate key findings
     */
    generateKeyFindings(languageDistribution, frameworks) {
        const findings = [];
        const primary = this.identifyPrimaryPlatform(languageDistribution);
        const langCount = Object.keys(languageDistribution.counts).length;
        
        findings.push(`Primary technology: ${primary} (${languageDistribution.percentages[primary]}% of codebase)`);
        
        if (frameworks.length > 0) {
            findings.push(`Modern frameworks detected: ${frameworks.slice(0, 3).join(', ')}`);
        }
        
        if (langCount > 1) {
            findings.push(`Multi-language project with ${langCount} different technologies`);
        }
        
        if (langCount > 5) {
            findings.push(`High language diversity may impact maintainability`);
        }
        
        return findings;
    }

    /**
     * Generate insights
     */
    generateInsights(languageDistribution, frameworks, projectType) {
        const insights = [];
        const languages = Object.keys(languageDistribution.counts);
        
        // Technology alignment insights
        if (languages.includes('PYTHON') && projectType.includes('Data Science')) {
            insights.push('Strong alignment between Python ecosystem and data science objectives');
        }
        
        if (frameworks.length >= 3) {
            insights.push('Rich framework ecosystem indicates mature development practices');
        }
        
        if (languages.includes('JAVASCRIPT') && languages.includes('PYTHON')) {
            insights.push('Full-stack architecture with Python backend and JavaScript frontend');
        }
        
        // Performance insights
        if (languages.includes('JULIA') || languages.includes('GO')) {
            insights.push('Performance-oriented language selection for computational efficiency');
        }
        
        // Maintainability insights
        const langCount = Object.keys(languageDistribution.counts).length;
        if (langCount <= 2) {
            insights.push('Simplified technology stack enhances team productivity and maintenance');
        }
        
        return insights;
    }
}
