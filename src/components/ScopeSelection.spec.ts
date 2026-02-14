import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ScopeSelection from './ScopeSelection.vue'
import { createPinia, setActivePinia } from 'pinia'
import { useStore } from '@/stores/index'

describe('ScopeSelection.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    const store = useStore()
    store.pageTypes = []
    store.collectionKeys = []
    store.selectedScopes = {
      blog: false,
      pageTypes: [],
      collectionKeys: [],
    }
  })

  describe('Rendering', () => {
    it('should render the component', () => {
      const wrapper = mount(ScopeSelection)
      expect(wrapper.find('.scope-selection').exists()).toBe(true)
    })

    it('should render default legend text', () => {
      const wrapper = mount(ScopeSelection)
      expect(wrapper.find('.scope-selection__label').text()).toBe('Scopes')
    })

    it('should render custom legend via slot', () => {
      const wrapper = mount(ScopeSelection, {
        slots: {
          legend: 'Custom Legend',
        },
      })
      expect(wrapper.find('.scope-selection__label').text()).toBe('Custom Legend')
    })

    it('should render blog checkbox', () => {
      const wrapper = mount(ScopeSelection)
      const blogCheckbox = wrapper.find('input[type="checkbox"]')
      expect(blogCheckbox.exists()).toBe(true)
    })

    it('should show empty scopes message when no page types or collections configured', () => {
      const wrapper = mount(ScopeSelection)
      const emptyMessage = wrapper.find('.scope-selection__empty-scopes')
      expect(emptyMessage.exists()).toBe(true)
      expect(emptyMessage.text()).toContain('No page types or collection keys configured')
    })

    it('should render page types when configured', () => {
      const store = useStore()
      store.pageTypes = ['landing_page', 'blog_post']

      const wrapper = mount(ScopeSelection)
      const pageTypeGroup = wrapper.find('.scope-selection__scope-group')
      expect(pageTypeGroup.exists()).toBe(true)
      expect(pageTypeGroup.text()).toContain('Page Types')
      expect(wrapper.text()).toContain('landing_page')
      expect(wrapper.text()).toContain('blog_post')
    })

    it('should render collection keys when configured', () => {
      const store = useStore()
      store.collectionKeys = ['authors', 'categories']

      const wrapper = mount(ScopeSelection)
      const collectionGroups = wrapper.findAll('.scope-selection__scope-group')
      const collectionGroup = collectionGroups[collectionGroups.length - 1]!
      expect(collectionGroup.text()).toContain('Collection Keys')
      expect(wrapper.text()).toContain('authors')
      expect(wrapper.text()).toContain('categories')
    })

    it('should not show empty message when page types are configured', () => {
      const store = useStore()
      store.pageTypes = ['landing_page']

      const wrapper = mount(ScopeSelection)
      expect(wrapper.find('.scope-selection__empty-scopes').exists()).toBe(false)
    })

    it('should not show empty message when collection keys are configured', () => {
      const store = useStore()
      store.collectionKeys = ['authors']

      const wrapper = mount(ScopeSelection)
      expect(wrapper.find('.scope-selection__empty-scopes').exists()).toBe(false)
    })
  })

  describe('Blog checkbox', () => {
    it('should be unchecked by default', () => {
      const wrapper = mount(ScopeSelection)
      const blogCheckbox = wrapper.find('input[type="checkbox"]')
      expect((blogCheckbox.element as HTMLInputElement).checked).toBe(false)
    })

    it('should be checked when store.selectedScopes.blog is true', () => {
      const store = useStore()
      store.selectedScopes = { ...store.selectedScopes, blog: true }

      const wrapper = mount(ScopeSelection)
      const blogCheckbox = wrapper.find('input[type="checkbox"]')
      expect((blogCheckbox.element as HTMLInputElement).checked).toBe(true)
    })

    it('should update store when toggled', async () => {
      const store = useStore()
      const wrapper = mount(ScopeSelection)
      const blogCheckbox = wrapper.find('input[type="checkbox"]')

      await blogCheckbox.setValue(true)
      expect(store.selectedScopes.blog).toBe(true)

      await blogCheckbox.setValue(false)
      expect(store.selectedScopes.blog).toBe(false)
    })

    it('should have correct aria-label when unchecked', () => {
      const wrapper = mount(ScopeSelection)
      const blogCheckbox = wrapper.find('input[type="checkbox"]')
      expect(blogCheckbox.attributes('aria-label')).toBe('include blog posts')
    })

    it('should have correct aria-label when checked', () => {
      const store = useStore()
      store.selectedScopes = { ...store.selectedScopes, blog: true }

      const wrapper = mount(ScopeSelection)
      const blogCheckbox = wrapper.find('input[type="checkbox"]')
      expect(blogCheckbox.attributes('aria-label')).toBe('exclude blog posts')
    })
  })

  describe('Page type checkboxes', () => {
    beforeEach(() => {
      const store = useStore()
      store.pageTypes = ['landing_page', 'blog_post', 'about_page']
    })

    it('should render all page type checkboxes', () => {
      const wrapper = mount(ScopeSelection)
      const checkboxes = wrapper.findAll('.scope-selection__scope-options input[type="checkbox"]')
      expect(checkboxes).toHaveLength(3)
    })

    it('should check page types that are in selectedScopes', () => {
      const store = useStore()
      store.selectedScopes = { ...store.selectedScopes, pageTypes: ['landing_page', 'about_page'] }

      const wrapper = mount(ScopeSelection)
      const checkboxes = wrapper.findAll('.scope-selection__scope-options input[type="checkbox"]')

      expect((checkboxes[0]!.element as HTMLInputElement).checked).toBe(true) // landing_page
      expect((checkboxes[1]!.element as HTMLInputElement).checked).toBe(false) // blog_post
      expect((checkboxes[2]!.element as HTMLInputElement).checked).toBe(true) // about_page
    })

    it('should add page type to store when checked', async () => {
      const store = useStore()
      const wrapper = mount(ScopeSelection)
      const checkboxes = wrapper.findAll('.scope-selection__scope-options input[type="checkbox"]')

      await checkboxes[0]!.setValue(true)
      expect(store.selectedScopes.pageTypes).toContain('landing_page')
    })

    it('should remove page type from store when unchecked', async () => {
      const store = useStore()
      store.selectedScopes = { ...store.selectedScopes, pageTypes: ['landing_page', 'about_page'] }

      const wrapper = mount(ScopeSelection)
      const checkboxes = wrapper.findAll('.scope-selection__scope-options input[type="checkbox"]')

      await checkboxes[0]!.setValue(false)
      expect(store.selectedScopes.pageTypes).not.toContain('landing_page')
      expect(store.selectedScopes.pageTypes).toContain('about_page')
    })

    it('should have correct aria-label', () => {
      const wrapper = mount(ScopeSelection, {
        props: {
          ariaContext: 'search',
        },
      })
      const checkboxes = wrapper.findAll('.scope-selection__scope-options input[type="checkbox"]')
      expect(checkboxes[0]!.attributes('aria-label')).toBe('Include landing_page pages in search')
    })

    it('should use default aria-label when ariaContext not provided', () => {
      const wrapper = mount(ScopeSelection)
      const checkboxes = wrapper.findAll('.scope-selection__scope-options input[type="checkbox"]')
      expect(checkboxes[0]!.attributes('aria-label')).toContain('Include landing_page pages')
    })
  })

  describe('Collection key checkboxes', () => {
    beforeEach(() => {
      const store = useStore()
      store.collectionKeys = ['authors', 'categories', 'tags']
    })

    it('should render all collection key checkboxes', () => {
      const wrapper = mount(ScopeSelection)
      const groups = wrapper.findAll('.scope-selection__scope-group')
      const collectionGroup = groups[groups.length - 1]
      const checkboxes = collectionGroup!.findAll('input[type="checkbox"]')
      expect(checkboxes).toHaveLength(3)
    })

    it('should check collection keys that are in selectedScopes', () => {
      const store = useStore()
      store.selectedScopes = { ...store.selectedScopes, collectionKeys: ['authors', 'tags'] }

      const wrapper = mount(ScopeSelection)
      const groups = wrapper.findAll('.scope-selection__scope-group')
      const collectionGroup = groups[groups.length - 1]
      const checkboxes = collectionGroup!.findAll('input[type="checkbox"]')

      expect((checkboxes[0]!.element as HTMLInputElement).checked).toBe(true) // authors
      expect((checkboxes[1]!.element as HTMLInputElement).checked).toBe(false) // categories
      expect((checkboxes[2]!.element as HTMLInputElement).checked).toBe(true) // tags
    })

    it('should add collection key to store when checked', async () => {
      const store = useStore()
      const wrapper = mount(ScopeSelection)
      const groups = wrapper.findAll('.scope-selection__scope-group')
      const collectionGroup = groups[groups.length - 1]
      const checkboxes = collectionGroup!.findAll('input[type="checkbox"]')

      await checkboxes[0]!.setValue(true)
      expect(store.selectedScopes.collectionKeys).toContain('authors')
    })

    it('should remove collection key from store when unchecked', async () => {
      const store = useStore()
      store.selectedScopes = { ...store.selectedScopes, collectionKeys: ['authors', 'tags'] }

      const wrapper = mount(ScopeSelection)
      const groups = wrapper.findAll('.scope-selection__scope-group')
      const collectionGroup = groups[groups.length - 1]
      const checkboxes = collectionGroup!.findAll('input[type="checkbox"]')

      await checkboxes[0]!.setValue(false)
      expect(store.selectedScopes.collectionKeys).not.toContain('authors')
      expect(store.selectedScopes.collectionKeys).toContain('tags')
    })

    it('should have correct aria-label', () => {
      const wrapper = mount(ScopeSelection, {
        props: {
          ariaContext: 'audit',
        },
      })
      const groups = wrapper.findAll('.scope-selection__scope-group')
      const collectionGroup = groups[groups.length - 1]
      const checkboxes = collectionGroup!.findAll('input[type="checkbox"]')
      expect(checkboxes[0]!.attributes('aria-label')).toBe('Include authors collection in audit')
    })
  })

  describe('Disabled state', () => {
    beforeEach(() => {
      const store = useStore()
      store.pageTypes = ['landing_page']
      store.collectionKeys = ['authors']
    })

    it('should disable blog checkbox when disabled prop is true', () => {
      const wrapper = mount(ScopeSelection, {
        props: {
          disabled: true,
        },
      })
      const blogCheckbox = wrapper.find('input[type="checkbox"]')
      expect(blogCheckbox.attributes('disabled')).toBeDefined()
    })

    it('should disable page type checkboxes when disabled prop is true', () => {
      const wrapper = mount(ScopeSelection, {
        props: {
          disabled: true,
        },
      })
      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      checkboxes.forEach((checkbox) => {
        expect(checkbox.attributes('disabled')).toBeDefined()
      })
    })

    it('should disable collection key checkboxes when disabled prop is true', () => {
      const wrapper = mount(ScopeSelection, {
        props: {
          disabled: true,
        },
      })
      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      checkboxes.forEach((checkbox) => {
        expect(checkbox.attributes('disabled')).toBeDefined()
      })
    })

    it('should not disable checkboxes when disabled prop is false', () => {
      const wrapper = mount(ScopeSelection, {
        props: {
          disabled: false,
        },
      })
      const checkboxes = wrapper.findAll('input[type="checkbox"]')
      checkboxes.forEach((checkbox) => {
        expect(checkbox.attributes('disabled')).toBeUndefined()
      })
    })
  })

  describe('Integration', () => {
    it('should handle both page types and collections simultaneously', () => {
      const store = useStore()
      store.pageTypes = ['landing_page']
      store.collectionKeys = ['authors']

      const wrapper = mount(ScopeSelection)
      const groups = wrapper.findAll('.scope-selection__scope-group')
      expect(groups).toHaveLength(2)
      expect(groups[0]!.text()).toContain('Page Types')
      expect(groups[1]!.text()).toContain('Collection Keys')
    })

    it('should maintain store state across multiple toggles', async () => {
      const store = useStore()
      store.pageTypes = ['landing_page', 'blog_post']

      const wrapper = mount(ScopeSelection)
      const checkboxes = wrapper.findAll('.scope-selection__scope-options input[type="checkbox"]')

      // Toggle first checkbox on
      await checkboxes[0]!.setValue(true)
      expect(store.selectedScopes.pageTypes).toEqual(['landing_page'])

      // Toggle second checkbox on
      await checkboxes[1]!.setValue(true)
      expect(store.selectedScopes.pageTypes).toEqual(['landing_page', 'blog_post'])

      // Toggle first checkbox off
      await checkboxes[0]!.setValue(false)
      expect(store.selectedScopes.pageTypes).toEqual(['blog_post'])
    })
  })
})
