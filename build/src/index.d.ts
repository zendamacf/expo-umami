import { TrackEventOptions, UmamiConfig } from "./types";
export { TrackEventOptions, UmamiConfig } from "./types";
export declare function initUmami(config?: UmamiConfig): Promise<void>;
export declare function isInitialized(): boolean;
export declare function flush(): Promise<void>;
export declare function getQueueSize(): number;
export declare function trackEvent(screenName: string, options?: TrackEventOptions): Promise<void>;
export declare function trackScreenView(screenName: string, options?: TrackEventOptions): Promise<void>;
export declare function trackClick(elementName: string, options?: Omit<TrackEventOptions, "eventName">): Promise<void>;
export declare function trackImpression(elementName: string, options?: Omit<TrackEventOptions, "eventName">): Promise<void>;
export declare function trackCustomEvent(url: string, eventName: string, options?: Omit<TrackEventOptions, "eventName">): Promise<void>;
export declare function identifyUser(userId: string): Promise<void>;
export declare function clearUser(): void;
//# sourceMappingURL=index.d.ts.map