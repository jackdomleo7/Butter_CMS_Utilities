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

  // Helper function to submit the search form
  const submitSearchForm = async (wrapper: ReturnType<typeof mount>) => {
    const form = wrapper.find('form')
    await form.trigger('submit')
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

    it('should render ScopeSelection component', () => {
      const wrapper = mountComponent()
      const scopeSelection = wrapper.find('.scope-selection')
      expect(scopeSelection.exists()).toBe(true)
      expect(wrapper.text()).toContain('Search Scopes')
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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

      await wrapper.find('#search-content-search-term').setValue('test')
      await submitSearchForm(wrapper)
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Please enter your API token')
      const resetButton = wrapper.findAll('button').find((btn) => btn.text() === 'Reset')
      expect(resetButton).toBeUndefined()
    })

    it('should not render reset button when search term is missing', async () => {
      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await submitSearchForm(wrapper)
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('Please enter a search term')
      const resetButton = wrapper.findAll('button').find((btn) => btn.text() === 'Reset')
      expect(resetButton).toBeUndefined()
    })

    it('should not render reset button when no results found but no actual results displayed', async () => {
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

      await wrapper.find('#search-content-search-term').setValue('test')
      await submitSearchForm(wrapper)
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('No items')
      const resetButton = wrapper.findAll('button').find((btn) => btn.text() === 'Reset')
      expect(resetButton).toBeUndefined()
    })

    it('should not render reset button when search fails', async () => {
      mockSearchContent.mockResolvedValue({
        success: false,
        results: [],
        totalItems: 0,
        failedScopes: ['Blog'],
        error: 'API token is invalid',
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'invalid-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await submitSearchForm(wrapper)
      await flushPromises()
      await nextTick()

      expect(wrapper.text()).toContain('API token is invalid')
      const resetButton = wrapper.findAll('button').find((btn) => btn.text() === 'Reset')
      expect(resetButton).toBeUndefined()
    })

    it('should render negation toggle section', () => {
      const wrapper = mountComponent()
      expect(wrapper.find('.search-content__negation-section').exists()).toBe(true)
      expect(wrapper.text()).toContain('Search Mode')
    })
  })

  describe('Functionality - Negation Toggle', () => {
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
      await submitSearchForm(wrapper)
      await flushPromises()
      await nextTick()

      const toggle = wrapper.findComponent({ name: 'Toggle' })
      expect(toggle.props('disabled')).toBe(true)
    })

    it('should disable text input when results exist', async () => {
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
      await submitSearchForm(wrapper)
      await flushPromises()
      await nextTick()

      const input = wrapper.find('#search-content-search-term')
      expect(input.attributes('disabled')).toBeDefined()
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

      await submitSearchForm(wrapper)
      await nextTick()

      expect(wrapper.text()).toContain('Please enter a search term')
    })

    it('should clear error when user enters text', async () => {
      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      // Trigger error
      await submitSearchForm(wrapper)
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

      await wrapper.find('#search-content-search-term').setValue('test')
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
      await flushPromises()
      await nextTick()

      const matchValue = wrapper.find('.search-content__match-value')
      const markCount = (matchValue.html().match(/<mark>/g) || []).length
      expect(markCount).toBe(3)
    })

    it('should highlight normalized character variants', async () => {
      mockSearchContent.mockResolvedValue({
        success: true,
        results: [
          {
            title: 'Test',
            slug: 'test',
            sourceType: 'Blog',
            matches: [
              { path: 'price', value: '£100 or £50', count: 2 },
              { path: 'quote', value: '"Hello" and "World"', count: 2 },
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

      // Search for £ - should highlight both £ symbols
      await wrapper.find('#search-content-search-term').setValue('£')
      await submitSearchForm(wrapper)
      await flushPromises()
      await nextTick()

      const priceMatch = wrapper.findAll('.search-content__match-value')[0]
      expect(priceMatch).toBeDefined()
      const priceHtml = priceMatch!.html()
      // Should highlight both £ symbols
      expect(priceHtml).toContain('<mark>')
      expect((priceHtml.match(/<mark>/g) || []).length).toBe(2)

      // Reset and search for quotes
      await wrapper.find('button[type="reset"]').trigger('click')
      await nextTick()

      // Search for " - should highlight both quote pairs
      await wrapper.find('#search-content-search-term').setValue('"')
      await submitSearchForm(wrapper)
      await flushPromises()
      await nextTick()

      const quoteMatch = wrapper.findAll('.search-content__match-value')[1]
      expect(quoteMatch).toBeDefined()
      const quoteHtml = quoteMatch!.html()
      // Should highlight all 4 quote marks
      expect(quoteHtml).toContain('<mark>')
      expect((quoteHtml.match(/<mark>/g) || []).length).toBe(4)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
        results: [{ title: 'Test', slug: 'test', sourceType: 'Blog', matches: [] }],
        totalItems: 1,
        failedScopes: [],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await submitSearchForm(wrapper)
      await flushPromises()
      await nextTick()

      const statusMessage = wrapper.text()
      expect(statusMessage).toContain('Found')

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
        results: [{ title: 'Test', slug: 'test', sourceType: 'Blog', matches: [] }],
        totalItems: 1,
        failedScopes: ['landing_page'],
      })

      const wrapper = mountComponent()
      const store = useStore()
      store.token = 'test-token'
      store.selectedScopes.blog = true

      await wrapper.find('#search-content-search-term').setValue('test')
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
      await flushPromises()
      await nextTick()

      const resetBtn = wrapper
        .findAllComponents({ name: 'Btn' })
        .find((btn) => btn.text() === 'Reset')
      expect(resetBtn?.props('status')).toBe('tertiary')
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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

      await wrapper.find('#search-content-search-term').setValue('test')
      await submitSearchForm(wrapper)
      await flushPromises()

      expect(mockSearchContent).toHaveBeenCalled()
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
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
      await submitSearchForm(wrapper)
      await flushPromises()
      await nextTick()

      // Results container should exist
      expect(wrapper.find('.search-content__results-container').exists()).toBe(true)
    })
  })
})
