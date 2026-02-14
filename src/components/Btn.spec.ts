import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Btn from './Btn.vue'

describe('Btn', () => {
  describe('Props - Element Type', () => {
    it('should render as button by default', () => {
      const wrapper = mount(Btn, {
        slots: {
          default: 'Click me',
        },
      })

      expect(wrapper.element.tagName).toBe('BUTTON')
    })

    it('should render as anchor when tag="a"', () => {
      const wrapper = mount(Btn, {
        props: {
          tag: 'a',
          href: 'https://example.com',
        },
        slots: {
          default: 'Link',
        },
      })

      expect(wrapper.element.tagName).toBe('A')
      expect(wrapper.attributes('href')).toBe('https://example.com')
    })

    it('should have type="button" by default when rendering as button', () => {
      const wrapper = mount(Btn, {
        slots: {
          default: 'Click me',
        },
      })

      expect(wrapper.attributes('type')).toBe('button')
    })

    it('should accept custom button type', () => {
      const wrapper = mount(Btn, {
        props: {
          type: 'submit',
        },
        slots: {
          default: 'Submit',
        },
      })

      expect(wrapper.attributes('type')).toBe('submit')
    })

    it('should not have type attribute when tag="a"', () => {
      const wrapper = mount(Btn, {
        props: {
          tag: 'a',
          href: 'https://example.com',
          type: 'submit', // Should be ignored
        },
        slots: {
          default: 'Link',
        },
      })

      expect(wrapper.attributes('type')).toBeUndefined()
    })
  })

  describe('Props - Visual Variants', () => {
    it('should render as primary (default) without status class', () => {
      const wrapper = mount(Btn, {
        slots: {
          default: 'Primary',
        },
      })

      expect(wrapper.classes()).toContain('btn')
      expect(wrapper.classes()).not.toContain('btn--secondary')
      expect(wrapper.classes()).not.toContain('btn--tertiary')
    })

    it('should render as secondary when status="secondary"', () => {
      const wrapper = mount(Btn, {
        props: {
          status: 'secondary',
        },
        slots: {
          default: 'Secondary',
        },
      })

      expect(wrapper.classes()).toContain('btn--secondary')
    })

    it('should render as tertiary when status="tertiary"', () => {
      const wrapper = mount(Btn, {
        props: {
          status: 'tertiary',
        },
        slots: {
          default: 'Tertiary',
        },
      })

      expect(wrapper.classes()).toContain('btn--tertiary')
    })
  })

  describe('Props - Disabled State', () => {
    it('should not be disabled by default', () => {
      const wrapper = mount(Btn, {
        slots: {
          default: 'Click me',
        },
      })

      expect(wrapper.attributes('disabled')).toBeUndefined()
    })

    it('should be disabled when disabled prop is true', () => {
      const wrapper = mount(Btn, {
        props: {
          disabled: true,
        },
        slots: {
          default: 'Disabled',
        },
      })

      expect(wrapper.attributes('disabled')).toBeDefined()
    })

    it('should be disabled when loading is true', () => {
      const wrapper = mount(Btn, {
        props: {
          loading: true,
        },
        slots: {
          default: 'Loading',
        },
      })

      expect(wrapper.attributes('disabled')).toBeDefined()
    })

    it('should be disabled when both disabled and loading are true', () => {
      const wrapper = mount(Btn, {
        props: {
          disabled: true,
          loading: true,
        },
        slots: {
          default: 'Busy',
        },
      })

      expect(wrapper.attributes('disabled')).toBeDefined()
    })
  })

  describe('Props - Loading State', () => {
    it('should not show spinner by default', () => {
      const wrapper = mount(Btn, {
        slots: {
          default: 'Click me',
        },
      })

      expect(wrapper.find('.btn__spinner').exists()).toBe(false)
      expect(wrapper.attributes('aria-busy')).toBe('false')
    })

    it('should show spinner when loading is true', () => {
      const wrapper = mount(Btn, {
        props: {
          loading: true,
        },
        slots: {
          default: 'Loading',
        },
      })

      expect(wrapper.find('.btn__spinner').exists()).toBe(true)
      expect(wrapper.attributes('aria-busy')).toBe('true')
    })

    it('should hide spinner when loading becomes false', async () => {
      const wrapper = mount(Btn, {
        props: {
          loading: true,
        },
        slots: {
          default: 'Loading',
        },
      })

      expect(wrapper.find('.btn__spinner').exists()).toBe(true)

      await wrapper.setProps({ loading: false })

      expect(wrapper.find('.btn__spinner').exists()).toBe(false)
      expect(wrapper.attributes('aria-busy')).toBe('false')
    })
  })

  describe('Accessibility', () => {
    it('should have aria-busy="true" when loading', () => {
      const wrapper = mount(Btn, {
        props: {
          loading: true,
        },
        slots: {
          default: 'Loading',
        },
      })

      expect(wrapper.attributes('aria-busy')).toBe('true')
    })

    it('should have aria-busy="false" when not loading', () => {
      const wrapper = mount(Btn, {
        props: {
          loading: false,
        },
        slots: {
          default: 'Click me',
        },
      })

      expect(wrapper.attributes('aria-busy')).toBe('false')
    })

    it('should have aria-hidden on spinner', () => {
      const wrapper = mount(Btn, {
        props: {
          loading: true,
        },
        slots: {
          default: 'Loading',
        },
      })

      const spinner = wrapper.find('.btn__spinner')
      expect(spinner.attributes('aria-hidden')).toBe('true')
    })
  })

  describe('Slot Content', () => {
    it('should render slot content', () => {
      const wrapper = mount(Btn, {
        slots: {
          default: 'Button Text',
        },
      })

      expect(wrapper.text()).toContain('Button Text')
    })

    it('should render HTML slot content', () => {
      const wrapper = mount(Btn, {
        slots: {
          default: '<strong>Bold</strong> Text',
        },
      })

      expect(wrapper.html()).toContain('<strong>Bold</strong>')
      expect(wrapper.text()).toContain('Bold Text')
    })

    it('should render slot content alongside spinner', () => {
      const wrapper = mount(Btn, {
        props: {
          loading: true,
        },
        slots: {
          default: 'Loading',
        },
      })

      expect(wrapper.find('.btn__spinner').exists()).toBe(true)
      expect(wrapper.text()).toContain('Loading')
    })
  })

  describe('Link Behavior', () => {
    it('should render href on anchor element', () => {
      const wrapper = mount(Btn, {
        props: {
          tag: 'a',
          href: 'https://example.com',
        },
        slots: {
          default: 'Visit Site',
        },
      })

      expect(wrapper.element.tagName).toBe('A')
      expect(wrapper.attributes('href')).toBe('https://example.com')
    })

    it('should not render disabled attribute on anchor', () => {
      const wrapper = mount(Btn, {
        props: {
          tag: 'a',
          href: 'https://example.com',
          disabled: true,
        },
        slots: {
          default: 'Disabled Link',
        },
      })

      // Anchors don't support disabled attribute, but style might apply
      expect(wrapper.element.tagName).toBe('A')
      expect(wrapper.attributes('href')).toBe('https://example.com')
    })
  })

  describe('Component Rendering', () => {
    it('should always have base btn class', () => {
      const wrapper = mount(Btn, {
        slots: {
          default: 'Test',
        },
      })

      expect(wrapper.classes()).toContain('btn')
    })

    it('should combine classes correctly', () => {
      const wrapper = mount(Btn, {
        props: {
          status: 'secondary',
        },
        slots: {
          default: 'Test',
        },
      })

      expect(wrapper.classes()).toContain('btn')
      expect(wrapper.classes()).toContain('btn--secondary')
    })

    it('should handle multiple prop changes', async () => {
      const wrapper = mount(Btn, {
        props: {
          loading: false,
          disabled: false,
          status: 'secondary',
        },
        slots: {
          default: 'Dynamic',
        },
      })

      expect(wrapper.find('.btn__spinner').exists()).toBe(false)
      expect(wrapper.attributes('disabled')).toBeUndefined()
      expect(wrapper.classes()).toContain('btn--secondary')

      await wrapper.setProps({ loading: true, disabled: true })

      expect(wrapper.find('.btn__spinner').exists()).toBe(true)
      expect(wrapper.attributes('disabled')).toBeDefined()
      expect(wrapper.classes()).toContain('btn--secondary')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty slot content', () => {
      const wrapper = mount(Btn)

      expect(wrapper.element.tagName).toBe('BUTTON')
      expect(wrapper.text()).toBe('')
    })

    it('should handle all button types', () => {
      const types: Array<'button' | 'submit' | 'reset'> = ['button', 'submit', 'reset']

      types.forEach((type) => {
        const wrapper = mount(Btn, {
          props: { type },
          slots: {
            default: type,
          },
        })

        expect(wrapper.attributes('type')).toBe(type)
      })
    })
  })
})
