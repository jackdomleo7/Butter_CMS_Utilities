import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import App from './App.vue'

// Mock Header to avoid favicon import issues in test environment
vi.mock('./components/Header.vue', () => ({
  default: {
    name: 'Header',
    template: '<header>Header</header>',
  },
}))

describe('App.vue', () => {
  const createWrapper = () => {
    return mount(App, {
      global: {
        stubs: {
          Header: { name: 'Header', template: '<header>Header Stub</header>' },
          Footer: { name: 'Footer', template: '<footer>Footer Stub</footer>' },
          InfoBanner: {
            name: 'InfoBanner',
            template: '<div class="info-banner-stub"><slot /></div>',
            props: ['status'],
          },
          ApiConfiguration: {
            name: 'ApiConfiguration',
            template: '<div class="api-config-stub">API Config</div>',
          },
          SearchContent: {
            name: 'SearchContent',
            template: '<div class="search-content-stub">Search Content</div>',
          },
          ComingSoon: {
            name: 'ComingSoon',
            template: '<div class="coming-soon-stub"><slot /></div>',
          },
          WhatsNew: {
            name: 'WhatsNew',
            template: '<div class="whats-new-stub">WhatsNew</div>',
          },
        },
      },
      shallow: true,
    })
  }

  describe('Structure', () => {
    it('renders the app wrapper', () => {
      const wrapper = createWrapper()
      expect(wrapper.exists()).toBe(true)
    })

    it('renders Header component', () => {
      const wrapper = createWrapper()
      const header = wrapper.findComponent({ name: 'Header' })
      expect(header.exists()).toBe(true)
    })

    it('renders Footer component', () => {
      const wrapper = createWrapper()
      const footer = wrapper.findComponent({ name: 'Footer' })
      expect(footer.exists()).toBe(true)
    })

    it('renders main element', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('main').exists()).toBe(true)
    })

    it('renders privacy banner', () => {
      const wrapper = createWrapper()
      const infoBanner = wrapper.findComponent({ name: 'InfoBanner' })
      expect(infoBanner.exists()).toBe(true)
      expect(infoBanner.props('status')).toBe('info')
    })

    it('displays privacy banner text', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('Privacy First')
      expect(wrapper.text()).toContain('All operations run entirely in your browser')
    })

    it('renders ApiConfiguration component', () => {
      const wrapper = createWrapper()
      const apiConfig = wrapper.findComponent({ name: 'ApiConfiguration' })
      expect(apiConfig.exists()).toBe(true)
    })

    it('renders utilities title', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('Utilities')
    })

    it('renders SearchContent component', () => {
      const wrapper = createWrapper()
      const searchContent = wrapper.findComponent({ name: 'SearchContent' })
      expect(searchContent.exists()).toBe(true)
    })

    it('renders ComingSoon components', () => {
      const wrapper = createWrapper()
      const comingSoon = wrapper.findAllComponents({ name: 'ComingSoon' })
      expect(comingSoon.length).toBeGreaterThanOrEqual(2)
    })

    it('displays coming soon utility descriptions', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('List all draft content')
      expect(wrapper.text()).toContain('WYSIWYG Analyzer')
    })

    it('renders WhatsNew component', () => {
      const wrapper = createWrapper()
      const whatsNew = wrapper.findComponent({ name: 'WhatsNew' })
      expect(whatsNew.exists()).toBe(true)
    })
  })

  describe('Layout', () => {
    it('has correct component order', () => {
      const wrapper = createWrapper()
      const html = wrapper.html()

      const headerIndex = html.indexOf('Header Stub')
      const mainIndex = html.indexOf('<main')
      const footerIndex = html.indexOf('Footer Stub')

      expect(headerIndex).toBeLessThan(mainIndex)
      expect(mainIndex).toBeLessThan(footerIndex)
    })

    it('main contains privacy banner, api config, and utilities', () => {
      const wrapper = createWrapper()
      const main = wrapper.find('main')

      expect(main.findComponent({ name: 'InfoBanner' }).exists()).toBe(true)
      expect(main.findComponent({ name: 'ApiConfiguration' }).exists()).toBe(true)
      expect(main.findComponent({ name: 'SearchContent' }).exists()).toBe(true)
    })
  })
})
