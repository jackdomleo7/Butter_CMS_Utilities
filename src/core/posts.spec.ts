import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { Butter } from '@/types'
import { getAllPosts } from './posts'
import * as fetchModule from './fetch'

// Mock the fetch module
vi.mock('./fetch', () => ({
  fetchWithRetry: vi.fn(),
}))

const mockFetchWithRetry = fetchModule.fetchWithRetry as ReturnType<typeof vi.fn>

describe('getAllPosts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should fetch all posts on a single page', async () => {
    const mockPost: Butter.Post = {
      author: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        slug: 'john-doe',
        bio: 'A writer',
        title: 'Author',
        linkedin_url: '',
        facebook_url: '',
        pinterest_url: '',
        instagram_url: '',
        twitter_handle: '',
        profile_image: '',
      },
      body: 'Content',
      categories: [],
      created: '2023-01-01',
      featured_image: null,
      featured_image_alt: '',
      meta_description: 'Description',
      published: '2023-01-01',
      scheduled: null,
      seo_title: 'Title',
      slug: 'test-post',
      status: 'published',
      summary: 'Summary',
      tags: [],
      title: 'Test Post',
      updated: null,
      url: 'https://example.com/test',
    }

    const mockResponse: Butter.Response<Butter.Post[]> = {
      data: [mockPost],
      meta: {
        next_page: null,
        previous_page: null,
        count: 1,
      },
    }

    mockFetchWithRetry.mockResolvedValueOnce(mockResponse)

    const result = await getAllPosts({
      token: 'test-token',
      preview: false,
    })

    expect(result).toEqual([mockPost])
    expect(mockFetchWithRetry).toHaveBeenCalledOnce()
    expect(mockFetchWithRetry).toHaveBeenCalledWith(
      expect.stringContaining('https://api.buttercms.com/v2/posts/'),
    )
    expect(mockFetchWithRetry).toHaveBeenCalledWith(
      expect.stringContaining('auth_token=test-token'),
    )
    expect(mockFetchWithRetry).toHaveBeenCalledWith(expect.stringContaining('page=1'))
    expect(mockFetchWithRetry).toHaveBeenCalledWith(expect.stringContaining('page_size=100'))
  })

  it('should include preview=1 in URL when preview is true', async () => {
    const mockResponse: Butter.Response<Butter.Post[]> = {
      data: [],
      meta: { next_page: null, previous_page: null, count: 0 },
    }

    mockFetchWithRetry.mockResolvedValueOnce(mockResponse)

    await getAllPosts({
      token: 'test-token',
      preview: true,
    })

    expect(mockFetchWithRetry).toHaveBeenCalledWith(expect.stringContaining('preview=1'))
  })

  it('should not include preview parameter when preview is false', async () => {
    const mockResponse: Butter.Response<Butter.Post[]> = {
      data: [],
      meta: { next_page: null, previous_page: null, count: 0 },
    }

    mockFetchWithRetry.mockResolvedValueOnce(mockResponse)

    await getAllPosts({
      token: 'test-token',
      preview: false,
    })

    const callUrl = mockFetchWithRetry.mock.calls[0]?.[0]
    expect(callUrl).not.toContain('preview=1')
  })

  it('should handle pagination across multiple pages', async () => {
    const mockPost1: Butter.Post = {
      author: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        slug: 'john-doe',
        bio: 'A writer',
        title: 'Author',
        linkedin_url: '',
        facebook_url: '',
        pinterest_url: '',
        instagram_url: '',
        twitter_handle: '',
        profile_image: '',
      },
      body: 'Content 1',
      categories: [],
      created: '2023-01-01',
      featured_image: null,
      featured_image_alt: '',
      meta_description: 'Description 1',
      published: '2023-01-01',
      scheduled: null,
      seo_title: 'Title 1',
      slug: 'post-1',
      status: 'published',
      summary: 'Summary 1',
      tags: [],
      title: 'Post 1',
      updated: null,
      url: 'https://example.com/1',
    }

    const mockPost2: Butter.Post = {
      ...mockPost1,
      body: 'Content 2',
      meta_description: 'Description 2',
      seo_title: 'Title 2',
      slug: 'post-2',
      summary: 'Summary 2',
      title: 'Post 2',
      url: 'https://example.com/2',
    }

    const mockPage1Response: Butter.Response<Butter.Post[]> = {
      data: [mockPost1],
      meta: {
        next_page: 2,
        previous_page: null,
        count: 2,
      },
    }

    const mockPage2Response: Butter.Response<Butter.Post[]> = {
      data: [mockPost2],
      meta: {
        next_page: null,
        previous_page: 1,
        count: 2,
      },
    }

    mockFetchWithRetry
      .mockResolvedValueOnce(mockPage1Response)
      .mockResolvedValueOnce(mockPage2Response)

    const result = await getAllPosts({
      token: 'test-token',
      preview: false,
    })

    expect(result).toHaveLength(2)
    expect(result[0]!.slug).toBe('post-1')
    expect(result[1]!.slug).toBe('post-2')
    expect(mockFetchWithRetry).toHaveBeenCalledTimes(2)
    expect(mockFetchWithRetry).toHaveBeenNthCalledWith(2, expect.stringContaining('page=2'))
  })

  it('should handle pagination across three pages', async () => {
    const createMockPost = (slug: string): Butter.Post => ({
      author: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        slug: 'john-doe',
        bio: 'A writer',
        title: 'Author',
        linkedin_url: '',
        facebook_url: '',
        pinterest_url: '',
        instagram_url: '',
        twitter_handle: '',
        profile_image: '',
      },
      body: `Content ${slug}`,
      categories: [],
      created: '2023-01-01',
      featured_image: null,
      featured_image_alt: '',
      meta_description: `Description ${slug}`,
      published: '2023-01-01',
      scheduled: null,
      seo_title: `Title ${slug}`,
      slug,
      status: 'published',
      summary: `Summary ${slug}`,
      tags: [],
      title: `Post ${slug}`,
      updated: null,
      url: `https://example.com/${slug}`,
    })

    mockFetchWithRetry
      .mockResolvedValueOnce({
        data: [createMockPost('post-1')],
        meta: { next_page: 2, previous_page: null, count: 3 },
      })
      .mockResolvedValueOnce({
        data: [createMockPost('post-2')],
        meta: { next_page: 3, previous_page: 1, count: 3 },
      })
      .mockResolvedValueOnce({
        data: [createMockPost('post-3')],
        meta: { next_page: null, previous_page: 2, count: 3 },
      })

    const result = await getAllPosts({
      token: 'test-token',
      preview: false,
    })

    expect(result).toHaveLength(3)
    expect(mockFetchWithRetry).toHaveBeenCalledTimes(3)
  })

  it('should return empty array when no posts exist', async () => {
    const mockResponse: Butter.Response<Butter.Post[]> = {
      data: [],
      meta: { next_page: null, previous_page: null, count: 0 },
    }

    mockFetchWithRetry.mockResolvedValueOnce(mockResponse)

    const result = await getAllPosts({
      token: 'test-token',
      preview: false,
    })

    expect(result).toEqual([])
    expect(mockFetchWithRetry).toHaveBeenCalledOnce()
  })

  it('should throw error on fetch failure', async () => {
    mockFetchWithRetry.mockRejectedValueOnce(new Error('API error'))

    await expect(
      getAllPosts({
        token: 'test-token',
        preview: false,
      }),
    ).rejects.toThrow('Failed to fetch posts: API error')
  })

  it('should handle response with null data gracefully', async () => {
    const mockResponse: Partial<Butter.Response<Butter.Post[]>> = {
      meta: { next_page: null, previous_page: null, count: 0 },
    }

    mockFetchWithRetry.mockResolvedValueOnce(mockResponse)

    const result = await getAllPosts({
      token: 'test-token',
      preview: false,
    })

    expect(result).toEqual([])
    expect(mockFetchWithRetry).toHaveBeenCalledOnce()
  })

  it('should handle response with non-array data gracefully', async () => {
    const mockResponse: Partial<Butter.Response<Butter.Post[]>> = {
      meta: { next_page: null, previous_page: null, count: 0 },
    }

    mockFetchWithRetry.mockResolvedValueOnce(mockResponse)

    const result = await getAllPosts({
      token: 'test-token',
      preview: false,
    })

    expect(result).toEqual([])
    expect(mockFetchWithRetry).toHaveBeenCalledOnce()
  })

  it('should use pagination until next_page is null', async () => {
    const createMockPost = (slug: string): Butter.Post => ({
      author: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        slug: 'john-doe',
        bio: 'A writer',
        title: 'Author',
        linkedin_url: '',
        facebook_url: '',
        pinterest_url: '',
        instagram_url: '',
        twitter_handle: '',
        profile_image: '',
      },
      body: `Content ${slug}`,
      categories: [],
      created: '2023-01-01',
      featured_image: null,
      featured_image_alt: '',
      meta_description: `Description ${slug}`,
      published: '2023-01-01',
      scheduled: null,
      seo_title: `Title ${slug}`,
      slug,
      status: 'published',
      summary: `Summary ${slug}`,
      tags: [],
      title: `Post ${slug}`,
      updated: null,
      url: `https://example.com/${slug}`,
    })

    mockFetchWithRetry
      .mockResolvedValueOnce({
        data: [createMockPost('post-1')],
        meta: { next_page: 2, previous_page: null, count: 100 },
      })
      .mockResolvedValueOnce({
        data: [createMockPost('post-2')],
        meta: { next_page: null, previous_page: 1, count: 100 },
      })

    const result = await getAllPosts({
      token: 'test-token',
      preview: false,
    })

    expect(result).toHaveLength(2)
    expect(mockFetchWithRetry).toHaveBeenCalledTimes(2)
  })
})
