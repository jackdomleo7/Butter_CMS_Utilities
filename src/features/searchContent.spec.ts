import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { searchContent } from './searchContent'
import * as pagesModule from '@/core/pages'
import * as postsModule from '@/core/posts'
import * as collectionsModule from '@/core/collections'

vi.mock('@/core/pages')
vi.mock('@/core/posts')
vi.mock('@/core/collections')

const mockGetAllPages = pagesModule.getAllPages as ReturnType<typeof vi.fn>
const mockGetAllPosts = postsModule.getAllPosts as ReturnType<typeof vi.fn>
const mockGetAllCollections = collectionsModule.getAllCollections as ReturnType<typeof vi.fn>

describe('searchContent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Input validation', () => {
    it('should handle empty search string', async () => {
      const result = await searchContent('pages', '', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(0)
      expect(result.totalItems).toBe(0)
      expect(mockGetAllPages).not.toHaveBeenCalled()
    })

    it('should handle whitespace-only search string', async () => {
      const result = await searchContent('pages', '   ', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(0)
      expect(result.totalItems).toBe(0)
      expect(mockGetAllPages).not.toHaveBeenCalled()
    })

    it('should trim search string', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'test',
          name: 'keyword',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])

      const result = await searchContent(
        'pages',
        '  keyword  ',
        'test-token',
        false,
        'landing_page',
      )

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
    })
  })

  describe('Pages scope', () => {
    it('should search pages and return matching results', async () => {
      const mockPages = [
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
      ]

      mockGetAllPages.mockResolvedValueOnce(mockPages)

      const result = await searchContent('pages', 'Contact', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.totalItems).toBe(2)
      expect(result.results).toHaveLength(1)
      expect(result.results[0]!.slug).toBe('contact')
      expect(result.results[0]!.title).toBe('Contact Page')
    })

    it('should return error when pageType is missing', async () => {
      const result = await searchContent('pages', 'test', 'test-token', false)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid search scope or missing required parameter')
    })

    it('should handle no matches in pages', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'First Page',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])

      const result = await searchContent('pages', 'xyz', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(0)
      expect(result.totalItems).toBe(1)
    })

    it('should include preview parameter when preview is true', async () => {
      mockGetAllPages.mockResolvedValueOnce([])

      await searchContent('pages', 'test', 'test-token', true, 'landing_page')

      expect(mockGetAllPages).toHaveBeenCalledWith({
        token: 'test-token',
        pageType: 'landing_page',
        preview: true,
      })
    })

    it('should handle getAllPages error', async () => {
      mockGetAllPages.mockRejectedValueOnce(new Error('API Error'))

      const result = await searchContent('pages', 'test', 'test-token', false, 'landing_page')

      expect(result.success).toBe(false)
      expect(result.error).toContain('API Error')
    })
  })

  describe('Blog scope', () => {
    it('should search blog posts and return matching results', async () => {
      const mockPosts = [
        {
          id: '1',
          slug: 'first-post',
          title: 'First Blog Post',
          published: '2023-01-01',
        },
        {
          id: '2',
          slug: 'second-post',
          title: 'Second Blog Post',
          published: '2023-01-02',
        },
      ]

      mockGetAllPosts.mockResolvedValueOnce(mockPosts)

      const result = await searchContent('blog', 'Blog', 'test-token', false)

      expect(result.success).toBe(true)
      expect(result.totalItems).toBe(2)
      expect(result.results).toHaveLength(2)
      expect(result.results[0]!.title).toBe('First Blog Post')
    })

    it('should handle no matches in blog posts', async () => {
      mockGetAllPosts.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'post-1',
          title: 'Post Title',
          published: '2023-01-01',
        },
      ])

      const result = await searchContent('blog', 'nonexistent', 'test-token', false)

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(0)
    })

    it('should handle getAllPosts error', async () => {
      mockGetAllPosts.mockRejectedValueOnce(new Error('Network Error'))

      const result = await searchContent('blog', 'test', 'test-token', false)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network Error')
    })
  })

  describe('Collections scope', () => {
    it('should search collections and return matching results', async () => {
      const mockCollections = [
        {
          id: 1,
          slug: 'product-1',
          name: 'Product One',
        },
        {
          id: 2,
          slug: 'product-2',
          name: 'Product Two',
        },
      ]

      mockGetAllCollections.mockResolvedValueOnce(mockCollections)

      const result = await searchContent(
        'collections',
        'Product',
        'test-token',
        false,
        undefined,
        'products',
      )

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(2)
      expect(result.results[0]!.slug).toBe('product-1')
    })

    it('should return error when collectionKey is missing', async () => {
      const result = await searchContent('collections', 'test', 'test-token', false)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid search scope or missing required parameter')
    })

    it('should handle getAllCollections error', async () => {
      mockGetAllCollections.mockRejectedValueOnce(new Error('Collection Error'))

      const result = await searchContent(
        'collections',
        'test',
        'test-token',
        false,
        undefined,
        'products',
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('Collection Error')
    })
  })

  describe('Case-insensitive matching', () => {
    it('should match lowercase search term against uppercase text', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'UPPERCASE TEXT',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])

      const result = await searchContent('pages', 'uppercase', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0]!.matches).toHaveLength(1)
    })

    it('should match uppercase search term against lowercase text', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'lowercase text',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])

      const result = await searchContent('pages', 'LOWERCASE', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
    })

    it('should match mixed case search term', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'MixedCase Content',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])

      const result = await searchContent('pages', 'mixed', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
    })
  })

  describe('Whitespace normalization', () => {
    it('should match text with non-breaking spaces', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'Hello\u00A0World',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])

      const result = await searchContent(
        'pages',
        'hello world',
        'test-token',
        false,
        'landing_page',
      )

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
    })

    it('should match text with HTML nbsp entities', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'Test&nbsp;Content',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])

      const result = await searchContent(
        'pages',
        'test content',
        'test-token',
        false,
        'landing_page',
      )

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
    })

    it('should normalize multiple consecutive spaces', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'Text   with    many     spaces',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])

      const result = await searchContent('pages', 'with many', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
    })

    it('should use normalized text in snippets', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'Before&nbsp;keyword&nbsp;after',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])

      const result = await searchContent('pages', 'keyword', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      // Snippet should contain normalized spaces, not &nbsp;
      expect(result.results[0]!.matches[0]!.value).toContain('Before keyword after')
      expect(result.results[0]!.matches[0]!.value).not.toContain('&nbsp;')
    })
  })

  describe('Alphabetical sorting', () => {
    it('should sort results alphabetically by slug', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '3',
          slug: 'zebra-page',
          name: 'Zebra Content',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
        {
          id: '1',
          slug: 'apple-page',
          name: 'Apple Content',
          page_type: 'landing_page',
          published: '2023-01-02',
        },
        {
          id: '2',
          slug: 'banana-page',
          name: 'Banana Content',
          page_type: 'landing_page',
          published: '2023-01-03',
        },
      ])

      const result = await searchContent('pages', 'content', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results[0]!.slug).toBe('apple-page')
      expect(result.results[1]!.slug).toBe('banana-page')
      expect(result.results[2]!.slug).toBe('zebra-page')
    })
  })

  describe('Multiple occurrences optimization', () => {
    it('should consolidate multiple occurrences into single match with count', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'test test test test test',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])

      const result = await searchContent('pages', 'test', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0]!.matches).toHaveLength(1)
      expect(result.results[0]!.matches[0]!.count).toBe(5)
      expect(result.results[0]!.matches[0]!.path).toContain('occurrences')
    })

    it('should show single occurrence without occurrence label', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'single match here',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])

      const result = await searchContent('pages', 'match', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results[0]!.matches[0]!.count).toBe(1)
      expect(result.results[0]!.matches[0]!.path).not.toContain('occurrences')
      expect(result.results[0]!.matches[0]!.path).toBe('name')
    })

    it('should limit snippet generation for many occurrences', async () => {
      const manyOccurrences = 'keyword '.repeat(100)
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: manyOccurrences,
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])

      const result = await searchContent('pages', 'keyword', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results[0]!.matches[0]!.count).toBe(100)
      // Should still return a valid snippet
      expect(result.results[0]!.matches[0]!.value).toBeTruthy()
      expect(result.results[0]!.matches[0]!.value).toContain('keyword')
    })
  })

  describe('Circular reference protection', () => {
    it('should handle circular references without infinite loop', async () => {
      const circularObj: Record<string, unknown> = {
        id: '1',
        slug: 'circular',
        name: 'Circular Reference Test',
        page_type: 'landing_page',
        published: '2023-01-01',
      }
      circularObj.self = circularObj
      circularObj.nested = { parent: circularObj }

      mockGetAllPages.mockResolvedValueOnce([circularObj])

      const result = await searchContent('pages', 'Circular', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0]!.title).toBe('Circular Reference Test')
    })

    it('should handle self-referencing arrays', async () => {
      const circularArray: Record<string, unknown> = {
        id: '1',
        slug: 'array-circular',
        name: 'Array Test',
        page_type: 'landing_page',
        published: '2023-01-01',
        items: [],
      }
      ;(circularArray.items as Array<Record<string, unknown>>).push(circularArray)

      mockGetAllPages.mockResolvedValueOnce([circularArray])

      const result = await searchContent('pages', 'Array', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
    })
  })

  describe('Depth limit protection', () => {
    it('should stop recursion at depth 10', async () => {
      // Create deeply nested object (12 levels)
      let deepObj: Record<string, unknown> = { value: 'deep keyword' }
      for (let i = 0; i < 12; i++) {
        deepObj = { level: deepObj }
      }

      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'deep',
          name: 'Deep Object',
          page_type: 'landing_page',
          published: '2023-01-01',
          data: deepObj,
        },
      ])

      const result = await searchContent('pages', 'deep', 'test-token', false, 'landing_page')

      // Should find match in name field but not in deeply nested value
      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0]!.title).toBe('Deep Object')
    })

    it('should handle depth 10 structures correctly', async () => {
      // Create object at depth 9 (will be depth 10 when counting from root item)
      // Root item = depth 0, data = depth 1, nested = depth 2, etc.
      let obj: Record<string, unknown> = { target: 'findme' }
      for (let i = 0; i < 8; i++) {
        obj = { nested: obj }
      }

      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page',
          name: 'Page',
          page_type: 'landing_page',
          published: '2023-01-01',
          data: obj,
        },
      ])

      const result = await searchContent('pages', 'findme', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      // Should find it at depth 10 (root=0, data=1, nested=2...10)
      expect(result.results).toHaveLength(1)
    })
  })

  describe('Nested object searching', () => {
    it('should find matches in nested objects', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'Page Name',
          page_type: 'landing_page',
          published: '2023-01-01',
          fields: {
            heading: 'Searchable Content',
            subheading: 'More nested content',
          },
        },
      ])

      const result = await searchContent('pages', 'Searchable', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0]!.matches.some((m) => m.path.includes('fields'))).toBe(true)
    })

    it('should find matches in arrays within objects', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'Page',
          page_type: 'landing_page',
          published: '2023-01-01',
          tags: ['keyword', 'searchable', 'content'],
        },
      ])

      const result = await searchContent('pages', 'searchable', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0]!.matches.some((m) => m.path.includes('tags'))).toBe(true)
    })

    it('should handle deeply nested structures', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'Page',
          page_type: 'landing_page',
          published: '2023-01-01',
          data: {
            level1: {
              level2: {
                level3: {
                  value: 'target keyword found',
                },
              },
            },
          },
        },
      ])

      const result = await searchContent('pages', 'target', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0]!.matches.some((m) => m.path.includes('level3'))).toBe(true)
    })

    it('should find matches in multiple nested fields', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'search-keyword',
          name: 'Search Title',
          page_type: 'landing_page',
          published: '2023-01-01',
          meta: {
            description: 'This contains search term',
            keywords: ['search', 'seo'],
          },
        },
      ])

      const result = await searchContent('pages', 'search', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results[0]!.matches.length).toBeGreaterThan(1)
    })
  })

  describe('Title and slug fallbacks', () => {
    it('should use name as title for pages', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-slug',
          name: 'Page Title',
          page_type: 'landing_page',
          published: '2023-01-01',
          content: 'searchable content',
        },
      ])

      const result = await searchContent('pages', 'searchable', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results[0]!.title).toBe('Page Title')
    })

    it('should use title as fallback when name is missing', async () => {
      mockGetAllPosts.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'post-slug',
          title: 'Post Title',
          published: '2023-01-01',
          content: 'searchable content',
        },
      ])

      const result = await searchContent('blog', 'searchable', 'test-token', false)

      expect(result.success).toBe(true)
      expect(result.results[0]!.title).toBe('Post Title')
    })

    it('should use slug as fallback when name and title are missing', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'fallback-slug',
          page_type: 'landing_page',
          published: '2023-01-01',
          content: 'searchable content here',
        },
      ])

      const result = await searchContent('pages', 'searchable', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0]!.title).toBe('fallback-slug')
    })

    it('should use Untitled when no name, title, or slug available', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          page_type: 'landing_page',
          published: '2023-01-01',
          content: 'searchable content',
        },
      ])

      const result = await searchContent('pages', 'searchable', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0]!.title).toBe('Untitled')
    })

    it('should use N/A for slug when slug is missing', async () => {
      mockGetAllCollections.mockResolvedValueOnce([
        {
          id: 1,
          name: 'Collection Item',
        },
      ])

      const result = await searchContent(
        'collections',
        'Collection',
        'test-token',
        false,
        undefined,
        'items',
      )

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0]!.slug).toBe('N/A')
    })
  })

  describe('Number and boolean matching', () => {
    it('should match number values', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'Page',
          page_type: 'landing_page',
          published: '2023-01-01',
          priority: 5,
        },
      ])

      const result = await searchContent('pages', '5', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results[0]!.matches.some((m) => m.value === '5')).toBe(true)
    })

    it('should match boolean values', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'Page',
          page_type: 'landing_page',
          published: '2023-01-01',
          featured: true,
        },
      ])

      const result = await searchContent('pages', 'true', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results[0]!.matches.some((m) => m.value === 'true')).toBe(true)
    })

    it('should match partial numbers', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'Page',
          page_type: 'landing_page',
          published: '2023-01-01',
          year: 2023,
        },
      ])

      const result = await searchContent('pages', '202', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
    })
  })

  describe('Context snippets', () => {
    it('should include ellipsis before match when context precedes', async () => {
      const longText = 'A'.repeat(150) + ' keyword ' + 'B'.repeat(50)
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: longText,
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])

      const result = await searchContent('pages', 'keyword', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results[0]!.matches[0]!.value).toMatch(/^\.\.\./)
    })

    it('should include ellipsis after match when content follows', async () => {
      const longText = 'keyword ' + 'B'.repeat(150)
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: longText,
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])

      const result = await searchContent('pages', 'keyword', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results[0]!.matches[0]!.value).toMatch(/\.\.\.$/)
    })

    it('should not include ellipsis when match is at start', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'keyword is at the beginning',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])

      const result = await searchContent('pages', 'keyword', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results[0]!.matches[0]!.value.startsWith('...')).toBe(false)
    })

    it('should not include ellipsis when match is at end', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'This ends with keyword',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])

      const result = await searchContent('pages', 'keyword', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results[0]!.matches[0]!.value.endsWith('...')).toBe(false)
    })

    it('should create readable context around matches', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'Before text with some context around the keyword and after text with more content',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])

      const result = await searchContent('pages', 'keyword', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      const snippet = result.results[0]!.matches[0]!.value
      expect(snippet).toContain('keyword')
      expect(snippet).toContain('context around')
      expect(snippet).toContain('after text')
    })
  })

  describe('Special characters and edge cases', () => {
    it('should handle special characters in search', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'Price: $99.99 (special)',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])

      const result = await searchContent('pages', '$99.99', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
    })

    it('should handle unicode characters', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'Café résumé naïve',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])

      const result = await searchContent('pages', 'café', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
    })

    it('should handle null and undefined values gracefully', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'Valid Name',
          page_type: 'landing_page',
          published: '2023-01-01',
          description: null,
          metadata: undefined,
        },
      ])

      const result = await searchContent('pages', 'Valid', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
    })

    it('should handle empty strings in fields', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'Test Page',
          page_type: 'landing_page',
          published: '2023-01-01',
          description: '',
          content: 'findme',
        },
      ])

      const result = await searchContent('pages', 'findme', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
    })
  })

  describe('Empty and edge cases', () => {
    it('should handle empty item array', async () => {
      mockGetAllPages.mockResolvedValueOnce([])

      const result = await searchContent('pages', 'anything', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(0)
      expect(result.totalItems).toBe(0)
    })

    it('should handle items with no matching fields', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'Page One',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])

      const result = await searchContent('pages', 'xyz123', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(0)
    })

    it('should ignore whitespace-only matches in fields', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: '   ',
          page_type: 'landing_page',
          published: '2023-01-01',
          description: 'Real content with keyword',
        },
      ])

      const result = await searchContent('pages', 'keyword', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results[0]!.matches.every((m) => m.value.trim().length > 0)).toBe(true)
    })
  })

  describe('Match count property', () => {
    it('should include count property for single match', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'keyword found',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])

      const result = await searchContent('pages', 'keyword', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0]!.matches[0]!.count).toBe(1)
    })

    it('should include accurate count for multiple matches', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'page-1',
          name: 'match match match',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
      ])

      const result = await searchContent('pages', 'match', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results[0]!.matches[0]!.count).toBe(3)
    })
  })

  describe('Integration tests', () => {
    it('should handle complex real-world page object', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: 'page-123',
          slug: 'product-launch',
          name: 'Our New Product Launch',
          page_type: 'landing_page',
          published: '2023-06-15',
          updated: '2023-06-20',
          seo_title: 'Launch Your Business Success',
          seo_description: 'Discover how our product can transform your business',
          fields: {
            hero_image: 'image.jpg',
            hero_title: 'Launch Your Dreams',
            hero_subtitle: 'Join thousands of successful businesses',
            cta_text: 'Get Started Today',
            cta_url: '/signup',
            features: [
              { title: 'Fast Setup', description: 'Get launched in 5 minutes' },
              { title: 'Secure Platform', description: 'Enterprise-grade security' },
            ],
          },
          tags: ['launch', 'product', 'business'],
          author: {
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      ])

      const result = await searchContent('pages', 'launch', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0]!.title).toBe('Our New Product Launch')
      expect(result.results[0]!.matches.length).toBeGreaterThan(0)
    })

    it('should handle multiple pages with different match patterns', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'about',
          name: 'About Company',
          page_type: 'landing_page',
          published: '2023-01-01',
          content: 'We serve our customers',
        },
        {
          id: '2',
          slug: 'blog',
          name: 'Blog Page',
          page_type: 'landing_page',
          published: '2023-01-02',
          content: 'Serve the community',
        },
        {
          id: '3',
          slug: 'contact',
          name: 'Contact Us',
          page_type: 'landing_page',
          published: '2023-01-03',
          content: 'No match here',
        },
      ])

      const result = await searchContent('pages', 'serve', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(2)
      expect(result.results[0]!.slug).toBe('about')
      expect(result.results[1]!.slug).toBe('blog')
    })

    it('should handle partial word matching', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          id: '1',
          slug: 'catalog',
          name: 'Product Catalog',
          page_type: 'landing_page',
          published: '2023-01-01',
        },
        {
          id: '2',
          slug: 'categories',
          name: 'All Categories',
          page_type: 'landing_page',
          published: '2023-01-02',
        },
      ])

      const result = await searchContent('pages', 'cat', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      // Should match both "catalog" and "categories"
      expect(result.results).toHaveLength(2)
    })
  })

  describe('Performance tests', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: String(i),
        slug: `page-${i}`,
        name: i % 10 === 0 ? `Found ${i}` : `Other ${i}`,
        page_type: 'landing_page',
        published: '2023-01-01',
      }))

      mockGetAllPages.mockResolvedValueOnce(largeDataset)

      const startTime = Date.now()
      const result = await searchContent('pages', 'Found', 'test-token', false, 'landing_page')
      const duration = Date.now() - startTime

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(100)
      expect(duration).toBeLessThan(2000) // Should complete in under 2 seconds
    })

    it('should handle objects with many fields', async () => {
      const objectWithManyFields: Record<string, unknown> = {
        id: '1',
        slug: 'complex',
        name: 'Complex Object',
        page_type: 'landing_page',
        published: '2023-01-01',
      }

      // Add 50 fields
      for (let i = 0; i < 50; i++) {
        objectWithManyFields[`field_${i}`] = i === 25 ? 'target keyword' : `value ${i}`
      }

      mockGetAllPages.mockResolvedValueOnce([objectWithManyFields])

      const result = await searchContent('pages', 'target', 'test-token', false, 'landing_page')

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
    })
  })
})
