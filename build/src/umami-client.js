"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UmamiClient = void 0;
const react_native_1 = require("react-native");
const Application = __importStar(require("expo-application"));
const Localization = __importStar(require("expo-localization"));
const expo_constants_1 = __importDefault(require("expo-constants"));
const event_queue_1 = require("./event-queue");
class UmamiClient {
    constructor() {
        this.config = null;
        this.eventQueue = null;
        this.appStateSubscription = null;
        this.distinctId = null;
    }
    static getInstance() {
        if (!UmamiClient.instance) {
            UmamiClient.instance = new UmamiClient();
        }
        return UmamiClient.instance;
    }
    async init(config) {
        if (this.config) {
            console.warn('[expo-umami] Already initialized. Ignoring init call.');
            return;
        }
        let finalConfig;
        if (config) {
            finalConfig = config;
        }
        else {
            const pluginConfig = expo_constants_1.default.expoConfig?.extra?.umami;
            if (!pluginConfig) {
                throw new Error('[expo-umami] No configuration provided. Either pass config to init() or configure via app.json plugin.');
            }
            finalConfig = pluginConfig;
        }
        this.config = {
            batchSize: 10,
            batchInterval: 30000,
            persistEvents: false,
            debug: false,
            disabled: false,
            ...finalConfig,
        };
        if (this.config.disabled) {
            this.log('[expo-umami] Umami client initialized (disabled)');
            return;
        }
        this.eventQueue = new event_queue_1.EventQueue(this.config.hostUrl, this.config.websiteId, this.config.batchSize, this.config.batchInterval, this.config.persistEvents, this.config.debug);
        await this.eventQueue.init();
        this.setupAppStateListener();
        this.log('Umami client initialized', this.config);
    }
    isDisabled() {
        return this.config?.disabled === true;
    }
    setupAppStateListener() {
        this.appStateSubscription = react_native_1.AppState.addEventListener('change', this.handleAppStateChange.bind(this));
    }
    handleAppStateChange(nextAppState) {
        if (nextAppState === 'background' || nextAppState === 'inactive') {
            this.log('App backgrounded, flushing queue');
            this.flush();
        }
    }
    async trackEvent(url, options = {}) {
        if (!this.config) {
            throw new Error('[expo-umami] Client not initialized. Call init() first.');
        }
        if (this.isDisabled()) {
            return;
        }
        if (!this.eventQueue) {
            throw new Error('[expo-umami] Client not initialized. Call init() first.');
        }
        const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
        const context = this.getDeviceContext();
        const payload = {
            ...context,
            title: options.title || url,
            url: normalizedUrl,
            website: this.config.websiteId,
            ...(options.eventName ? { name: options.eventName } : {}),
            ...(this.distinctId ? { id: this.distinctId } : {}),
            data: options.data || {},
        };
        this.log(`Tracking event: ${url}${options.eventName ? ` (${options.eventName})` : ''}`, payload);
        await this.eventQueue.enqueue({ type: 'event', payload });
    }
    async identifyUser(userId) {
        if (!this.config || !this.eventQueue) {
            throw new Error('[expo-umami] Client not initialized. Call init() first.');
        }
        const trimmedUserId = userId.trim();
        if (!trimmedUserId) {
            return;
        }
        this.distinctId = trimmedUserId;
        const payload = {
            ...this.getDeviceContext(),
            website: this.config.websiteId,
            id: trimmedUserId,
        };
        this.log('Identifying user', { id: trimmedUserId });
        await this.eventQueue.enqueue({ type: 'identify', payload });
    }
    clearUser() {
        this.distinctId = null;
    }
    async flush() {
        if (this.eventQueue) {
            await this.eventQueue.flush();
        }
    }
    destroy() {
        if (this.eventQueue) {
            this.eventQueue.destroy();
            this.eventQueue = null;
        }
        if (this.appStateSubscription) {
            this.appStateSubscription.remove();
            this.appStateSubscription = null;
        }
        this.distinctId = null;
        this.config = null;
        UmamiClient.instance = null;
    }
    isInitialized() {
        return this.config !== null;
    }
    getQueueSize() {
        return this.eventQueue?.getQueueSize() || 0;
    }
    getDistinctId() {
        return this.distinctId;
    }
    getDeviceContext() {
        const { width, height } = react_native_1.Dimensions.get('window');
        const locale = Localization.getLocales()[0]?.languageTag || 'en-US';
        return {
            hostname: Application.applicationId ?? 'unknown.app',
            language: locale,
            screen: `${Math.round(width)}x${Math.round(height)}`,
        };
    }
    log(...args) {
        if (this.config?.debug) {
            console.log('[expo-umami]', ...args);
        }
    }
}
exports.UmamiClient = UmamiClient;
UmamiClient.instance = null;
