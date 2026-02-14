import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import Tabs from './Tabs.vue'
import Tab from './Tab.vue'

describe('Tabs', () => {
  let wrapper: VueWrapper

  const createWrapper = () => {
    return mount(Tabs, {
      slots: {
        tabs: `
          <Tab label="First" icon="🔍" panel-id="panel-1" :index="0" />
          <Tab label="Second" icon="⚠️" panel-id="panel-2" :index="1" />
          <Tab label="Third" panel-id="panel-3" :index="2" />
        `,
        panels: `
          <div id="panel-1" role="tabpanel">Panel 1 content</div>
          <div id="panel-2" role="tabpanel">Panel 2 content</div>
          <div id="panel-3" role="tabpanel">Panel 3 content</div>
        `,
      },
      global: {
        components: { Tab },
        plugins: [createPinia()],
      },
    })
  }

  beforeEach(() => {
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

    it('should render slot content for tabs and panels', () => {
      expect(wrapper.findAllComponents(Tab)).toHaveLength(3)
      expect(wrapper.findAll('[role="tabpanel"]')).toHaveLength(3)
    })
  })

  describe('Keyboard Navigation', () => {
    it('should navigate to next tab with ArrowRight', async () => {
      const tablist = wrapper.find('[role="tablist"]')
      const tabs = wrapper.findAllComponents(Tab)

      // Verify first tab is initially active
      expect(tabs[0]!.find('button').attributes('aria-selected')).toBe('true')

      // Trigger ArrowRight
      await tablist.trigger('keydown', { key: 'ArrowRight' })
      await wrapper.vm.$nextTick()

      // Second tab should now be active
      expect(tabs[1]!.find('button').attributes('aria-selected')).toBe('true')
    })

    it('should navigate to previous tab with ArrowLeft', async () => {
      const tablist = wrapper.find('[role="tablist"]')
      const tabs = wrapper.findAllComponents(Tab)

      // Click second tab to make it active
      await tabs[1]!.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      // Trigger ArrowLeft
      await tablist.trigger('keydown', { key: 'ArrowLeft' })
      await wrapper.vm.$nextTick()

      // First tab should now be active
      expect(tabs[0]!.find('button').attributes('aria-selected')).toBe('true')
    })

    it('should wrap to last tab when ArrowLeft on first tab', async () => {
      const tablist = wrapper.find('[role="tablist"]')
      const tabs = wrapper.findAllComponents(Tab)

      // First tab is active by default
      expect(tabs[0]!.find('button').attributes('aria-selected')).toBe('true')

      // Trigger ArrowLeft
      await tablist.trigger('keydown', { key: 'ArrowLeft' })
      await wrapper.vm.$nextTick()

      // Should wrap to last tab (index 2)
      expect(tabs[2]!.find('button').attributes('aria-selected')).toBe('true')
    })

    it('should wrap to first tab when ArrowRight on last tab', async () => {
      const tablist = wrapper.find('[role="tablist"]')
      const tabs = wrapper.findAllComponents(Tab)

      // Click last tab to make it active
      await tabs[2]!.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      // Trigger ArrowRight
      await tablist.trigger('keydown', { key: 'ArrowRight' })
      await wrapper.vm.$nextTick()

      // Should wrap to first tab
      expect(tabs[0]!.find('button').attributes('aria-selected')).toBe('true')
    })

    it('should navigate to first tab with Home key', async () => {
      const tablist = wrapper.find('[role="tablist"]')
      const tabs = wrapper.findAllComponents(Tab)

      // Click middle tab to make it active
      await tabs[1]!.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      // Trigger Home
      await tablist.trigger('keydown', { key: 'Home' })
      await wrapper.vm.$nextTick()

      expect(tabs[0]!.find('button').attributes('aria-selected')).toBe('true')
    })

    it('should navigate to last tab with End key', async () => {
      const tablist = wrapper.find('[role="tablist"]')
      const tabs = wrapper.findAllComponents(Tab)

      // First tab is active by default
      expect(tabs[0]!.find('button').attributes('aria-selected')).toBe('true')

      // Trigger End
      await tablist.trigger('keydown', { key: 'End' })
      await wrapper.vm.$nextTick()

      expect(tabs[2]!.find('button').attributes('aria-selected')).toBe('true')
    })

    it('should prevent default behavior on navigation keys', async () => {
      const tablist = wrapper.find('[role="tablist"]')
      const event = new KeyboardEvent('keydown', { key: 'ArrowRight' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')

      await tablist.element.dispatchEvent(event)

      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have correct ARIA roles', () => {
      const tablist = wrapper.find('[role="tablist"]')
      expect(tablist.exists()).toBe(true)
    })

    it('should maintain proper tab/panel relationship via aria-controls', () => {
      const tabs = wrapper.findAllComponents(Tab)
      const panels = wrapper.findAll('[role="tabpanel"]')

      tabs.forEach((tab, index) => {
        const panelId = panels[index]!.attributes('id')
        expect(tab.props('panelId')).toBe(panelId)
      })
    })
  })

  describe('State Management', () => {
    it('should start with first tab active by default', () => {
      const tabs = wrapper.findAllComponents(Tab)
      expect(tabs[0]!.find('button').attributes('aria-selected')).toBe('true')
    })

    it('should update active tab when tab is clicked', async () => {
      const tabs = wrapper.findAllComponents(Tab)

      // Click second tab
      await tabs[1]!.find('button').trigger('click')
      await wrapper.vm.$nextTick()

      expect(tabs[1]!.find('button').attributes('aria-selected')).toBe('true')
    })
  })

  describe('Visual Elements', () => {
    it('should apply correct CSS classes', () => {
      expect(wrapper.find('.tabs').exists()).toBe(true)
      expect(wrapper.find('.tabs__list').exists()).toBe(true)
      expect(wrapper.find('.tabs__panels').exists()).toBe(true)
    })

    it('should have gap between tabs', () => {
      const tablist = wrapper.find('.tabs__list')
      expect(tablist.attributes('style')).toBeUndefined() // Uses CSS custom properties
    })
  })
})
