import { UmamiBatchItem } from './types';
export declare class EventQueue {
    private queue;
    private batchSize;
    private batchInterval;
    private persistEvents;
    private debug;
    private intervalId?;
    private hostUrl;
    private websiteId;
    private isFlushing;
    private userAgent;
    constructor(hostUrl: string, websiteId: string, batchSize?: number, batchInterval?: number, persistEvents?: boolean, debug?: boolean);
    init(): Promise<void>;
    private loadPersistedEvents;
    private persistQueue;
    private withWebsiteId;
    enqueue(item: UmamiBatchItem): Promise<void>;
    flush(): Promise<void>;
    private sendBatch;
    destroy(): void;
    private log;
    getQueueSize(): number;
}
//# sourceMappingURL=event-queue.d.ts.map