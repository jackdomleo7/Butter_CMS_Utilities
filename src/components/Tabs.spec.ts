import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Tabs from './Tabs.vue'
import TabPanel from './TabPanel.vue'

describe('Tabs', () => {
  let wrapper: VueWrapper

  const createWrapper = () => {
    return mount(Tabs, {
      slots: {
        default: `
          <TabPanel label="First" icon="🔍" :index="0">Panel 1 content</TabPanel>
          <TabPanel label="Second" icon="⚠️" :index="1">Panel 2 content</TabPanel>
          <TabPanel label="Third" :index="2">Panel 3 content</TabPanel>
        `,
      },
      global: {
        components: { TabPanel },
        plugins: [createPinia()],
      },
    })
  }

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    wrapper = createWrapper()
  })

  describe('Rendering', () => {
    it('should render the tabs component', () => {
      expect(wrapper.find('.tabs').exists()).toBe(true)
    })

    it('should render tablist with proper role', () => {
      const tablist = wrapper.find('[role="tablist"]')
      expect(tablist.exists()).toBe(true)
      expect(tablist.classes()).toContain('tabs__list')
    })

    it('should render tabs panels container', () => {
      expect(wrapper.find('.tabs__panels').exists()).toBe(true)
    })

    it('should render a tab button for each registered TabPanel', async () => {
      await wrapper.vm.$nextTick()
      const buttons = wrapper.findAll('[role="tab"]')
      expect(buttons).toHaveLength(3)
    })

    it('should render tab labels', async () => {
      await wrapper.vm.$nextTick()
      const labels = wrapper.findAll('.tab__label')
      expect(labels[0]!.text()).toBe('First')
      expect(labels[1]!.text()).toBe('Second')
      expect(labels[2]!.text()).toBe('Third')
    })

    it('should render tab icon when provided', async () => {
      await wrapper.vm.$nextTick()
      const icons = wrapper.findAll('.tab__icon')
      expect(icons).toHaveLength(2) // First and Second have icons
      expect(icons[0]!.text()).toBe('🔍')
      expect(icons[1]!.text()).toBe('⚠️')
    })

    it('should not render icon element when no icon provided', async () => {
      await wrapper.vm.$nextTick()
      const buttons = wrapper.findAll('[role="tab"]')
      // Third tab has no icon
      expect(buttons[2]!.find('.tab__icon').exists()).toBe(false)
    })
  })

  describe('Keyboard Navigation', () => {
    it('should navigate to next tab with ArrowRight', async () => {
      await wrapper.vm.$nextTick()
      const tablist = wrapper.find('[role="tablist"]')

      // First tab should be active initially
      const buttons = wrapper.findAll('[role="tab"]')
      expect(buttons[0]!.attributes('aria-selected')).toBe('true')

      await tablist.trigger('keydown', { key: 'ArrowRight' })
      await wrapper.vm.$nextTick()

      expect(buttons[1]!.attributes('aria-selected')).toBe('true')
    })

    it('should navigate to previous tab with ArrowLeft', async () => {
      await wrapper.vm.$nextTick()
      const tablist = wrapper.find('[role="tablist"]')
      const buttons = wrapper.findAll('[role="tab"]')

      // Click second tab to make it active
      await buttons[1]!.trigger('click')
      await wrapper.vm.$nextTick()
      expect(buttons[1]!.attributes('aria-selected')).toBe('true')

      await tablist.trigger('keydown', { key: 'ArrowLeft' })
      await wrapper.vm.$nextTick()

      expect(buttons[0]!.attributes('aria-selected')).toBe('true')
    })

    it('should wrap to last tab when ArrowLeft on first tab', async () => {
      await wrapper.vm.$nextTick()
      const tablist = wrapper.find('[role="tablist"]')
      const buttons = wrapper.findAll('[role="tab"]')

      // First tab is active by default
      await tablist.trigger('keydown', { key: 'ArrowLeft' })
      await wrapper.vm.$nextTick()

      expect(buttons[2]!.attributes('aria-selected')).toBe('true')
    })

    it('should wrap to first tab when ArrowRight on last tab', async () => {
      await wrapper.vm.$nextTick()
      const tablist = wrapper.find('[role="tablist"]')
      const buttons = wrapper.findAll('[role="tab"]')

      // Click last tab
      await buttons[2]!.trigger('click')
      await wrapper.vm.$nextTick()

      await tablist.trigger('keydown', { key: 'ArrowRight' })
      await wrapper.vm.$nextTick()

      expect(buttons[0]!.attributes('aria-selected')).toBe('true')
    })

    it('should navigate to first tab with Home key', async () => {
      await wrapper.vm.$nextTick()
      const tablist = wrapper.find('[role="tablist"]')
      const buttons = wrapper.findAll('[role="tab"]')

      // Click second tab
      await buttons[1]!.trigger('click')
      await wrapper.vm.$nextTick()

      await tablist.trigger('keydown', { key: 'Home' })
      await wrapper.vm.$nextTick()

      expect(buttons[0]!.attributes('aria-selected')).toBe('true')
    })

    it('should navigate to last tab with End key', async () => {
      await wrapper.vm.$nextTick()
      const tablist = wrapper.find('[role="tablist"]')
      const buttons = wrapper.findAll('[role="tab"]')

      await tablist.trigger('keydown', { key: 'End' })
      await wrapper.vm.$nextTick()

      expect(buttons[2]!.attributes('aria-selected')).toBe('true')
    })

    it('should prevent default behavior on ArrowRight', async () => {
      await wrapper.vm.$nextTick()
      const tablist = wrapper.find('[role="tablist"]')
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      tablist.element.dispatchEvent(event)
      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have correct ARIA roles on tablist', async () => {
      await wrapper.vm.$nextTick()
      const tablist = wrapper.find('[role="tablist"]')
      expect(tablist.exists()).toBe(true)
    })

    it('tab buttons should have role="tab"', async () => {
      await wrapper.vm.$nextTick()
      const tabs = wrapper.findAll('[role="tab"]')
      expect(tabs.length).toBe(3)
    })

    it('first tab should be selected by default', async () => {
      await wrapper.vm.$nextTick()
      const buttons = wrapper.findAll('[role="tab"]')
      expect(buttons[0]!.attributes('aria-selected')).toBe('true')
    })

    it('inactive tabs should have aria-selected="false"', async () => {
      await wrapper.vm.$nextTick()
      const buttons = wrapper.findAll('[role="tab"]')
      expect(buttons[1]!.attributes('aria-selected')).toBe('false')
      expect(buttons[2]!.attributes('aria-selected')).toBe('false')
    })

    it('active tab should have tabindex="0", inactive tabs tabindex="-1"', async () => {
      await wrapper.vm.$nextTick()
      const buttons = wrapper.findAll('[role="tab"]')
      expect(buttons[0]!.attributes('tabindex')).toBe('0')
      expect(buttons[1]!.attributes('tabindex')).toBe('-1')
    })

    it('tab icons should have aria-hidden="true"', async () => {
      await wrapper.vm.$nextTick()
      const icons = wrapper.findAll('.tab__icon')
      icons.forEach((icon) => {
        expect(icon.attributes('aria-hidden')).toBe('true')
      })
    })
  })

  describe('State Management', () => {
    it('should start with first tab active by default', async () => {
      await wrapper.vm.$nextTick()
      const buttons = wrapper.findAll('[role="tab"]')
      expect(buttons[0]!.attributes('aria-selected')).toBe('true')
    })

    it('should update active tab when tab button is clicked', async () => {
      await wrapper.vm.$nextTick()
      const buttons = wrapper.findAll('[role="tab"]')

      await buttons[1]!.trigger('click')
      await wrapper.vm.$nextTick()

      expect(buttons[1]!.attributes('aria-selected')).toBe('true')
      expect(buttons[0]!.attributes('aria-selected')).toBe('false')
    })

    it('should show first panel content by default', async () => {
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[role="tabpanel"]').text()).toContain('Panel 1 content')
    })

    it('should show second panel when second tab is clicked', async () => {
      await wrapper.vm.$nextTick()
      const buttons = wrapper.findAll('[role="tab"]')
      await buttons[1]!.trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('[role="tabpanel"]').text()).toContain('Panel 2 content')
    })
  })

  describe('Visual Elements', () => {
    it('should apply correct CSS classes', () => {
      expect(wrapper.find('.tabs').exists()).toBe(true)
      expect(wrapper.find('.tabs__list').exists()).toBe(true)
      expect(wrapper.find('.tabs__panels').exists()).toBe(true)
    })

    it('should apply tab--active class to active tab', async () => {
      await wrapper.vm.$nextTick()
      const buttons = wrapper.findAll('[role="tab"]')
      expect(buttons[0]!.classes()).toContain('tab--active')
      expect(buttons[1]!.classes()).not.toContain('tab--active')
    })
  })
})
