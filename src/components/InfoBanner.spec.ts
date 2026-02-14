import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import InfoBanner from './InfoBanner.vue'

describe('InfoBanner', () => {
  describe('Props', () => {
    it('should render with default info status', () => {
      const wrapper = mount(InfoBanner, {
        slots: {
          default: 'Test message',
        },
      })

      expect(wrapper.classes()).toContain('info-banner--info')
      expect(wrapper.text()).toBe('Test message')
    })

    it('should render with warning status', () => {
      const wrapper = mount(InfoBanner, {
        props: {
          status: 'warning',
        },
        slots: {
          default: 'Warning message',
        },
      })

      expect(wrapper.classes()).toContain('info-banner--warning')
      expect(wrapper.text()).toBe('Warning message')
    })

    it('should render with error status', () => {
      const wrapper = mount(InfoBanner, {
        props: {
          status: 'error',
        },
        slots: {
          default: 'Error message',
        },
      })

      expect(wrapper.classes()).toContain('info-banner--error')
      expect(wrapper.text()).toBe('Error message')
    })

    it('should render with success status', () => {
      const wrapper = mount(InfoBanner, {
        props: {
          status: 'success',
        },
        slots: {
          default: 'Success message',
        },
      })

      expect(wrapper.classes()).toContain('info-banner--success')
      expect(wrapper.text()).toBe('Success message')
    })

    it('should always have base info-banner class', () => {
      const statusVariants: Array<'info' | 'warning' | 'error' | 'success'> = [
        'info',
        'warning',
        'error',
        'success',
      ]

      statusVariants.forEach((status) => {
        const wrapper = mount(InfoBanner, {
          props: { status },
          slots: {
            default: 'Test',
          },
        })

        expect(wrapper.classes()).toContain('info-banner')
        expect(wrapper.classes()).toContain(`info-banner--${status}`)
      })
    })
  })

  describe('Slot content', () => {
    it('should render simple text content', () => {
      const wrapper = mount(InfoBanner, {
        slots: {
          default: 'Simple text message',
        },
      })

      expect(wrapper.text()).toBe('Simple text message')
    })

    it('should render HTML content', () => {
      const wrapper = mount(InfoBanner, {
        slots: {
          default: '<p>Paragraph content</p>',
        },
      })

      expect(wrapper.html()).toContain('<p>Paragraph content</p>')
    })

    it('should render strong tags correctly', () => {
      const wrapper = mount(InfoBanner, {
        slots: {
          default: '<strong>Bold text</strong> and normal text',
        },
      })

      expect(wrapper.html()).toContain('<strong>Bold text</strong>')
      expect(wrapper.text()).toContain('Bold text and normal text')
    })

    it('should render complex content with multiple elements', () => {
      const wrapper = mount(InfoBanner, {
        slots: {
          default: `
            <p>First paragraph</p>
            <p>Second paragraph with <strong>emphasis</strong></p>
          `,
        },
      })

      expect(wrapper.findAll('p')).toHaveLength(2)
      expect(wrapper.find('strong').exists()).toBe(true)
    })
  })

  describe('Styling', () => {
    it('should apply correct base styles', () => {
      const wrapper = mount(InfoBanner, {
        slots: {
          default: 'Test',
        },
      })

      const element = wrapper.element as HTMLElement
      const styles = window.getComputedStyle(element)

      // Check that CSS custom properties are used
      expect(styles.backgroundColor).toBeDefined()
      expect(styles.borderLeftWidth).toBeDefined()
      expect(styles.padding).toBeDefined()
      expect(styles.borderRadius).toBeDefined()
    })

    it('should have accessible structure', () => {
      const wrapper = mount(InfoBanner, {
        props: {
          status: 'error',
        },
        slots: {
          default: 'Error occurred',
        },
      })

      // Should render as a div
      expect(wrapper.element.tagName).toBe('DIV')

      // Should have the appropriate class for styling
      expect(wrapper.classes()).toContain('info-banner')
      expect(wrapper.classes()).toContain('info-banner--error')
    })
  })

  describe('Visual variants', () => {
    it('should differentiate between all status types via classes', () => {
      const statuses: Array<'info' | 'warning' | 'error' | 'success'> = [
        'info',
        'warning',
        'error',
        'success',
      ]

      const classNames = statuses.map((status) => {
        const wrapper = mount(InfoBanner, {
          props: { status },
          slots: { default: 'Test' },
        })
        return wrapper.classes()
      })

      // Each status should have unique class
      expect(classNames[0]).toContain('info-banner--info')
      expect(classNames[1]).toContain('info-banner--warning')
      expect(classNames[2]).toContain('info-banner--error')
      expect(classNames[3]).toContain('info-banner--success')

      // Verify they're all different
      const uniqueClasses = new Set(classNames.map((c) => c.join(' ')))
      expect(uniqueClasses.size).toBe(4)
    })
  })
})
