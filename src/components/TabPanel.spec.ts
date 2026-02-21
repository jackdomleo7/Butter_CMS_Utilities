import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, type WritableComputedRef } from 'vue'
import TabPanel from './TabPanel.vue'

const createWrapper = (
  props: { label: string; icon?: string; index: number },
  activeTabIndex = 0,
) => {
  const activeTabIndexRef = ref(activeTabIndex) as unknown as WritableComputedRef<number>
  const registerTabPanel = vi.fn()
  const unregisterTabPanel = vi.fn()

  const wrapper = mount(TabPanel, {
    props,
    global: {
      provide: {
        activeTabIndex: activeTabIndexRef,
        registerTabPanel,
        unregisterTabPanel,
      },
    },
    slots: {
      default: '<p>Panel content</p>',
    },
  })

  return { wrapper, activeTabIndexRef, registerTabPanel, unregisterTabPanel }
}

describe('TabPanel.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Lifecycle', () => {
    it('registers itself on mount', () => {
      const { registerTabPanel } = createWrapper({ label: 'Search', index: 0 })
      expect(registerTabPanel).toHaveBeenCalledOnce()
      expect(registerTabPanel).toHaveBeenCalledWith({ label: 'Search', icon: undefined, index: 0 })
    })

    it('registers with icon when provided', () => {
      const { registerTabPanel } = createWrapper({ label: 'Audit', icon: '⚠️', index: 1 })
      expect(registerTabPanel).toHaveBeenCalledWith({ label: 'Audit', icon: '⚠️', index: 1 })
    })

    it('unregisters itself on unmount', () => {
      const { wrapper, unregisterTabPanel } = createWrapper({ label: 'Search', index: 0 })
      wrapper.unmount()
      expect(unregisterTabPanel).toHaveBeenCalledOnce()
      expect(unregisterTabPanel).toHaveBeenCalledWith(0)
    })

    it('unregisters with correct index', () => {
      const { wrapper, unregisterTabPanel } = createWrapper({ label: 'Components', index: 2 })
      wrapper.unmount()
      expect(unregisterTabPanel).toHaveBeenCalledWith(2)
    })
  })

  describe('Rendering', () => {
    it('renders panel content when active', () => {
      const { wrapper } = createWrapper({ label: 'Search', index: 0 }, 0)
      expect(wrapper.find('[role="tabpanel"]').exists()).toBe(true)
      expect(wrapper.find('[role="tabpanel"]').text()).toContain('Panel content')
    })

    it('does not render when inactive', () => {
      const { wrapper } = createWrapper({ label: 'Audit', index: 1 }, 0)
      expect(wrapper.find('[role="tabpanel"]').exists()).toBe(false)
    })

    it('renders when its index matches activeTabIndex', () => {
      const { wrapper } = createWrapper({ label: 'Components', index: 2 }, 2)
      expect(wrapper.find('[role="tabpanel"]').exists()).toBe(true)
    })

    it('shows/hides based on activeTabIndex changes', async () => {
      const activeTabIndexRef = ref(0) as unknown as WritableComputedRef<number>
      const wrapper = mount(TabPanel, {
        props: { label: 'Audit', index: 1 },
        global: {
          provide: {
            activeTabIndex: activeTabIndexRef,
            registerTabPanel: vi.fn(),
            unregisterTabPanel: vi.fn(),
          },
        },
        slots: { default: '<p>Audit content</p>' },
      })

      expect(wrapper.find('[role="tabpanel"]').exists()).toBe(false)

      activeTabIndexRef.value = 1
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[role="tabpanel"]').exists()).toBe(true)
    })
  })

  describe('ARIA Attributes', () => {
    it('sets role="tabpanel" on the panel div', () => {
      const { wrapper } = createWrapper({ label: 'Search', index: 0 }, 0)
      const panel = wrapper.find('[role="tabpanel"]')
      expect(panel.attributes('role')).toBe('tabpanel')
    })

    it('sets correct id based on index', () => {
      const { wrapper } = createWrapper({ label: 'Search', index: 0 }, 0)
      const panel = wrapper.find('[role="tabpanel"]')
      expect(panel.attributes('id')).toBe('tab-panel-0')
    })

    it('sets correct id for non-zero index', () => {
      const { wrapper } = createWrapper({ label: 'Audit', index: 1 }, 1)
      const panel = wrapper.find('[role="tabpanel"]')
      expect(panel.attributes('id')).toBe('tab-panel-1')
    })

    it('sets aria-labelledby referencing the corresponding tab button', () => {
      const { wrapper } = createWrapper({ label: 'Search', index: 0 }, 0)
      const panel = wrapper.find('[role="tabpanel"]')
      expect(panel.attributes('aria-labelledby')).toBe('tab-0')
    })

    it('sets correct aria-labelledby for non-zero index', () => {
      const { wrapper } = createWrapper({ label: 'Components', index: 2 }, 2)
      const panel = wrapper.find('[role="tabpanel"]')
      expect(panel.attributes('aria-labelledby')).toBe('tab-2')
    })
  })

  describe('Props', () => {
    it('accepts label prop', () => {
      const { registerTabPanel } = createWrapper({ label: 'My Tab', index: 0 })
      expect(registerTabPanel).toHaveBeenCalledWith(expect.objectContaining({ label: 'My Tab' }))
    })

    it('accepts optional icon prop', () => {
      const { registerTabPanel } = createWrapper({ label: 'Search', icon: '🔍', index: 0 })
      expect(registerTabPanel).toHaveBeenCalledWith(expect.objectContaining({ icon: '🔍' }))
    })

    it('passes undefined when icon is not provided', () => {
      const { registerTabPanel } = createWrapper({ label: 'Search', index: 0 })
      expect(registerTabPanel).toHaveBeenCalledWith(expect.objectContaining({ icon: undefined }))
    })

    it('accepts index prop and uses it for panel id', () => {
      const { wrapper } = createWrapper({ label: 'Last', index: 5 }, 5)
      expect(wrapper.find('[role="tabpanel"]').attributes('id')).toBe('tab-panel-5')
    })
  })

  describe('Slot', () => {
    it('renders default slot content', () => {
      const activeTabIndexRef = ref(0) as unknown as WritableComputedRef<number>
      const wrapper = mount(TabPanel, {
        props: { label: 'Search', index: 0 },
        global: {
          provide: {
            activeTabIndex: activeTabIndexRef,
            registerTabPanel: vi.fn(),
            unregisterTabPanel: vi.fn(),
          },
        },
        slots: { default: '<span class="custom-content">Custom slot</span>' },
      })

      expect(wrapper.find('.custom-content').exists()).toBe(true)
      expect(wrapper.find('.custom-content').text()).toBe('Custom slot')
    })
  })
})
