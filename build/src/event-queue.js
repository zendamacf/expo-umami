"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventQueue = void 0;
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const user_agent_1 = require("./user-agent");
const STORAGE_KEY = '@expo-umami/event-queue';
class EventQueue {
    constructor(hostUrl, websiteId, batchSize = 10, batchInterval = 30000, persistEvents = false, debug = false) {
        this.queue = [];
        this.isFlushing = false;
        this.hostUrl = hostUrl;
        this.websiteId = websiteId;
        this.batchSize = batchSize;
        this.batchInterval = batchInterval;
        this.persistEvents = persistEvents;
        this.debug = debug;
        this.userAgent = (0, user_agent_1.buildUserAgent)();
    }
    async init() {
        if (this.persistEvents) {
            await this.loadPersistedEvents();
        }
        this.intervalId = setInterval(() => {
            this.flush();
        }, this.batchInterval);
    }
    async loadPersistedEvents() {
        try {
            const stored = await async_storage_1.default.getItem(STORAGE_KEY);
            if (stored) {
                this.queue = JSON.parse(stored);
                this.log(`Loaded ${this.queue.length} persisted events`);
            }
        }
        catch (error) {
            this.log('Error loading persisted events:', error);
        }
    }
    async persistQueue() {
        if (!this.persistEvents)
            return;
        try {
            await async_storage_1.default.setItem(STORAGE_KEY, JSON.stringify(this.queue));
        }
        catch (error) {
            this.log('Error persisting queue:', error);
        }
    }
    withWebsiteId(item) {
        if (item.type === 'event') {
            return {
                type: 'event',
                payload: {
                    ...item.payload,
                    website: this.websiteId,
                },
            };
        }
        return {
            type: 'identify',
            payload: {
                ...item.payload,
                website: this.websiteId,
            },
        };
    }
    async enqueue(item) {
        const queuedItem = {
            item: this.withWebsiteId(item),
            timestamp: Date.now(),
        };
        this.queue.push(queuedItem);
        this.log(`Queued ${item.type}. Queue size: ${this.queue.length}`);
        if (this.persistEvents) {
            await this.persistQueue();
        }
        if (this.queue.length >= this.batchSize) {
            await this.flush();
        }
    }
    async flush() {
        if (this.queue.length === 0 || this.isFlushing) {
            return;
        }
        this.isFlushing = true;
        const itemsToSend = [...this.queue];
        this.queue = [];
        this.log(`Flushing ${itemsToSend.length} items`);
        try {
            const response = await this.sendBatch(itemsToSend.map((entry) => entry.item));
            this.log('Batch sent successfully:', response);
            if (this.persistEvents) {
                await this.persistQueue();
            }
        }
        catch (error) {
            this.log('Error sending batch, re-queuing items:', error);
            this.queue = [...itemsToSend, ...this.queue];
            if (this.persistEvents) {
                await this.persistQueue();
            }
        }
        finally {
            this.isFlushing = false;
        }
    }
    async sendBatch(items) {
        const url = `${this.hostUrl}/api/batch`;
        this.log(`Sending batch to ${url}`, items);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': this.userAgent,
            },
            body: JSON.stringify(items),
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
    }
    destroy() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }
    log(...args) {
        if (this.debug) {
            console.log('[expo-umami]', ...args);
        }
    }
    getQueueSize() {
        return this.queue.length;
    }
}
exports.EventQueue = EventQueue;
