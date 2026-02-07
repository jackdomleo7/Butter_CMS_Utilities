import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Butter } from '@/types'
import { fetchWithRetry } from './fetch'

describe('fetchWithRetry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should return data on successful fetch', async () => {
    const mockData: Butter.Response<string[]> = {
      data: ['item1', 'item2'],
      meta: {
        next_page: null,
        previous_page: null,
        count: 2,
      },
    }

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    const result = await fetchWithRetry<string[]>('https://api.example.com/test')

    expect(result).toEqual(mockData)
    expect(globalThis.fetch).toHaveBeenCalledOnce()
    expect(globalThis.fetch).toHaveBeenCalledWith('https://api.example.com/test')
  })

  it('should retry on failure and succeed on second attempt', async () => {
    const mockData: Butter.Response<string[]> = {
      data: ['item1'],
      meta: { next_page: null, previous_page: null, count: 1 },
    }

    globalThis.fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

    const result = await fetchWithRetry<string[]>('https://api.example.com/test', 3)

    expect(result).toEqual(mockData)
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })

  it('should retry on HTTP error (not ok)', async () => {
    const mockData: Butter.Response<string[]> = {
      data: ['item1'],
      meta: { next_page: null, previous_page: null, count: 1 },
    }

    globalThis.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

    const result = await fetchWithRetry<string[]>('https://api.example.com/test', 3)

    expect(result).toEqual(mockData)
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })

  it('should throw error after all retries are exhausted', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    await expect(fetchWithRetry('https://api.example.com/test', 3)).rejects.toThrow('Network error')
    expect(globalThis.fetch).toHaveBeenCalledTimes(3)
  })

  it('should throw HTTP error after all retries are exhausted', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    })

    await expect(fetchWithRetry('https://api.example.com/test', 2)).rejects.toThrow(
      'HTTP 404: Not Found',
    )
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })

  it('should use default maxRetries of 3', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    await expect(fetchWithRetry('https://api.example.com/test')).rejects.toThrow('Network error')
    expect(globalThis.fetch).toHaveBeenCalledTimes(3)
  })

  it('should exponentially backoff with retry delays', async () => {
    const mockData: Butter.Response<unknown> = {
      data: {},
      meta: { next_page: null, previous_page: null, count: 0 },
    }

    globalThis.fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error('Attempt 1'))
      .mockRejectedValueOnce(new Error('Attempt 2'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

    const startTime = Date.now()
    await fetchWithRetry('https://api.example.com/test', 3)
    const duration = Date.now() - startTime

    // Should have at least 1000ms + 2000ms = 3000ms of delays
    expect(duration).toBeGreaterThanOrEqual(3000)
    expect(globalThis.fetch).toHaveBeenCalledTimes(3)
  })

  it('should handle generic type parameter', async () => {
    interface CustomData {
      id: number
      name: string
    }

    const mockData: Butter.Response<CustomData[]> = {
      data: [
        { id: 1, name: 'Test' },
        { id: 2, name: 'Item' },
      ],
      meta: { next_page: null, previous_page: null, count: 2 },
    }

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    const result = await fetchWithRetry<CustomData[]>('https://api.example.com/test')

    expect(result.data).toHaveLength(2)
    expect(result.data[0]).toBeDefined()
    expect(result.data[0]?.id).toBe(1)
    expect(result.data[0]?.name).toBe('Test')
  })

  it('should succeed on first attempt without retries', async () => {
    const mockData: Butter.Response<string> = {
      data: 'success',
      meta: { next_page: null, previous_page: null, count: 1 },
    }

    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    })

    await fetchWithRetry('https://api.example.com/test', 1)

    expect(globalThis.fetch).toHaveBeenCalledTimes(1)
  })
})
