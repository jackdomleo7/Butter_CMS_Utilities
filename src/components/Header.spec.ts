import { describe, it, expect, vi, beforeAll } from 'vitest'
import { mount } from '@vue/test-utils'
import Header from './Header.vue'

// Mock the favicon to avoid file system errors in tests
beforeAll(() => {
  vi.mock('/favicon.png', () => ({
    default: '/favicon.png',
  }))
})

describe('Header.vue', () => {
  const createWrapper = () => {
    return mount(Header)
  }

  describe('Structure', () => {
    it('renders header element', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('header').exists()).toBe(true)
    })

    it('has header class', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('header').classes()).toContain('header')
    })

    it('renders h1 with app title', () => {
      const wrapper = createWrapper()
      const h1 = wrapper.find('h1')
      expect(h1.exists()).toBe(true)
      expect(h1.text()).toContain('Butter CMS Utilities')
    })

    it('renders favicon image', () => {
      const wrapper = createWrapper()
      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toContain('favicon.png')
      expect(img.attributes('alt')).toBe('')
      expect(img.attributes('width')).toBe('36')
      expect(img.attributes('height')).toBe('36')
    })

    it('renders subtitle', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('Unofficial client-side tools for Butter CMS')
    })

    it('renders tagline', () => {
      const wrapper = createWrapper()
      const tagline = wrapper.find('.header__tagline')
      expect(tagline.exists()).toBe(true)
      expect(tagline.text()).toBe("I can't believe it's not Butter CMS!")
    })
  })

  describe('Accessibility', () => {
    it('image has empty alt text (decorative)', () => {
      const wrapper = createWrapper()
      const img = wrapper.find('img')
      expect(img.attributes('alt')).toBe('')
    })

    it('uses semantic header element', () => {
      const wrapper = createWrapper()
      expect(wrapper.element.tagName).toBe('HEADER')
    })

    it('has proper heading hierarchy', () => {
      const wrapper = createWrapper()
      const h1 = wrapper.find('h1')
      expect(h1.exists()).toBe(true)
    })
  })

  describe('Content Structure', () => {
    it('has header__content wrapper', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('.header__content').exists()).toBe(true)
    })

    it('contains all text elements within content wrapper', () => {
      const wrapper = createWrapper()
      const content = wrapper.find('.header__content')
      expect(content.find('h1').exists()).toBe(true)
      expect(content.findAll('p').length).toBeGreaterThanOrEqual(2)
    })
  })
})
