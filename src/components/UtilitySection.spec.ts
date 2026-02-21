import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UtilitySection from './UtilitySection.vue'

describe('UtilitySection', () => {
  describe('Props - Description', () => {
    it('should not render description by default', () => {
      const wrapper = mount(UtilitySection, {
        props: {
          title: 'Title',
        },
      })

      expect(wrapper.find('.utility-section__description').exists()).toBe(false)
    })

    it('should render description when provided', () => {
      const wrapper = mount(UtilitySection, {
        props: {
          title: 'Title',
          description: 'This is a description',
        },
      })

      expect(wrapper.find('.utility-section__description').exists()).toBe(true)
      expect(wrapper.find('.utility-section__description').text()).toBe('This is a description')
    })

    it('should render HTML in description using v-html', () => {
      const wrapper = mount(UtilitySection, {
        props: {
          title: 'Title',
          description: 'Description with <strong>bold</strong> text',
        },
      })

      expect(wrapper.find('.utility-section__description').html()).toContain(
        '<strong>bold</strong>',
      )
      expect(wrapper.find('.utility-section__description').text()).toContain('bold text')
    })

    it('should render links in description', () => {
      const wrapper = mount(UtilitySection, {
        props: {
          title: 'Title',
          description: 'Click <a href="#test">here</a> for more info',
        },
      })

      expect(wrapper.find('.utility-section__description a').exists()).toBe(true)
      expect(wrapper.find('.utility-section__description a').attributes('href')).toBe('#test')
    })

    it('should not render description when empty string', () => {
      const wrapper = mount(UtilitySection, {
        props: {
          title: 'Title',
          description: '',
        },
      })

      expect(wrapper.find('.utility-section__description').exists()).toBe(false)
    })
  })

  describe('Slot Content', () => {
    it('should render default slot in content area', () => {
      const wrapper = mount(UtilitySection, {
        props: {
          title: 'Title',
        },
        slots: {
          default: '<div>Slot content</div>',
        },
      })

      expect(wrapper.find('.utility-section__content').html()).toContain('<div>Slot content</div>')
    })

    it('should render multiple elements in default slot', () => {
      const wrapper = mount(UtilitySection, {
        props: {
          title: 'Title',
        },
        slots: {
          default: '<div>First</div><div>Second</div>',
        },
      })

      const content = wrapper.find('.utility-section__content')
      expect(content.findAll('div')).toHaveLength(2)
      expect(content.text()).toContain('First')
      expect(content.text()).toContain('Second')
    })

    it('should handle empty slot', () => {
      const wrapper = mount(UtilitySection, {
        props: {
          title: 'Title',
        },
      })

      expect(wrapper.find('.utility-section__content').exists()).toBe(true)
      expect(wrapper.find('.utility-section__content').text()).toBe('')
    })
  })

  describe('Component Structure', () => {
    it('should render as section element', () => {
      const wrapper = mount(UtilitySection, {
        props: {
          title: 'Title',
        },
      })

      expect(wrapper.element.tagName).toBe('SECTION')
    })

    it('should have utility-section class', () => {
      const wrapper = mount(UtilitySection, {
        props: {
          title: 'Title',
        },
      })

      expect(wrapper.classes()).toContain('utility-section')
    })

    it('should have correct structure without description', () => {
      const wrapper = mount(UtilitySection, {
        props: {
          title: 'Title',
        },
      })

      expect(wrapper.find('.utility-section__title').exists()).toBe(true)
      expect(wrapper.find('.utility-section__description').exists()).toBe(false)
      expect(wrapper.find('.utility-section__content').exists()).toBe(true)
    })

    it('should have correct structure with description', () => {
      const wrapper = mount(UtilitySection, {
        props: {
          title: 'Title',
          description: 'Description',
        },
      })

      expect(wrapper.find('.utility-section__title').exists()).toBe(true)
      expect(wrapper.find('.utility-section__description').exists()).toBe(true)
      expect(wrapper.find('.utility-section__content').exists()).toBe(true)
    })

    it('should render elements in correct order', () => {
      const wrapper = mount(UtilitySection, {
        props: {
          title: 'Title',
          description: 'Description',
        },
        slots: {
          default: 'Content',
        },
      })

      const html = wrapper.html()
      const titleIndex = html.indexOf('utility-section__title')
      const descIndex = html.indexOf('utility-section__description')
      const contentIndex = html.indexOf('utility-section__content')

      expect(titleIndex).toBeLessThan(descIndex)
      expect(descIndex).toBeLessThan(contentIndex)
    })
  })

  describe('Semantic HTML', () => {
    it('should use semantic heading elements', () => {
      const wrapper = mount(UtilitySection, {
        props: {
          title: 'Title',
        },
      })

      expect(wrapper.find('h2.utility-section__title').exists()).toBe(true)
    })

    it('should use paragraph for description', () => {
      const wrapper = mount(UtilitySection, {
        props: {
          title: 'Title',
          description: 'Description',
        },
      })

      expect(wrapper.find('p.utility-section__description').exists()).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters in title', () => {
      const wrapper = mount(UtilitySection, {
        props: {
          title: 'Title with <special> & "characters"',
        },
      })

      expect(wrapper.find('.utility-section__title').text()).toBe(
        'Title with <special> & "characters"',
      )
    })

    it('should handle long titles', () => {
      const longTitle = 'A'.repeat(100)
      const wrapper = mount(UtilitySection, {
        props: {
          title: longTitle,
        },
      })

      expect(wrapper.find('.utility-section__title').text()).toBe(longTitle)
    })

    it('should handle complex HTML in description', () => {
      const wrapper = mount(UtilitySection, {
        props: {
          title: 'Title',
          description: '<p>Paragraph</p><ul><li>Item 1</li><li>Item 2</li></ul>',
        },
      })

      expect(wrapper.find('.utility-section__description p').exists()).toBe(true)
      expect(wrapper.find('.utility-section__description ul').exists()).toBe(true)
      expect(wrapper.find('.utility-section__description li').exists()).toBe(true)
    })
  })
})
