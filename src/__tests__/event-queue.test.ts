import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventQueue } from '../event-queue';
import type { UmamiBatchItem, UmamiEvent, UmamiIdentify } from '../types';

describe('EventQueue', () => {
  let queue: EventQueue;
  const mockHostUrl = 'https://analytics.test.com';
  const mockWebsiteId = 'test-website-id';

  const eventPayload: UmamiEvent = {
    hostname: 'com.test.app',
    language: 'en-US',
    screen: '390x844',
    title: 'Home',
    url: '/home',
    website: mockWebsiteId,
    data: {},
  };

  const identifyPayload: UmamiIdentify = {
    website: mockWebsiteId,
    hostname: 'com.test.app',
    language: 'en-US',
    screen: '390x844',
    id: 'user-123',
  };

  const eventItem: UmamiBatchItem = {
    type: 'event',
    payload: eventPayload,
  };

  const identifyItem: UmamiBatchItem = {
    type: 'identify',
    payload: identifyPayload,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    if (queue) {
      queue.destroy();
    }
  });

  it('should create a queue with default settings', () => {
    queue = new EventQueue(mockHostUrl, mockWebsiteId);
    expect(queue).toBeDefined();
    expect(queue.getQueueSize()).toBe(0);
  });

  it('should enqueue an event batch item', async () => {
    queue = new EventQueue(mockHostUrl, mockWebsiteId);
    await queue.init();

    await queue.enqueue(eventItem);
    expect(queue.getQueueSize()).toBe(1);
  });

  it('should auto-flush when batch size is reached', async () => {
    const batchSize = 3;
    queue = new EventQueue(mockHostUrl, mockWebsiteId, batchSize);
    await queue.init();

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ size: 3, processed: 3, errors: 0 }),
    });

    await queue.enqueue(eventItem);
    await queue.enqueue(eventItem);
    await queue.enqueue(eventItem);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(global.fetch).toHaveBeenCalledWith(
      `${mockHostUrl}/api/batch`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'User-Agent': expect.any(String),
        }),
      })
    );
  });

  it('should re-queue items on flush failure', async () => {
    queue = new EventQueue(mockHostUrl, mockWebsiteId, 1);
    await queue.init();

    (global.fetch as any).mockRejectedValue(new Error('Network error'));

    await queue.enqueue(eventItem);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(queue.getQueueSize()).toBe(1);
  });

  it('should add website ID to event payloads', async () => {
    queue = new EventQueue(mockHostUrl, mockWebsiteId, 10);
    await queue.init();

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ size: 1, processed: 1, errors: 0 }),
    });

    await queue.enqueue({
      type: 'event',
      payload: { ...eventPayload, website: '' },
    });
    await queue.flush();

    const fetchCall = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);

    expect(Array.isArray(body)).toBe(true);
    expect(body[0]).toEqual({
      type: 'event',
      payload: expect.objectContaining({
        website: mockWebsiteId,
      }),
    });
  });

  it('should send events in correct batch format', async () => {
    queue = new EventQueue(mockHostUrl, mockWebsiteId, 10);
    await queue.init();

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ size: 1, processed: 1, errors: 0 }),
    });

    await queue.enqueue({
      type: 'event',
      payload: { ...eventPayload, data: { custom: 'value' } },
    });
    await queue.flush();

    const fetchCall = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);

    expect(body).toEqual([
      {
        type: 'event',
        payload: expect.objectContaining({
          ...eventPayload,
          data: { custom: 'value' },
        }),
      },
    ]);
  });

  it('should send identify in correct batch format', async () => {
    queue = new EventQueue(mockHostUrl, mockWebsiteId, 10);
    await queue.init();

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ size: 1, processed: 1, errors: 0 }),
    });

    await queue.enqueue(identifyItem);
    await queue.flush();

    const fetchCall = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);

    expect(body).toEqual([
      {
        type: 'identify',
        payload: expect.objectContaining({
          ...identifyPayload,
          website: mockWebsiteId,
          id: 'user-123',
        }),
      },
    ]);
  });

  it('should send mixed event and identify items in one batch', async () => {
    queue = new EventQueue(mockHostUrl, mockWebsiteId, 10);
    await queue.init();

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ size: 2, processed: 2, errors: 0 }),
    });

    await queue.enqueue(identifyItem);
    await queue.enqueue(eventItem);
    await queue.flush();

    const fetchCall = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(fetchCall[1].body);

    expect(body).toEqual([
      {
        type: 'identify',
        payload: expect.objectContaining({ id: 'user-123' }),
      },
      {
        type: 'event',
        payload: expect.objectContaining({ url: '/home' }),
      },
    ]);
  });
});
