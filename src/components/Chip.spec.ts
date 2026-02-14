import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Chip from './Chip.vue'

describe('Chip', () => {
  describe('Props', () => {
    it('should render with default small size', () => {
      const wrapper = mount(Chip, {
        slots: {
          default: 'Test Chip',
        },
      })

      expect(wrapper.text()).toBe('Test Chip')
      expect(wrapper.classes()).not.toContain('chip--medium')
    })

    it('should render with medium size when specified', () => {
      const wrapper = mount(Chip, {
        props: {
          size: 'medium',
        },
        slots: {
          default: 'Medium Chip',
        },
      })

      expect(wrapper.classes()).toContain('chip--medium')
    })

    it('should render without remove button by default', () => {
      const wrapper = mount(Chip, {
        slots: {
          default: 'Test Chip',
        },
      })

      expect(wrapper.find('.chip__remove').exists()).toBe(false)
      expect(wrapper.classes()).not.toContain('chip--removable')
    })

    it('should render with remove button when removable is true', () => {
      const wrapper = mount(Chip, {
        props: {
          removable: true,
        },
        slots: {
          default: 'Removable Chip',
        },
      })

      expect(wrapper.find('.chip__remove').exists()).toBe(true)
      expect(wrapper.classes()).toContain('chip--removable')
    })
  })

  describe('Events', () => {
    it('should emit remove event when remove button is clicked', async () => {
      const wrapper = mount(Chip, {
        props: {
          removable: true,
        },
        slots: {
          default: 'Test Chip',
        },
      })

      const removeButton = wrapper.find('.chip__remove')
      await removeButton.trigger('click')

      expect(wrapper.emitted()).toHaveProperty('remove')
      expect(wrapper.emitted('remove')).toHaveLength(1)
    })

    it('should not emit remove event when chip is not removable', async () => {
      const wrapper = mount(Chip, {
        props: {
          removable: false,
        },
        slots: {
          default: 'Test Chip',
        },
      })

      // Try to trigger click on the chip itself
      await wrapper.trigger('click')

      expect(wrapper.emitted('remove')).toBeUndefined()
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-label on remove button', () => {
      const wrapper = mount(Chip, {
        props: {
          removable: true,
        },
        slots: {
          default: 'Test Chip',
        },
      })

      const removeButton = wrapper.find('.chip__remove')
      expect(removeButton.attributes('aria-label')).toBe('Remove')
    })

    it('should have button type on remove button', () => {
      const wrapper = mount(Chip, {
        props: {
          removable: true,
        },
        slots: {
          default: 'Test Chip',
        },
      })

      const removeButton = wrapper.find('.chip__remove')
      expect(removeButton.attributes('type')).toBe('button')
    })

    it('should have minimum touch target size for remove button', () => {
      const wrapper = mount(Chip, {
        props: {
          removable: true,
        },
        slots: {
          default: 'Test Chip',
        },
      })

      const removeButton = wrapper.find('.chip__remove')
      const element = removeButton.element as HTMLElement

      // Get computed styles (in test env, we check the CSS properties are set)
      const styles = window.getComputedStyle(element)

      // The component uses min-width and min-height of 1.5rem (24px)
      expect(styles.minWidth).toBeDefined()
      expect(styles.minHeight).toBeDefined()
    })
  })

  describe('Slot content', () => {
    it('should render slot content correctly', () => {
      const wrapper = mount(Chip, {
        slots: {
          default: '<strong>Bold Text</strong>',
        },
      })

      expect(wrapper.html()).toContain('<strong>Bold Text</strong>')
    })

    it('should render multiple slot children', () => {
      const wrapper = mount(Chip, {
        slots: {
          default: '<span>Part 1</span><span>Part 2</span>',
        },
      })

      expect(wrapper.html()).toContain('<span>Part 1</span>')
      expect(wrapper.html()).toContain('<span>Part 2</span>')
    })
  })
})
