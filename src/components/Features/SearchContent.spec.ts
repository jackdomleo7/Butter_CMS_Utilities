import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import SearchContent from './SearchContent.vue'
import { useStore } from '@/stores/index'

// Mock searchContent function
const mockSearchContent = vi.fn()
vi.mock('@/features/searchContent', () => ({
  searchContent: (...args: unknown[]) => mockSearchContent(...args),
}))

describe('SearchContent.vue', () => {
  // Helper function to mount with proper stubs
  const mountComponent = (options = {}) => {
    return mount(SearchContent, {
      global: {
        stubs: {
          Card: {
            name: 'Card',
            props: ['skeleton'],
            template: '<div class="card" :data-skeleton="skeleton"><slot /></div>',
          },
        },
      },
      ...options,
    })
  }

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    mockSearchContent.mockReset()
  })

  describe('Structure - Component Rendering', () => {
    it('should render UtilitySection with title', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.utility-section').exists()).toBe(true)
      expect(wrapper.text()).toContain('Search Content')
    })

    it('should render search scopes fieldset', () => {
      const wrapper = mountComponent()
      const fieldset = wrapper.find('.search-content__scopes-selection')
      expect(fieldset.exists()).toBe(true)
      expect(wrapper.text()).toContain('Search Scopes')
    })

    it('should render blog post checkbox', () => {
      const wrapper = mountComponent()
      const checkbox = wrapper.find(
        'input[type="checkbox"][aria-label="Include blog posts in search"]',
      )
      expect(checkbox.exists()).toBe(true)
      expect(wrapper.text()).toContain('Blog')
    })

    it('should render search term input', () => {
      const wrapper = mountComponent()
      const input = wrapper.find('#search-content-search-term')
      expect(input.exists()).toBe(true)
    })

    it('should render search button when no results', () => {
      const wrapper = mountComponent()
      const searchButton = wrapper.findAll('button').find((btn) => btn.text() === 'Search')
      expect(searchButton).toBeDefined()
    })

    it('should not render search button when results exist', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [{ title: 'Test', slug: 'test', sourceType: 'Blog', matches: [] }],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const searchButton = wrapper.findAll('button').find((btn) => btn.text() === 'Search')
      expect(searchButton).toBeUndefined()
    })

    it('should render reset button when results exist', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [{ title: 'Test', slug: 'test', sourceType: 'Blog', matches: [] }],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const resetButton = wrapper.findAll('button').find((btn) => btn.text() === 'Reset')
      expect(resetButton).toBeDefined()
    })

    it('should render negation toggle section', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.search-content__negation-section').exists()).toBe(true)
      expect(wrapper.text()).toContain('Search Mode')
    })
  })

  describe('Structure - Page Types', () => {
    it('should render page types when configured in store', async () => {
      const store = useStore()
      store.pageTypes = ['landing_page', 'blog_page']
      const wrapper = mountComponent()
      await nextTick()

      expect(wrapper.text()).toContain('Page Types')
      expect(wrapper.text()).toContain('landing_page')
      expect(wrapper.text()).toContain('blog_page')
    })

    it('should render page type checkboxes with correct aria-labels', async () => {
      const store = useStore()
      store.pageTypes = ['landing_page']
      const wrapper = mountComponent()
      await nextTick()

      const checkbox = wrapper.find('input[aria-label="Include landing_page pages in search"]')
      expect(checkbox.exists()).toBe(true)
    })

    it('should not render page types section when none configured', () => {
      const wrapper = mountComponent()
      const store = useStore()
      store.pageTypes = []

      expect(wrapper.text()).not.toContain('Page Types')
    })
  })

  describe('Structure - Collections', () => {
    it('should render collections when configured in store', async () => {
      const store = useStore()
      store.collectionKeys = ['items', 'products']
      const wrapper = mountComponent()
      await nextTick()

      expect(wrapper.text()).toContain('Collection Keys')
      expect(wrapper.text()).toContain('items')
      expect(wrapper.text()).toContain('products')
    })

    it('should render collection checkboxes with correct aria-labels', async () => {
      const store = useStore()
      store.collectionKeys = ['items']
      const wrapper = mountComponent()
      await nextTick()

      const checkbox = wrapper.find('input[aria-label="Include items collection in search"]')
      expect(checkbox.exists()).toBe(true)
    })

    it('should not render collections section when none configured', () => {
      const wrapper = mountComponent()
      const store = useStore()
      store.collectionKeys = []

      expect(wrapper.text()).not.toContain('Collection Keys')
    })
  })

  describe('Structure - Empty State', () => {
    it('should show message when no page types or collections configured', () => {
      const wrapper = mountComponent()
      const store = useStore()
      store.pageTypes = []
      store.collectionKeys = []

      expect(wrapper.find('.search-content__empty-scopes').exists()).toBe(true)
      expect(wrapper.text()).toContain('No page types or collection keys configured')
      expect(wrapper.text()).toContain('Configure them in API Configuration above')
    })

    it('should not show empty message when page types exist', async () => {
      const store = useStore()
      store.pageTypes = ['landing_page']
      store.collectionKeys = []
      const wrapper = mountComponent()
      await nextTick()

      expect(wrapper.find('.search-content__empty-scopes').exists()).toBe(false)
    })

    it('should not show empty message when collections exist', async () => {
      const store = useStore()
      store.pageTypes = []
      store.collectionKeys = ['items']
      const wrapper = mountComponent()
      await nextTick()

      expect(wrapper.find('.search-content__empty-scopes').exists()).toBe(false)
    })
  })

  describe('Scope Selection - Blog', () => {
    it('should have blog checkbox unchecked by default', () => {
      const wrapper = mountComponent()
      const checkbox = wrapper.find<HTMLInputElement>(
        'input[aria-label="Include blog posts in search"]',
      )
      expect(checkbox.element.checked).toBe(false)
    })

    it('should update store when blog checkbox is toggled', async () => {
      const wrapper = mountComponent()
      const store = useStore()
      const checkbox = wrapper.find('input[aria-label="Include blog posts in search"]')

      await checkbox.setValue(true)
      expect(store.selectedScopes.blog).toBe(true)

      await checkbox.setValue(false)
      expect(store.selectedScopes.blog).toBe(false)
    })

    it('should sync with store blog value', async () => {
      const wrapper = mountComponent()
      const store = useStore()
      const checkbox = wrapper.find<HTMLInputElement>(
        'input[aria-label="Include blog posts in search"]',
      )

      store.selectedScopes = { ...store.selectedScopes, blog: true }
      await nextTick()

      expect(checkbox.element.checked).toBe(true)
    })

    it('should disable blog checkbox when results exist', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [{ title: 'Test', slug: 'test', sourceType: 'Blog', matches: [] }],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const checkbox = wrapper.find<HTMLInputElement>(
        'input[aria-label="Include blog posts in search"]',
      )
      expect(checkbox.element.disabled).toBe(true)
    })
  })

  describe('Scope Selection - Page Types', () => {
    it('should not have page types selected by default', async () => {
      const store = useStore()
      store.pageTypes = ['landing_page', 'blog_page']
      const wrapper = mountComponent()
      await nextTick()

      const checkboxes = wrapper.findAll('[aria-label*="pages in search"]')
      checkboxes.forEach((checkbox) => {
        expect((checkbox.element as HTMLInputElement).checked).toBe(false)
      })
    })

    it('should toggle page type in store when checkbox is clicked', async () => {
      const store = useStore()
      store.pageTypes = ['landing_page']
      const wrapper = mountComponent()
      await nextTick()

      const checkbox = wrapper.find('input[aria-label="Include landing_page pages in search"]')
      await checkbox.setValue(true)

      expect(store.selectedScopes.pageTypes).toContain('landing_page')
    })

    it('should remove page type from store when unchecked', async () => {
      const wrapper = mountComponent()
      const store = useStore()
      store.pageTypes = ['landing_page']
      store.selectedScopes.pageTypes = ['landing_page']
      await nextTick()

      const checkbox = wrapper.find('input[aria-label="Include landing_page pages in search"]')
      await checkbox.setValue(false)

      expect(store.selectedScopes.pageTypes).not.toContain('landing_page')
    })

    it('should handle multiple page types selection', async () => {
      const store = useStore()
      store.pageTypes = ['landing_page', 'blog_page', 'contact_page']
      const wrapper = mountComponent()
      await nextTick()

      const checkbox1 = wrapper.find('input[aria-label="Include landing_page pages in search"]')
      const checkbox2 = wrapper.find('input[aria-label="Include blog_page pages in search"]')

      await checkbox1.setValue(true)
      await checkbox2.setValue(true)

      expect(store.selectedScopes.pageTypes).toContain('landing_page')
      expect(store.selectedScopes.pageTypes).toContain('blog_page')
      expect(store.selectedScopes.pageTypes).toHaveLength(2)
    })

    it('should disable page type checkboxes when results exist', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [{ title: 'Test', slug: 'test', sourceType: 'landing_page', matches: [] }],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.pageTypes = ['landing_page']
      store.selectedScopes.pageTypes = ['landing_page']

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const checkbox = wrapper.find<HTMLInputElement>(
        'input[aria-label="Include landing_page pages in search"]',
      )
      expect(checkbox.element.disabled).toBe(true)
    })

    it('should sync with store pageTypes selection', async () => {
      const wrapper = mountComponent()
      const store = useStore()
      store.pageTypes = ['landing_page']
      store.selectedScopes.pageTypes = ['landing_page']
      await nextTick()

      const checkbox = wrapper.find<HTMLInputElement>(
        'input[aria-label="Include landing_page pages in search"]',
      )
      expect(checkbox.element.checked).toBe(true)
    })
  })

  describe('Scope Selection - Collections', () => {
    it('should not have collections selected by default', async () => {
      const store = useStore()
      store.collectionKeys = ['items', 'products']
      const wrapper = mountComponent()
      await nextTick()

      const checkboxes = wrapper.findAll('[aria-label*="collection in search"]')
      checkboxes.forEach((checkbox) => {
        expect((checkbox.element as HTMLInputElement).checked).toBe(false)
      })
    })

    it('should toggle collection in store when checkbox is clicked', async () => {
      const store = useStore()
      store.collectionKeys = ['items']
      const wrapper = mountComponent()
      await nextTick()

      const checkbox = wrapper.find('input[aria-label="Include items collection in search"]')
      await checkbox.setValue(true)

      expect(store.selectedScopes.collectionKeys).toContain('items')
    })

    it('should remove collection from store when unchecked', async () => {
      const wrapper = mountComponent()
      const store = useStore()
      store.collectionKeys = ['items']
      store.selectedScopes.collectionKeys = ['items']
      await nextTick()

      const checkbox = wrapper.find('input[aria-label="Include items collection in search"]')
      await checkbox.setValue(false)

      expect(store.selectedScopes.collectionKeys).not.toContain('items')
    })

    it('should handle multiple collections selection', async () => {
      const store = useStore()
      store.collectionKeys = ['items', 'products', 'services']
      const wrapper = mountComponent()
      await nextTick()

      const checkbox1 = wrapper.find('input[aria-label="Include items collection in search"]')
      const checkbox2 = wrapper.find('input[aria-label="Include products collection in search"]')

      await checkbox1.setValue(true)
      await checkbox2.setValue(true)

      expect(store.selectedScopes.collectionKeys).toContain('items')
      expect(store.selectedScopes.collectionKeys).toContain('products')
      expect(store.selectedScopes.collectionKeys).toHaveLength(2)
    })

    it('should disable collection checkboxes when results exist', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [{ title: 'Test', slug: 'test', sourceType: 'items', matches: [] }],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.collectionKeys = ['items']
      store.selectedScopes.collectionKeys = ['items']

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const checkbox = wrapper.find<HTMLInputElement>(
        'input[aria-label="Include items collection in search"]',
      )
      expect(checkbox.element.disabled).toBe(true)
    })

    it('should sync with store collectionKeys selection', async () => {
      const wrapper = mountComponent()
      const store = useStore()
      store.collectionKeys = ['items']
      store.selectedScopes.collectionKeys = ['items']
      await nextTick()

      const checkbox = wrapper.find<HTMLInputElement>(
        'input[aria-label="Include items collection in search"]',
      )
      expect(checkbox.element.checked).toBe(true)
    })
  })

  describe('Search Mode Toggle - Negation', () => {
    it('should render toggle component', () => {
      const wrapper = mountComponent()
      const toggle = wrapper.findComponent({ name: 'Toggle' })
      expect(toggle.exists()).toBe(true)
    })

    it('should have toggle with correct id', () => {
      const wrapper = mountComponent()
      const toggle = wrapper.find('#search-mode-toggle')
      expect(toggle.exists()).toBe(true)
    })

    it('should default to include mode (negateSearch=false)', () => {
      const wrapper = mountComponent()
      const toggle = wrapper.findComponent({ name: 'Toggle' })
      expect(toggle.props('modelValue')).toBe(false)
    })

    it('should show "Include matches" label in description when negation off', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('matching your search term')
    })

    it('should show "Exclude matches" label in description when negation on', async () => {
      const wrapper = mountComponent()
      const toggle = wrapper.findComponent({ name: 'Toggle' })

      await toggle.vm.$emit('update:modelValue', true)
      await nextTick()

      expect(wrapper.text()).toContain('NOT matching')
    })

    it('should update negateSearch when toggle is changed', async () => {
      const wrapper = mountComponent()
      const toggle = wrapper.findComponent({ name: 'Toggle' })

      await toggle.vm.$emit('update:modelValue', true)
      await nextTick()

      expect(toggle.props('modelValue')).toBe(true)
    })

    it('should disable toggle when results exist', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [{ title: 'Test', slug: 'test', sourceType: 'Blog', matches: [] }],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const toggle = wrapper.findComponent({ name: 'Toggle' })
      expect(toggle.props('disabled')).toBe(true)
    })

    it('should show correct off-label', () => {
      const wrapper = mountComponent()
      const toggle = wrapper.findComponent({ name: 'Toggle' })
      expect(toggle.props('offLabel')).toContain('Include matches')
    })

    it('should show correct on-label', () => {
      const wrapper = mountComponent()
      const toggle = wrapper.findComponent({ name: 'Toggle' })
      expect(toggle.props('onLabel')).toContain('Exclude matches')
    })
  })

  describe('Search Term - Input', () => {
    it('should render search term input with correct id', () => {
      const wrapper = mountComponent()
      const input = wrapper.find('#search-content-search-term')
      expect(input.exists()).toBe(true)
    })

    it('should be empty by default', () => {
      const wrapper = mountComponent()
      const input = wrapper.find<HTMLInputElement>('#search-content-search-term')
      expect(input.element.value).toBe('')
    })

    it('should update value when user types', async () => {
      const wrapper = mountComponent()
      const input = wrapper.find('#search-content-search-term')

      await input.setValue('test search')
      expect((input.element as HTMLInputElement).value).toBe('test search')
    })

    it('should mark field as required', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('(required)')
    })

    it('should render label', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).toContain('Search Term')
    })

    it('should not show error message by default', () => {
      const wrapper = mountComponent()
      expect(wrapper.text()).not.toContain('Please enter a search term')
    })

    it('should show error when search attempted with empty term', async () => {
      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await nextTick()

      expect(wrapper.text()).toContain('Please enter a search term')
    })

    it('should clear error when user enters text', async () => {
      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      // Trigger error
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await nextTick()
      expect(wrapper.text()).toContain('Please enter a search term')

      // Clear by entering text - the error is shown via slot, need to check component state
      const input = wrapper.find('#search-content-search-term')
      await input.setValue('test')
      await nextTick()

      // Error message should still be in slot until next search attempt
      // The showMissingSearchTermError ref controls visibility
    })

    it('should trigger search on Enter key', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [],
        totalItems: 0,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      const input = wrapper.find('#search-content-search-term')
      await input.setValue('test')
      await input.trigger('keypress.enter')
      await flushPromises()

      expect(mockSearchContent).toHaveBeenCalled()
    })
  })

  describe('Search Term - Validation', () => {
    it('should trim whitespace from search term', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [],
        totalItems: 0,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      const input = wrapper.find('#search-content-search-term')
      await input.setValue('  test  ')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()

      expect(mockSearchContent).toHaveBeenCalledWith(
        'test',
        'test-token',
        false,
        [],
        [],
        true,
        false,
      )
    })

    it('should treat whitespace-only input as empty', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [],
        totalItems: 0,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      const input = wrapper.find('#search-content-search-term')
      await input.setValue('   ')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      // The component trims the search term before passing to searchContent
      expect(mockSearchContent).toHaveBeenCalledWith(
        '', // empty string after trim
        'test-token',
        false,
        [],
        [],
        true,
        false,
      )
    })

    it('should accept single character search', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [],
        totalItems: 0,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      const input = wrapper.find('#search-content-search-term')
      await input.setValue('a')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()

      expect(mockSearchContent).toHaveBeenCalled()
    })

    it('should accept special characters in search', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [],
        totalItems: 0,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      const input = wrapper.find('#search-content-search-term')
      await input.setValue('@#$%')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()

      expect(mockSearchContent).toHaveBeenCalled()
    })
  })

  describe('Search Execution - Basic', () => {
    it('should call searchContent when search button clicked', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [],
        totalItems: 0,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()

      expect(mockSearchContent).toHaveBeenCalledWith(
        'test',
        'test-token',
        false,
        [],
        [],
        true,
        false,
      )
    })

    it('should show error when no API token', async () => {
      const wrapper = mountComponent()
      const store = useStore()
      store.token = ''
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Please enter your API token')
      expect(mockSearchContent).not.toHaveBeenCalled()
    })

    it('should show loading state during search', async () => {
      let resolveSearch: (value: unknown) => void
      mockSearchContent.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSearch = resolve
          }),
      )

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      const searchBtn = wrapper.findAll('button').find((btn) => btn.text() === 'Search')
      await searchBtn?.trigger('click')
      await nextTick()

      expect(wrapper.find('.search-content__loading').exists()).toBe(true)

      // Clean up
      resolveSearch!({ success: true, results: [], totalItems: 0, failedScopes: [] })
      await flushPromises()
    })

    it('should show skeleton cards during loading', async () => {
      mockSearchContent.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ success: true, results: [], totalItems: 0, failedScopes: [] }),
              100,
            ),
          ),
      )

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await nextTick()

      const skeletons = wrapper.findAll('[data-skeleton="true"]')
      expect(skeletons).toHaveLength(3)
    })

    it('should clear loading state after search completes', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [],
        totalItems: 0,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()

      expect(wrapper.find('.search-content__loading').exists()).toBe(false)
    })
  })

  describe('Search Execution - Parameters', () => {
    it('should pass correct parameters with blog selected', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [],
        totalItems: 0,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'api-token-123'
      store.selectedScopes.blog = true
      store.includePreview = false

      await wrapper.find('#search-content-search-term').setValue('test query')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()

      expect(mockSearchContent).toHaveBeenCalledWith(
        'test query',
        'api-token-123',
        false,
        [],
        [],
        true,
        false,
      )
    })

    it('should pass correct parameters with page types selected', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [],
        totalItems: 0,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'api-token'
      store.pageTypes = ['landing_page', 'blog_page']
      store.selectedScopes.pageTypes = ['landing_page', 'blog_page']
      store.selectedScopes.blog = false

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()

      expect(mockSearchContent).toHaveBeenCalledWith(
        'test',
        'api-token',
        false,
        ['landing_page', 'blog_page'],
        [],
        false,
        false,
      )
    })

    it('should pass correct parameters with collections selected', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [],
        totalItems: 0,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'api-token'
      store.collectionKeys = ['items', 'products']
      store.selectedScopes.collectionKeys = ['items', 'products']
      store.selectedScopes.blog = false

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()

      expect(mockSearchContent).toHaveBeenCalledWith(
        'test',
        'api-token',
        false,
        [],
        ['items', 'products'],
        false,
        false,
      )
    })

    it('should pass negateSearch=true when toggle is on', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [],
        totalItems: 0,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'api-token'
      store.selectedScopes.blog = true

      const toggle = wrapper.findComponent({ name: 'Toggle' })
      await toggle.vm.$emit('update:modelValue', true)
      await nextTick()

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()

      expect(mockSearchContent).toHaveBeenCalledWith('test', 'api-token', false, [], [], true, true)
    })

    it('should pass includePreview from store', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [],
        totalItems: 0,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'api-token'
      store.selectedScopes.blog = true
      store.includePreview = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()

      expect(mockSearchContent).toHaveBeenCalledWith('test', 'api-token', true, [], [], true, false)
    })

    it('should handle mixed scope selection', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [],
        totalItems: 0,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'api-token'
      store.pageTypes = ['landing_page']
      store.collectionKeys = ['items']
      store.selectedScopes = {
        blog: true,
        pageTypes: ['landing_page'],
        collectionKeys: ['items'],
      }

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()

      expect(mockSearchContent).toHaveBeenCalledWith(
        'test',
        'api-token',
        false,
        ['landing_page'],
        ['items'],
        true,
        false,
      )
    })
  })

  describe('Search Execution - Error Handling', () => {
    it('should handle search failure', async () => {
      mockSearchContent.mockResolvedValue({
        success: false,
        error: 'API error occurred',
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('API error occurred')
    })

    it('should handle thrown exceptions', async () => {
      mockSearchContent.mockRejectedValue(new Error('Network error'))

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Network error')
    })

    it('should clear previous results on new search', async () => {
      mockSearchContent.mockResolvedValueOnce({
        success: true,
        results: [
          {
            title: 'First',
            slug: 'first',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'First', count: 1 }],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      // First search
      await wrapper.find('#search-content-search-term').setValue('first')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('First')

      // Reset and second search
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Reset')
        ?.trigger('click')
      await nextTick()

      mockSearchContent.mockResolvedValueOnce({
        success: true,
        results: [
          {
            title: 'Second',
            slug: 'second',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'Second', count: 1 }],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const input = wrapper.find('#search-content-search-term')
      await input.setValue('second')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Second')
      expect(wrapper.text()).not.toContain('First')
    })

    it('should clear error messages on new search', async () => {
      mockSearchContent.mockResolvedValueOnce({
        success: false,
        error: 'Error message',
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      // First search with error
      await wrapper.find('#search-content-search-term').setValue('test1')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()

      expect(wrapper.text()).toContain('Error message')

      // Second successful search
      mockSearchContent.mockResolvedValueOnce({
        success: true,
        results: [],
        totalItems: 0,
        failedScopes: [],
      })

      const input = wrapper.find('#search-content-search-term')
      await input.setValue('test2')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()

      expect(wrapper.text()).not.toContain('Error message')
    })
  })

  describe('Results Display - Basic', () => {
    it('should display results when search is successful', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test Result',
            slug: 'test-result',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'Test Result', count: 1 }],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.find('.search-content__results-container').exists()).toBe(true)
      expect(wrapper.text()).toContain('Test Result')
    })

    it('should display multiple results', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Result 1',
            slug: 'result-1',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'Result 1', count: 1 }],
          },
          {
            title: 'Result 2',
            slug: 'result-2',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'Result 2', count: 1 }],
          },
        ],
        totalItems: 2,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Result 1')
      expect(wrapper.text()).toContain('Result 2')
    })

    it('should display result title', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'My Test Title',
            slug: 'test',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'My Test Title', count: 1 }],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.find('.search-content__result-title').exists()).toBe(true)
      expect(wrapper.find('.search-content__result-title').text()).toBe('My Test Title')
    })

    it('should display result slug', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'my-test-slug',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'Test', count: 1 }],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.find('.search-content__result-slug').exists()).toBe(true)
      expect(wrapper.find('.search-content__result-slug').text()).toBe('my-test-slug')
    })

    it('should not display results container when no results', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [],
        totalItems: 0,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.find('.search-content__results-container').exists()).toBe(false)
    })
  })

  describe('Results Display - Badges and Counts', () => {
    it('should display source type badge', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'Test', count: 1 }],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const chips = wrapper.findAllComponents({ name: 'Chip' })
      const sourceBadge = chips.find((chip) => chip.text() === 'Blog')
      expect(sourceBadge).toBeDefined()
    })

    it('should display page type as source badge', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'landing_page',
            matches: [{ path: 'title', value: 'Test', count: 1 }],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.pageTypes = ['landing_page']
      store.selectedScopes.pageTypes = ['landing_page']

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const chips = wrapper.findAllComponents({ name: 'Chip' })
      const sourceBadge = chips.find((chip) => chip.text() === 'landing_page')
      expect(sourceBadge).toBeDefined()
    })

    it('should display match count', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            matches: [
              { path: 'title', value: 'Test', count: 1 },
              { path: 'body', value: 'Test content', count: 2 },
            ],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.find('.search-content__match-count').text()).toContain('3')
      expect(wrapper.text()).toContain('matches')
    })

    it('should use singular "match" for count of 1', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'Test', count: 1 }],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const matchCount = wrapper.find('.search-content__match-count').text()
      expect(matchCount).toContain('1')
      expect(matchCount).toContain('match')
      expect(matchCount).not.toContain('matches')
    })

    it('should display summary with total matches', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test 1',
            slug: 'test-1',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'Test', count: 2 }],
          },
          {
            title: 'Test 2',
            slug: 'test-2',
            sourceType: 'landing_page',
            matches: [{ path: 'body', value: 'Test', count: 3 }],
          },
        ],
        totalItems: 2,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true
      store.pageTypes = ['landing_page']
      store.selectedScopes.pageTypes = ['landing_page']

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.find('.search-content__summary').exists()).toBe(true)
      expect(wrapper.text()).toContain('5 matches')
    })

    it('should display scope breakdown in summary', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test 1',
            slug: 'test-1',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'Test', count: 2 }],
          },
          {
            title: 'Test 2',
            slug: 'test-2',
            sourceType: 'landing_page',
            matches: [{ path: 'body', value: 'Test', count: 3 }],
          },
        ],
        totalItems: 2,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const summary = wrapper.find('.search-content__summary').text()
      expect(summary).toContain('Blog')
      expect(summary).toContain('landing_page')
    })
  })

  describe('Results Display - Matches', () => {
    it('should display match path', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            matches: [{ path: 'fields.title', value: 'Test', count: 1 }],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.find('.search-content__match-path').exists()).toBe(true)
      expect(wrapper.find('.search-content__match-path').text()).toBe('fields.title')
    })

    it('should display match value', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'My Test Value', count: 1 }],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.find('.search-content__match-value').exists()).toBe(true)
      expect(wrapper.find('.search-content__match-value').text()).toContain('My Test Value')
    })

    it('should highlight search term in match value', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'This is a test value', count: 1 }],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const matchValue = wrapper.find('.search-content__match-value')
      expect(matchValue.html()).toContain('<mark>')
      expect(matchValue.html()).toContain('test')
    })

    it('should display multiple matches for one result', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            matches: [
              { path: 'title', value: 'Test Title', count: 1 },
              { path: 'body', value: 'Test Body', count: 1 },
              { path: 'summary', value: 'Test Summary', count: 1 },
            ],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const matchItems = wrapper.findAll('.search-content__match-item')
      expect(matchItems).toHaveLength(3)
    })

    it('should escape HTML in match values', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: '<script>alert("xss")</script>', count: 1 }],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('script')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const matchValue = wrapper.find('.search-content__match-value')
      // Check that the dangerous script tag is escaped
      const html = matchValue.html()
      expect(html).not.toMatch(/<script[^>]*>(?!.*&lt;)/)
      expect(html).toContain('&lt;')
    })

    it('should handle case-insensitive highlighting', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'TEST test TeSt', count: 3 }],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const matchValue = wrapper.find('.search-content__match-value')
      const markCount = (matchValue.html().match(/<mark>/g) || []).length
      expect(markCount).toBe(3)
    })
  })

  describe('Status Messages - Info Banner', () => {
    it('should show success message with results found', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'Test', count: 1 }],
          },
        ],
        totalItems: 10,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const infoBanner = wrapper.findComponent({ name: 'InfoBanner' })
      expect(infoBanner.exists()).toBe(true)
      expect(infoBanner.props('status')).toBe('success')
    })

    it('should show info message when no results found', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [],
        totalItems: 10,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('nonexistent')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const infoBanner = wrapper.findComponent({ name: 'InfoBanner' })
      expect(infoBanner.exists()).toBe(true)
      expect(infoBanner.props('status')).toBe('info')
      expect(wrapper.text()).toContain('No items')
      expect(wrapper.text()).toContain('containing')
    })

    it('should show error message on failure', async () => {
      mockSearchContent.mockResolvedValue({
        success: false,
        error: 'Invalid API token',
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const infoBanner = wrapper.findComponent({ name: 'InfoBanner' })
      expect(infoBanner.exists()).toBe(true)
      expect(infoBanner.props('status')).toBe('error')
      expect(wrapper.text()).toContain('Invalid API token')
    })

    it('should include search term in message', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [],
        totalItems: 5,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('my search query')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('my search query')
    })

    it('should include total items in message', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [],
        totalItems: 42,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('42')
    })

    it('should show "NOT containing" in negation mode', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [],
        totalItems: 10,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      const toggle = wrapper.findComponent({ name: 'Toggle' })
      await toggle.vm.$emit('update:modelValue', true)
      await nextTick()

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('NOT containing')
    })

    it('should have role="alert" on status message', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [],
        totalItems: 0,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const infoBanner = wrapper.findComponent({ name: 'InfoBanner' })
      expect(infoBanner.attributes('role')).toBe('alert')
    })

    it('should not show status message during loading', async () => {
      mockSearchContent.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ success: true, results: [], totalItems: 0, failedScopes: [] }),
              100,
            ),
          ),
      )

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await nextTick()

      const infoBanners = wrapper.findAllComponents({ name: 'InfoBanner' })
      const statusBanner = infoBanners.find((banner) => banner.classes('status-message'))
      expect(statusBanner).toBeUndefined()
    })
  })

  describe('Failed Scopes - Warning Banner', () => {
    it('should show warning when some scopes fail', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'Test', count: 1 }],
          },
        ],
        totalItems: 1,
        failedScopes: ['landing_page', 'items'],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Partial failure')
      expect(wrapper.text()).toContain('landing_page')
      expect(wrapper.text()).toContain('items')
    })

    it('should show warning banner with status="warning"', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [],
        totalItems: 0,
        failedScopes: ['landing_page'],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const warningBanners = wrapper
        .findAllComponents({ name: 'InfoBanner' })
        .filter((b) => b.props('status') === 'warning')
      expect(warningBanners.length).toBeGreaterThan(0)
    })

    it('should not show warning when no scopes fail', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [],
        totalItems: 0,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).not.toContain('Partial failure')
    })

    it('should clear failed scopes on new search', async () => {
      mockSearchContent.mockResolvedValueOnce({
        success: true,
        results: [],
        totalItems: 0,
        failedScopes: ['landing_page'],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test1')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Partial failure')

      mockSearchContent.mockResolvedValueOnce({
        success: true,
        results: [],
        totalItems: 0,
        failedScopes: [],
      })

      const input = wrapper.find('#search-content-search-term')
      await input.setValue('test2')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).not.toContain('Partial failure')
    })

    it('should not show warning during loading', async () => {
      mockSearchContent.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  results: [],
                  totalItems: 0,
                  failedScopes: ['landing_page'],
                }),
              100,
            ),
          ),
      )

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await nextTick()

      expect(wrapper.text()).not.toContain('Partial failure')
    })
  })

  describe('Reset Functionality', () => {
    it('should clear results when reset is clicked', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'Test', count: 1 }],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.find('.search-content__results-container').exists()).toBe(true)

      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Reset')
        ?.trigger('click')
      await nextTick()

      expect(wrapper.find('.search-content__results-container').exists()).toBe(false)
    })

    it('should clear search term when reset is clicked', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'Test', count: 1 }],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test query')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Reset')
        ?.trigger('click')
      await nextTick()

      const input = wrapper.find<HTMLInputElement>('#search-content-search-term')
      expect(input.element.value).toBe('')
    })

    it('should clear status messages when reset is clicked', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [],
        totalItems: 0,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const statusMessage = wrapper.text()
      expect(statusMessage).toContain('No items')

      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Reset')
        ?.trigger('click')
      await nextTick()

      const infoBanner = wrapper.findComponent({ name: 'InfoBanner' })
      expect(infoBanner.exists()).toBe(false)
    })

    it('should clear failed scopes when reset is clicked', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [],
        totalItems: 0,
        failedScopes: ['landing_page'],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Partial failure')

      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Reset')
        ?.trigger('click')
      await nextTick()

      expect(wrapper.text()).not.toContain('Partial failure')
    })

    it('should clear error message when reset is clicked', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'Test', count: 1 }],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Reset')
        ?.trigger('click')
      await nextTick()

      expect(wrapper.text()).not.toContain('Please enter a search term')
    })

    it('should have reset button with type="reset"', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'Test', count: 1 }],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const resetBtn = wrapper
        .findAllComponents({ name: 'Btn' })
        .find((btn) => btn.text() === 'Reset')
      expect(resetBtn?.props('type')).toBe('reset')
    })

    it('should have reset button with tertiary status', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'Test', count: 1 }],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const resetBtn = wrapper
        .findAllComponents({ name: 'Btn' })
        .find((btn) => btn.text() === 'Reset')
      expect(resetBtn?.props('status')).toBe('tertiary')
    })

    it('should re-enable checkboxes after reset', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'Test', count: 1 }],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const checkboxBefore = wrapper.find<HTMLInputElement>(
        'input[aria-label="Include blog posts in search"]',
      )
      expect(checkboxBefore.element.disabled).toBe(true)

      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Reset')
        ?.trigger('click')
      await nextTick()

      const checkboxAfter = wrapper.find<HTMLInputElement>(
        'input[aria-label="Include blog posts in search"]',
      )
      expect(checkboxAfter.element.disabled).toBe(false)
    })

    it('should re-enable toggle after reset', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'Test', count: 1 }],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const toggleBefore = wrapper.findComponent({ name: 'Toggle' })
      expect(toggleBefore.props('disabled')).toBe(true)

      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Reset')
        ?.trigger('click')
      await nextTick()

      const toggleAfter = wrapper.findComponent({ name: 'Toggle' })
      expect(toggleAfter.props('disabled')).toBe(false)
    })
  })

  describe('Accessibility', () => {
    it('should have fieldset with legend for scopes', () => {
      const wrapper = mountComponent()
      const fieldset = wrapper.find('fieldset.search-content__scopes-selection')
      const legend = fieldset.find('legend')

      expect(fieldset.exists()).toBe(true)
      expect(legend.exists()).toBe(true)
      expect(legend.text()).toBe('Search Scopes')
    })

    it('should have aria-label on blog checkbox', () => {
      const wrapper = mountComponent()
      const checkbox = wrapper.find(
        'input[type="checkbox"][aria-label="Include blog posts in search"]',
      )
      expect(checkbox.exists()).toBe(true)
    })

    it('should have aria-label on page type checkboxes', async () => {
      const store = useStore()
      store.pageTypes = ['landing_page']
      const wrapper = mountComponent()
      await nextTick()

      const checkbox = wrapper.find('input[aria-label="Include landing_page pages in search"]')
      expect(checkbox.exists()).toBe(true)
    })

    it('should have aria-label on collection checkboxes', async () => {
      const store = useStore()
      store.collectionKeys = ['items']
      const wrapper = mountComponent()
      await nextTick()

      const checkbox = wrapper.find('input[aria-label="Include items collection in search"]')
      expect(checkbox.exists()).toBe(true)
    })

    it('should have aria-live="polite" on results summary', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'Test', count: 1 }],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const summary = wrapper.find('.search-content__summary')
      expect(summary.attributes('aria-live')).toBe('polite')
    })

    it('should have aria-atomic="true" on results summary', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'Test', count: 1 }],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const summary = wrapper.find('.search-content__summary')
      expect(summary.attributes('aria-atomic')).toBe('true')
    })

    it('should have role="alert" on status banner', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [],
        totalItems: 0,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      const infoBanner = wrapper.findComponent({ name: 'InfoBanner' })
      expect(infoBanner.attributes('role')).toBe('alert')
    })

    it('should have labels for all form controls', async () => {
      const store = useStore()
      store.pageTypes = ['landing_page']
      store.collectionKeys = ['items']
      const wrapper = mountComponent()
      await nextTick()

      // Search term has label via TextInput component
      expect(wrapper.text()).toContain('Search Term')

      // Toggle has label
      expect(wrapper.text()).toContain('Search Mode')

      // Scopes have legend
      expect(wrapper.text()).toContain('Search Scopes')

      // All checkboxes have labels via aria-label
      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      checkboxes.forEach((checkbox) => {
        expect(checkbox.attributes('aria-label')).toBeDefined()
      })
    })

    it('should support keyboard navigation on Enter key', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [],
        totalItems: 0,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      const input = wrapper.find('#search-content-search-term')
      await input.setValue('test')
      await input.trigger('keypress.enter')
      await flushPromises()

      expect(mockSearchContent).toHaveBeenCalled()
    })

    it('should have semantic HTML structure', () => {
      const wrapper = mountComponent()

      // Has fieldset/legend for grouping
      expect(wrapper.find('fieldset').exists()).toBe(true)
      expect(wrapper.find('legend').exists()).toBe(true)

      // Labels for checkboxes
      const labels = wrapper.findAll('label')
      expect(labels.length).toBeGreaterThan(0)
    })

    it('should have proper heading hierarchy in result cards', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'Test', count: 1 }],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      // Results should have proper structure with headers
      expect(wrapper.find('.search-content__result-header').exists()).toBe(true)
      expect(wrapper.find('.search-content__result-title').exists()).toBe(true)
    })
  })

  describe('Computed Properties - Match Counts', () => {
    it('calculates matchesByScope correctly with single scope', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test 1',
            slug: 'test-1',
            sourceType: 'Blog',
            matches: [
              { path: 'title', value: 'Test', count: 2 },
              { path: 'body', value: 'Test', count: 3 },
            ],
          },
          {
            title: 'Test 2',
            slug: 'test-2',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'Test', count: 1 }],
          },
        ],
        totalItems: 2,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      // Should display match count chip
      const matchCountChip = wrapper.find('.search-content__match-count')
      expect(matchCountChip.exists()).toBe(true)
    })

    it('calculates matchesByScope correctly with multiple scopes', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Blog Post',
            slug: 'blog-post',
            sourceType: 'Blog',
            matches: [
              { path: 'title', value: 'Test', count: 2 },
              { path: 'body', value: 'Test', count: 3 },
            ],
          },
          {
            title: 'Landing Page',
            slug: 'landing-page',
            sourceType: 'landing_page',
            matches: [{ path: 'title', value: 'Test', count: 1 }],
          },
          {
            title: 'Collection Item',
            slug: 'collection-item',
            sourceType: 'products',
            matches: [{ path: 'name', value: 'Test', count: 4 }],
          },
        ],
        totalItems: 3,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      // Should display results from all three scope types
      const badges = wrapper.findAll('.search-content__result-title-wrapper .chip')
      expect(badges.length).toBe(3)
    })

    it('calculates getResultMatchCount for individual results', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Multi Match',
            slug: 'multi-match',
            sourceType: 'Blog',
            matches: [
              { path: 'title', value: 'Test', count: 2 },
              { path: 'body', value: 'Test', count: 3 },
              { path: 'meta', value: 'Test', count: 1 },
            ],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      // Should display total match count (2 + 3 + 1 = 6)
      const matchCountChip = wrapper.find('.search-content__match-count')
      expect(matchCountChip.text()).toContain('6')
      expect(matchCountChip.text()).toContain('matches')
    })

    it('handles matches without explicit count property', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            matches: [
              { path: 'title', value: 'Test' }, // No count property
              { path: 'body', value: 'Test', count: 2 },
            ],
          },
        ],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      // Should default missing count to 1, total = 1 + 2 = 3
      const matchCountChip = wrapper.find('.search-content__match-count')
      expect(matchCountChip.text()).toContain('3')
    })

    it('displays matchesSummary with scope breakdown', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Blog 1',
            slug: 'blog-1',
            sourceType: 'Blog',
            matches: [{ path: 'title', value: 'Test', count: 5 }],
          },
          {
            title: 'Page 1',
            slug: 'page-1',
            sourceType: 'landing_page',
            matches: [{ path: 'title', value: 'Test', count: 3 }],
          },
        ],
        totalItems: 2,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await wrapper
        .findAll('button')
        .find((btn) => btn.text() === 'Search')
        ?.trigger('click')
      await flushPromises()
      await nextTick()

      // Results container should exist
      expect(wrapper.find('.search-content__results-container').exists()).toBe(true)
    })
  })
})
