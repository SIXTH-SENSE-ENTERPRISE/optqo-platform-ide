/**
 * optqo Platform - File System Utilities
 * Provides common file system operations for the platform
 */

import fs from 'fs/promises';
import path from 'path';

export class FileUtils {
    /**
     * Ensure directory exists, create if it doesn't
     * @param {string} dirPath - Directory path to ensure
     */
    static async ensureDir(dirPath) {
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
        }
    }

    /**
     * Read JSON file with error handling
     * @param {string} filePath - Path to JSON file
     * @returns {Object|null} Parsed JSON or null if error
     */
    static async readJSON(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            console.error(`Error reading JSON file ${filePath}:`, error.message);
            return null;
        }
    }

    /**
     * Write JSON file with formatting
     * @param {string} filePath - Path to write JSON file
     * @param {Object} data - Data to write
     */
    static async writeJSON(filePath, data) {
        try {
            await this.ensureDir(path.dirname(filePath));
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
            console.error(`Error writing JSON file ${filePath}:`, error.message);
            throw error;
        }
    }

    /**
     * Get file extension
     * @param {string} filePath - Path to file
     * @returns {string} File extension without dot
     */
    static getExtension(filePath) {
        return path.extname(filePath).slice(1).toLowerCase();
    }

    /**
     * Check if file exists
     * @param {string} filePath - Path to check
     * @returns {boolean} True if file exists
     */
    static async exists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}
