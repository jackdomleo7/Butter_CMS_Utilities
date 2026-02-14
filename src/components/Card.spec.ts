import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Card from './Card.vue'

describe('Card', () => {
  describe('Props', () => {
    it('should render with default props', () => {
      const wrapper = mount(Card, {
        slots: {
          default: 'Card content',
        },
      })

      expect(wrapper.classes()).toContain('card')
      expect(wrapper.classes()).not.toContain('card--skeleton')
      expect(wrapper.classes()).not.toContain('card--clickable')
      expect(wrapper.text()).toBe('Card content')
    })

    it('should not be skeleton by default', () => {
      const wrapper = mount(Card)

      expect(wrapper.attributes('aria-busy')).toBe('false')
      expect(wrapper.attributes('aria-label')).toBeUndefined()
      expect(wrapper.find('.skeleton').exists()).toBe(false)
    })

    it('should not be clickable by default', () => {
      const wrapper = mount(Card)

      expect(wrapper.classes()).not.toContain('card--clickable')
    })

    it('should render as skeleton when skeleton prop is true', () => {
      const wrapper = mount(Card, {
        props: {
          skeleton: true,
        },
      })

      expect(wrapper.classes()).toContain('card--skeleton')
      expect(wrapper.attributes('aria-busy')).toBe('true')
      expect(wrapper.attributes('aria-label')).toBe('Loading')
    })

    it('should render as clickable when clickable prop is true', () => {
      const wrapper = mount(Card, {
        props: {
          clickable: true,
        },
        slots: {
          default: 'Clickable content',
        },
      })

      expect(wrapper.classes()).toContain('card--clickable')
      expect(wrapper.text()).toBe('Clickable content')
    })

    it('should support both skeleton and clickable props', () => {
      const wrapper = mount(Card, {
        props: {
          skeleton: true,
          clickable: true,
        },
      })

      expect(wrapper.classes()).toContain('card--skeleton')
      expect(wrapper.classes()).toContain('card--clickable')
    })
  })

  describe('Skeleton State', () => {
    it('should render skeleton elements when skeleton is true', () => {
      const wrapper = mount(Card, {
        props: {
          skeleton: true,
        },
      })

      expect(wrapper.find('.skeleton--badge').exists()).toBe(true)
      expect(wrapper.find('.skeleton--title').exists()).toBe(true)
      expect(wrapper.find('.skeleton--slug').exists()).toBe(true)
      expect(wrapper.findAll('.skeleton--line')).toHaveLength(3)
    })

    it('should have correct skeleton line variants', () => {
      const wrapper = mount(Card, {
        props: {
          skeleton: true,
        },
      })

      expect(wrapper.find('.skeleton--line-full').exists()).toBe(true)
      expect(wrapper.find('.skeleton--line-90').exists()).toBe(true)
      expect(wrapper.find('.skeleton--line-70').exists()).toBe(true)
    })

    it('should not render slot content when skeleton is true', () => {
      const wrapper = mount(Card, {
        props: {
          skeleton: true,
        },
        slots: {
          default: 'This should not appear',
        },
      })

      expect(wrapper.text()).not.toContain('This should not appear')
      expect(wrapper.find('.skeleton').exists()).toBe(true)
    })

    it('should render slot content when skeleton is false', () => {
      const wrapper = mount(Card, {
        props: {
          skeleton: false,
        },
        slots: {
          default: 'Actual content',
        },
      })

      expect(wrapper.text()).toBe('Actual content')
      expect(wrapper.find('.skeleton').exists()).toBe(false)
    })

    it('should toggle between skeleton and content', async () => {
      const wrapper = mount(Card, {
        props: {
          skeleton: true,
        },
        slots: {
          default: 'Loaded content',
        },
      })

      expect(wrapper.find('.skeleton').exists()).toBe(true)
      expect(wrapper.text()).not.toContain('Loaded content')

      await wrapper.setProps({ skeleton: false })

      expect(wrapper.find('.skeleton').exists()).toBe(false)
      expect(wrapper.text()).toBe('Loaded content')
    })
  })

  describe('Slot Content', () => {
    it('should render simple text content', () => {
      const wrapper = mount(Card, {
        slots: {
          default: 'Simple text',
        },
      })

      expect(wrapper.text()).toBe('Simple text')
    })

    it('should render HTML content', () => {
      const wrapper = mount(Card, {
        slots: {
          default: '<h2>Title</h2><p>Description</p>',
        },
      })

      expect(wrapper.html()).toContain('<h2>Title</h2>')
      expect(wrapper.html()).toContain('<p>Description</p>')
    })

    it('should render complex nested content', () => {
      const wrapper = mount(Card, {
        slots: {
          default: `
            <div class="card-header">
              <span class="badge">New</span>
              <h3>Article Title</h3>
            </div>
            <p>Article excerpt goes here</p>
          `,
        },
      })

      expect(wrapper.find('.card-header').exists()).toBe(true)
      expect(wrapper.find('.badge').exists()).toBe(true)
      expect(wrapper.find('h3').text()).toBe('Article Title')
      expect(wrapper.find('p').text()).toBe('Article excerpt goes here')
    })

    it('should handle empty slot', () => {
      const wrapper = mount(Card)

      expect(wrapper.text()).toBe('')
      expect(wrapper.find('.card').exists()).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('should have aria-busy="true" when skeleton is true', () => {
      const wrapper = mount(Card, {
        props: {
          skeleton: true,
        },
      })

      expect(wrapper.attributes('aria-busy')).toBe('true')
    })

    it('should have aria-label="Loading" when skeleton is true', () => {
      const wrapper = mount(Card, {
        props: {
          skeleton: true,
        },
      })

      expect(wrapper.attributes('aria-label')).toBe('Loading')
    })

    it('should not have aria-busy or aria-label when not skeleton', () => {
      const wrapper = mount(Card, {
        props: {
          skeleton: false,
        },
      })

      expect(wrapper.attributes('aria-busy')).toBe('false')
      expect(wrapper.attributes('aria-label')).toBeUndefined()
    })

    it('should update aria attributes when skeleton prop changes', async () => {
      const wrapper = mount(Card, {
        props: {
          skeleton: false,
        },
      })

      expect(wrapper.attributes('aria-busy')).toBe('false')

      await wrapper.setProps({ skeleton: true })

      expect(wrapper.attributes('aria-busy')).toBe('true')
      expect(wrapper.attributes('aria-label')).toBe('Loading')
    })
  })

  describe('Visual States', () => {
    it('should always have base card class', () => {
      const variants: Array<{ skeleton?: boolean; clickable?: boolean }> = [
        {},
        { skeleton: true },
        { clickable: true },
        { skeleton: true, clickable: true },
      ]

      variants.forEach((props) => {
        const wrapper = mount(Card, { props })
        expect(wrapper.classes()).toContain('card')
      })
    })

    it('should render as div element', () => {
      const wrapper = mount(Card)

      expect(wrapper.element.tagName).toBe('DIV')
    })
  })
})
