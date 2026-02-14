import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import Tab from './Tab.vue'
import { ref, type Ref } from 'vue'

describe('Tab', () => {
  let wrapper: VueWrapper
  const mockActiveTabIndex = ref(0)
  const mockRegisterTab = vi.fn()
  const mockUnregisterTab = vi.fn()

  const createWrapper = (props = {}, activeIndex = 0) => {
    mockActiveTabIndex.value = activeIndex
    return mount(Tab, {
      props: {
        label: 'Test Tab',
        panelId: 'test-panel',
        index: 0,
        ...props,
      },
      global: {
        provide: {
          activeTabIndex: mockActiveTabIndex as Ref<number>,
          registerTab: mockRegisterTab,
          unregisterTab: mockUnregisterTab,
        },
      },
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Props', () => {
    it('should render with required props', () => {
      wrapper = createWrapper()
      const button = wrapper.find('button')
      expect(button.exists()).toBe(true)
      expect(button.text()).toContain('Test Tab')
    })

    it('should render label correctly', () => {
      wrapper = createWrapper({ label: 'Search' })
      expect(wrapper.find('.tab__label').text()).toBe('Search')
    })

    it('should render icon when provided', () => {
      wrapper = createWrapper({ label: 'Search', icon: '🔍' })
      const icon = wrapper.find('.tab__icon')
      expect(icon.exists()).toBe(true)
      expect(icon.text()).toBe('🔍')
    })

    it('should not render icon when not provided', () => {
      wrapper = createWrapper({ label: 'Search' })
      const icon = wrapper.find('.tab__icon')
      expect(icon.exists()).toBe(false)
    })

    it('should use panelId prop for aria-controls', () => {
      wrapper = createWrapper({ panelId: 'panel-1' })
      expect(wrapper.find('button').attributes('aria-controls')).toBe('panel-1')
    })

    it('should use index prop for button id', () => {
      wrapper = createWrapper({ index: 2 })
      expect(wrapper.find('button').attributes('id')).toBe('tab-2')
    })
  })

  describe('Accessibility', () => {
    it('should have role="tab"', () => {
      wrapper = createWrapper()
      expect(wrapper.find('button').attributes('role')).toBe('tab')
    })

    it('should have aria-selected="true" when active', () => {
      wrapper = createWrapper({ index: 0 }, 0)
      expect(wrapper.find('button').attributes('aria-selected')).toBe('true')
    })

    it('should have aria-selected="false" when not active', () => {
      wrapper = createWrapper({ index: 1 }, 0)
      expect(wrapper.find('button').attributes('aria-selected')).toBe('false')
    })

    it('should have tabindex="0" when selected', () => {
      wrapper = createWrapper({ index: 0 }, 0)
      expect(wrapper.find('button').attributes('tabindex')).toBe('0')
    })

    it('should have tabindex="-1" when not selected', () => {
      wrapper = createWrapper({ index: 1 }, 0)
      expect(wrapper.find('button').attributes('tabindex')).toBe('-1')
    })

    it('should have aria-controls pointing to panel', () => {
      wrapper = createWrapper({ panelId: 'search-panel' })
      expect(wrapper.find('button').attributes('aria-controls')).toBe('search-panel')
    })

    it('should mark icon as decorative with aria-hidden', () => {
      wrapper = createWrapper({ icon: '🔍' })
      const icon = wrapper.find('.tab__icon')
      expect(icon.attributes('aria-hidden')).toBe('true')
    })
  })

  describe('Events', () => {
    it('should update activeTabIndex when clicked', async () => {
      wrapper = createWrapper({ index: 1 }, 0)
      await wrapper.find('button').trigger('click')
      expect(mockActiveTabIndex.value).toBe(1)
    })

    it('should update activeTabIndex on Space key', async () => {
      wrapper = createWrapper({ index: 2 }, 0)
      await wrapper.find('button').trigger('keydown', { key: ' ' })
      expect(mockActiveTabIndex.value).toBe(2)
    })

    it('should update activeTabIndex on Enter key', async () => {
      wrapper = createWrapper({ index: 1 }, 0)
      await wrapper.find('button').trigger('keydown', { key: 'Enter' })
      expect(mockActiveTabIndex.value).toBe(1)
    })

    it('should prevent default on Space key', async () => {
      wrapper = createWrapper()
      const event = new KeyboardEvent('keydown', { key: ' ' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

      await wrapper.find('button').element.dispatchEvent(event)
      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('should prevent default on Enter key', async () => {
      wrapper = createWrapper()
      const event = new KeyboardEvent('keydown', { key: 'Enter' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

      await wrapper.find('button').element.dispatchEvent(event)
      expect(preventDefaultSpy).toHaveBeenCalled()
    })

    it('should not respond to other keys', async () => {
      wrapper = createWrapper({ index: 1 }, 0)
      await wrapper.find('button').trigger('keydown', { key: 'a' })
      expect(mockActiveTabIndex.value).toBe(0) // Should remain unchanged
    })
  })

  describe('Visual State', () => {
    it('should have tab--active class when selected', () => {
      wrapper = createWrapper({ index: 0 }, 0)
      expect(wrapper.find('button').classes()).toContain('tab--active')
    })

    it('should not have tab--active class when not selected', () => {
      wrapper = createWrapper({ index: 1 }, 0)
      expect(wrapper.find('button').classes()).not.toContain('tab--active')
    })

    it('should always have base tab class', () => {
      wrapper = createWrapper()
      expect(wrapper.find('button').classes()).toContain('tab')
    })
  })

  describe('Lifecycle', () => {
    it('should register with parent on mount', () => {
      wrapper = createWrapper()
      // Wait for component to mount
      expect(mockRegisterTab).toHaveBeenCalledTimes(1)
      expect(mockRegisterTab).toHaveBeenCalledWith(expect.any(HTMLButtonElement))
    })
  })

  describe('Computed Properties', () => {
    it('should compute isSelected correctly when active', () => {
      wrapper = createWrapper({ index: 0 }, 0)
      expect(wrapper.find('button').attributes('aria-selected')).toBe('true')
    })

    it('should compute isSelected correctly when not active', () => {
      wrapper = createWrapper({ index: 1 }, 0)
      expect(wrapper.find('button').attributes('aria-selected')).toBe('false')
    })

    it('should update isSelected when activeTabIndex changes', async () => {
      wrapper = createWrapper({ index: 1 }, 0)
      expect(wrapper.find('button').attributes('aria-selected')).toBe('false')

      mockActiveTabIndex.value = 1
      await wrapper.vm.$nextTick()

      expect(wrapper.find('button').attributes('aria-selected')).toBe('true')
    })
  })

  describe('Button Attributes', () => {
    it('should have type="button"', () => {
      wrapper = createWrapper()
      expect(wrapper.find('button').attributes('type')).toBe('button')
    })

    it('should have unique id based on index', () => {
      const wrapper1 = createWrapper({ index: 0 })
      const wrapper2 = createWrapper({ index: 1 })

      expect(wrapper1.find('button').attributes('id')).toBe('tab-0')
      expect(wrapper2.find('button').attributes('id')).toBe('tab-1')
    })
  })
})
