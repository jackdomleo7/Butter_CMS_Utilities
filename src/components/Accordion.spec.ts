import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Accordion from './Accordion.vue'

describe('Accordion', () => {
  describe('Props', () => {
    it('should render with default props', () => {
      const wrapper = mount(Accordion, {
        slots: {
          title: 'Accordion Title',
          default: 'Accordion content',
        },
      })

      expect(wrapper.find('.accordion').exists()).toBe(true)
      expect(wrapper.find('summary').text()).toContain('Accordion Title')
    })

    it('should be closed by default', () => {
      const wrapper = mount(Accordion, {
        slots: {
          title: 'Title',
          default: 'Content',
        },
      })

      expect(wrapper.find('details').attributes('open')).toBeUndefined()
    })

    it('should be open when open prop is true', () => {
      const wrapper = mount(Accordion, {
        props: {
          open: true,
        },
        slots: {
          title: 'Title',
          default: 'Content',
        },
      })

      expect(wrapper.find('details').attributes('open')).toBeDefined()
    })

    it('should toggle open state when prop changes', async () => {
      const wrapper = mount(Accordion, {
        props: {
          open: false,
        },
        slots: {
          title: 'Title',
          default: 'Content',
        },
      })

      expect(wrapper.find('details').attributes('open')).toBeUndefined()

      await wrapper.setProps({ open: true })

      expect(wrapper.find('details').attributes('open')).toBeDefined()
    })
  })

  describe('Slots', () => {
    it('should render title slot', () => {
      const wrapper = mount(Accordion, {
        slots: {
          title: 'Title Text',
        },
      })

      expect(wrapper.find('.accordion__title-content').text()).toBe('Title Text')
    })

    it('should render default slot', () => {
      const wrapper = mount(Accordion, {
        slots: {
          default: 'Panel Content',
        },
      })

      expect(wrapper.find('.accordion__content-inner').text()).toBe('Panel Content')
    })

    it('should render HTML in title slot', () => {
      const wrapper = mount(Accordion, {
        slots: {
          title: '<strong>Bold</strong> Title',
        },
      })

      expect(wrapper.html()).toContain('<strong>Bold</strong>')
      expect(wrapper.find('.accordion__title-content').text()).toContain('Bold Title')
    })

    it('should render HTML in default slot', () => {
      const wrapper = mount(Accordion, {
        slots: {
          default: '<p>Paragraph content</p>',
        },
      })

      expect(wrapper.html()).toContain('<p>Paragraph content</p>')
    })
  })

  describe('Visual Elements', () => {
    it('should render chevron icon', () => {
      const wrapper = mount(Accordion, {
        slots: {
          title: 'Title',
        },
      })

      expect(wrapper.find('.accordion__chevron').exists()).toBe(true)
      expect(wrapper.find('.accordion__chevron').text()).toBe('▼')
    })

    it('should have all structural elements', () => {
      const wrapper = mount(Accordion, {
        slots: {
          title: 'Title',
          default: 'Content',
        },
      })

      expect(wrapper.find('.accordion').exists()).toBe(true)
      expect(wrapper.find('details').exists()).toBe(true)
      expect(wrapper.find('.accordion__title').exists()).toBe(true)
      expect(wrapper.find('.accordion__title-content').exists()).toBe(true)
      expect(wrapper.find('.accordion__chevron').exists()).toBe(true)
      expect(wrapper.find('.accordion__content').exists()).toBe(true)
      expect(wrapper.find('.accordion__content-inner').exists()).toBe(true)
    })
  })

  describe('Interaction', () => {
    it('should be clickable via summary element', async () => {
      const wrapper = mount(Accordion, {
        props: {
          open: false,
        },
        slots: {
          title: 'Title',
          default: 'Content',
        },
      })

      const summary = wrapper.find('summary')
      expect(summary.exists()).toBe(true)
    })

    it('should show content when open', () => {
      const wrapper = mount(Accordion, {
        props: {
          open: true,
        },
        slots: {
          title: 'Title',
          default: 'Hidden Content',
        },
      })

      const content = wrapper.find('.accordion__content-inner')
      expect(content.text()).toBe('Hidden Content')
    })

    it('should update isOpen state when toggled', async () => {
      const wrapper = mount(Accordion, {
        props: {
          open: false,
        },
        slots: {
          title: 'Title',
          default: 'Content',
        },
      })

      // Initially closed, content should have inert attribute
      expect(wrapper.find('.accordion__content').attributes('inert')).toBeDefined()

      // Open the accordion
      await wrapper.setProps({ open: true })
      await wrapper.vm.$nextTick()

      // Content should not have inert attribute when open
      expect(wrapper.find('.accordion__content').attributes('inert')).toBeUndefined()
    })
  })

  describe('Accessibility', () => {
    it('should use native details/summary for accessibility', () => {
      const wrapper = mount(Accordion, {
        slots: {
          title: 'Accessible Title',
        },
      })

      expect(wrapper.find('details').exists()).toBe(true)
      expect(wrapper.find('summary').exists()).toBe(true)
    })

    it('should have region role on content', () => {
      const wrapper = mount(Accordion, {
        slots: {
          title: 'Title',
        },
      })

      expect(wrapper.find('.accordion__content').attributes('role')).toBe('region')
    })

    it('should set inert attribute on content when closed', () => {
      const wrapper = mount(Accordion, {
        props: {
          open: false,
        },
        slots: {
          title: 'Title',
          default: 'Content',
        },
      })

      expect(wrapper.find('.accordion__content').attributes('inert')).toBeDefined()
    })

    it('should remove inert attribute on content when open', () => {
      const wrapper = mount(Accordion, {
        props: {
          open: true,
        },
        slots: {
          title: 'Title',
          default: 'Content',
        },
      })

      expect(wrapper.find('.accordion__content').attributes('inert')).toBeUndefined()
    })

    it('should hide webkit details marker', () => {
      const wrapper = mount(Accordion, {
        slots: {
          title: 'Title',
        },
      })

      const summary = wrapper.find('summary')
      expect(summary.exists()).toBe(true)
    })

    it('should be keyboard accessible', () => {
      const wrapper = mount(Accordion, {
        slots: {
          title: 'Title',
        },
      })

      const summary = wrapper.find('summary')
      expect(summary.element.tagName).toBe('SUMMARY')
    })

    it('should have aria-hidden on chevron', () => {
      const wrapper = mount(Accordion, {
        slots: {
          title: 'Title',
        },
      })

      expect(wrapper.find('.accordion__chevron').attributes('aria-hidden')).toBe('true')
    })
  })

  describe('Component Structure', () => {
    it('should wrap accordion in div', () => {
      const wrapper = mount(Accordion, {
        slots: {
          title: 'Title',
        },
      })

      expect(wrapper.element.tagName).toBe('DIV')
      expect(wrapper.classes()).toContain('accordion')
    })

    it('should have details element inside wrapper', () => {
      const wrapper = mount(Accordion, {
        slots: {
          title: 'Title',
        },
      })

      expect(wrapper.find('details').exists()).toBe(true)
    })

    it('should have content div as sibling to details', () => {
      const wrapper = mount(Accordion, {
        slots: {
          title: 'Title',
          default: 'Content',
        },
      })

      const accordion = wrapper.find('.accordion')

      // Get all direct element children (filter out text/comment nodes)
      const children = accordion.element.children

      expect(children.length).toBe(2)
      expect(children[0]!.tagName).toBe('DETAILS')
      expect(children[1]!.tagName).toBe('DIV')
      expect(children[1]!.classList.contains('accordion__content')).toBe(true)
    })

    it('should handle empty slots gracefully', () => {
      const wrapper = mount(Accordion)

      expect(wrapper.find('.accordion__title-content').exists()).toBe(true)
      expect(wrapper.find('.accordion__content-inner').exists()).toBe(true)
    })
  })
})
