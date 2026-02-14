import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Toggle from './Toggle.vue'

describe('Toggle', () => {
  describe('Props', () => {
    it('should render with required props', () => {
      const wrapper = mount(Toggle, {
        props: {
          id: 'test-toggle',
          modelValue: false,
        },
      })

      expect(wrapper.find('button').exists()).toBe(true)
      expect(wrapper.find('button').attributes('id')).toBe('test-toggle')
    })

    it('should show off label when modelValue is false', () => {
      const wrapper = mount(Toggle, {
        props: {
          id: 'test-toggle',
          modelValue: false,
        },
      })

      expect(wrapper.text()).toBe('Off')
      expect(wrapper.find('.toggle__label').text()).toBe('Off')
    })

    it('should show on label when modelValue is true', () => {
      const wrapper = mount(Toggle, {
        props: {
          id: 'test-toggle',
          modelValue: true,
        },
      })

      expect(wrapper.text()).toBe('On')
      expect(wrapper.find('.toggle__label').text()).toBe('On')
    })

    it('should use custom on/off labels when provided', async () => {
      const wrapper = mount(Toggle, {
        props: {
          id: 'test-toggle',
          modelValue: false,
          onLabel: 'Enabled',
          offLabel: 'Disabled',
        },
      })

      expect(wrapper.text()).toBe('Disabled')

      await wrapper.setProps({ modelValue: true })
      expect(wrapper.text()).toBe('Enabled')
    })

    it('should be enabled by default', () => {
      const wrapper = mount(Toggle, {
        props: {
          id: 'test-toggle',
          modelValue: false,
        },
      })

      expect(wrapper.find('button').attributes('disabled')).toBeUndefined()
      expect(wrapper.classes()).not.toContain('toggle--disabled')
    })

    it('should render as disabled when disabled prop is true', () => {
      const wrapper = mount(Toggle, {
        props: {
          id: 'test-toggle',
          modelValue: false,
          disabled: true,
        },
      })

      expect(wrapper.find('button').attributes('disabled')).toBeDefined()
      expect(wrapper.classes()).toContain('toggle--disabled')
    })
  })

  describe('Events', () => {
    it('should emit update:modelValue with opposite value when clicked', async () => {
      const wrapper = mount(Toggle, {
        props: {
          id: 'test-toggle',
          modelValue: false,
        },
      })

      await wrapper.find('button').trigger('click')

      expect(wrapper.emitted()).toHaveProperty('update:modelValue')
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    })

    it('should toggle from true to false when clicked', async () => {
      const wrapper = mount(Toggle, {
        props: {
          id: 'test-toggle',
          modelValue: true,
        },
      })

      await wrapper.find('button').trigger('click')

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false])
    })

    it('should not emit event when disabled', async () => {
      const wrapper = mount(Toggle, {
        props: {
          id: 'test-toggle',
          modelValue: false,
          disabled: true,
        },
      })

      await wrapper.find('button').trigger('click')

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('should emit update:modelValue when Space key is pressed', async () => {
      const wrapper = mount(Toggle, {
        props: {
          id: 'test-toggle',
          modelValue: false,
        },
      })

      await wrapper.find('button').trigger('keydown', { key: ' ' })

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    })

    it('should emit update:modelValue when Enter key is pressed', async () => {
      const wrapper = mount(Toggle, {
        props: {
          id: 'test-toggle',
          modelValue: false,
        },
      })

      await wrapper.find('button').trigger('keydown', { key: 'Enter' })

      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])
    })

    it('should not emit when other keys are pressed', async () => {
      const wrapper = mount(Toggle, {
        props: {
          id: 'test-toggle',
          modelValue: false,
        },
      })

      await wrapper.find('button').trigger('keydown', { key: 'a' })
      await wrapper.find('button').trigger('keydown', { key: 'Escape' })

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })

    it('should not emit when keyboard events occur while disabled', async () => {
      const wrapper = mount(Toggle, {
        props: {
          id: 'test-toggle',
          modelValue: false,
          disabled: true,
        },
      })

      await wrapper.find('button').trigger('keydown', { key: ' ' })
      await wrapper.find('button').trigger('keydown', { key: 'Enter' })

      expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    })
  })

  describe('Accessibility', () => {
    it('should have role="switch"', () => {
      const wrapper = mount(Toggle, {
        props: {
          id: 'test-toggle',
          modelValue: false,
        },
      })

      expect(wrapper.find('button').attributes('role')).toBe('switch')
    })

    it('should set aria-checked based on modelValue', async () => {
      const wrapper = mount(Toggle, {
        props: {
          id: 'test-toggle',
          modelValue: false,
        },
      })

      expect(wrapper.find('button').attributes('aria-checked')).toBe('false')

      await wrapper.setProps({ modelValue: true })
      expect(wrapper.find('button').attributes('aria-checked')).toBe('true')
    })

    it('should have aria-label matching current state', async () => {
      const wrapper = mount(Toggle, {
        props: {
          id: 'test-toggle',
          modelValue: false,
          onLabel: 'Active',
          offLabel: 'Inactive',
        },
      })

      expect(wrapper.find('button').attributes('aria-label')).toBe('Inactive')

      await wrapper.setProps({ modelValue: true })
      expect(wrapper.find('button').attributes('aria-label')).toBe('Active')
    })

    it('should have type="button"', () => {
      const wrapper = mount(Toggle, {
        props: {
          id: 'test-toggle',
          modelValue: false,
        },
      })

      expect(wrapper.find('button').attributes('type')).toBe('button')
    })

    it('should handle Space and Enter key with proper event handling', async () => {
      const wrapper = mount(Toggle, {
        props: {
          id: 'test-toggle',
          modelValue: false,
        },
      })

      // Test Space key
      await wrapper.find('button').trigger('keydown', { key: ' ' })
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([true])

      // Clear emitted events and test Enter key
      wrapper.vm.$emit('update:modelValue', false) // Reset
      await wrapper.find('button').trigger('keydown', { key: 'Enter' })

      // Should have emitted twice now (once for Space, once for Enter)
      expect(wrapper.emitted('update:modelValue')).toHaveLength(3) // Initial Space + reset + Enter
    })
  })

  describe('Visual State', () => {
    it('should apply toggle--on class when modelValue is true', () => {
      const wrapper = mount(Toggle, {
        props: {
          id: 'test-toggle',
          modelValue: true,
        },
      })

      expect(wrapper.classes()).toContain('toggle--on')
    })

    it('should not apply toggle--on class when modelValue is false', () => {
      const wrapper = mount(Toggle, {
        props: {
          id: 'test-toggle',
          modelValue: false,
        },
      })

      expect(wrapper.classes()).not.toContain('toggle--on')
    })

    it('should render track and thumb elements', () => {
      const wrapper = mount(Toggle, {
        props: {
          id: 'test-toggle',
          modelValue: false,
        },
      })

      expect(wrapper.find('.toggle__track').exists()).toBe(true)
      expect(wrapper.find('.toggle__thumb').exists()).toBe(true)
    })
  })
})
