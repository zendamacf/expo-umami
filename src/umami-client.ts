import { AppState, AppStateStatus, Dimensions } from 'react-native';
import * as Application from 'expo-application';
import * as Localization from 'expo-localization';
import Constants from 'expo-constants';
import { UmamiConfig, UmamiEvent, UmamiIdentify, TrackEventOptions } from './types';
import { EventQueue } from './event-queue';

export class UmamiClient {
  private static instance: UmamiClient | null = null;
  private config: UmamiConfig | null = null;
  private eventQueue: EventQueue | null = null;
  private appStateSubscription: any = null;
  private distinctId: string | null = null;

  private constructor() {}

  static getInstance(): UmamiClient {
    if (!UmamiClient.instance) {
      UmamiClient.instance = new UmamiClient();
    }
    return UmamiClient.instance;
  }

  async init(config?: UmamiConfig): Promise<void> {
    if (this.config) {
      console.warn('[expo-umami] Already initialized. Ignoring init call.');
      return;
    }

    let finalConfig: UmamiConfig;

    if (config) {
      finalConfig = config;
    } else {
      const pluginConfig = Constants.expoConfig?.extra?.umami;
      if (!pluginConfig) {
        throw new Error(
          '[expo-umami] No configuration provided. Either pass config to init() or configure via app.json plugin.'
        );
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

    this.eventQueue = new EventQueue(
      this.config.hostUrl,
      this.config.websiteId,
      this.config.batchSize,
      this.config.batchInterval,
      this.config.persistEvents,
      this.config.debug
    );

    await this.eventQueue.init();
    this.setupAppStateListener();

    this.log('Umami client initialized', this.config);
  }

  private isDisabled(): boolean {
    return this.config?.disabled === true;
  }

  private setupAppStateListener(): void {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange.bind(this)
    );
  }

  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      this.log('App backgrounded, flushing queue');
      this.flush();
    }
  }

  async trackEvent(url: string, options: TrackEventOptions = {}): Promise<void> {
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

    const payload: UmamiEvent = {
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

  async identifyUser(userId: string): Promise<void> {
    if (!this.config || !this.eventQueue) {
      throw new Error('[expo-umami] Client not initialized. Call init() first.');
    }

    const trimmedUserId = userId.trim();
    if (!trimmedUserId) {
      return;
    }

    this.distinctId = trimmedUserId;

    const payload: UmamiIdentify = {
      ...this.getDeviceContext(),
      website: this.config.websiteId,
      id: trimmedUserId,
    };

    this.log('Identifying user', { id: trimmedUserId });

    await this.eventQueue.enqueue({ type: 'identify', payload });
  }

  clearUser(): void {
    this.distinctId = null;
  }

  async flush(): Promise<void> {
    if (this.eventQueue) {
      await this.eventQueue.flush();
    }
  }

  destroy(): void {
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

  isInitialized(): boolean {
    return this.config !== null;
  }

  getQueueSize(): number {
    return this.eventQueue?.getQueueSize() || 0;
  }

  getDistinctId(): string | null {
    return this.distinctId;
  }

  private getDeviceContext(): Pick<UmamiEvent, 'hostname' | 'language' | 'screen'> {
    const { width, height } = Dimensions.get('window');
    const locale = Localization.getLocales()[0]?.languageTag || 'en-US';

    return {
      hostname: Application.applicationId ?? 'unknown.app',
      language: locale,
      screen: `${Math.round(width)}x${Math.round(height)}`,
    };
  }

  private log(...args: any[]): void {
    if (this.config?.debug) {
      console.log('[expo-umami]', ...args);
    }
  }
}
