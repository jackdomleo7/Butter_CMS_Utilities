import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Butter } from '@/types'
import { getAllCollections } from './collections'
import * as fetchModule from './fetch'

// Mock the fetch module
vi.mock('./fetch', () => ({
  fetchWithRetry: vi.fn(),
}))

const mockFetchWithRetry = fetchModule.fetchWithRetry as ReturnType<typeof vi.fn>

describe('getAllCollections', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should fetch all collections on a single page', async () => {
    const mockCollection: Butter.Collection = {
      id: 1,
      name: 'Collection 1',
      description: 'A test collection',
    }

    const mockResponse: Butter.Response<{ test_collection: Butter.Collection[] }> = {
      data: { test_collection: [mockCollection] },
      meta: {
        next_page: null,
        previous_page: null,
        count: 1,
      },
    }

    mockFetchWithRetry.mockResolvedValueOnce(mockResponse)

    const result = await getAllCollections({
      token: 'test-token',
      preview: false,
      collectionType: 'test_collection',
    })

    expect(result).toEqual([mockCollection])
    expect(mockFetchWithRetry).toHaveBeenCalledOnce()
    expect(mockFetchWithRetry).toHaveBeenCalledWith(
      expect.stringContaining('https://api.buttercms.com/v2/content/test_collection/'),
    )
    expect(mockFetchWithRetry).toHaveBeenCalledWith(
      expect.stringContaining('auth_token=test-token'),
    )
    expect(mockFetchWithRetry).toHaveBeenCalledWith(expect.stringContaining('page=1'))
    expect(mockFetchWithRetry).toHaveBeenCalledWith(expect.stringContaining('page_size=100'))
    expect(mockFetchWithRetry).toHaveBeenCalledWith(expect.stringContaining('levels=5'))
    expect(mockFetchWithRetry).toHaveBeenCalledWith(expect.stringContaining('alt_media_text=1'))
  })

  it('should include different collection types in URL', async () => {
    const mockResponse: Butter.Response<{ products: Butter.Collection[] }> = {
      data: { products: [] },
      meta: { next_page: null, previous_page: null, count: 0 },
    }

    mockFetchWithRetry.mockResolvedValueOnce(mockResponse)

    await getAllCollections({
      token: 'test-token',
      preview: false,
      collectionType: 'products',
    })

    expect(mockFetchWithRetry).toHaveBeenCalledWith(expect.stringContaining('content/products/'))
  })

  it('should include preview=1 in URL when preview is true', async () => {
    const mockResponse: Butter.Response<{ test_collection: Butter.Collection[] }> = {
      data: { test_collection: [] },
      meta: { next_page: null, previous_page: null, count: 0 },
    }

    mockFetchWithRetry.mockResolvedValueOnce(mockResponse)

    await getAllCollections({
      token: 'test-token',
      preview: true,
      collectionType: 'test_collection',
    })

    expect(mockFetchWithRetry).toHaveBeenCalledWith(expect.stringContaining('preview=1'))
  })

  it('should not include preview parameter when preview is false', async () => {
    const mockResponse: Butter.Response<{ test_collection: Butter.Collection[] }> = {
      data: { test_collection: [] },
      meta: { next_page: null, previous_page: null, count: 0 },
    }

    mockFetchWithRetry.mockResolvedValueOnce(mockResponse)

    await getAllCollections({
      token: 'test-token',
      preview: false,
      collectionType: 'test_collection',
    })

    const callUrl = mockFetchWithRetry.mock.calls[0]?.[0]
    expect(callUrl).not.toContain('preview=1')
  })

  it('should handle pagination across multiple pages', async () => {
    const mockCollection1: Butter.Collection = {
      id: 1,
      name: 'Item 1',
    }

    const mockCollection2: Butter.Collection = {
      id: 2,
      name: 'Item 2',
    }

    const mockPage1Response: Butter.Response<{ test_collection: Butter.Collection[] }> = {
      data: { test_collection: [mockCollection1] },
      meta: {
        next_page: 2,
        previous_page: null,
        count: 2,
      },
    }

    const mockPage2Response: Butter.Response<{ test_collection: Butter.Collection[] }> = {
      data: { test_collection: [mockCollection2] },
      meta: {
        next_page: null,
        previous_page: 1,
        count: 2,
      },
    }

    mockFetchWithRetry
      .mockResolvedValueOnce(mockPage1Response)
      .mockResolvedValueOnce(mockPage2Response)

    const result = await getAllCollections({
      token: 'test-token',
      preview: false,
      collectionType: 'test_collection',
    })

    expect(result).toHaveLength(2)
    expect(result[0]!.id).toBe(1)
    expect(result[1]!.id).toBe(2)
    expect(mockFetchWithRetry).toHaveBeenCalledTimes(2)
    expect(mockFetchWithRetry).toHaveBeenNthCalledWith(2, expect.stringContaining('page=2'))
  })

  it('should handle pagination across five pages', async () => {
    const createMockCollection = (id: number): Butter.Collection => ({
      id,
      name: `Item ${id}`,
    })

    mockFetchWithRetry
      .mockResolvedValueOnce({
        data: { test_collection: [createMockCollection(1)] },
        meta: { next_page: 2, previous_page: null, count: 5 },
      })
      .mockResolvedValueOnce({
        data: { test_collection: [createMockCollection(2)] },
        meta: { next_page: 3, previous_page: 1, count: 5 },
      })
      .mockResolvedValueOnce({
        data: { test_collection: [createMockCollection(3)] },
        meta: { next_page: 4, previous_page: 2, count: 5 },
      })
      .mockResolvedValueOnce({
        data: { test_collection: [createMockCollection(4)] },
        meta: { next_page: 5, previous_page: 3, count: 5 },
      })
      .mockResolvedValueOnce({
        data: { test_collection: [createMockCollection(5)] },
        meta: { next_page: null, previous_page: 4, count: 5 },
      })

    const result = await getAllCollections({
      token: 'test-token',
      preview: false,
      collectionType: 'test_collection',
    })

    expect(result).toHaveLength(5)
    expect(mockFetchWithRetry).toHaveBeenCalledTimes(5)
  })

  it('should return empty array when no collections exist', async () => {
    const mockResponse: Butter.Response<{ test_collection: Butter.Collection[] }> = {
      data: { test_collection: [] },
      meta: { next_page: null, previous_page: null, count: 0 },
    }

    mockFetchWithRetry.mockResolvedValueOnce(mockResponse)

    const result = await getAllCollections({
      token: 'test-token',
      preview: false,
      collectionType: 'test_collection',
    })

    expect(result).toEqual([])
    expect(mockFetchWithRetry).toHaveBeenCalledOnce()
  })

  it('should throw error on fetch failure', async () => {
    mockFetchWithRetry.mockRejectedValueOnce(new Error('API error'))

    await expect(
      getAllCollections({
        token: 'test-token',
        preview: false,
        collectionType: 'test_collection',
      }),
    ).rejects.toThrow('Failed to fetch collection test_collection: API error')
  })

  it('should handle different error messages in fetch failure', async () => {
    mockFetchWithRetry.mockRejectedValueOnce(new Error('Network timeout'))

    await expect(
      getAllCollections({
        token: 'test-token',
        preview: false,
        collectionType: 'products',
      }),
    ).rejects.toThrow('Failed to fetch collection products: Network timeout')
  })

  it('should handle response with null data gracefully', async () => {
    const mockResponse: Partial<Butter.Response<{ test_collection: Butter.Collection[] }>> = {
      meta: { next_page: null, previous_page: null, count: 0 },
    }

    mockFetchWithRetry.mockResolvedValueOnce(mockResponse)

    const result = await getAllCollections({
      token: 'test-token',
      preview: false,
      collectionType: 'test_collection',
    })

    expect(result).toEqual([])
    expect(mockFetchWithRetry).toHaveBeenCalledOnce()
  })

  it('should handle response with non-array data gracefully', async () => {
    const mockResponse: Partial<Butter.Response<{ test_collection: Butter.Collection[] }>> = {
      meta: { next_page: null, previous_page: null, count: 0 },
    }

    mockFetchWithRetry.mockResolvedValueOnce(mockResponse)

    const result = await getAllCollections({
      token: 'test-token',
      preview: false,
      collectionType: 'test_collection',
    })

    expect(result).toEqual([])
    expect(mockFetchWithRetry).toHaveBeenCalledOnce()
  })

  it('should continue pagination until next_page is null', async () => {
    const createMockCollection = (id: number): Butter.Collection => ({
      id,
      name: `Item ${id}`,
    })

    mockFetchWithRetry
      .mockResolvedValueOnce({
        data: { test_collection: [createMockCollection(1)] },
        meta: { next_page: 2, previous_page: null, count: 100 },
      })
      .mockResolvedValueOnce({
        data: { test_collection: [createMockCollection(2)] },
        meta: { next_page: null, previous_page: 1, count: 100 },
      })

    const result = await getAllCollections({
      token: 'test-token',
      preview: false,
      collectionType: 'test_collection',
    })

    expect(result).toHaveLength(2)
    expect(mockFetchWithRetry).toHaveBeenCalledTimes(2)
  })

  it('should handle collections with complex nested data', async () => {
    const mockCollection: Butter.Collection = {
      id: 1,
      name: 'Complex Collection',
      metadata: {
        tags: ['tag1', 'tag2'],
        nested: {
          level2: {
            value: 'test',
          },
        },
      },
      items: [
        { id: 1, title: 'Item 1' },
        { id: 2, title: 'Item 2' },
      ],
    }

    const mockResponse: Butter.Response<{ test_collection: Butter.Collection[] }> = {
      data: { test_collection: [mockCollection] },
      meta: { next_page: null, previous_page: null, count: 1 },
    }

    mockFetchWithRetry.mockResolvedValueOnce(mockResponse)

    const result = await getAllCollections({
      token: 'test-token',
      preview: false,
      collectionType: 'test_collection',
    })

    expect(result).toHaveLength(1)
    expect(result[0]!.metadata).toEqual(mockCollection.metadata)
    expect(result[0]!.items).toEqual(mockCollection.items)
  })

  it('should handle multiple collections on one page', async () => {
    const mockCollections: Butter.Collection[] = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' },
      { id: 4, name: 'Item 4' },
      { id: 5, name: 'Item 5' },
    ]

    const mockResponse: Butter.Response<{ test_collection: Butter.Collection[] }> = {
      data: { test_collection: mockCollections },
      meta: { next_page: null, previous_page: null, count: 5 },
    }

    mockFetchWithRetry.mockResolvedValueOnce(mockResponse)

    const result = await getAllCollections({
      token: 'test-token',
      preview: false,
      collectionType: 'test_collection',
    })

    expect(result).toHaveLength(5)
    expect(result).toEqual(mockCollections)
    expect(mockFetchWithRetry).toHaveBeenCalledOnce()
  })
})
