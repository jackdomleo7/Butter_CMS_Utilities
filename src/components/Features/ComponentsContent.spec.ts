import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ComponentsContent from './ComponentsContent.vue'
import { useStore } from '@/stores/index'
import type { ComponentsResponse } from '@/features/components'

const mockAuditComponents = vi.fn()
vi.mock('@/features/components', () => ({
  auditComponents: (...args: unknown[]) => mockAuditComponents(...args),
}))

const mountComponent = () => {
  return mount(ComponentsContent, {
    global: {
      stubs: {
        Card: {
          name: 'Card',
          props: ['skeleton'],
          template: '<div class="card" :data-skeleton="skeleton"><slot /></div>',
        },
        ScopeSelection: {
          name: 'ScopeSelection',
          props: ['disabled', 'exclude', 'ariaContext'],
          template: '<div class="scope-selection"><slot name="legend" /></div>',
        },
      },
    },
  })
}

const makeResponse = (
  results: ComponentsResponse['results'],
  overrides: Partial<ComponentsResponse> = {},
): ComponentsResponse => ({
  success: true,
  results,
  totalScanned: results.reduce((acc, r) => acc + r.usages.length, 0) || 1,
  ...overrides,
})

describe('ComponentsContent.vue', () => {
  let store: ReturnType<typeof useStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    mockAuditComponents.mockReset()
    store = useStore()
    store.token = 'test-token'
    store.knownComponents = ['hero_banner', 'cta_block']
    store.selectedScopes = { blog: false, pageTypes: ['landing_page'], collectionKeys: [] }
  })

  describe('Guard states', () => {
    it('shows warning when no known components configured', () => {
      store.knownComponents = []
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('No known components configured')
    })

    it('does not show ScopeSelection when no known components configured', () => {
      store.knownComponents = []
      const wrapper = mountComponent()
      expect(wrapper.find('.scope-selection').exists()).toBe(false)
    })

    it('does not show run button when no known components configured', () => {
      store.knownComponents = []
      const wrapper = mountComponent()
      const buttons = wrapper.findAll('button')
      const runBtn = buttons.find((b) => b.text() === 'Run Analysis')
      expect(runBtn).toBeUndefined()
    })

    it('shows ScopeSelection when known components are configured', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.scope-selection').exists()).toBe(true)
    })

    it('shows run button when known components are configured', () => {
      const wrapper = mountComponent()
      const buttons = wrapper.findAll('button')
      const runBtn = buttons.find((b) => b.text().includes('Run Analysis'))
      expect(runBtn).toBeDefined()
    })

    it('shows error and does not call api when no page types selected', async () => {
      store.selectedScopes = { blog: false, pageTypes: [], collectionKeys: [] }
      const wrapper = mountComponent()
      const runBtn = wrapper.findAll('button').find((b) => b.text().includes('Run Analysis'))
      await runBtn?.trigger('click')
      await flushPromises()
      expect(mockAuditComponents).not.toHaveBeenCalled()
      expect(wrapper.text()).toContain('Please select at least one page type')
    })

    it('shows error when no token', async () => {
      store.token = ''
      const wrapper = mountComponent()
      const runBtn = wrapper.findAll('button').find((b) => b.text().includes('Run Analysis'))
      await runBtn?.trigger('click')
      await flushPromises()
      expect(mockAuditComponents).not.toHaveBeenCalled()
      expect(wrapper.text()).toContain('Please enter your API token')
    })
  })

  describe('Loading state', () => {
    it('shows skeleton cards while loading', async () => {
      mockAuditComponents.mockImplementation(() => new Promise(() => {})) // never resolves
      const wrapper = mountComponent()
      const runBtn = wrapper.findAll('button').find((b) => b.text().includes('Run Analysis'))
      await runBtn?.trigger('click')
      await flushPromises()
      const skeletons = wrapper.findAll('[data-skeleton="true"]')
      expect(skeletons.length).toBe(3)
    })

    it('renders 3 skeleton cards while loading', async () => {
      mockAuditComponents.mockImplementation(() => new Promise(() => {}))
      const wrapper = mountComponent()
      const runBtn = wrapper.findAll('button').find((b) => b.text().includes('Run Analysis'))
      await runBtn?.trigger('click')
      await flushPromises()
      expect(wrapper.findAll('.components-content__loading .card')).toHaveLength(3)
    })
  })

  describe('Results rendering', () => {
    it('renders result cards for each component', async () => {
      mockAuditComponents.mockResolvedValue(
        makeResponse([
          {
            componentSlug: 'hero_banner',
            usageCount: 2,
            usages: [
              {
                title: 'Home',
                slug: 'home',
                pageType: 'landing_page',
                status: 'published',
              },
              {
                title: 'About',
                slug: 'about',
                pageType: 'landing_page',
                status: 'published',
              },
            ],
          },
          { componentSlug: 'cta_block', usageCount: 0, usages: [] },
        ]),
      )
      const wrapper = mountComponent()
      const runBtn = wrapper.findAll('button').find((b) => b.text().includes('Run Analysis'))
      await runBtn?.trigger('click')
      await flushPromises()
      expect(wrapper.findAll('.components-content__result-card')).toHaveLength(2)
    })

    it('shows component slug on each result card', async () => {
      mockAuditComponents.mockResolvedValue(
        makeResponse([
          {
            componentSlug: 'hero_banner',
            usageCount: 1,
            usages: [
              {
                title: 'Home',
                slug: 'home',
                pageType: 'landing_page',
                status: 'published',
              },
            ],
          },
        ]),
      )
      const wrapper = mountComponent()
      await wrapper
        .findAll('button')
        .find((b) => b.text().includes('Run Analysis'))
        ?.trigger('click')
      await flushPromises()
      expect(wrapper.text()).toContain('hero_banner')
    })

    it('shows "0 usages" inline warning for components with 0 usages', async () => {
      mockAuditComponents.mockResolvedValue(
        makeResponse([{ componentSlug: 'orphan', usageCount: 0, usages: [] }]),
      )
      const wrapper = mountComponent()
      await wrapper
        .findAll('button')
        .find((b) => b.text().includes('Run Analysis'))
        ?.trigger('click')
      await flushPromises()
      expect(wrapper.text()).toContain(
        'No actual pages found using this component within the selected page type scopes',
      )
    })

    it('does not show zero-usage warning for components that have usages', async () => {
      mockAuditComponents.mockResolvedValue(
        makeResponse([
          {
            componentSlug: 'hero_banner',
            usageCount: 1,
            usages: [
              {
                title: 'Home',
                slug: 'home',
                pageType: 'landing_page',
                status: 'published',
              },
            ],
          },
        ]),
      )
      const wrapper = mountComponent()
      await wrapper
        .findAll('button')
        .find((b) => b.text().includes('Run Analysis'))
        ?.trigger('click')
      await flushPromises()
      expect(wrapper.text()).not.toContain(
        'No actual pages found using this component within the selected page type scopes',
      )
    })

    it('shows page usage items for used components', async () => {
      mockAuditComponents.mockResolvedValue(
        makeResponse([
          {
            componentSlug: 'hero_banner',
            usageCount: 1,
            usages: [
              {
                title: 'My Home Page',
                slug: 'home',
                pageType: 'landing_page',
                status: 'published',
              },
            ],
          },
        ]),
      )
      const wrapper = mountComponent()
      await wrapper
        .findAll('button')
        .find((b) => b.text().includes('Run Analysis'))
        ?.trigger('click')
      await flushPromises()
      expect(wrapper.text()).toContain('My Home Page')
      expect(wrapper.find('a.components-content__usage-link').exists()).toBe(false)
    })

    it('shows status badge on usage items', async () => {
      mockAuditComponents.mockResolvedValue(
        makeResponse([
          {
            componentSlug: 'hero_banner',
            usageCount: 1,
            usages: [
              {
                title: 'Home',
                slug: 'home',
                pageType: 'landing_page',
                status: 'draft',
              },
            ],
          },
        ]),
      )
      const wrapper = mountComponent()
      await wrapper
        .findAll('button')
        .find((b) => b.text().includes('Run Analysis'))
        ?.trigger('click')
      await flushPromises()
      const badge = wrapper.find('.components-content__status-badge--draft')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('draft')
    })

    it('shows summary with scanned pages count', async () => {
      mockAuditComponents.mockResolvedValue({
        success: true,
        results: [
          {
            componentSlug: 'hero_banner',
            usageCount: 1,
            usages: [
              {
                title: 'Home',
                slug: 'home',
                pageType: 'landing_page',
                status: 'published',
              },
            ],
          },
        ],
        totalScanned: 5,
      })
      const wrapper = mountComponent()
      await wrapper
        .findAll('button')
        .find((b) => b.text().includes('Run Analysis'))
        ?.trigger('click')
      await flushPromises()
      expect(wrapper.text()).toContain('5')
      expect(wrapper.text()).toContain('pages')
    })
  })

  describe('Partial failure', () => {
    it('shows partial failure warning when some scopes failed', async () => {
      mockAuditComponents.mockResolvedValue({
        success: true,
        results: [],
        totalScanned: 2,
        failedScopes: ['bad_page'],
      })
      const wrapper = mountComponent()
      await wrapper
        .findAll('button')
        .find((b) => b.text().includes('Run Analysis'))
        ?.trigger('click')
      await flushPromises()
      expect(wrapper.text()).toContain('Partial failure')
      expect(wrapper.text()).toContain('bad_page')
    })

    it('does not show partial failure warning when there are no failed scopes', async () => {
      mockAuditComponents.mockResolvedValue(
        makeResponse([{ componentSlug: 'hero_banner', usageCount: 0, usages: [] }]),
      )
      const wrapper = mountComponent()
      await wrapper
        .findAll('button')
        .find((b) => b.text().includes('Run Analysis'))
        ?.trigger('click')
      await flushPromises()
      expect(wrapper.text()).not.toContain('Partial failure')
    })
  })

  describe('API error', () => {
    it('shows error message when auditComponents returns failure', async () => {
      mockAuditComponents.mockResolvedValue({
        success: false,
        results: [],
        totalScanned: 0,
        error: 'Something went wrong',
      })
      const wrapper = mountComponent()
      await wrapper
        .findAll('button')
        .find((b) => b.text().includes('Run Analysis'))
        ?.trigger('click')
      await flushPromises()
      expect(wrapper.text()).toContain('Something went wrong')
    })

    it('shows error when auditComponents throws', async () => {
      mockAuditComponents.mockRejectedValue(new Error('Network failure'))
      const wrapper = mountComponent()
      await wrapper
        .findAll('button')
        .find((b) => b.text().includes('Run Analysis'))
        ?.trigger('click')
      await flushPromises()
      expect(wrapper.text()).toContain('Network failure')
    })
  })

  describe('Reset', () => {
    it('shows reset button after results are shown', async () => {
      mockAuditComponents.mockResolvedValue(
        makeResponse([{ componentSlug: 'hero_banner', usageCount: 0, usages: [] }]),
      )
      const wrapper = mountComponent()
      await wrapper
        .findAll('button')
        .find((b) => b.text().includes('Run Analysis'))
        ?.trigger('click')
      await flushPromises()
      const resetBtn = wrapper.findAll('button').find((b) => b.text().includes('Reset'))
      expect(resetBtn).toBeDefined()
    })

    it('clears results when reset is clicked', async () => {
      mockAuditComponents.mockResolvedValue(
        makeResponse([
          {
            componentSlug: 'hero_banner',
            usageCount: 1,
            usages: [
              {
                title: 'Home',
                slug: 'home',
                pageType: 'landing_page',
                status: 'published',
              },
            ],
          },
        ]),
      )
      const wrapper = mountComponent()
      await wrapper
        .findAll('button')
        .find((b) => b.text().includes('Run Analysis'))
        ?.trigger('click')
      await flushPromises()
      expect(wrapper.findAll('.components-content__result-card').length).toBeGreaterThan(0)

      const resetBtn = wrapper.findAll('button').find((b) => b.text().includes('Reset'))
      await resetBtn?.trigger('click')
      await flushPromises()
      expect(wrapper.findAll('.components-content__result-card')).toHaveLength(0)
    })

    it('hides reset button before running analysis', () => {
      const wrapper = mountComponent()
      const resetBtn = wrapper.findAll('button').find((b) => b.text().includes('Reset'))
      expect(resetBtn).toBeUndefined()
    })
  })

  describe('ScopeSelection integration', () => {
    it('passes exclude prop with blog and collectionKeys', () => {
      const wrapper = mountComponent()
      const scopeSel = wrapper.findComponent({ name: 'ScopeSelection' })
      expect(scopeSel.props('exclude')).toEqual(['blog', 'collectionKeys'])
    })

    it('disables ScopeSelection after results are shown', async () => {
      mockAuditComponents.mockResolvedValue(
        makeResponse([{ componentSlug: 'hero_banner', usageCount: 0, usages: [] }]),
      )
      const wrapper = mountComponent()
      await wrapper
        .findAll('button')
        .find((b) => b.text().includes('Run Analysis'))
        ?.trigger('click')
      await flushPromises()
      const scopeSel = wrapper.findComponent({ name: 'ScopeSelection' })
      expect(scopeSel.props('disabled')).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('renders the UtilitySection with title', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.utility-section').exists()).toBe(true)
      expect(wrapper.text()).toContain('Component Usage Audit')
    })

    it('does not render link elements on usage items', async () => {
      mockAuditComponents.mockResolvedValue(
        makeResponse([
          {
            componentSlug: 'hero_banner',
            usageCount: 1,
            usages: [
              {
                title: 'Home',
                slug: 'home',
                pageType: 'landing_page',
                status: 'published',
              },
            ],
          },
        ]),
      )
      const wrapper = mountComponent()
      await wrapper
        .findAll('button')
        .find((b) => b.text().includes('Run Analysis'))
        ?.trigger('click')
      await flushPromises()
      expect(wrapper.find('a.components-content__usage-link').exists()).toBe(false)
    })
  })
})
