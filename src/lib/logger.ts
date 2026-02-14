/**
 * Conditional Logger Utility
 * Prevents sensitive data exposure in production
 */

const isDev = import.meta.env.DEV;

export const logger = {
    /**
     * Log debug information (only in development)
     */
    log: (...args: any[]) => {
        if (isDev) {
            console.log(...args);
        }
    },

    /**
     * Log warnings (only in development)
     */
    warn: (...args: any[]) => {
        if (isDev) {
            console.warn(...args);
        }
    },

    /**
     * Log errors (always logged for monitoring)
     */
    error: (...args: any[]) => {
        console.error(...args);
    },

    /**
     * Log info (only in development)
     */
    info: (...args: any[]) => {
        if (isDev) {
            console.info(...args);
        }
    },
};
