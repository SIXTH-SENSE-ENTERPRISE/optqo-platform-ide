import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

/**
 * Analyze Activity - Independent code analysis module
 * 
 * Performs comprehensive code analysis based on the current context
 * and focus areas. Adapts behavior based on configuration.
 */
export default class AnalyzeActivity {
    constructor() {
        this.supportedExtensions = {
            // Web Technologies
            '.js': 'javascript',
            '.ts': 'typescript', 
            '.jsx': 'react',
            '.tsx': 'typescript-react',
            '.vue': 'vue',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.less': 'less',
            
            // Backend Languages
            '.py': 'python',
            '.java': 'java',
            '.cs': 'csharp',
            '.cpp': 'cpp',
            '.c': 'c',
            '.php': 'php',
            '.rb': 'ruby',
            '.go': 'go',
            '.rs': 'rust',
            '.scala': 'scala',
            '.kt': 'kotlin',
            '.swift': 'swift',
            '.m': 'objective-c',
            
            // Data & Analytics
            '.sas': 'sas',
            '.r': 'r',
            '.sql': 'sql',
            '.py': 'python', // Also used for data science
            '.ipynb': 'jupyter-notebook',
            '.m': 'matlab',
            '.jl': 'julia',
            
            // Configuration & Infrastructure
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.json': 'json',
            '.xml': 'xml',
            '.toml': 'toml',
            '.ini': 'ini',
            '.conf': 'config',
            '.tf': 'terraform',
            '.dockerfile': 'docker',
            
            // Shell & Scripts
            '.sh': 'shell',
            '.bat': 'batch',
            '.ps1': 'powershell',
            '.cmd': 'command',
            
            // Mobile
            '.dart': 'dart',
            '.kt': 'kotlin',
            '.swift': 'swift',
            
            // Functional Languages
            '.hs': 'haskell',
            '.clj': 'clojure',
            '.fs': 'fsharp',
            '.ml': 'ocaml',
            
            // Other
            '.pl': 'perl',
            '.lua': 'lua',
            '.vim': 'vimscript',
            '.ex': 'elixir',
            '.erl': 'erlang'
        };
    }

    /**
     * Execute analysis activity
     */
    async execute(inputPath, options = {}, context = {}) {
        console.log('🔍 Starting code analysis...');
        
        try {
            const analysisResult = {
                context: context.context || 'general',
                timestamp: new Date().toISOString(),
                inputPath: inputPath,
                options: options,
                summary: {},
                files: [],
                findings: [],
                recommendations: [],
                success: true
            };

            // Discover files in the project
            const files = await this.discoverFiles(inputPath);
            console.log(`📁 Discovered ${files.length} files`);

            // Analyze each file
            for (const filePath of files) {
                const fileAnalysis = await this.analyzeFile(filePath, context);
                analysisResult.files.push(fileAnalysis);
            }

            // Generate context-specific analysis
            const contextAnalysis = await this.performContextAnalysis(
                analysisResult.files, 
                context
            );
            
            analysisResult.findings = contextAnalysis.findings;
            analysisResult.recommendations = contextAnalysis.recommendations;
            analysisResult.summary = this.generateSummary(analysisResult);

            // Save results if output path specified
            if (options.output) {
                await this.saveResults(analysisResult, options.output);
            }

            return analysisResult;

        } catch (error) {
            console.error('❌ Analysis failed:', error.message);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Discover relevant files in the project
     */
    async discoverFiles(inputPath) {
        const patterns = [
            // Programming Languages
            '**/*.js', '**/*.ts', '**/*.jsx', '**/*.tsx', '**/*.vue',
            '**/*.py', '**/*.java', '**/*.cs', '**/*.cpp', '**/*.c',
            '**/*.php', '**/*.rb', '**/*.go', '**/*.rs', '**/*.scala',
            '**/*.kt', '**/*.swift', '**/*.m', '**/*.dart',
            
            // Data & Analytics
            '**/*.sas', '**/*.r', '**/*.sql', '**/*.ipynb', '**/*.jl',
            
            // Configuration & Infrastructure  
            '**/*.yaml', '**/*.yml', '**/*.json', '**/*.xml',
            '**/*.toml', '**/*.ini', '**/*.conf', '**/*.tf',
            '**/Dockerfile', '**/dockerfile',
            
            // Shell & Scripts
            '**/*.sh', '**/*.bat', '**/*.ps1', '**/*.cmd',
            
            // Web Technologies
            '**/*.html', '**/*.css', '**/*.scss', '**/*.less',
            
            // Functional & Other Languages
            '**/*.hs', '**/*.clj', '**/*.fs', '**/*.ml',
            '**/*.pl', '**/*.lua', '**/*.vim', '**/*.ex', '**/*.erl',
            
            // Project Files
            '**/package.json', '**/pom.xml', '**/build.gradle',
            '**/requirements.txt', '**/Gemfile', '**/go.mod',
            '**/Cargo.toml', '**/project.clj'
        ];

        const files = [];
        
        for (const pattern of patterns) {
            const matches = await glob(pattern, {
                cwd: inputPath,
                ignore: [
                    '**/node_modules/**',
                    '**/dist/**', 
                    '**/build/**',
                    '**/.git/**',
                    '**/coverage/**',
                    '**/target/**',
                    '**/bin/**',
                    '**/obj/**',
                    '**/__pycache__/**',
                    '**/venv/**',
                    '**/env/**',
                    '**/.venv/**'
                ]
            });
            
            files.push(...matches.map(file => path.join(inputPath, file)));
        }

        return [...new Set(files)]; // Remove duplicates
    }

    /**
     * Analyze individual file
     */
    async analyzeFile(filePath, context) {
        const stats = fs.statSync(filePath);
        const content = fs.readFileSync(filePath, 'utf8');
        const extension = path.extname(filePath);
        const language = this.supportedExtensions[extension] || 'unknown';

        const analysis = {
            path: filePath,
            filename: path.basename(filePath),
            language: language,
            size: stats.size,
            lines: content.split('\n').length,
            complexity: this.calculateComplexity(content, language),
            patterns: this.findPatterns(content, context),
            issues: this.identifyIssues(content, language, context),
            metrics: this.calculateMetrics(content, language)
        };

        return analysis;
    }

    /**
     * Calculate code complexity
     */
    calculateComplexity(content, language) {
        // Language-agnostic complexity calculation
        const complexityIndicators = {
            // Universal patterns (work across languages)
            conditionals: [
                /if\s*[\(\{]|IF\s+/gi,           // if statements (multiple syntaxes)
                /else\s*if|ELSE\s*IF|elif/gi,    // else if statements
                /switch\s*[\(\{]|CASE\s+/gi,     // switch/case statements
                /when\s+|WHEN\s+/gi              // when statements (Ruby, Scala, etc.)
            ],
            loops: [
                /while\s*[\(\{]|WHILE\s+/gi,     // while loops
                /for\s*[\(\{]|FOR\s+/gi,         // for loops
                /foreach|for\s+\w+\s+in/gi,      // foreach loops
                /do\s*\{|DO\s+/gi,               // do loops
                /loop\s*\{|LOOP/gi               // loop statements
            ],
            exception_handling: [
                /try\s*\{|TRY\s+/gi,             // try blocks
                /catch\s*[\(\{]|CATCH\s+/gi,     // catch blocks
                /except\s*[:]/gi,                // Python except
                /rescue\s+|RESCUE\s+/gi          // Ruby rescue
            ],
            logical_operators: [
                /&&|\|\||AND\s+|OR\s+/gi,        // logical operators
                /\sand\s|\sor\s/gi               // word-based logical operators
            ],
            branching: [
                /\?.*:|case\s+/gi,               // ternary and case
                /goto\s+|GOTO\s+/gi              // goto statements
            ]
        };

        let complexity = 1; // Base complexity
        
        // Count complexity indicators across all categories
        Object.values(complexityIndicators).forEach(patterns => {
            patterns.forEach(regex => {
                const matches = content.match(regex);
                if (matches) {
                    complexity += matches.length;
                }
            });
        });

        // Language-specific adjustments
        if (language === 'sas') {
            // SAS DATA steps and PROC steps add complexity
            const sasPatterns = [
                /data\s+\w+/gi,                  // DATA steps
                /proc\s+\w+/gi,                  // PROC steps
                /merge\s+/gi,                    // MERGE operations
                /by\s+\w+/gi                     // BY statements
            ];
            
            sasPatterns.forEach(regex => {
                const matches = content.match(regex);
                if (matches) {
                    complexity += matches.length;
                }
            });
        }

        if (language === 'sql') {
            // SQL JOIN complexity
            const sqlPatterns = [
                /join\s+\w+|JOIN\s+\w+/gi,       // JOIN operations
                /union\s+|UNION\s+/gi,           // UNION operations
                /subquery|exists\s*\(/gi         // Subqueries
            ];
            
            sqlPatterns.forEach(regex => {
                const matches = content.match(regex);
                if (matches) {
                    complexity += matches.length;
                }
            });
        }

        return {
            score: complexity,
            level: complexity < 10 ? 'low' : complexity < 20 ? 'medium' : 'high'
        };
    }

    /**
     * Find patterns based on context focus
     */
    findPatterns(content, context) {
        const patterns = [];
        const focusAreas = context.focus || [];
        
        // Always analyze business context regardless of specific focus
        patterns.push(...this.findBusinessContextPatterns(content));
        
        // Context-specific pattern detection
        if (focusAreas.includes('business-context-identification')) {
            patterns.push(...this.findDomainSpecificPatterns(content));
        }
        
        if (focusAreas.includes('data-driven-insights')) {
            patterns.push(...this.findDataInsightPatterns(content));
        }
        
        if (focusAreas.includes('performance-bottlenecks')) {
            patterns.push(...this.findPerformancePatterns(content));
        }

        return patterns;
    }

    /**
     * Find business context patterns (universal for all codebases)
     */
    findBusinessContextPatterns(content) {
        const patterns = [];
        
        const businessPatterns = [
            { pattern: /customer|client|user/gi, type: 'customer-entities' },
            { pattern: /order|transaction|payment/gi, type: 'transaction-logic' },
            { pattern: /product|service|item/gi, type: 'product-entities' },
            { pattern: /report|dashboard|analytics/gi, type: 'reporting-logic' },
            { pattern: /workflow|process|pipeline/gi, type: 'process-automation' },
            { pattern: /metric|kpi|measurement|score/gi, type: 'business-metrics' },
            { pattern: /validation|rule|constraint/gi, type: 'business-rules' },
            { pattern: /integration|api|webhook/gi, type: 'system-integration' }
        ];

        businessPatterns.forEach(({ pattern, type }) => {
            const matches = content.match(pattern);
            if (matches) {
                patterns.push({
                    type: type,
                    count: matches.length,
                    businessRelevance: 'high',
                    examples: matches.slice(0, 3) // First 3 examples
                });
            }
        });

        return patterns;
    }

    /**
     * Find domain-specific business patterns (language-agnostic)
     */
    findDomainSpecificPatterns(content) {
        const patterns = [];
        
        // Detect potential business domains across any language/technology
        const domainIndicators = [
            // Financial Services
            { pattern: /account|transaction|payment|billing|invoice|commission|fee|interest|loan|credit|debit|balance|portfolio|trade|settlement/gi, domain: 'financial-services' },
            
            // Healthcare
            { pattern: /patient|medical|health|diagnosis|treatment|prescription|doctor|nurse|hospital|clinic|appointment/gi, domain: 'healthcare' },
            
            // E-commerce/Retail
            { pattern: /product|inventory|stock|warehouse|order|cart|checkout|shipping|delivery|catalog|price|discount/gi, domain: 'e-commerce' },
            
            // Supply Chain/Logistics
            { pattern: /supplier|vendor|procurement|shipment|logistics|distribution|fulfillment|tracking|delivery/gi, domain: 'supply-chain' },
            
            // Human Resources
            { pattern: /employee|hr|payroll|salary|benefits|recruitment|hiring|performance|attendance|leave/gi, domain: 'human-resources' },
            
            // Education
            { pattern: /student|course|class|grade|enrollment|curriculum|teacher|instructor|lesson|assignment|exam/gi, domain: 'education' },
            
            // CRM/Sales
            { pattern: /customer|client|lead|prospect|opportunity|sales|pipeline|quota|territory|campaign|contact/gi, domain: 'crm-sales' },
            
            // Manufacturing
            { pattern: /production|manufacturing|assembly|quality|defect|batch|lot|machine|equipment|maintenance/gi, domain: 'manufacturing' },
            
            // Real Estate
            { pattern: /property|listing|rent|lease|tenant|landlord|mortgage|appraisal|inspection|closing/gi, domain: 'real-estate' },
            
            // Insurance
            { pattern: /policy|claim|premium|coverage|underwriting|risk|actuary|adjuster|beneficiary/gi, domain: 'insurance' },
            
            // Transportation
            { pattern: /vehicle|driver|route|trip|booking|reservation|schedule|fleet|dispatch|fuel/gi, domain: 'transportation' },
            
            // Energy/Utilities
            { pattern: /meter|consumption|billing|utility|grid|power|energy|gas|water|electric|usage/gi, domain: 'energy-utilities' },
            
            // Government/Public Sector
            { pattern: /citizen|permit|license|tax|compliance|regulation|audit|reporting|filing/gi, domain: 'government' },
            
            // Data Analytics/BI
            { pattern: /report|dashboard|analytics|metric|kpi|insight|visualization|data.*warehouse|etl|pipeline/gi, domain: 'data-analytics' },
            
            // Gaming/Entertainment
            { pattern: /player|game|level|score|achievement|tournament|match|rating|league/gi, domain: 'gaming' },
            
            // Social Media/Content
            { pattern: /user|post|comment|like|share|follow|feed|content|media|social/gi, domain: 'social-media' }
        ];

        domainIndicators.forEach(({ pattern, domain }) => {
            const matches = content.match(pattern);
            if (matches) {
                patterns.push({
                    type: 'domain-indicator',
                    domain: domain,
                    count: matches.length,
                    businessContext: 'domain-specific',
                    matchedTerms: [...new Set(matches.map(m => m.toLowerCase()))].slice(0, 5) // Top 5 unique terms
                });
            }
        });

        return patterns;
    }

    /**
     * Find data insight patterns
     */
    findDataInsightPatterns(content) {
        const patterns = [];
        
        const insightPatterns = [
            { pattern: /aggregate|sum|count|avg|average/gi, type: 'data-aggregation' },
            { pattern: /filter|where|select/gi, type: 'data-filtering' },
            { pattern: /sort|order|rank/gi, type: 'data-sorting' },
            { pattern: /join|merge|combine/gi, type: 'data-joining' },
            { pattern: /transform|convert|map/gi, type: 'data-transformation' },
            { pattern: /export|import|sync/gi, type: 'data-movement' }
        ];

        insightPatterns.forEach(({ pattern, type }) => {
            const matches = content.match(pattern);
            if (matches) {
                patterns.push({
                    type: type,
                    count: matches.length,
                    dataRelevance: 'high'
                });
            }
        });

        return patterns;
    }

    /**
     * Find performance patterns (for optimization context)
     */
    findPerformancePatterns(content) {
        const patterns = [];
        
        const performancePatterns = [
            { pattern: /for\s*\(.*for\s*\(/gs, type: 'nested-loops' },
            { pattern: /while\s*\(.*while\s*\(/gs, type: 'nested-while-loops' },
            { pattern: /\.indexOf\(/g, type: 'inefficient-search' },
            { pattern: /document\.getElementById/g, type: 'dom-queries' },
            { pattern: /JSON\.parse.*JSON\.stringify/g, type: 'unnecessary-serialization' }
        ];

        performancePatterns.forEach(({ pattern, type }) => {
            const matches = content.match(pattern);
            if (matches) {
                patterns.push({
                    type: type,
                    count: matches.length,
                    severity: 'medium'
                });
            }
        });

        return patterns;
    }

    /**
     * Find compliance patterns (for financial context)
     */
    findCompliancePatterns(content) {
        const patterns = [];
        
        const compliancePatterns = [
            { pattern: /audit.*trail/gi, type: 'audit-trail' },
            { pattern: /logging/gi, type: 'logging' },
            { pattern: /validation/gi, type: 'data-validation' },
            { pattern: /authorization|permission/gi, type: 'authorization' },
            { pattern: /encryption|decrypt/gi, type: 'encryption' }
        ];

        compliancePatterns.forEach(({ pattern, type }) => {
            const matches = content.match(pattern);
            if (matches) {
                patterns.push({
                    type: type,
                    count: matches.length,
                    compliance: 'present'
                });
            }
        });

        return patterns;
    }

    /**
     * Identify potential issues (language-agnostic)
     */
    identifyIssues(content, language, context) {
        const issues = [];
        
        // Universal issues (any language)
        const universalIssues = [
            { pattern: /TODO|FIXME|HACK|XXX/gi, type: 'todo-comments', severity: 'low' },
            { pattern: /deprecated|obsolete/gi, type: 'deprecated-code', severity: 'medium' },
            { pattern: /password|secret|key/gi, type: 'potential-secret', severity: 'high' },
            { pattern: /\.printStackTrace\(\)|console\.error|print.*error/gi, type: 'error-handling', severity: 'low' }
        ];

        universalIssues.forEach(({ pattern, type, severity }) => {
            if (content.match(pattern)) {
                issues.push({
                    type: type,
                    severity: severity,
                    description: `Contains ${type.replace('-', ' ')}`
                });
            }
        });

        // Language-specific security issues
        const securityPatterns = {
            javascript: [
                { pattern: /eval\s*\(/gi, issue: 'eval() usage - security risk' },
                { pattern: /innerHTML\s*=/gi, issue: 'innerHTML usage - XSS risk' },
                { pattern: /document\.write/gi, issue: 'document.write() - security risk' }
            ],
            python: [
                { pattern: /exec\s*\(/gi, issue: 'exec() usage - security risk' },
                { pattern: /pickle\.loads/gi, issue: 'pickle.loads() - security risk' },
                { pattern: /subprocess\.call.*shell=True/gi, issue: 'shell=True - command injection risk' }
            ],
            sql: [
                { pattern: /\+.*\+.*WHERE|concat.*WHERE/gi, issue: 'Potential SQL injection' },
                { pattern: /exec\s*\(/gi, issue: 'Dynamic SQL execution' }
            ],
            sas: [
                { pattern: /x\s+['"].*['"]/gi, issue: 'X command usage - security risk' },
                { pattern: /systask\s+command/gi, issue: 'SYSTASK command - security risk' }
            ],
            php: [
                { pattern: /eval\s*\(/gi, issue: 'eval() usage - security risk' },
                { pattern: /\$_GET|\$_POST.*without.*validation/gi, issue: 'Unvalidated user input' }
            ]
        };

        if (securityPatterns[language]) {
            securityPatterns[language].forEach(({ pattern, issue }) => {
                if (content.match(pattern)) {
                    issues.push({
                        type: 'security-risk',
                        severity: 'high',
                        description: issue
                    });
                }
            });
        }

        // Performance issues (language-agnostic)
        const performancePatterns = [
            { pattern: /for.*for.*for/gi, type: 'nested-loops', severity: 'medium' },
            { pattern: /while.*while/gi, type: 'nested-loops', severity: 'medium' },
            { pattern: /sleep\s*\(|delay\s*\(/gi, type: 'blocking-operations', severity: 'low' }
        ];

        performancePatterns.forEach(({ pattern, type, severity }) => {
            if (content.match(pattern)) {
                issues.push({
                    type: type,
                    severity: severity,
                    description: `Performance concern: ${type.replace('-', ' ')}`
                });
            }
        });

        return issues;
    }

    /**
     * Calculate code metrics
     */
    calculateMetrics(content, language) {
        const lines = content.split('\n');
        
        return {
            totalLines: lines.length,
            codeLines: lines.filter(line => line.trim() && !line.trim().startsWith('//')).length,
            commentLines: lines.filter(line => line.trim().startsWith('//')).length,
            blankLines: lines.filter(line => !line.trim()).length,
            functions: this.countFunctions(content, language),
            classes: this.countClasses(content, language)
        };
    }

    /**
     * Count functions in code (language-agnostic)
     */
    countFunctions(content, language) {
        const functionPatterns = {
            // JavaScript/TypeScript
            javascript: /function\s+\w+|const\s+\w+\s*=.*=>|\w+\s*\(/g,
            typescript: /function\s+\w+|const\s+\w+\s*=.*=>|\w+\s*\(/g,
            
            // Python
            python: /def\s+\w+/g,
            
            // Java/C#/Kotlin
            java: /(public|private|protected)?\s*(static)?\s*\w+\s+\w+\s*\(/g,
            csharp: /(public|private|protected)?\s*(static)?\s*\w+\s+\w+\s*\(/g,
            kotlin: /fun\s+\w+/g,
            
            // C/C++
            c: /\w+\s+\w+\s*\([^)]*\)\s*\{/g,
            cpp: /\w+\s+\w+\s*\([^)]*\)\s*\{/g,
            
            // Ruby
            ruby: /def\s+\w+/g,
            
            // Go
            go: /func\s+\w+/g,
            
            // Rust
            rust: /fn\s+\w+/g,
            
            // PHP
            php: /function\s+\w+/g,
            
            // Swift
            swift: /func\s+\w+/g,
            
            // SAS
            sas: /proc\s+\w+|data\s+\w+/gi,
            
            // SQL
            sql: /create\s+(procedure|function)\s+\w+|CREATE\s+(PROCEDURE|FUNCTION)\s+\w+/gi,
            
            // R
            r: /\w+\s*<-\s*function|\w+\s*=\s*function/g,
            
            // Scala
            scala: /def\s+\w+/g,
            
            // Shell
            shell: /function\s+\w+|\w+\s*\(\)\s*\{/g,
            
            // PowerShell
            powershell: /function\s+\w+/gi,
            
            // Default pattern for unknown languages
            default: /function\s+\w+|def\s+\w+|proc\s+\w+/gi
        };

        const pattern = functionPatterns[language] || functionPatterns.default;
        const matches = content.match(pattern);
        return matches ? matches.length : 0;
    }

    /**
     * Count classes in code (language-agnostic)
     */
    countClasses(content, language) {
        const classPatterns = {
            // Object-oriented languages
            javascript: /class\s+\w+/g,
            typescript: /class\s+\w+/g,
            python: /class\s+\w+/g,
            java: /(public|private)?\s*class\s+\w+/g,
            csharp: /(public|private)?\s*class\s+\w+/g,
            kotlin: /class\s+\w+/g,
            cpp: /class\s+\w+/g,
            ruby: /class\s+\w+/g,
            swift: /class\s+\w+/g,
            scala: /class\s+\w+/g,
            php: /class\s+\w+/g,
            
            // Languages with different concepts
            go: /type\s+\w+\s+struct/g,        // Go structs
            rust: /struct\s+\w+/g,             // Rust structs
            c: /struct\s+\w+/g,                // C structs
            
            // Default for unknown languages
            default: /class\s+\w+|struct\s+\w+|type\s+\w+/gi
        };

        const pattern = classPatterns[language] || classPatterns.default;
        const matches = content.match(pattern);
        return matches ? matches.length : 0;
    }

    /**
     * Perform context-specific analysis
     */
    async performContextAnalysis(files, context) {
        const findings = [];
        const recommendations = [];
        
        // Aggregate analysis based on context focus
        const totalComplexity = files.reduce((sum, file) => sum + file.complexity.score, 0);
        const averageComplexity = totalComplexity / files.length;
        
        if (averageComplexity > 15) {
            findings.push({
                type: 'high-complexity',
                severity: 'medium',
                description: `Average complexity (${averageComplexity.toFixed(1)}) exceeds recommended threshold`,
                affectedFiles: files.filter(f => f.complexity.score > 15).length
            });
            
            recommendations.push({
                type: 'refactoring',
                priority: 'medium',
                description: 'Consider breaking down complex functions into smaller, more manageable pieces'
            });
        }

        // Context-specific analysis
        if (context.context === 'financial-analyst') {
            findings.push(...this.analyzeFinancialPatterns(files));
            recommendations.push(...this.getFinancialRecommendations(files));
        }

        return { findings, recommendations };
    }

    /**
     * Analyze financial-specific patterns
     */
    analyzeFinancialPatterns(files) {
        const findings = [];
        
        const businessLogicFiles = files.filter(file => 
            file.patterns.some(p => p.type.includes('logic'))
        );
        
        if (businessLogicFiles.length > 0) {
            findings.push({
                type: 'business-logic-identified',
                severity: 'info',
                description: `Found business logic in ${businessLogicFiles.length} files`,
                files: businessLogicFiles.map(f => f.filename)
            });
        }

        return findings;
    }

    /**
     * Get financial-specific recommendations
     */
    getFinancialRecommendations(files) {
        const recommendations = [];
        
        recommendations.push({
            type: 'compliance',
            priority: 'high',
            description: 'Ensure all financial calculations have comprehensive unit tests'
        });
        
        recommendations.push({
            type: 'security',
            priority: 'high', 
            description: 'Implement proper audit trails for all financial transactions'
        });

        return recommendations;
    }

    /**
     * Generate analysis summary
     */
    generateSummary(analysisResult) {
        const files = analysisResult.files;
        
        return {
            totalFiles: files.length,
            languages: [...new Set(files.map(f => f.language))],
            totalLines: files.reduce((sum, f) => sum + f.lines, 0),
            averageComplexity: (files.reduce((sum, f) => sum + f.complexity.score, 0) / files.length).toFixed(1),
            highComplexityFiles: files.filter(f => f.complexity.level === 'high').length,
            totalIssues: files.reduce((sum, f) => sum + f.issues.length, 0),
            findingsCount: analysisResult.findings.length,
            recommendationsCount: analysisResult.recommendations.length
        };
    }

    /**
     * Save analysis results
     */
    async saveResults(results, outputPath) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `analysis-${results.context}-${timestamp}.json`;
        const fullPath = path.join(outputPath, filename);
        
        // Ensure output directory exists
        fs.mkdirSync(outputPath, { recursive: true });
        
        fs.writeFileSync(fullPath, JSON.stringify(results, null, 2));
        console.log(`💾 Results saved to: ${fullPath}`);
    }
}
