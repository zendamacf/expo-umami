export interface UmamiConfig {
    websiteId: string;
    hostUrl: string;
    /** When true, no events are queued or sent. Useful for development builds. */
    disabled?: boolean;
    batchSize?: number;
    batchInterval?: number;
    persistEvents?: boolean;
    debug?: boolean;
}
export interface UmamiEvent {
    hostname: string;
    language: string;
    screen: string;
    title: string;
    url: string;
    website: string;
    name?: string;
    id?: string;
    data?: Record<string, any>;
}
export interface UmamiIdentify {
    website: string;
    hostname: string;
    language: string;
    screen: string;
    id: string;
}
export type UmamiBatchItem = {
    type: 'event';
    payload: UmamiEvent;
} | {
    type: 'identify';
    payload: UmamiIdentify;
};
export interface TrackEventOptions {
    title?: string;
    eventName?: string;
    data?: Record<string, any>;
}
export type EventType = 'pageview' | 'event' | 'impression' | 'click';
export interface QueuedBatchItem {
    item: UmamiBatchItem;
    timestamp: number;
}
export interface BatchResponse {
    size: number;
    processed: number;
    errors: number;
    details?: Array<{
        index: number;
        response: any;
    }>;
}
//# sourceMappingURL=types.d.ts.map