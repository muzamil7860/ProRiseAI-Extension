// Storage utilities for LinkedIn AI Assistant
// Handles settings and data persistence

class StorageService {
    constructor() {
        this.defaultSettings = {
            globalTone: 'professional',
            postCreatorEnabled: true,
            commentSuggestionsEnabled: true,
            commentRewriterEnabled: false,
            inboxRepliesEnabled: true,
            rewriteAnywhereEnabled: true,
            hashtagGeneratorEnabled: false,
            engagementBoostEnabled: true,
            autoSummarizerEnabled: false,
            translationEnabled: false,
            // Keyword alert feature
            keywordAlertsEnabled: true,
            keywordList: ['developer', 'wordpress'],
            alertSoundEnabled: true
            ,
            // Background crawler
            backgroundScanEnabled: true,
            crawlIntervalSec: 60,
            // WhatsApp alerts
            whatsappAlertsEnabled: false,
            whatsappPhone: ''
        };
    }

    async getSettings() {
        try {
            const result = await chrome.storage.sync.get(Object.keys(this.defaultSettings));
            return { ...this.defaultSettings, ...result };
        } catch (error) {
            console.error('Error getting settings:', error);
            return this.defaultSettings;
        }
    }

    async getSetting(key) {
        try {
            const result = await chrome.storage.sync.get(key);
            return result[key] !== undefined ? result[key] : this.defaultSettings[key];
        } catch (error) {
            console.error(`Error getting setting ${key}:`, error);
            return this.defaultSettings[key];
        }
    }

    async setSetting(key, value) {
        try {
            await chrome.storage.sync.set({ [key]: value });
            return true;
        } catch (error) {
            console.error(`Error setting ${key}:`, error);
            return false;
        }
    }

    async setSettings(settings) {
        try {
            await chrome.storage.sync.set(settings);
            return true;
        } catch (error) {
            console.error('Error setting settings:', error);
            return false;
        }
    }

    async getStats() {
        try {
            const result = await chrome.storage.local.get([
                'postsGenerated',
                'commentsAssisted',
                'messagesReplied',
                'monthlyUsage',
                'installDate'
            ]);
            
            return {
                postsGenerated: result.postsGenerated || 0,
                commentsAssisted: result.commentsAssisted || 0,
                messagesReplied: result.messagesReplied || 0,
                monthlyUsage: result.monthlyUsage || 0,
                installDate: result.installDate || Date.now()
            };
        } catch (error) {
            console.error('Error getting stats:', error);
            return {
                postsGenerated: 0,
                commentsAssisted: 0,
                messagesReplied: 0,
                monthlyUsage: 0,
                installDate: Date.now()
            };
        }
    }

    async updateStat(statKey, increment = 1) {
        try {
            const current = await chrome.storage.local.get([statKey, 'monthlyUsage']);
            const updates = {
                [statKey]: (current[statKey] || 0) + increment,
                monthlyUsage: (current.monthlyUsage || 0) + increment
            };
            
            await chrome.storage.local.set(updates);
            return updates;
        } catch (error) {
            console.error(`Error updating stat ${statKey}:`, error);
            return null;
        }
    }

    async getUserData(key) {
        try {
            const result = await chrome.storage.local.get(key);
            return result[key];
        } catch (error) {
            console.error(`Error getting user data ${key}:`, error);
            return null;
        }
    }

    async setUserData(key, value) {
        try {
            await chrome.storage.local.set({ [key]: value });
            return true;
        } catch (error) {
            console.error(`Error setting user data ${key}:`, error);
            return false;
        }
    }

    async clearUserData() {
        try {
            await chrome.storage.local.clear();
            return true;
        } catch (error) {
            console.error('Error clearing user data:', error);
            return false;
        }
    }

    async resetSettings() {
        try {
            await chrome.storage.sync.clear();
            await chrome.storage.sync.set(this.defaultSettings);
            return true;
        } catch (error) {
            console.error('Error resetting settings:', error);
            return false;
        }
    }

    // Cache management for temporary data
    async cacheData(key, data, ttl = 3600000) { // Default 1 hour TTL
        try {
            const cacheItem = {
                data,
                timestamp: Date.now(),
                ttl
            };
            await chrome.storage.local.set({ [`cache_${key}`]: cacheItem });
            return true;
        } catch (error) {
            console.error(`Error caching data ${key}:`, error);
            return false;
        }
    }

    async getCachedData(key) {
        try {
            const result = await chrome.storage.local.get(`cache_${key}`);
            const cacheItem = result[`cache_${key}`];
            
            if (!cacheItem) {
                return null;
            }
            
            // Check if cache has expired
            if (Date.now() - cacheItem.timestamp > cacheItem.ttl) {
                await chrome.storage.local.remove(`cache_${key}`);
                return null;
            }
            
            return cacheItem.data;
        } catch (error) {
            console.error(`Error getting cached data ${key}:`, error);
            return null;
        }
    }

    async clearCache() {
        try {
            const result = await chrome.storage.local.get();
            const cacheKeys = Object.keys(result).filter(key => key.startsWith('cache_'));
            
            if (cacheKeys.length > 0) {
                await chrome.storage.local.remove(cacheKeys);
            }
            
            return true;
        } catch (error) {
            console.error('Error clearing cache:', error);
            return false;
        }
    }

    // Listen for settings changes
    onSettingsChanged(callback) {
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'sync') {
                const settingsChanges = {};
                let hasChanges = false;
                
                Object.keys(this.defaultSettings).forEach(key => {
                    if (changes[key]) {
                        settingsChanges[key] = changes[key].newValue;
                        hasChanges = true;
                    }
                });
                
                if (hasChanges) {
                    callback(settingsChanges);
                }
            }
        });
    }

    // Export settings for backup
    async exportSettings() {
        try {
            const settings = await this.getSettings();
            const stats = await this.getStats();
            
            const exportData = {
                settings,
                stats,
                exportDate: new Date().toISOString(),
                version: chrome.runtime.getManifest().version
            };
            
            return exportData;
        } catch (error) {
            console.error('Error exporting settings:', error);
            return null;
        }
    }

    // Import settings from backup
    async importSettings(exportData) {
        try {
            if (!exportData || !exportData.settings) {
                throw new Error('Invalid export data');
            }
            
            // Validate settings structure
            const validSettings = {};
            Object.keys(this.defaultSettings).forEach(key => {
                if (exportData.settings[key] !== undefined) {
                    validSettings[key] = exportData.settings[key];
                }
            });
            
            await this.setSettings(validSettings);
            
            // Optionally import stats (but not overwrite current ones)
            if (exportData.stats) {
                const currentStats = await this.getStats();
                const importStats = { ...currentStats };
                
                // Only import if current stats are all zero (fresh install)
                if (currentStats.postsGenerated === 0 && 
                    currentStats.commentsAssisted === 0 && 
                    currentStats.messagesReplied === 0) {
                    
                    Object.assign(importStats, exportData.stats);
                    await chrome.storage.local.set(importStats);
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error importing settings:', error);
            return false;
        }
    }
}

// Create global instance
window.AIAssistantStorage = new StorageService();
