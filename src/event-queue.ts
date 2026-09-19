import AsyncStorage from '@react-native-async-storage/async-storage';
import { BatchResponse, QueuedBatchItem, UmamiBatchItem } from './types';
import { buildUserAgent } from './user-agent';

const STORAGE_KEY = '@expo-umami/event-queue';

export class EventQueue {
  private queue: QueuedBatchItem[] = [];
  private batchSize: number;
  private batchInterval: number;
  private persistEvents: boolean;
  private debug: boolean;
  private intervalId?: NodeJS.Timeout;
  private hostUrl: string;
  private websiteId: string;
  private isFlushing = false;
  private userAgent: string;

  constructor(
    hostUrl: string,
    websiteId: string,
    batchSize = 10,
    batchInterval = 30000,
    persistEvents = false,
    debug = false
  ) {
    this.hostUrl = hostUrl;
    this.websiteId = websiteId;
    this.batchSize = batchSize;
    this.batchInterval = batchInterval;
    this.persistEvents = persistEvents;
    this.debug = debug;
    this.userAgent = buildUserAgent();
  }

  async init(): Promise<void> {
    if (this.persistEvents) {
      await this.loadPersistedEvents();
    }

    this.intervalId = setInterval(() => {
      this.flush();
    }, this.batchInterval);
  }

  private async loadPersistedEvents(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        this.log(`Loaded ${this.queue.length} persisted events`);
      }
    } catch (error) {
      this.log('Error loading persisted events:', error);
    }
  }

  private async persistQueue(): Promise<void> {
    if (!this.persistEvents) return;

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      this.log('Error persisting queue:', error);
    }
  }

  private withWebsiteId(item: UmamiBatchItem): UmamiBatchItem {
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

  async enqueue(item: UmamiBatchItem): Promise<void> {
    const queuedItem: QueuedBatchItem = {
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

  async flush(): Promise<void> {
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
    } catch (error) {
      this.log('Error sending batch, re-queuing items:', error);
      this.queue = [...itemsToSend, ...this.queue];

      if (this.persistEvents) {
        await this.persistQueue();
      }
    } finally {
      this.isFlushing = false;
    }
  }

  private async sendBatch(items: UmamiBatchItem[]): Promise<BatchResponse> {
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

  destroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private log(...args: any[]): void {
    if (this.debug) {
      console.log('[expo-umami]', ...args);
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}
