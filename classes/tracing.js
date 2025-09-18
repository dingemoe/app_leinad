// ==UserScript==
// @name         Leinad Tracing API
// @namespace    https://github.com/dingemoe/app_leinad
// @version      1.0.0
// @description  Pure logging API for Deno KV - no UI, just await tracing() functions
// @author       Daniel
// @match        *://*/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @grant        GM_info
// @require      https://raw.githubusercontent.com/dingemoe/app_leinad/main/classes/tracer.js?v=1.0.1
// ==/UserScript==

(function() {
    'use strict';

    const API_BASE = "https://leinad-log.deno.dev";
    
    // Storage keys for Greasemonkey
    const STORAGE_KEYS = {
        SESSION_TOKENS: 'leinad_session_tokens',
        LOCATION_TOKENS: 'leinad_location_tokens',
        LAST_SESSION: 'leinad_last_session_token'
    };

    /**
     * Tracing API - Global function for logging operations
     * Usage:
     *   await tracing.logs()                    // Get all logs for current location
     *   await tracing.logs("session_token")     // Get logs for specific session
     *   await tracing.sessions()                // List all stored session tokens
     *   await tracing.clear()                   // Clear all stored tokens
     *   await tracing.start(callback)           // Start tracer and run callback
     */
    window.tracing = {
        
        /**
         * Get logs from Deno KV API
         * @param {string} [sessionToken] - Optional session token, uses stored location token if not provided
         * @param {Object} [options] - Additional options
         * @returns {Promise<Object>} API response with logs
         */
        async logs(sessionToken = null, options = {}) {
            const { limit = 50, location = null } = options;
            
            let url = `${API_BASE}/logs`;
            const params = new URLSearchParams();
            
            if (sessionToken) {
                // Use session token
                params.append('token', sessionToken);
                console.log(`[Tracing] 🔍 Fetching logs for session: ${sessionToken}`);
            } else {
                // Use location token
                const currentLocation = location || window.location.hostname;
                const locationToken = this._getLocationToken(currentLocation);
                
                if (!locationToken) {
                    throw new Error(`No location token found for ${currentLocation}. Create some logs first or provide a session token.`);
                }
                
                params.append('location', currentLocation);
                params.append('token', locationToken);
                console.log(`[Tracing] 🌐 Fetching logs for location: ${currentLocation}`);
            }
            
            if (limit) params.append('limit', limit.toString());
            
            url += '?' + params.toString();
            
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(`API Error: ${data.error || response.statusText}`);
                }
                
                console.log(`[Tracing] ✅ Retrieved ${data.count || 0} logs`);
                return data;
                
            } catch (error) {
                console.error('[Tracing] ❌ Failed to fetch logs:', error);
                throw error;
            }
        },

        /**
         * Start tracer and execute callback
         * @param {Function} callback - Function to execute with tracer context
         * @param {Object} [options] - Tracer options
         * @returns {Promise<any>} Result from callback
         */
        async start(callback, options = {}) {
            const tracerOptions = {
                apiBase: API_BASE,
                flushMs: 800,
                hookConsole: false, // No console hooking for pure API mode
                ...options
            };
            
            console.log('[Tracing] 🚀 Starting tracer in API mode...');
            
            const tracer = new LeinadTracer(tracerOptions);
            
            return new Promise((resolve, reject) => {
                tracer.start(async ({ logEvent }) => {
                    try {
                        // Store session token when it's generated
                        const currentSession = tracer._currentSessionToken;
                        if (currentSession) {
                            this._storeSessionToken(currentSession);
                        }
                        
                        const result = await callback({ logEvent, tracer });
                        resolve(result);
                    } catch (error) {
                        console.error('[Tracing] ❌ Callback error:', error);
                        reject(error);
                    }
                });
            });
        },

        /**
         * Get all stored session tokens
         * @returns {Array<Object>} List of session tokens with metadata
         */
        sessions() {
            const stored = GM_getValue(STORAGE_KEYS.SESSION_TOKENS, '[]');
            const sessions = JSON.parse(stored);
            
            console.log(`[Tracing] 📋 Found ${sessions.length} stored sessions`);
            sessions.forEach((session, i) => {
                console.log(`  ${i + 1}. ${session.token} (${session.location}, ${session.createdAt})`);
            });
            
            return sessions;
        },

        /**
         * Get logs for the most recent session
         * @returns {Promise<Object>} API response with logs
         */
        async latest() {
            const lastSession = GM_getValue(STORAGE_KEYS.LAST_SESSION, null);
            if (!lastSession) {
                throw new Error('No recent session token found. Create some logs first.');
            }
            
            console.log(`[Tracing] ⏰ Fetching latest session: ${lastSession}`);
            return this.logs(lastSession);
        },

        /**
         * Clear all stored tokens
         */
        clear() {
            GM_deleteValue(STORAGE_KEYS.SESSION_TOKENS);
            GM_deleteValue(STORAGE_KEYS.LOCATION_TOKENS);
            GM_deleteValue(STORAGE_KEYS.LAST_SESSION);
            console.log('[Tracing] 🧹 Cleared all stored tokens');
        },

        /**
         * Get current status and configuration
         * @returns {Object} Status information
         */
        status() {
            const sessions = this.sessions();
            const locationTokens = this._getStoredLocationTokens();
            const lastSession = GM_getValue(STORAGE_KEYS.LAST_SESSION, null);
            
            const status = {
                apiBase: API_BASE,
                currentLocation: window.location.hostname,
                storedSessions: sessions.length,
                storedLocationTokens: Object.keys(locationTokens).length,
                lastSession,
                storageKeys: STORAGE_KEYS
            };
            
            console.log('[Tracing] 📊 Status:', status);
            return status;
        },

        /**
         * Search logs by criteria
         * @param {Object} criteria - Search criteria
         * @returns {Promise<Array>} Filtered logs
         */
        async search(criteria = {}) {
            const { sessionToken, event, mode, location, since } = criteria;
            
            let logs;
            if (sessionToken) {
                const response = await this.logs(sessionToken);
                logs = response.logs || [];
            } else {
                const response = await this.logs();
                logs = response.logs || [];
            }
            
            let filtered = logs;
            
            if (event) {
                filtered = filtered.filter(log => 
                    log.event && log.event.toLowerCase().includes(event.toLowerCase())
                );
            }
            
            if (mode) {
                filtered = filtered.filter(log => log.mode === mode);
            }
            
            if (location) {
                filtered = filtered.filter(log => 
                    log.location && log.location.toLowerCase().includes(location.toLowerCase())
                );
            }
            
            if (since) {
                const sinceDate = new Date(since);
                filtered = filtered.filter(log => new Date(log.datetime) >= sinceDate);
            }
            
            console.log(`[Tracing] 🔍 Search found ${filtered.length} matching logs`);
            return filtered;
        },

        // Private helper methods
        _storeSessionToken(token) {
            const stored = GM_getValue(STORAGE_KEYS.SESSION_TOKENS, '[]');
            const sessions = JSON.parse(stored);
            
            const newSession = {
                token,
                location: window.location.hostname,
                createdAt: new Date().toISOString(),
                url: window.location.href
            };
            
            // Avoid duplicates
            if (!sessions.find(s => s.token === token)) {
                sessions.push(newSession);
                // Keep only last 20 sessions
                if (sessions.length > 20) {
                    sessions.splice(0, sessions.length - 20);
                }
                GM_setValue(STORAGE_KEYS.SESSION_TOKENS, JSON.stringify(sessions));
            }
            
            // Store as last session
            GM_setValue(STORAGE_KEYS.LAST_SESSION, token);
            
            console.log(`[Tracing] 💾 Stored session token: ${token}`);
        },

        _getLocationToken(location) {
            const stored = this._getStoredLocationTokens();
            return stored[location.toLowerCase()] || null;
        },

        _storeLocationToken(location, token) {
            const stored = this._getStoredLocationTokens();
            stored[location.toLowerCase()] = token;
            GM_setValue(STORAGE_KEYS.LOCATION_TOKENS, JSON.stringify(stored));
        },

        _getStoredLocationTokens() {
            const stored = GM_getValue(STORAGE_KEYS.LOCATION_TOKENS, '{}');
            return JSON.parse(stored);
        }
    };

    // Auto-initialize message
    console.log(`[Tracing] 🎯 Leinad Tracing API v1.0.0 loaded`);
    console.log(`[Tracing] 💡 Usage: await tracing.logs(), tracing.sessions(), tracing.start(callback)`);
    console.log(`[Tracing] 📍 Current location: ${window.location.hostname}`);

    // Expose globally
    if (typeof unsafeWindow !== 'undefined') {
        unsafeWindow.tracing = window.tracing;
    }

})();