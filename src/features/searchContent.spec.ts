import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { searchContent } from './searchContent'

const {
  getAllPages: mockGetAllPages,
  getAllPosts: mockGetAllPosts,
  getAllCollections: mockGetAllCollections,
} = vi.hoisted(() => ({
  getAllPages: vi.fn(),
  getAllPosts: vi.fn(),
  getAllCollections: vi.fn(),
}))

vi.mock('@/core/pages', () => ({
  getAllPages: mockGetAllPages,
}))

vi.mock('@/core/posts', () => ({
  getAllPosts: mockGetAllPosts,
}))

vi.mock('@/core/collections', () => ({
  getAllCollections: mockGetAllCollections,
}))

describe('searchContent', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockGetAllPages.mockReset()
    mockGetAllPosts.mockReset()
    mockGetAllCollections.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Input validation', () => {
    it('should handle empty search string', async () => {
      mockGetAllPages.mockResolvedValueOnce([])
      mockGetAllPosts.mockResolvedValueOnce([])
      mockGetAllCollections.mockResolvedValueOnce([])

      const result = await searchContent('', 'test-token', false, ['landing_page'], [], true)

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(0)
    })

    it('should return error when no scopes are selected', async () => {
      const result = await searchContent('test', 'test-token', false, [], [], false)

      expect(result.success).toBe(false)
      expect(result.error).toContain('at least one')
    })
  })

  describe('Pages scope', () => {
    it('should search pages', async () => {
      mockGetAllPages.mockImplementation(async () => [
        {
          id: '1',
          slug: 'about',
          name: 'TestAbout',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])
      mockGetAllPosts.mockImplementation(async () => [])
      mockGetAllCollections.mockImplementation(async () => [])

      const result = await searchContent(
        'TestAbout',
        'test-token',
        false,
        ['landing_page'],
        [],
        false,
      )

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0]!.slug).toBe('about')
    })
  })

  describe('Blog scope', () => {
    it('should search blog', async () => {
      mockGetAllPages.mockImplementation(async () => [])
      mockGetAllPosts.mockImplementation(async () => [
        {
          id: '1',
          slug: 'post-1',
          title: 'TestBlogPost',
          published: '2023-01-01',
        },
      ])
      mockGetAllCollections.mockImplementation(async () => [])

      const result = await searchContent('TestBlogPost', 'test-token', false, [], [], true)

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0]!.slug).toBe('post-1')
    })
  })

  describe('Collections scope', () => {
    it('should search collections', async () => {
      mockGetAllPages.mockImplementation(async () => [])
      mockGetAllPosts.mockImplementation(async () => [])
      mockGetAllCollections.mockImplementation(async () => [
        {
          id: 1,
          slug: 'item-1',
          name: 'TestCollection',
        },
      ])

      const result = await searchContent(
        'TestCollection',
        'test-token',
        false,
        [],
        ['items'],
        false,
      )

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0]!.slug).toBe('item-1')
    })
  })

  describe('Multiple scopes combined', () => {
    it('should handle combined scopes', async () => {
      mockGetAllPages.mockImplementation(async () => [
        {
          id: '1',
          slug: 'test-page',
          name: 'Test Page',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])
      mockGetAllPosts.mockImplementation(async () => [])
      mockGetAllCollections.mockImplementation(async () => [])

      const result = await searchContent('Test', 'test-token', false, ['landing_page'], [], true)

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0]!.sourceType).toBe('landing_page')
    })
  })

  describe('Error handling', () => {
    it('should handle API errors gracefully', async () => {
      mockGetAllPages.mockRejectedValueOnce(new Error('API Error'))
      mockGetAllPosts.mockImplementation(async () => [])
      mockGetAllCollections.mockImplementation(async () => [])

      const result = await searchContent('test', 'test-token', false, ['landing_page'], [], false)

      expect(result.success).toBe(false)
      expect(result.error).toContain('API Error')
    })
  })

  describe('Multiple matches in single field', () => {
    it('should handle multiple occurrences of search term in same field', async () => {
      mockGetAllPages.mockImplementation(async () => [
        {
          id: '1',
          slug: 'tutorial',
          name: 'Testing testing testing services',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])
      mockGetAllPosts.mockImplementation(async () => [])
      mockGetAllCollections.mockImplementation(async () => [])

      const result = await searchContent(
        'testing',
        'test-token',
        false,
        ['landing_page'],
        [],
        false,
      )

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0]!.matches[0]!.count).toBe(3)
      expect(result.results[0]!.matches[0]!.path).toContain('occurrences')
    })
  })

  describe('Array content searching', () => {
    it('should search through array content', async () => {
      mockGetAllPages.mockImplementation(async () => [
        {
          id: '1',
          slug: 'page-with-array',
          name: 'Page',
          page_type: 'landing_page',
          published: '2023-01-01',
          tags: ['SearchableTag', 'other'],
        },
      ])
      mockGetAllPosts.mockImplementation(async () => [])
      mockGetAllCollections.mockImplementation(async () => [])

      const result = await searchContent(
        'SearchableTag',
        'test-token',
        false,
        ['landing_page'],
        [],
        false,
      )

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
    })
  })

  describe('Numeric and boolean searches', () => {
    it('should search numeric and boolean values', async () => {
      mockGetAllPages.mockImplementation(async () => [
        {
          id: '1',
          slug: 'page-numeric',
          name: 'Page',
          page_type: 'landing_page',
          published: '2023-01-01',
          views: 12345,
          featured: true,
        },
      ])
      mockGetAllPosts.mockImplementation(async () => [])
      mockGetAllCollections.mockImplementation(async () => [])

      const result = await searchContent('true', 'test-token', false, ['landing_page'], [], false)

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
    })
  })

  describe('Negation mode', () => {
    it('should return items NOT containing search term when negate is true', async () => {
      mockGetAllPages.mockImplementation(async () => [
        {
          id: '1',
          slug: 'about',
          name: 'About Us',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
        {
          id: '2',
          slug: 'contact',
          name: 'Contact Page',
          page_type: 'landing_page',
          published: '2023-01-02',
        },
        {
          id: '3',
          slug: 'services',
          name: 'TestServices',
          page_type: 'landing_page',
          published: '2023-01-03',
        },
      ])
      mockGetAllPosts.mockImplementation(async () => [])
      mockGetAllCollections.mockImplementation(async () => [])

      const result = await searchContent(
        'Test',
        'test-token',
        false,
        ['landing_page'],
        [],
        false,
        true,
      )

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(2)
      expect(result.results.map((r) => r.slug)).toEqual(['about', 'contact'])
    })

    it('should return empty matches array for negated results', async () => {
      mockGetAllPages.mockImplementation(async () => [
        {
          id: '1',
          slug: 'about',
          name: 'About Us',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])
      mockGetAllPosts.mockImplementation(async () => [])
      mockGetAllCollections.mockImplementation(async () => [])

      const result = await searchContent(
        'Test',
        'test-token',
        false,
        ['landing_page'],
        [],
        false,
        true,
      )

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0]!.matches).toHaveLength(0)
    })

    it('should work with multiple scopes in negate mode', async () => {
      mockGetAllPages.mockImplementation(async () => [
        {
          id: '1',
          slug: 'test-page',
          name: 'TestPage',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
        {
          id: '2',
          slug: 'about',
          name: 'About',
          page_type: 'landing_page',
          published: '2023-01-02',
        },
      ])
      mockGetAllPosts.mockImplementation(async () => [
        {
          id: '1',
          slug: 'post-1',
          title: 'Regular Post',
          published: '2023-01-01',
        },
        {
          id: '2',
          slug: 'test-blog',
          title: 'Test Blog Post',
          published: '2023-01-02',
        },
      ])
      mockGetAllCollections.mockImplementation(async () => [])

      const result = await searchContent(
        'Test',
        'test-token',
        false,
        ['landing_page'],
        [],
        true,
        true,
      )

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(2)
      expect(result.results.map((r) => r.slug).sort()).toEqual(['about', 'post-1'])
    })

    it('should return all items when negating and no items contain search term', async () => {
      mockGetAllPages.mockImplementation(async () => [
        {
          id: '1',
          slug: 'page-1',
          name: 'Page One',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
        {
          id: '2',
          slug: 'page-2',
          name: 'Page Two',
          page_type: 'landing_page',
          published: '2023-01-02',
        },
      ])
      mockGetAllPosts.mockImplementation(async () => [])
      mockGetAllCollections.mockImplementation(async () => [])

      const result = await searchContent(
        'NonExistent',
        'test-token',
        false,
        ['landing_page'],
        [],
        false,
        true,
      )

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(2)
    })

    it('should return no items when negating and all items contain search term', async () => {
      mockGetAllPages.mockImplementation(async () => [
        {
          id: '1',
          slug: 'test-1',
          name: 'Test Page One',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
        {
          id: '2',
          slug: 'test-2',
          name: 'Test Page Two',
          page_type: 'landing_page',
          published: '2023-01-02',
        },
      ])
      mockGetAllPosts.mockImplementation(async () => [])
      mockGetAllCollections.mockImplementation(async () => [])

      const result = await searchContent(
        'Test',
        'test-token',
        false,
        ['landing_page'],
        [],
        false,
        true,
      )

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(0)
    })
  })
})
