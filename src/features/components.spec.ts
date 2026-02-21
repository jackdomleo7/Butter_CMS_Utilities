import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { auditComponents } from './components'

const { getAllPages: mockGetAllPages } = vi.hoisted(() => ({
  getAllPages: vi.fn(),
}))

vi.mock('@/core/pages', () => ({
  getAllPages: mockGetAllPages,
}))

// Helper to build a minimal mock Butter.Page
function makePage(
  slug: string,
  fields: Record<string, unknown>,
  overrides: Partial<{
    name: string
    status: 'published' | 'draft' | 'scheduled'
    pageType: string
  }> = {},
) {
  return {
    slug,
    name: overrides.name ?? slug,
    page_type: overrides.pageType ?? 'test_page',
    status: overrides.status ?? 'published',
    published: overrides.status === 'published' ? '2024-01-01' : null,
    scheduled: null,
    updated: null,
    fields,
  }
}

describe('auditComponents', () => {
  beforeEach(() => {
    mockGetAllPages.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Input validation', () => {
    it('returns error when token is empty', async () => {
      const result = await auditComponents('', false, ['landing_page'], ['hero_banner'])
      expect(result.success).toBe(false)
      expect(result.error).toContain('token')
      expect(result.totalScanned).toBe(0)
    })

    it('returns error when knownComponents is empty', async () => {
      const result = await auditComponents('token', false, ['landing_page'], [])
      expect(result.success).toBe(false)
      expect(result.error).toContain('components')
      expect(result.totalScanned).toBe(0)
    })

    it('returns error when selectedPageTypes is empty', async () => {
      const result = await auditComponents('token', false, [], ['hero_banner'])
      expect(result.success).toBe(false)
      expect(result.error).toContain('page types')
      expect(result.totalScanned).toBe(0)
    })

    it('calls getAllPages and returns success with no results when no pages exist', async () => {
      mockGetAllPages.mockResolvedValueOnce([])
      const result = await auditComponents('token', false, ['landing_page'], ['hero_banner'])
      expect(result.success).toBe(true)
      expect(result.totalScanned).toBe(0)
      expect(result.results).toHaveLength(1)
      expect(result.results[0]!.componentSlug).toBe('hero_banner')
      expect(result.results[0]!.usageCount).toBe(0)
    })
  })

  describe('Component detection - Strategy 1: object keys', () => {
    it('detects component used as an object key in fields', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        makePage('page-1', { hero_banner: { title: 'Hello World' } }),
      ])

      const result = await auditComponents('token', false, ['landing_page'], ['hero_banner'])

      expect(result.success).toBe(true)
      expect(result.results[0]!.componentSlug).toBe('hero_banner')
      expect(result.results[0]!.usageCount).toBe(1)
      expect(result.results[0]!.usages[0]!.slug).toBe('page-1')
    })

    it('detects multiple known components as object keys', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        makePage('page-1', {
          hero_banner: { title: 'Hello' },
          cta_block: { text: 'Click me' },
        }),
      ])

      const result = await auditComponents(
        'token',
        false,
        ['landing_page'],
        ['hero_banner', 'cta_block'],
      )

      expect(result.success).toBe(true)
      const heroBanner = result.results.find((r) => r.componentSlug === 'hero_banner')
      const ctaBlock = result.results.find((r) => r.componentSlug === 'cta_block')
      expect(heroBanner!.usageCount).toBe(1)
      expect(ctaBlock!.usageCount).toBe(1)
    })

    it('detects nested object key', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        makePage('page-1', {
          content: {
            sections: {
              hero_banner: { title: 'Nested' },
            },
          },
        }),
      ])

      const result = await auditComponents('token', false, ['landing_page'], ['hero_banner'])

      expect(result.results[0]!.usageCount).toBe(1)
    })
  })

  describe('Component detection - Strategy 2: type field value', () => {
    it('detects component via "type" field value', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        makePage('page-1', {
          components: [
            { type: 'hero_banner', title: 'Hello' },
            { type: 'cta_block', text: 'Click me' },
          ],
        }),
      ])

      const result = await auditComponents(
        'token',
        false,
        ['landing_page'],
        ['hero_banner', 'cta_block'],
      )

      const heroBanner = result.results.find((r) => r.componentSlug === 'hero_banner')
      const ctaBlock = result.results.find((r) => r.componentSlug === 'cta_block')
      expect(heroBanner!.usageCount).toBe(1)
      expect(ctaBlock!.usageCount).toBe(1)
    })

    it('detects deeply nested type field', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        makePage('page-1', {
          layout: {
            rows: [
              {
                cols: [{ type: 'testimonial', quote: 'Great!' }],
              },
            ],
          },
        }),
      ])

      const result = await auditComponents('token', false, ['landing_page'], ['testimonial'])

      expect(result.results[0]!.usageCount).toBe(1)
    })

    it('does not match "type" field when value is not a known component', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        makePage('page-1', {
          meta: { type: 'unknown_type' },
        }),
      ])

      const result = await auditComponents('token', false, ['landing_page'], ['hero_banner'])

      expect(result.results[0]!.usageCount).toBe(0)
    })
  })

  describe('Multiple pages', () => {
    it('counts usages across multiple pages', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        makePage('page-1', { hero_banner: { title: 'Page 1' } }),
        makePage('page-2', { hero_banner: { title: 'Page 2' } }),
        makePage('page-3', { other_field: 'no component' }),
      ])

      const result = await auditComponents('token', false, ['landing_page'], ['hero_banner'])

      expect(result.totalScanned).toBe(3)
      expect(result.results[0]!.usageCount).toBe(2)
      expect(result.results[0]!.usages).toHaveLength(2)
    })

    it('includes correct page data in usages', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        makePage('my-page', { hero_banner: {} }, { name: 'My Page', status: 'draft' }),
      ])

      const result = await auditComponents('token', false, ['landing_page'], ['hero_banner'])

      const usage = result.results[0]!.usages[0]!
      expect(usage.slug).toBe('my-page')
      expect(usage.title).toBe('My Page')
      expect(usage.status).toBe('draft')
      expect(usage.pageType).toBe('landing_page')
    })
  })

  describe('Multiple page types', () => {
    it('scans all selected page types', async () => {
      mockGetAllPages
        .mockResolvedValueOnce([makePage('p1', { hero_banner: {} })])
        .mockResolvedValueOnce([makePage('p2', { hero_banner: {} })])

      const result = await auditComponents(
        'token',
        false,
        ['landing_page', 'about_page'],
        ['hero_banner'],
      )

      expect(result.totalScanned).toBe(2)
      expect(result.results[0]!.usageCount).toBe(2)
    })

    it('passes preview flag to getAllPages', async () => {
      mockGetAllPages.mockResolvedValueOnce([])

      await auditComponents('token', true, ['landing_page'], ['hero_banner'])

      expect(mockGetAllPages).toHaveBeenCalledWith({
        token: 'token',
        preview: true,
        pageType: 'landing_page',
      })
    })
  })

  describe('Failure handling', () => {
    it('records failed scopes when getAllPages throws', async () => {
      mockGetAllPages.mockRejectedValueOnce(new Error('Network error'))

      const result = await auditComponents('token', false, ['failing_page'], ['hero_banner'])

      expect(result.success).toBe(true)
      expect(result.failedScopes).toContain('failing_page')
      expect(result.totalScanned).toBe(0)
    })

    it('continues scanning other page types after a failure', async () => {
      mockGetAllPages
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce([makePage('p1', { hero_banner: {} })])

      const result = await auditComponents(
        'token',
        false,
        ['failing_page', 'good_page'],
        ['hero_banner'],
      )

      expect(result.failedScopes).toContain('failing_page')
      expect(result.totalScanned).toBe(1)
      expect(result.results[0]!.usageCount).toBe(1)
    })

    it('returns no failedScopes key when all scopes succeed', async () => {
      mockGetAllPages.mockResolvedValueOnce([])

      const result = await auditComponents('token', false, ['landing_page'], ['hero_banner'])

      expect(result.failedScopes).toBeUndefined()
    })
  })

  describe('Sorting', () => {
    it('sorts results ascending by usageCount, with 0-usage components first', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        makePage('p1', { components: [{ type: 'cta_block' }, { type: 'cta_block' }] }),
        makePage('p2', { components: [{ type: 'cta_block' }] }),
        makePage('p3', { components: [{ type: 'hero_banner' }] }),
      ])

      const result = await auditComponents(
        'token',
        false,
        ['landing_page'],
        ['hero_banner', 'cta_block', 'orphan'],
      )

      // orphan 0 pages, hero_banner 1 page, cta_block 2 pages
      expect(result.results[0]!.componentSlug).toBe('orphan')
      expect(result.results[0]!.usageCount).toBe(0)
      expect(result.results[1]!.componentSlug).toBe('hero_banner')
      expect(result.results[1]!.usageCount).toBe(1)
      expect(result.results[2]!.componentSlug).toBe('cta_block')
      expect(result.results[2]!.usageCount).toBe(2)
    })
  })

  describe('Safety mechanisms', () => {
    it('handles null and undefined values in fields without throwing', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        makePage('page-1', {
          nullField: null,
          nested: { another: null, value: undefined },
        }),
      ])

      const result = await auditComponents('token', false, ['landing_page'], ['hero_banner'])

      expect(result.success).toBe(true)
      expect(result.totalScanned).toBe(1)
    })

    it('handles circular references via WeakSet without throwing', async () => {
      const circular: Record<string, unknown> = { name: 'root' }
      circular['self'] = circular

      mockGetAllPages.mockResolvedValueOnce([makePage('page-1', circular)])

      await expect(
        auditComponents('token', false, ['landing_page'], ['hero_banner']),
      ).resolves.not.toThrow()
    })

    it('handles arrays containing non-objects without throwing', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        makePage('page-1', {
          tags: ['one', 'two', 3, null, true],
        }),
      ])

      const result = await auditComponents('token', false, ['landing_page'], ['hero_banner'])

      expect(result.success).toBe(true)
    })

    it('handles pages with empty fields object', async () => {
      mockGetAllPages.mockResolvedValueOnce([makePage('empty-page', {})])

      const result = await auditComponents('token', false, ['landing_page'], ['hero_banner'])

      expect(result.success).toBe(true)
      expect(result.results[0]!.usageCount).toBe(0)
    })
  })

  describe('Both strategies together', () => {
    it('finds component via both key and type field on same page (counted once per page)', async () => {
      mockGetAllPages.mockResolvedValueOnce([
        makePage('page-1', {
          hero_banner: { title: 'Permanent' },
          picker: [{ type: 'hero_banner', title: 'Picker' }],
        }),
      ])

      const result = await auditComponents('token', false, ['landing_page'], ['hero_banner'])

      // On one page, even if found multiple ways, we only add one usage entry per page
      // (the walker finds the component for this page, then we create one ComponentUsage)
      // Actually looking at our implementation - we count per page based on the Map<componentSlug, count>
      // If the same component appears both as a key AND as a type value, counts.get('hero_banner') = 2
      // but we still only push one usage entry for that page.
      expect(result.results[0]!.usages).toHaveLength(1)
      expect(result.results[0]!.usageCount).toBe(1)
    })
  })
})
