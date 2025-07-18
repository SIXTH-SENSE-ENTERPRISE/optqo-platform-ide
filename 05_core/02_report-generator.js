// Report Generator Module
import fs from 'fs';
import path from 'path';

export class ReportGenerator {
    constructor() {
        this.templatePath = path.join(process.cwd(), '04_templates');
    }

    /**
     * Generate HTML report from analysis data
     * @param {Object} analysisData - The analysis result data
     * @param {Object} options - Report generation options
     * @returns {Object} - Generated report info
     */
    async generateHTMLReport(analysisData, options = {}) {
        try {
            const templateFile = path.join(this.templatePath, '01_optqo_analysis_report.html');
            
            // Check if template exists
            if (!fs.existsSync(templateFile)) {
                throw new Error(`Template file not found: ${templateFile}`);
            }
            
            let htmlTemplate = await fs.promises.readFile(templateFile, 'utf8');

            // Extract project name from path
            const projectName = this.extractProjectName(analysisData.inputPath);
            
            // Prepare template data
            const templateData = this.prepareTemplateData(analysisData, projectName);
            
            // Simple template replacement (Handlebars-like syntax)
            htmlTemplate = this.replaceTemplateVariables(htmlTemplate, templateData);
            
            // Generate output filename
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
            const outputFilename = `report-${analysisData.context}-${timestamp}.html`;
            const outputPath = options.outputDir 
                ? path.join(options.outputDir, outputFilename)
                : path.join(process.cwd(), 'analysis-workspace', 'reports', outputFilename);

            // Ensure output directory exists
            const outputDir = path.dirname(outputPath);
            if (!fs.existsSync(outputDir)) {
                await fs.promises.mkdir(outputDir, { recursive: true });
            }

            // Write HTML report
            await fs.promises.writeFile(outputPath, htmlTemplate, 'utf8');

            return {
                success: true,
                reportPath: outputPath,
                filename: outputFilename,
                projectName: projectName,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Report generation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Extract project name from file path
     */
    extractProjectName(inputPath) {
        const pathParts = inputPath.split(/[\/\\]/);
        return pathParts[pathParts.length - 1] || 'Unknown Project';
    }

    /**
     * Prepare data for template substitution
     */
    prepareTemplateData(analysisData, projectName) {
        const summary = analysisData.summary || {};
        
        return {
            projectName: projectName,
            context: analysisData.context || 'Unknown',
            timestamp: new Date(analysisData.timestamp).toLocaleString(),
            projectPath: analysisData.inputPath || 'Unknown',
            totalFiles: summary.totalFiles || 0,
            totalLines: this.formatNumber(summary.totalLines || 0),
            languageCount: summary.languages?.length || 0,
            languages: summary.languages || [],
            averageComplexity: summary.averageComplexity || 'N/A',
            highComplexityFiles: summary.highComplexityFiles || 0,
            totalIssues: summary.totalIssues || 0,
            files: analysisData.files || [],
            businessPatterns: this.extractBusinessPatterns(analysisData.files || []),
            findings: analysisData.findings || [],
            recommendations: analysisData.recommendations || []
        };
    }

    /**
     * Extract business patterns from files for display
     */
    extractBusinessPatterns(files) {
        const allPatterns = [];
        
        files.forEach(file => {
            if (file.patterns) {
                file.patterns.forEach(pattern => {
                    allPatterns.push({
                        type: pattern.type,
                        count: pattern.count,
                        businessRelevance: pattern.businessRelevance,
                        examples: pattern.examples || []
                    });
                });
            }
        });

        // Group similar patterns
        const groupedPatterns = {};
        allPatterns.forEach(pattern => {
            if (groupedPatterns[pattern.type]) {
                groupedPatterns[pattern.type].count += pattern.count;
                groupedPatterns[pattern.type].examples = [
                    ...groupedPatterns[pattern.type].examples,
                    ...pattern.examples
                ].slice(0, 5); // Limit examples
            } else {
                groupedPatterns[pattern.type] = { ...pattern };
            }
        });

        return Object.values(groupedPatterns);
    }

    /**
     * Simple template variable replacement
     */
    replaceTemplateVariables(template, data) {
        let result = template;

        // Replace simple variables {{variable}} first
        result = result.replace(/\{\{([^#\/][^}]*)\}\}/g, (match, key) => {
            const cleanKey = key.trim();
            const value = this.getNestedValue(data, cleanKey);
            return value !== undefined ? String(value) : '';
        });

        // Handle each loops {{#each array}}...{{/each}}
        result = result.replace(/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayKey, itemTemplate) => {
            const array = this.getNestedValue(data, arrayKey.trim());
            if (!Array.isArray(array) || array.length === 0) return '';
            
            return array.map(item => {
                let itemHtml = itemTemplate;
                if (typeof item === 'string') {
                    itemHtml = itemHtml.replace(/\{\{this\}\}/g, item);
                } else if (typeof item === 'object' && item !== null) {
                    // Replace all properties of the item
                    Object.keys(item).forEach(prop => {
                        const regex = new RegExp(`\\{\\{${prop}\\}\\}`, 'g');
                        const value = item[prop];
                        itemHtml = itemHtml.replace(regex, value !== undefined ? String(value) : '');
                    });
                    
                    // Handle special formatters
                    itemHtml = itemHtml.replace(/\{\{formatSize\s+([^}]+)\}\}/g, (match, sizeKey) => {
                        const sizeValue = item[sizeKey.trim()];
                        return sizeValue ? this.formatSize(sizeValue) : '';
                    });
                }
                return itemHtml;
            }).join('');
        });

        // Handle if conditions {{#if condition}}...{{/if}}
        result = result.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
            const value = this.getNestedValue(data, condition.trim());
            return (value && (Array.isArray(value) ? value.length > 0 : true)) ? content : '';
        });

        return result;
    }

    /**
     * Get nested object value by dot notation
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => {
            return current && current[key] !== undefined ? current[key] : undefined;
        }, obj);
    }

    /**
     * Format large numbers for display
     */
    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    /**
     * Format file size for display
     */
    formatSize(bytes) {
        if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return bytes + ' B';
    }
}
