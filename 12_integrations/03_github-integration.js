/**
 * optqo Platform - GitHub Integration Module
 * Provides GitHub repository integration capabilities
 */

import { Octokit } from '@octokit/rest';
import { Logger } from '../10_utils/03_logger.js';

export class GitHubIntegration {
    constructor(token = process.env.GITHUB_TOKEN) {
        this.octokit = new Octokit({
            auth: token
        });
    }

    /**
     * Get repository information
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @returns {Object} Repository data
     */
    async getRepository(owner, repo) {
        try {
            const response = await this.octokit.rest.repos.get({
                owner,
                repo
            });
            return response.data;
        } catch (error) {
            Logger.error(`Failed to get repository ${owner}/${repo}`, error);
            throw error;
        }
    }

    /**
     * List repository files
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} path - Path to list (optional)
     * @returns {Array} File list
     */
    async listFiles(owner, repo, path = '') {
        try {
            const response = await this.octokit.rest.repos.getContent({
                owner,
                repo,
                path
            });
            return Array.isArray(response.data) ? response.data : [response.data];
        } catch (error) {
            Logger.error(`Failed to list files in ${owner}/${repo}/${path}`, error);
            throw error;
        }
    }

    /**
     * Get file content
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @param {string} path - File path
     * @returns {string} File content
     */
    async getFileContent(owner, repo, path) {
        try {
            const response = await this.octokit.rest.repos.getContent({
                owner,
                repo,
                path
            });
            
            if (response.data.content) {
                return Buffer.from(response.data.content, 'base64').toString('utf8');
            }
            throw new Error('File content not available');
        } catch (error) {
            Logger.error(`Failed to get file content ${owner}/${repo}/${path}`, error);
            throw error;
        }
    }

    /**
     * Analyze repository structure
     * @param {string} owner - Repository owner
     * @param {string} repo - Repository name
     * @returns {Object} Analysis results
     */
    async analyzeRepository(owner, repo) {
        Logger.info(`Starting analysis of ${owner}/${repo}`);
        
        try {
            const repoData = await this.getRepository(owner, repo);
            const files = await this.listFiles(owner, repo);
            
            const analysis = {
                repository: {
                    name: repoData.name,
                    description: repoData.description,
                    language: repoData.language,
                    size: repoData.size,
                    stargazers: repoData.stargazers_count,
                    forks: repoData.forks_count,
                    issues: repoData.open_issues_count,
                    createdAt: repoData.created_at,
                    updatedAt: repoData.updated_at
                },
                structure: await this.analyzeStructure(files),
                timestamp: new Date().toISOString()
            };
            
            Logger.info(`Analysis completed for ${owner}/${repo}`);
            return analysis;
        } catch (error) {
            Logger.error(`Repository analysis failed for ${owner}/${repo}`, error);
            throw error;
        }
    }

    /**
     * Analyze repository file structure
     * @param {Array} files - File list
     * @returns {Object} Structure analysis
     */
    async analyzeStructure(files) {
        const structure = {
            totalFiles: files.length,
            directories: 0,
            fileTypes: {},
            hasReadme: false,
            hasLicense: false,
            hasPackageJson: false,
            hasDockerfile: false
        };

        for (const file of files) {
            if (file.type === 'dir') {
                structure.directories++;
            } else {
                const extension = file.name.split('.').pop()?.toLowerCase() || 'no-extension';
                structure.fileTypes[extension] = (structure.fileTypes[extension] || 0) + 1;
                
                // Check for important files
                const fileName = file.name.toLowerCase();
                if (fileName.startsWith('readme')) structure.hasReadme = true;
                if (fileName.includes('license')) structure.hasLicense = true;
                if (fileName === 'package.json') structure.hasPackageJson = true;
                if (fileName === 'dockerfile') structure.hasDockerfile = true;
            }
        }

        return structure;
    }
}
