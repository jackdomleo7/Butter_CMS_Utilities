import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Butter } from '@/types'
import { getAllPages } from './pages'
import * as fetchModule from './fetch'

// Mock the fetch module
vi.mock('./fetch', () => ({
  fetchWithRetry: vi.fn(),
}))

const mockFetchWithRetry = fetchModule.fetchWithRetry as ReturnType<typeof vi.fn>

describe('getAllPages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should fetch all pages on a single page', async () => {
    const mockPage: Butter.Page = {
      fields: {
        title: 'Home',
        description: 'Homepage',
      },
      name: 'Home',
      page_type: 'landing_page',
      published: '2023-01-01',
      scheduled: null,
      slug: 'home',
      status: 'published',
      updated: null,
    }

    const mockResponse: Butter.Response<Butter.Page[]> = {
      data: [mockPage],
      meta: {
        next_page: null,
        previous_page: null,
        count: 1,
      },
    }

    mockFetchWithRetry.mockResolvedValueOnce(mockResponse)

    const result = await getAllPages({
      token: 'test-token',
      preview: false,
      pageType: 'landing_page',
    })

    expect(result).toEqual([mockPage])
    expect(mockFetchWithRetry).toHaveBeenCalledOnce()
    expect(mockFetchWithRetry).toHaveBeenCalledWith(
      expect.stringContaining('https://api.buttercms.com/v2/pages/landing_page/'),
    )
    expect(mockFetchWithRetry).toHaveBeenCalledWith(
      expect.stringContaining('auth_token=test-token'),
    )
    expect(mockFetchWithRetry).toHaveBeenCalledWith(expect.stringContaining('page=1'))
    expect(mockFetchWithRetry).toHaveBeenCalledWith(expect.stringContaining('page_size=100'))
    expect(mockFetchWithRetry).toHaveBeenCalledWith(expect.stringContaining('levels=5'))
    expect(mockFetchWithRetry).toHaveBeenCalledWith(expect.stringContaining('alt_media_text=1'))
  })

  it('should include different page types in URL', async () => {
    const mockResponse: Butter.Response<Butter.Page[]> = {
      data: [],
      meta: { next_page: null, previous_page: null, count: 0 },
    }

    mockFetchWithRetry.mockResolvedValueOnce(mockResponse)

    await getAllPages({
      token: 'test-token',
      preview: false,
      pageType: 'product_page',
    })

    expect(mockFetchWithRetry).toHaveBeenCalledWith(expect.stringContaining('pages/product_page/'))
  })

  it('should include preview=1 in URL when preview is true', async () => {
    const mockResponse: Butter.Response<Butter.Page[]> = {
      data: [],
      meta: { next_page: null, previous_page: null, count: 0 },
    }

    mockFetchWithRetry.mockResolvedValueOnce(mockResponse)

    await getAllPages({
      token: 'test-token',
      preview: true,
      pageType: 'landing_page',
    })

    expect(mockFetchWithRetry).toHaveBeenCalledWith(expect.stringContaining('preview=1'))
  })

  it('should not include preview parameter when preview is false', async () => {
    const mockResponse: Butter.Response<Butter.Page[]> = {
      data: [],
      meta: { next_page: null, previous_page: null, count: 0 },
    }

    mockFetchWithRetry.mockResolvedValueOnce(mockResponse)

    await getAllPages({
      token: 'test-token',
      preview: false,
      pageType: 'landing_page',
    })

    const callUrl = mockFetchWithRetry.mock.calls[0]?.[0]
    expect(callUrl).not.toContain('preview=1')
  })

  it('should handle pagination across multiple pages', async () => {
    const mockPage1: Butter.Page = {
      fields: { title: 'Page 1' },
      name: 'Page 1',
      page_type: 'landing_page',
      published: '2023-01-01',
      scheduled: null,
      slug: 'page-1',
      status: 'published',
      updated: null,
    }

    const mockPage2: Butter.Page = {
      fields: { title: 'Page 2' },
      name: 'Page 2',
      page_type: 'landing_page',
      published: '2023-01-02',
      scheduled: null,
      slug: 'page-2',
      status: 'published',
      updated: null,
    }

    const mockPage1Response: Butter.Response<Butter.Page[]> = {
      data: [mockPage1],
      meta: {
        next_page: 2,
        previous_page: null,
        count: 2,
      },
    }

    const mockPage2Response: Butter.Response<Butter.Page[]> = {
      data: [mockPage2],
      meta: {
        next_page: null,
        previous_page: 1,
        count: 2,
      },
    }

    mockFetchWithRetry
      .mockResolvedValueOnce(mockPage1Response)
      .mockResolvedValueOnce(mockPage2Response)

    const result = await getAllPages({
      token: 'test-token',
      preview: false,
      pageType: 'landing_page',
    })

    expect(result).toHaveLength(2)
    expect(result[0]!.slug).toBe('page-1')
    expect(result[1]!.slug).toBe('page-2')
    expect(mockFetchWithRetry).toHaveBeenCalledTimes(2)
    expect(mockFetchWithRetry).toHaveBeenNthCalledWith(2, expect.stringContaining('page=2'))
  })

  it('should handle pagination across three pages', async () => {
    const createMockPage = (slug: string): Butter.Page => ({
      fields: { title: `Page ${slug}` },
      name: `Page ${slug}`,
      page_type: 'landing_page',
      published: '2023-01-01',
      scheduled: null,
      slug,
      status: 'published',
      updated: null,
    })

    mockFetchWithRetry
      .mockResolvedValueOnce({
        data: [createMockPage('page-1')],
        meta: { next_page: 2, previous_page: null, count: 3 },
      })
      .mockResolvedValueOnce({
        data: [createMockPage('page-2')],
        meta: { next_page: 3, previous_page: 1, count: 3 },
      })
      .mockResolvedValueOnce({
        data: [createMockPage('page-3')],
        meta: { next_page: null, previous_page: 2, count: 3 },
      })

    const result = await getAllPages({
      token: 'test-token',
      preview: false,
      pageType: 'landing_page',
    })

    expect(result).toHaveLength(3)
    expect(mockFetchWithRetry).toHaveBeenCalledTimes(3)
  })

  it('should return empty array when no pages exist', async () => {
    const mockResponse: Butter.Response<Butter.Page[]> = {
      data: [],
      meta: { next_page: null, previous_page: null, count: 0 },
    }

    mockFetchWithRetry.mockResolvedValueOnce(mockResponse)

    const result = await getAllPages({
      token: 'test-token',
      preview: false,
      pageType: 'landing_page',
    })

    expect(result).toEqual([])
    expect(mockFetchWithRetry).toHaveBeenCalledOnce()
  })

  it('should throw error on fetch failure', async () => {
    mockFetchWithRetry.mockRejectedValueOnce(new Error('API error'))

    await expect(
      getAllPages({
        token: 'test-token',
        preview: false,
        pageType: 'landing_page',
      }),
    ).rejects.toThrow('Failed to fetch page landing_page: API error')
  })

  it('should handle different error messages in fetch failure', async () => {
    mockFetchWithRetry.mockRejectedValueOnce(new Error('Network timeout'))

    await expect(
      getAllPages({
        token: 'test-token',
        preview: false,
        pageType: 'product_page',
      }),
    ).rejects.toThrow('Failed to fetch page product_page: Network timeout')
  })

  it('should handle response with null data gracefully', async () => {
    const mockResponse: Partial<Butter.Response<Butter.Page[]>> = {
      meta: { next_page: null, previous_page: null, count: 0 },
    }

    mockFetchWithRetry.mockResolvedValueOnce(mockResponse)

    const result = await getAllPages({
      token: 'test-token',
      preview: false,
      pageType: 'landing_page',
    })

    expect(result).toEqual([])
    expect(mockFetchWithRetry).toHaveBeenCalledOnce()
  })

  it('should handle response with non-array data gracefully', async () => {
    const mockResponse: Partial<Butter.Response<Butter.Page[]>> = {
      meta: { next_page: null, previous_page: null, count: 0 },
    }

    mockFetchWithRetry.mockResolvedValueOnce(mockResponse)

    const result = await getAllPages({
      token: 'test-token',
      preview: false,
      pageType: 'landing_page',
    })

    expect(result).toEqual([])
    expect(mockFetchWithRetry).toHaveBeenCalledOnce()
  })

  it('should continue pagination until next_page is null', async () => {
    const createMockPage = (slug: string): Butter.Page => ({
      fields: { title: `Page ${slug}` },
      name: `Page ${slug}`,
      page_type: 'landing_page',
      published: '2023-01-01',
      scheduled: null,
      slug,
      status: 'published',
      updated: null,
    })

    mockFetchWithRetry
      .mockResolvedValueOnce({
        data: [createMockPage('page-1')],
        meta: { next_page: 2, previous_page: null, count: 100 },
      })
      .mockResolvedValueOnce({
        data: [createMockPage('page-2')],
        meta: { next_page: null, previous_page: 1, count: 100 },
      })

    const result = await getAllPages({
      token: 'test-token',
      preview: false,
      pageType: 'landing_page',
    })

    expect(result).toHaveLength(2)
    expect(mockFetchWithRetry).toHaveBeenCalledTimes(2)
  })

  it('should handle pages with complex fields', async () => {
    const mockPage: Butter.Page = {
      fields: {
        title: 'Complex Page',
        nested: {
          field: 'value',
          array: [1, 2, 3],
        },
        images: ['img1.jpg', 'img2.jpg'],
      },
      name: 'Complex',
      page_type: 'landing_page',
      published: '2023-01-01',
      scheduled: null,
      slug: 'complex',
      status: 'published',
      updated: null,
    }

    const mockResponse: Butter.Response<Butter.Page[]> = {
      data: [mockPage],
      meta: { next_page: null, previous_page: null, count: 1 },
    }

    mockFetchWithRetry.mockResolvedValueOnce(mockResponse)

    const result = await getAllPages({
      token: 'test-token',
      preview: false,
      pageType: 'landing_page',
    })

    expect(result).toHaveLength(1)
    expect(result[0]!.fields).toEqual(mockPage.fields)
  })
})
