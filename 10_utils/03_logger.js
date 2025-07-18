/**
 * optqo Platform - Logging Utilities
 * Provides standardized logging for the platform
 */

import { DateUtils } from './02_date-utils.js';

export class Logger {
    static levels = {
        ERROR: 0,
        WARN: 1,
        INFO: 2,
        DEBUG: 3
    };

    static currentLevel = Logger.levels.INFO;

    /**
     * Set logging level
     * @param {string} level - Logging level (ERROR, WARN, INFO, DEBUG)
     */
    static setLevel(level) {
        this.currentLevel = this.levels[level.toUpperCase()] ?? this.levels.INFO;
    }

    /**
     * Log error message
     * @param {string} message - Error message
     * @param {Error} error - Optional error object
     */
    static error(message, error = null) {
        if (this.currentLevel >= this.levels.ERROR) {
            const timestamp = DateUtils.getReadableDate();
            console.error(`[${timestamp}] ERROR: ${message}`);
            if (error) {
                console.error(error);
            }
        }
    }

    /**
     * Log warning message
     * @param {string} message - Warning message
     */
    static warn(message) {
        if (this.currentLevel >= this.levels.WARN) {
            const timestamp = DateUtils.getReadableDate();
            console.warn(`[${timestamp}] WARN: ${message}`);
        }
    }

    /**
     * Log info message
     * @param {string} message - Info message
     */
    static info(message) {
        if (this.currentLevel >= this.levels.INFO) {
            const timestamp = DateUtils.getReadableDate();
            console.log(`[${timestamp}] INFO: ${message}`);
        }
    }

    /**
     * Log debug message
     * @param {string} message - Debug message
     * @param {any} data - Optional data to log
     */
    static debug(message, data = null) {
        if (this.currentLevel >= this.levels.DEBUG) {
            const timestamp = DateUtils.getReadableDate();
            console.log(`[${timestamp}] DEBUG: ${message}`);
            if (data) {
                console.log(data);
            }
        }
    }

    /**
     * Log agent activity
     * @param {string} agent - Agent name
     * @param {string} action - Action being performed
     */
    static agent(agent, action) {
        this.info(`[${agent}] ${action}`);
    }
}
