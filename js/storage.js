/**
 * Storage Module - Handles Local Storage operations
 * Manages saving and retrieving resume analysis history
 */

const StorageManager = {
    // Storage keys
    STORAGE_KEYS: {
        ANALYSES: 'resume_analyses',
        API_KEY: 'gemini_api_key',
        THEME: 'app_theme'
    },

    /**
     * Save analysis to local storage
     * @param {Object} analysisData - The analysis result data
     */
    saveAnalysis(analysisData) {
        try {
            const analyses = this.getAllAnalyses();
            
            // Create analysis record
            const analysisRecord = {
                id: Date.now(),
                timestamp: new Date().toISOString(),
                fileName: analysisData.fileName || 'Unknown',
                ...analysisData
            };

            // Add to beginning of array (most recent first)
            analyses.unshift(analysisRecord);

            // Keep only last 10 analyses
            const limitedAnalyses = analyses.slice(0, 10);

            // Save to localStorage
            localStorage.setItem(
                this.STORAGE_KEYS.ANALYSES,
                JSON.stringify(limitedAnalyses)
            );

            return analysisRecord;
        } catch (error) {
            console.error('Error saving analysis:', error);
            return null;
        }
    },

    /**
     * Get all saved analyses
     * @returns {Array} Array of analysis records
     */
    getAllAnalyses() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEYS.ANALYSES);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error retrieving analyses:', error);
            return [];
        }
    },

    /**
     * Get analysis by ID
     * @param {number} id - Analysis ID
     * @returns {Object|null} Analysis record or null
     */
    getAnalysisById(id) {
        try {
            const analyses = this.getAllAnalyses();
            return analyses.find(analysis => analysis.id === id) || null;
        } catch (error) {
            console.error('Error retrieving analysis:', error);
            return null;
        }
    },

    /**
     * Delete analysis by ID
     * @param {number} id - Analysis ID
     * @returns {boolean} Success status
     */
    deleteAnalysis(id) {
        try {
            const analyses = this.getAllAnalyses();
            const filteredAnalyses = analyses.filter(analysis => analysis.id !== id);
            
            localStorage.setItem(
                this.STORAGE_KEYS.ANALYSES,
                JSON.stringify(filteredAnalyses)
            );
            
            return true;
        } catch (error) {
            console.error('Error deleting analysis:', error);
            return false;
        }
    },

    /**
     * Clear all analyses
     * @returns {boolean} Success status
     */
    clearAllAnalyses() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.ANALYSES);
            return true;
        } catch (error) {
            console.error('Error clearing analyses:', error);
            return false;
        }
    },

    /**
     * Save API key to local storage
     * @param {string} apiKey - Gemini API key
     */
    saveApiKey(apiKey) {
        try {
            if (apiKey && apiKey.trim()) {
                localStorage.setItem(this.STORAGE_KEYS.API_KEY, apiKey.trim());
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error saving API key:', error);
            return false;
        }
    },

    /**
     * Get saved API key
     * @returns {string|null} API key or null
     */
    getApiKey() {
        try {
            return localStorage.getItem(this.STORAGE_KEYS.API_KEY);
        } catch (error) {
            console.error('Error retrieving API key:', error);
            return null;
        }
    },

    /**
     * Delete saved API key
     * @returns {boolean} Success status
     */
    deleteApiKey() {
        try {
            localStorage.removeItem(this.STORAGE_KEYS.API_KEY);
            return true;
        } catch (error) {
            console.error('Error deleting API key:', error);
            return false;
        }
    },

    /**
     * Save theme preference
     * @param {string} theme - Theme name ('light' or 'dark')
     */
    saveTheme(theme) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.THEME, theme);
            return true;
        } catch (error) {
            console.error('Error saving theme:', error);
            return false;
        }
    },

    /**
     * Get saved theme preference
     * @returns {string|null} Theme name or null
     */
    getTheme() {
        try {
            return localStorage.getItem(this.STORAGE_KEYS.THEME);
        } catch (error) {
            console.error('Error retrieving theme:', error);
            return null;
        }
    },

    /**
     * Get storage usage statistics
     * @returns {Object} Storage statistics
     */
    getStorageStats() {
        try {
            const analyses = this.getAllAnalyses();
            const apiKey = this.getApiKey();
            
            return {
                totalAnalyses: analyses.length,
                hasApiKey: !!apiKey,
                oldestAnalysis: analyses.length > 0 ? analyses[analyses.length - 1].timestamp : null,
                newestAnalysis: analyses.length > 0 ? analyses[0].timestamp : null
            };
        } catch (error) {
            console.error('Error getting storage stats:', error);
            return {
                totalAnalyses: 0,
                hasApiKey: false,
                oldestAnalysis: null,
                newestAnalysis: null
            };
        }
    },

    /**
     * Export all data as JSON
     * @returns {string} JSON string of all data
     */
    exportData() {
        try {
            const data = {
                analyses: this.getAllAnalyses(),
                theme: this.getTheme(),
                exportDate: new Date().toISOString()
            };
            return JSON.stringify(data, null, 2);
        } catch (error) {
            console.error('Error exporting data:', error);
            return null;
        }
    },

    /**
     * Import data from JSON
     * @param {string} jsonData - JSON string to import
     * @returns {boolean} Success status
     */
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.analyses && Array.isArray(data.analyses)) {
                localStorage.setItem(
                    this.STORAGE_KEYS.ANALYSES,
                    JSON.stringify(data.analyses)
                );
            }
            
            if (data.theme) {
                this.saveTheme(data.theme);
            }
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
};

// Make StorageManager available globally
if (typeof window !== 'undefined') {
    window.StorageManager = StorageManager;
}
