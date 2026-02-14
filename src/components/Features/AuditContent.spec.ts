import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import AuditContent from './AuditContent.vue'
import { useStore } from '@/stores/index'

// Mock auditContent function
const mockAuditContent = vi.fn()
vi.mock('@/features/audit', () => ({
  auditContent: (...args: unknown[]) => mockAuditContent(...args),
  UGLY_HTML_PATTERNS: ['mso-', 'figma=', 'style="'],
}))

describe('AuditContent.vue', () => {
  // Helper function to mount with proper stubs
  const mountComponent = (options = {}) => {
    return mount(AuditContent, {
      global: {
        stubs: {
          Card: {
            name: 'Card',
            props: ['skeleton'],
            template: '<div class="card" :data-skeleton="skeleton"><slot /></div>',
          },
          ScopeSelection: {
            name: 'ScopeSelection',
            props: ['disabled', 'ariaContext'],
            template: '<div class="scope-selection"><slot name="legend" /></div>',
          },
        },
      },
      ...options,
    })
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    mockAuditContent.mockReset()
  })

  describe('Structure - Component Rendering', () => {
    it('should render UtilitySection with title', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.utility-section').exists()).toBe(true)
      expect(wrapper.text()).toContain('Audit HTML Bloat')
    })

    it('should render informational banner explaining the feature', () => {
      const wrapper = mountComponent()
      const infoBanner = wrapper.find('.audit-content__info')
      expect(infoBanner.exists()).toBe(true)
      expect(wrapper.text()).toContain('What this checks')
      expect(wrapper.text()).toContain('figma=')
      expect(wrapper.text()).toContain('mso-')
    })

    it('should render ScopeSelection component', () => {
      const wrapper = mountComponent()
      const scopeSelection = wrapper.find('.scope-selection')
      expect(scopeSelection.exists()).toBe(true)
      expect(wrapper.text()).toContain('Audit Scopes')
    })

    it('should render Run Audit button when no results', () => {
      const wrapper = mountComponent()
      const auditButton = wrapper.findAll('button').find((btn) => btn.text() === 'Run Audit')
      expect(auditButton).toBeDefined()
    })

    it('should not render Run Audit button when results exist', async () => {
      mockAuditContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            issues: [{ pattern: 'mso-', path: 'body', value: 'test', count: 1 }],
          },
        ],
        totalIssues: 1,
        patternsFound: ['mso-'],
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Run Audit')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const auditButton = wrapper.findAll('button').find((btn) => btn.text() === 'Run Audit')
      expect(auditButton).toBeUndefined()
    })

    it('should render reset button when results exist', async () => {
      mockAuditContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            issues: [{ pattern: 'mso-', path: 'body', value: 'test', count: 1 }],
          },
        ],
        totalIssues: 1,
        patternsFound: ['mso-'],
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Run Audit')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const resetButton = wrapper.findAll('button').find((btn) => btn.text() === 'Reset')
      expect(resetButton).toBeDefined()
    })

    it('should not render reset button when there is only an error message', async () => {
      const wrapper = mountComponent()
      const store = useStore()
      store.token = ''
      store.selectedScopes.blog = true

      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Run Audit')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Please enter your API token')
      const resetButton = wrapper.findAll('button').find((btn) => btn.text() === 'Reset')
      expect(resetButton).toBeUndefined()
    })

    it('should not render reset button when no issues found but no results displayed', async () => {
      mockAuditContent.mockResolvedValue({
        success: true,
        results: [],
        totalIssues: 0,
        patternsFound: [],
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Run Audit')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('No HTML bloat detected')
      const resetButton = wrapper.findAll('button').find((btn) => btn.text() === 'Reset')
      expect(resetButton).toBeUndefined()
    })

    it('should not render reset button when audit fails', async () => {
      mockAuditContent.mockResolvedValue({
        success: false,
        results: [],
        totalIssues: 0,
        patternsFound: [],
        failedScopes: ['Blog'],
        error: 'API token is invalid',
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'invalid-token'
      store.selectedScopes.blog = true

      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Run Audit')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('API token is invalid')
      const resetButton = wrapper.findAll('button').find((btn) => btn.text() === 'Reset')
      expect(resetButton).toBeUndefined()
    })
  })

  describe('Functionality - Audit Execution', () => {
    it('should show error when no API token is configured', async () => {
      const wrapper = mountComponent()
      const store = useStore()
      store.token = ''
      store.selectedScopes.blog = true

      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Run Audit')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Please enter your API token')
    })

    it('should call auditContent with correct parameters', async () => {
      mockAuditContent.mockResolvedValue({
        success: true,
        results: [],
        totalIssues: 0,
        patternsFound: [],
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.includePreview = true
      store.selectedScopes.blog = true
      store.selectedScopes.pageTypes = ['landing_page']
      store.selectedScopes.collectionKeys = ['items']

      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Run Audit')
        ?.trigger('click')
      await flushPromises()

      expect(mockAuditContent).toHaveBeenCalledWith(
        'test-token',
        true,
        ['landing_page'],
        ['items'],
        true,
      )
    })

    it('should show loading state during audit', async () => {
      mockAuditContent.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100)),
      )

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      const auditButton = wrapper.findAll('button').find((btn) => btn.text() === 'Run Audit')
      await auditButton?.trigger('click')
      await nextTick()

      expect(wrapper.find('.audit-content__loading').exists()).toBe(true)
      expect(wrapper.findAll('.card[data-skeleton="true"]').length).toBe(3)
    })

    it('should display results when issues are found', async () => {
      mockAuditContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test Page',
            slug: 'test-page',
            sourceType: 'landing_page',
            issues: [
              {
                pattern: 'mso-',
                path: 'fields.body',
                value: '<p style="mso-line-height: 115%">Test</p>',
                count: 1,
              },
            ],
          },
        ],
        totalIssues: 1,
        patternsFound: ['mso-'],
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Run Audit')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.find('#auditResultsContainer').exists()).toBe(true)
      expect(wrapper.text()).toContain('Test Page')
      expect(wrapper.text()).toContain('test-page')
      expect(wrapper.text()).toContain('mso-')
    })

    it('should display success message when no issues found', async () => {
      mockAuditContent.mockResolvedValue({
        success: true,
        results: [],
        totalIssues: 0,
        patternsFound: [],
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Run Audit')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('No HTML bloat detected')
      expect(wrapper.text()).toContain('Your content is clean')
    })

    it('should handle audit failures gracefully', async () => {
      mockAuditContent.mockResolvedValue({
        success: false,
        results: [],
        totalIssues: 0,
        patternsFound: [],
        failedScopes: ['Blog'],
        error: 'API token is invalid',
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'invalid-token'
      store.selectedScopes.blog = true

      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Run Audit')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('API token is invalid')
    })

    it('should show partial failure warning', async () => {
      mockAuditContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'landing_page',
            issues: [{ pattern: 'mso-', path: 'body', value: 'test', count: 1 }],
          },
        ],
        totalIssues: 1,
        patternsFound: ['mso-'],
        failedScopes: ['Blog'],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true
      store.selectedScopes.pageTypes = ['landing_page']

      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Run Audit')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Partial failure')
      expect(wrapper.text()).toContain('Failed to fetch Blog')
    })
  })

  describe('Functionality - Reset', () => {
    it('should reset audit results and state', async () => {
      mockAuditContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            issues: [{ pattern: 'mso-', path: 'body', value: 'test', count: 1 }],
          },
        ],
        totalIssues: 1,
        patternsFound: ['mso-'],
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      // Run audit
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Run Audit')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.find('#auditResultsContainer').exists()).toBe(true)

      // Reset
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Reset')
        ?.trigger('click')
      await nextTick()

      expect(wrapper.find('#auditResultsContainer').exists()).toBe(false)
      const auditButton = wrapper.findAll('button').find((btn) => btn.text() === 'Run Audit')
      expect(auditButton).toBeDefined()
    })
  })

  describe('Display - Results Summary', () => {
    it('should display total issues and patterns found', async () => {
      mockAuditContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            issues: [
              { pattern: 'mso-', path: 'body', value: 'test1', count: 2 },
              { pattern: 'figma=', path: 'footer', value: 'test2', count: 1 },
            ],
          },
        ],
        totalIssues: 3,
        patternsFound: ['mso-', 'figma='],
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Run Audit')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const summary = wrapper.find('.audit-content__summary')
      expect(summary.text()).toContain('3')
      expect(summary.text()).toContain('issue')
      expect(summary.text()).toContain('mso-, figma=')
    })

    it('should pluralize issue count correctly', async () => {
      mockAuditContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            issues: [{ pattern: 'mso-', path: 'body', value: 'test', count: 1 }],
          },
        ],
        totalIssues: 1,
        patternsFound: ['mso-'],
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Run Audit')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('1 issue')
      expect(wrapper.text()).not.toContain('1 issues')
    })
  })

  describe('Display - Issue Cards', () => {
    it('should display issue cards with correct structure', async () => {
      mockAuditContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test Page',
            slug: 'test-page',
            sourceType: 'landing_page',
            issues: [
              {
                pattern: 'mso-',
                path: 'fields.body',
                value: '<p style="mso-test">Content</p>',
                count: 1,
              },
            ],
          },
        ],
        totalIssues: 1,
        patternsFound: ['mso-'],
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Run Audit')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.find('.audit-content__result-header').exists()).toBe(true)
      expect(wrapper.find('.audit-content__result-title').text()).toBe('Test Page')
      expect(wrapper.find('.audit-content__result-slug').text()).toBe('test-page')
      expect(wrapper.find('.audit-content__issues-list').exists()).toBe(true)
    })

    it('should highlight patterns in issue values', async () => {
      mockAuditContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            issues: [
              {
                pattern: 'mso-',
                path: 'body',
                value: '<p style="mso-line-height: 115%">Test</p>',
                count: 1,
              },
            ],
          },
        ],
        totalIssues: 1,
        patternsFound: ['mso-'],
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Run Audit')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const issueValue = wrapper.find('.audit-content__issue-value')
      expect(issueValue.html()).toContain('<mark>')
    })
  })

  describe('Accessibility', () => {
    it('should have aria-live region for results summary', async () => {
      mockAuditContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            issues: [{ pattern: 'mso-', path: 'body', value: 'test', count: 1 }],
          },
        ],
        totalIssues: 1,
        patternsFound: ['mso-'],
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Run Audit')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const summary = wrapper.find('[aria-live="polite"]')
      expect(summary.exists()).toBe(true)
      expect(summary.attributes('aria-atomic')).toBe('true')
    })

    it('should have role="alert" on status messages', async () => {
      mockAuditContent.mockResolvedValue({
        success: false,
        results: [],
        totalIssues: 0,
        patternsFound: [],
        error: 'Test error',
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Run Audit')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const alert = wrapper.find('[role="alert"]')
      expect(alert.exists()).toBe(true)
    })
  })
})
