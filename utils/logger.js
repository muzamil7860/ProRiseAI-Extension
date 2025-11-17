// Debug utility for conditional logging
// Set DEBUG to false in production
const DEBUG = false;

const Logger = {
    log: (...args) => {
        if (DEBUG) console.log(...args);
    },
    
    warn: (...args) => {
        if (DEBUG) console.warn(...args);
    },
    
    error: (...args) => {
        // Always log errors, but can be toggled off in production
        if (DEBUG) console.error(...args);
    },
    
    info: (...args) => {
        if (DEBUG) console.info(...args);
    }
};

// Export for use in other files
if (typeof window !== 'undefined') {
    window.Logger = Logger;
}
