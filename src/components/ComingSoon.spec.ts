import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ComingSoon from './ComingSoon.vue'

describe('ComingSoon', () => {
  describe('Basic Rendering', () => {
    it('should render as section element', () => {
      const wrapper = mount(ComingSoon)

      expect(wrapper.element.tagName).toBe('SECTION')
    })

    it('should have coming-soon class', () => {
      const wrapper = mount(ComingSoon)

      expect(wrapper.classes()).toContain('coming-soon')
    })

    it('should display "Coming soon..." text', () => {
      const wrapper = mount(ComingSoon)

      expect(wrapper.text()).toContain('Coming soon...')
    })
  })

  describe('Slot Content', () => {
    it('should render without slot content', () => {
      const wrapper = mount(ComingSoon)

      expect(wrapper.text()).toContain('Coming soon...')
    })

    it('should render slot content after "Coming soon..."', () => {
      const wrapper = mount(ComingSoon, {
        slots: {
          default: 'New feature',
        },
      })

      expect(wrapper.text()).toContain('Coming soon...')
      expect(wrapper.text()).toContain('New feature')
    })

    it('should render HTML slot content', () => {
      const wrapper = mount(ComingSoon, {
        slots: {
          default: '<strong>Bold feature</strong>',
        },
      })

      expect(wrapper.html()).toContain('<strong>Bold feature</strong>')
      expect(wrapper.text()).toContain('Bold feature')
    })

    it('should render paragraph slot content', () => {
      const wrapper = mount(ComingSoon, {
        slots: {
          default: '<p>Feature description</p>',
        },
      })

      expect(wrapper.html()).toContain('<p>Feature description</p>')
    })

    it('should render multiple elements in slot', () => {
      const wrapper = mount(ComingSoon, {
        slots: {
          default: '<span>First</span><span>Second</span>',
        },
      })

      expect(wrapper.text()).toContain('First')
      expect(wrapper.text()).toContain('Second')
    })
  })

  describe('Text Content', () => {
    it('should include non-breaking space after "Coming soon..."', () => {
      const wrapper = mount(ComingSoon)

      // The component has "Coming soon...&nbsp;"
      const html = wrapper.html()
      expect(html).toContain('Coming soon...&nbsp;')
    })

    it('should format text correctly with slot', () => {
      const wrapper = mount(ComingSoon, {
        slots: {
          default: 'Feature Name',
        },
      })

      // Should have format: "Coming soon... Feature Name"
      expect(wrapper.text()).toContain('Coming soon...')
      expect(wrapper.text()).toContain('Feature Name')
    })
  })

  describe('Component Structure', () => {
    it('should be a simple wrapper component', () => {
      const wrapper = mount(ComingSoon, {
        slots: {
          default: 'Content',
        },
      })

      // Check structure: section.coming-soon > text + slot
      expect(wrapper.find('section.coming-soon').exists()).toBe(true)
      expect(wrapper.text()).toContain('Coming soon...')
      expect(wrapper.text()).toContain('Content')
    })

    it('should maintain consistent structure regardless of slot content', () => {
      const withoutSlot = mount(ComingSoon)
      const withSlot = mount(ComingSoon, {
        slots: {
          default: 'Test',
        },
      })

      expect(withoutSlot.element.tagName).toBe(withSlot.element.tagName)
      expect(withoutSlot.classes()).toEqual(withSlot.classes())
    })
  })
})
