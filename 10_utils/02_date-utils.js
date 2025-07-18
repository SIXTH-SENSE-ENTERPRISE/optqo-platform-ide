/**
 * optqo Platform - Date/Time Utilities
 * Provides standardized date formatting for the platform
 */

export class DateUtils {
    /**
     * Get current timestamp in ISO format for filenames
     * @returns {string} Formatted timestamp
     */
    static getTimestamp() {
        return new Date().toISOString().replace(/[:.]/g, '-');
    }

    /**
     * Get human-readable date string
     * @returns {string} Formatted date
     */
    static getReadableDate() {
        return new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Get date for report headers
     * @returns {string} Report-formatted date
     */
    static getReportDate() {
        return new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    /**
     * Calculate elapsed time between two dates
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date (optional, defaults to now)
     * @returns {string} Human-readable elapsed time
     */
    static getElapsedTime(startDate, endDate = new Date()) {
        const elapsed = endDate - startDate;
        const seconds = Math.floor(elapsed / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) {
            return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
}
