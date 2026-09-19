import { UmamiConfig, TrackEventOptions } from './types';
export declare class UmamiClient {
    private static instance;
    private config;
    private eventQueue;
    private appStateSubscription;
    private distinctId;
    private constructor();
    static getInstance(): UmamiClient;
    init(config?: UmamiConfig): Promise<void>;
    private isDisabled;
    private setupAppStateListener;
    private handleAppStateChange;
    trackEvent(url: string, options?: TrackEventOptions): Promise<void>;
    identifyUser(userId: string): Promise<void>;
    clearUser(): void;
    flush(): Promise<void>;
    destroy(): void;
    isInitialized(): boolean;
    getQueueSize(): number;
    getDistinctId(): string | null;
    private getDeviceContext;
    private log;
}
//# sourceMappingURL=umami-client.d.ts.map