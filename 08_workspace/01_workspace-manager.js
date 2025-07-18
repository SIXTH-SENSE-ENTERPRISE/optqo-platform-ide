/**
 * Workspace Manager - Handles project-specific workspace isolation
 * Ensures multiple users can work simultaneously without conflicts
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..');

export class WorkspaceManager {
    constructor() {
        this.workspaces = new Map();
        this.workspaceRoot = __dirname;
    }

    /**
     * Create a new project workspace with organized structure
     * @param {string} projectName - Name of the project
     * @param {string} projectType - Type of project ('github-repo' or 'local-project')
     * @returns {Object} Workspace configuration
     */
    async createWorkspace(projectName, projectType = 'local-project') {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const workspaceId = `${projectName}-${timestamp}`;
        
        // Determine the base directory based on project type
        const baseDir = projectType === 'github-repo' ? 'github-repos' : 'local-projects';
        const workspacePath = join(__dirname, baseDir, workspaceId);
        
        // Create organized project structure
        await fs.mkdir(workspacePath, { recursive: true });
        await fs.mkdir(join(workspacePath, 'source'), { recursive: true });
        await fs.mkdir(join(workspacePath, 'analysis'), { recursive: true });
        await fs.mkdir(join(workspacePath, 'reports'), { recursive: true });
        
        const workspace = {
            id: workspaceId,
            projectName,
            projectType,
            timestamp,
            paths: {
                root: workspacePath,
                source: join(workspacePath, 'source'),
                analysis: join(workspacePath, 'analysis'),
                reports: join(workspacePath, 'reports')
            },
            createdAt: new Date().toISOString(),
            active: true
        };

        // Save workspace configuration
        await fs.writeFile(
            join(workspacePath, 'workspace-config.json'),
            JSON.stringify(workspace, null, 2)
        );

        this.workspaces.set(workspaceId, workspace);
        
        console.log(`Created workspace: ${workspaceId} for project: ${projectName}`);
        return workspace;
    }

    /**
     * Get existing workspace by ID
     * @param {string} workspaceId - Workspace identifier
     * @returns {Object|null} Workspace configuration or null
     */
    async getWorkspace(workspaceId) {
        if (this.workspaces.has(workspaceId)) {
            return this.workspaces.get(workspaceId);
        }

        // Try to load from disk
        try {
            const workspacePath = join(this.sessionsDir, workspaceId);
            const configPath = join(workspacePath, 'workspace-config.json');
            const configData = await fs.readFile(configPath, 'utf-8');
            const workspace = JSON.parse(configData);
            
            this.workspaces.set(workspaceId, workspace);
            return workspace;
        } catch (error) {
            console.error(`Workspace ${workspaceId} not found:`, error);
            return null;
        }
    }

    /**
     * List all active workspaces
     * @returns {Array} Array of workspace configurations
     */
    async listWorkspaces() {
        try {
            const sessionDirs = await fs.readdir(this.sessionsDir);
            const workspaces = [];

            for (const dir of sessionDirs) {
                try {
                    const configPath = join(this.sessionsDir, dir, 'workspace-config.json');
                    const configData = await fs.readFile(configPath, 'utf-8');
                    const workspace = JSON.parse(configData);
                    workspaces.push(workspace);
                } catch (error) {
                    console.warn(`Could not load workspace ${dir}:`, error.message);
                }
            }

            return workspaces.sort((a, b) => new Date(b.created) - new Date(a.created));
        } catch (error) {
            console.error('Failed to list workspaces:', error);
            return [];
        }
    }

    /**
     * Clean up old workspaces (older than specified days)
     * @param {number} maxAgeInDays - Maximum age in days (default: 7)
     */
    async cleanupOldWorkspaces(maxAgeInDays = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays);

        const workspaces = await this.listWorkspaces();
        const cleanupPromises = [];

        for (const workspace of workspaces) {
            const workspaceDate = new Date(workspace.created);
            if (workspaceDate < cutoffDate) {
                console.log(`Cleaning up old workspace: ${workspace.id}`);
                cleanupPromises.push(this.deleteWorkspace(workspace.id));
            }
        }

        await Promise.all(cleanupPromises);
    }

    /**
     * Delete a workspace and all its contents
     * @param {string} workspaceId - Workspace identifier
     */
    async deleteWorkspace(workspaceId) {
        try {
            const workspacePath = join(this.sessionsDir, workspaceId);
            await fs.rm(workspacePath, { recursive: true, force: true });
            this.workspaces.delete(workspaceId);
            console.log(`Deleted workspace: ${workspaceId}`);
        } catch (error) {
            console.error(`Failed to delete workspace ${workspaceId}:`, error);
        }
    }

    /**
     * Get the output path for a specific workspace
     * @param {string} workspaceId - Workspace identifier
     * @returns {string|null} Output path or null if workspace not found
     */
    async getOutputPath(workspaceId) {
        const workspace = await this.getWorkspace(workspaceId);
        return workspace ? workspace.outputsPath : null;
    }
}

// Singleton instance for global use
export const workspaceManager = new WorkspaceManager();
