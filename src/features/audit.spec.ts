import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { auditContent, UGLY_HTML_PATTERNS } from './audit'

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

describe('auditContent', () => {
  beforeEach(() => {
    mockGetAllPages.mockReset()
    mockGetAllPosts.mockReset()
    mockGetAllCollections.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Input validation', () => {
    it('should return error when no scopes are selected', async () => {
      const result = await auditContent('test-token', false, [], [], false)

      expect(result.success).toBe(false)
      expect(result.error).toContain('at least one audit scope')
      expect(result.totalIssues).toBe(0)
      expect(result.patternsFound).toHaveLength(0)
    })

    it('should proceed when at least one scope is selected', async () => {
      mockGetAllPages.mockResolvedValueOnce([])

      const result = await auditContent('test-token', false, ['landing_page'], [], false)

      expect(result.success).toBe(true)
    })
  })

  describe('Pattern detection', () => {
    it('should detect Microsoft Office attributes (mso-)', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          slug: 'test-page',
          name: 'Test Page',
          fields: {
            body: '<p style="mso-line-height: 115%">Content from Word</p>',
          },
        },
      ])
      mockGetAllPosts.mockResolvedValueOnce([])
      mockGetAllCollections.mockResolvedValueOnce([])

      const result = await auditContent('test-token', false, ['landing_page'], [], false)

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.patternsFound).toContain('mso-')
      expect(result.totalIssues).toBeGreaterThan(0)
    })

    it('should detect Figma attributes', async () => {
      mockGetAllPages.mockResolvedValueOnce([])
      mockGetAllPosts.mockResolvedValueOnce([
        {
          slug: 'test-post',
          title: 'Test Post',
          body: '<div figma="abc123">Content from Figma</div>',
        },
      ])
      mockGetAllCollections.mockResolvedValueOnce([])

      const result = await auditContent('test-token', false, [], [], true)

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.patternsFound).toContain('figma=')
    })

    it('should detect Microsoft Office data attributes', async () => {
      mockGetAllPages.mockResolvedValueOnce([])
      mockGetAllPosts.mockResolvedValueOnce([])
      mockGetAllCollections.mockResolvedValueOnce([
        {
          slug: 'item-1',
          name: 'Test Item',
          description:
            '<p>Content</p><span data-contrast="auto">Text</span><div data-font="14">More text</div>',
        },
      ])

      const result = await auditContent('test-token', false, [], ['items'], false)

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.patternsFound).toContain('data-contrast')
      expect(result.patternsFound).toContain('data-font')
    })

    it('should detect inline event handlers', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          slug: 'dangerous',
          name: 'Dangerous Page',
          fields: {
            content: '<button onclick="alert(\'XSS\')">Click Me</button>',
          },
        },
      ])
      mockGetAllPosts.mockResolvedValueOnce([])
      mockGetAllCollections.mockResolvedValueOnce([])

      const result = await auditContent('test-token', false, ['landing_page'], [], false)

      expect(result.success).toBe(true)
      expect(result.patternsFound).toContain('onclick=')
    })

    it('should detect rich text editor patterns', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          slug: 'prosemirror-content',
          name: 'ProseMirror Page',
          fields: {
            hero: '<p>Content</p><div data-pm-slice="1 1 []">Pasted content</div>',
          },
        },
      ])
      mockGetAllPosts.mockResolvedValueOnce([])
      mockGetAllCollections.mockResolvedValueOnce([])

      const result = await auditContent('test-token', false, ['landing_page'], [], false)

      expect(result.success).toBe(true)
      expect(result.patternsFound).toContain('data-pm')
    })

    it('should detect multiple patterns in same item', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          slug: 'messy',
          name: 'Messy Page',
          fields: {
            body: '<p data-ccp="test" figma="abc"><span></span>Messy content</p>',
          },
        },
      ])
      mockGetAllPosts.mockResolvedValueOnce([])
      mockGetAllCollections.mockResolvedValueOnce([])

      const result = await auditContent('test-token', false, ['landing_page'], [], false)

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(1)
      expect(result.results[0]!.issues.length).toBeGreaterThanOrEqual(2) // data-ccp, figma=, <span></span>
      expect(result.patternsFound.length).toBeGreaterThanOrEqual(2)
    })

    it('should not find issues in clean content', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          slug: 'clean',
          name: 'Clean Page',
          fields: {
            body: '<p>This is clean semantic HTML content</p>',
          },
        },
      ])
      mockGetAllPosts.mockResolvedValueOnce([])
      mockGetAllCollections.mockResolvedValueOnce([])

      const result = await auditContent('test-token', false, ['landing_page'], [], false)

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(0)
      expect(result.totalIssues).toBe(0)
      expect(result.patternsFound).toHaveLength(0)
    })
  })

  describe('Multiple scopes', () => {
    it('should audit pages and blog together', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          slug: 'page-1',
          name: 'Page 1',
          fields: { body: '<p mso-style="test">Page content</p>' },
        },
      ])
      mockGetAllPosts.mockResolvedValueOnce([
        {
          slug: 'post-1',
          title: 'Post 1',
          body: '<div figma="test">Post content</div>',
        },
      ])
      mockGetAllCollections.mockResolvedValueOnce([])

      const result = await auditContent('test-token', false, ['landing_page'], [], true)

      expect(result.success).toBe(true)
      expect(result.results).toHaveLength(2)
      expect(result.patternsFound.length).toBeGreaterThan(0)
    })

    it('should audit multiple page types', async () => {
      mockGetAllPages
        .mockResolvedValueOnce([
          {
            slug: 'landing',
            name: 'Landing',
            fields: { content: '<p style="mso-test">Landing</p>' },
          },
        ])
        .mockResolvedValueOnce([
          {
            slug: 'about',
            name: 'About',
            fields: { content: '<p align="left">About</p>' },
          },
        ])
      mockGetAllPosts.mockResolvedValueOnce([])
      mockGetAllCollections.mockResolvedValueOnce([])

      const result = await auditContent(
        'test-token',
        false,
        ['landing_page', 'about_page'],
        [],
        false,
      )

      expect(result.success).toBe(true)
      expect(result.results.length).toBeGreaterThan(0)
    })

    it('should audit multiple collections', async () => {
      mockGetAllPages.mockResolvedValueOnce([])
      mockGetAllPosts.mockResolvedValueOnce([])
      mockGetAllCollections
        .mockResolvedValueOnce([
          {
            slug: 'item-1',
            name: 'Item 1',
            description: '<p figma="test">Item 1</p>',
          },
        ])
        .mockResolvedValueOnce([
          {
            slug: 'item-2',
            name: 'Item 2',
            content: '<div onclick="test()">Item 2</div>',
          },
        ])

      const result = await auditContent('test-token', false, [], ['items', 'products'], false)

      expect(result.success).toBe(true)
      expect(result.results.length).toBeGreaterThan(0)
    })
  })

  describe('Error handling', () => {
    it('should handle page fetch failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockGetAllPages.mockRejectedValueOnce(new Error('API Error'))
      mockGetAllPosts.mockResolvedValueOnce([])
      mockGetAllCollections.mockResolvedValueOnce([])

      const result = await auditContent('test-token', false, ['landing_page'], [], true)

      expect(result.success).toBe(true) // Should succeed with partial results
      expect(result.failedScopes).toContain('Page Type: landing_page')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch page type'),
        expect.any(Error),
      )

      consoleErrorSpy.mockRestore()
    })

    it('should handle blog fetch failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockGetAllPages.mockResolvedValueOnce([])
      mockGetAllPosts.mockRejectedValueOnce(new Error('API Error'))
      mockGetAllCollections.mockResolvedValueOnce([])

      const result = await auditContent('test-token', false, ['landing_page'], [], true)

      expect(result.success).toBe(true) // Should succeed with partial results
      expect(result.failedScopes).toContain('Blog')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch Blog posts'),
        expect.any(Error),
      )

      consoleErrorSpy.mockRestore()
    })

    it('should handle collection fetch failure', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockGetAllPages.mockResolvedValueOnce([])
      mockGetAllPosts.mockResolvedValueOnce([])
      mockGetAllCollections.mockRejectedValueOnce(new Error('API Error'))

      const result = await auditContent('test-token', false, [], ['items'], true)

      expect(result.success).toBe(true) // Should succeed with partial results
      expect(result.failedScopes).toContain('Collection: items')
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch collection'),
        expect.any(Error),
      )

      consoleErrorSpy.mockRestore()
    })

    it('should return error when all scopes fail', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockGetAllPages.mockRejectedValueOnce(new Error('Page API Error'))
      mockGetAllPosts.mockRejectedValueOnce(new Error('Blog API Error'))
      mockGetAllCollections.mockResolvedValueOnce([])

      const result = await auditContent('test-token', false, ['landing_page'], [], true)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to fetch all selected scopes')
      expect(result.failedScopes).toHaveLength(2)

      consoleErrorSpy.mockRestore()
    })

    it('should handle unexpected errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockGetAllPages.mockRejectedValueOnce(new Error('Unexpected error'))
      mockGetAllPosts.mockResolvedValueOnce([])
      mockGetAllCollections.mockResolvedValueOnce([])

      const result = await auditContent('test-token', false, ['landing_page'], [], false)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to fetch all selected scopes')

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Results formatting', () => {
    it('should include title, slug, and sourceType', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          slug: 'test-page',
          name: 'Test Page',
          fields: { body: '<p mso-test>Content</p>' },
        },
      ])
      mockGetAllPosts.mockResolvedValueOnce([])
      mockGetAllCollections.mockResolvedValueOnce([])

      const result = await auditContent('test-token', false, ['landing_page'], [], false)

      expect(result.results[0]).toHaveProperty('title')
      expect(result.results[0]).toHaveProperty('slug')
      expect(result.results[0]).toHaveProperty('sourceType')
      expect(result.results[0]!.sourceType).toBe('landing_page')
    })

    it('should group issues by pattern', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          slug: 'test',
          name: 'Test',
          fields: {
            body: '<p mso-test>Test</p>',
            footer: '<p mso-test>Footer</p>',
          },
        },
      ])
      mockGetAllPosts.mockResolvedValueOnce([])
      mockGetAllCollections.mockResolvedValueOnce([])

      const result = await auditContent('test-token', false, ['landing_page'], [], false)

      expect(result.results[0]!.issues.length).toBeGreaterThan(0)
      expect(result.results[0]!.issues[0]).toHaveProperty('pattern')
      expect(result.results[0]!.issues[0]).toHaveProperty('path')
      expect(result.results[0]!.issues[0]).toHaveProperty('value')
      expect(result.results[0]!.issues[0]).toHaveProperty('count')
    })

    it('should show occurrence count for multiple matches', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          slug: 'test',
          name: 'Test',
          fields: {
            body: '<p onclick="alert(1)">One</p><p onclick="alert(2)">Two</p><p onclick="alert(3)">Three</p>',
          },
        },
      ])
      mockGetAllPosts.mockResolvedValueOnce([])
      mockGetAllCollections.mockResolvedValueOnce([])

      const result = await auditContent('test-token', false, ['landing_page'], [], false)

      const onclickIssue = result.results[0]!.issues.find((i) => i.pattern === 'onclick=')
      expect(onclickIssue).toBeDefined()
      expect(onclickIssue!.count).toBe(3)
      expect(onclickIssue!.path).toContain('3 occurrences')
    })

    it('should sort results by slug', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          slug: 'zebra',
          name: 'Zebra',
          fields: { body: '<p mso-test>Z</p>' },
        },
        {
          slug: 'apple',
          name: 'Apple',
          fields: { body: '<p mso-test>A</p>' },
        },
        {
          slug: 'middle',
          name: 'Middle',
          fields: { body: '<p mso-test>M</p>' },
        },
      ])
      mockGetAllPosts.mockResolvedValueOnce([])
      mockGetAllCollections.mockResolvedValueOnce([])

      const result = await auditContent('test-token', false, ['landing_page'], [], false)

      expect(result.results[0]!.slug).toBe('apple')
      expect(result.results[1]!.slug).toBe('middle')
      expect(result.results[2]!.slug).toBe('zebra')
    })

    it('should sort issues by pattern then path', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          slug: 'test',
          name: 'Test',
          fields: {
            header: '<p align="left">Header</p>',
            body: '<p mso-test>Body</p>',
            footer: '<p bgcolor="white">Footer</p>',
          },
        },
      ])
      mockGetAllPosts.mockResolvedValueOnce([])
      mockGetAllCollections.mockResolvedValueOnce([])

      const result = await auditContent('test-token', false, ['landing_page'], [], false)

      const patterns = result.results[0]!.issues.map((i) => i.pattern)
      const sortedPatterns = [...patterns].sort()
      expect(patterns).toEqual(sortedPatterns)
    })

    it('should handle items without title gracefully', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          slug: 'no-title',
          fields: { body: '<p mso-test>Content</p>' },
        },
      ])
      mockGetAllPosts.mockResolvedValueOnce([])
      mockGetAllCollections.mockResolvedValueOnce([])

      const result = await auditContent('test-token', false, ['landing_page'], [], false)

      expect(result.results[0]!.title).toBe('no-title') // Falls back to slug
    })
  })

  describe('Pattern coverage', () => {
    it('should export UGLY_HTML_PATTERNS constant', () => {
      expect(UGLY_HTML_PATTERNS).toBeDefined()
      expect(Array.isArray(UGLY_HTML_PATTERNS)).toBe(true)
      expect(UGLY_HTML_PATTERNS.length).toBeGreaterThan(0)
    })

    it('should include Microsoft Office patterns', () => {
      expect(UGLY_HTML_PATTERNS).toContain('mso-')
      expect(UGLY_HTML_PATTERNS).toContain('paraid=')
      expect(UGLY_HTML_PATTERNS).toContain('o:gfxdata=')
    })

    it('should include Figma patterns', () => {
      expect(UGLY_HTML_PATTERNS).toContain('figma=')
      expect(UGLY_HTML_PATTERNS).toContain('figmeta=')
    })

    it('should include data attribute patterns', () => {
      expect(UGLY_HTML_PATTERNS).toContain('data-contrast')
      expect(UGLY_HTML_PATTERNS).toContain('data-font')
      expect(UGLY_HTML_PATTERNS).toContain('data-pm')
      expect(UGLY_HTML_PATTERNS).toContain('data-')
    })

    it('should include inline handler patterns', () => {
      expect(UGLY_HTML_PATTERNS).toContain('onclick=')
      expect(UGLY_HTML_PATTERNS).toContain('onload=')
    })
  })

  describe('Preview mode', () => {
    it('should pass preview flag to fetch functions', async () => {
      mockGetAllPages.mockResolvedValueOnce([])
      mockGetAllPosts.mockResolvedValueOnce([])
      mockGetAllCollections.mockResolvedValueOnce([])

      await auditContent('test-token', true, ['landing_page'], ['items'], true)

      expect(mockGetAllPages).toHaveBeenCalledWith(expect.objectContaining({ preview: true }))
      expect(mockGetAllPosts).toHaveBeenCalledWith(expect.objectContaining({ preview: true }))
      expect(mockGetAllCollections).toHaveBeenCalledWith(expect.objectContaining({ preview: true }))
    })
  })

  describe('Total issues count', () => {
    it('should count total issues across all items', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        {
          slug: 'page-1',
          name: 'Page 1',
          fields: { body: '<p onclick="test">One</p><p onclick="test">Two</p>' },
        },
        {
          slug: 'page-2',
          name: 'Page 2',
          fields: { body: '<p mso-test>Three</p>' },
        },
      ])
      mockGetAllPosts.mockResolvedValueOnce([])
      mockGetAllCollections.mockResolvedValueOnce([])

      const result = await auditContent('test-token', false, ['landing_page'], [], false)

      expect(result.totalIssues).toBeGreaterThanOrEqual(3)
    })
  })
})
