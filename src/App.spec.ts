import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from './App.vue'

// Mock Header to avoid favicon import issues in test environment
vi.mock('./components/Header.vue', () => ({
  default: {
    name: 'Header',
    template: '<header>Header</header>',
  },
}))

describe('App.vue', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  const createWrapper = () => {
    return mount(App, {
      global: {
        plugins: [createPinia()],
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
          AuditContent: {
            name: 'AuditContent',
            template: '<div class="audit-content-stub">Audit Content</div>',
          },
          WhatsNew: {
            name: 'WhatsNew',
            template: '<div class="whats-new-stub">WhatsNew</div>',
          },
        },
      },
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

    it('renders Tabs component', () => {
      const wrapper = createWrapper()
      const tabs = wrapper.findComponent({ name: 'Tabs' })
      expect(tabs.exists()).toBe(true)
    })

    it('renders Tab components for Search and Audit', () => {
      const wrapper = createWrapper()
      const tabComponents = wrapper.findAllComponents({ name: 'Tab' })
      expect(tabComponents).toHaveLength(2)
    })

    it('renders SearchContent component within tabs', () => {
      const wrapper = createWrapper()
      const searchContent = wrapper.findComponent({ name: 'SearchContent' })
      expect(searchContent.exists()).toBe(true)
    })

    it('renders AuditContent component within tabs', async () => {
      const wrapper = createWrapper()
      await flushPromises()

      // Click the Audit tab to render the AuditContent
      const tabs = wrapper.findAll('button[class*="tab"]')
      const auditTab = tabs[1]
      if (auditTab) {
        await auditTab.trigger('click')
        await flushPromises()
      }

      const auditContent = wrapper.findComponent({ name: 'AuditContent' })
      expect(auditContent.exists()).toBe(true)
    })

    it('renders WhatsNew component', () => {
      const wrapper = createWrapper()
      const whatsNew = wrapper.findComponent({ name: 'WhatsNew' })
      expect(whatsNew.exists()).toBe(true)
    })
  })

  describe('Tab Configuration', () => {
    it('Search tab has correct props', () => {
      const wrapper = createWrapper()
      const tabs = wrapper.findAllComponents({ name: 'Tab' })
      const searchTab = tabs[0]

      expect(searchTab!.props('label')).toBe('Search')
      expect(searchTab!.props('icon')).toBe('🔍')
      expect(searchTab!.props('panelId')).toBe('search-panel')
      expect(searchTab!.props('index')).toBe(0)
    })

    it('Audit tab has correct props', () => {
      const wrapper = createWrapper()
      const tabs = wrapper.findAllComponents({ name: 'Tab' })
      const auditTab = tabs[1]

      expect(auditTab!.props('label')).toBe('Audit')
      expect(auditTab!.props('icon')).toBe('⚠️')
      expect(auditTab!.props('panelId')).toBe('audit-panel')
      expect(auditTab!.props('index')).toBe(1)
    })
  })

  describe('Tab Panels', () => {
    it('search panel has correct id and role', () => {
      const wrapper = createWrapper()
      const searchPanel = wrapper.find('#search-panel')

      expect(searchPanel.exists()).toBe(true)
      expect(searchPanel.attributes('role')).toBe('tabpanel')
      expect(searchPanel.attributes('aria-labelledby')).toBe('tab-0')
    })

    it('audit panel has correct id and role', async () => {
      const wrapper = createWrapper()
      await flushPromises()

      // Click the Audit tab to render the audit panel
      const tabs = wrapper.findAll('button[class*="tab"]')
      const auditTab = tabs[1]
      if (auditTab) {
        await auditTab.trigger('click')
        await flushPromises()
      }

      const auditPanel = wrapper.find('#audit-panel')
      expect(auditPanel.exists()).toBe(true)
      expect(auditPanel.attributes('role')).toBe('tabpanel')
      expect(auditPanel.attributes('aria-labelledby')).toBe('tab-1')
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

    it('main contains privacy banner, api config, and tabs', () => {
      const wrapper = createWrapper()
      const main = wrapper.find('main')

      expect(main.findComponent({ name: 'InfoBanner' }).exists()).toBe(true)
      expect(main.findComponent({ name: 'ApiConfiguration' }).exists()).toBe(true)
      expect(main.findComponent({ name: 'Tabs' }).exists()).toBe(true)
    })
  })
})
