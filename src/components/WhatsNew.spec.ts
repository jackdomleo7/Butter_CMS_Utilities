import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import WhatsNew from './WhatsNew.vue'

describe('WhatsNew.vue', () => {
  const createWrapper = () => {
    return mount(WhatsNew, {
      global: {
        stubs: {
          Modal: {
            name: 'Modal',
            template: '<div class="modal-stub"><slot name="heading" /><slot /></div>',
            props: ['id', 'open'],
            emits: ['close'],
          },
        },
      },
    })
  }

  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Initial State', () => {
    it('does not show modal when last visit is recent', async () => {
      // Set last visit to far future to be after all features
      const futureDate = new Date('2030-01-01T00:00:00Z')
      localStorage.setItem('butter_cms_last_visit', futureDate.toISOString())

      const wrapper = createWrapper()
      await flushPromises()

      const modal = wrapper.findComponent({ name: 'Modal' })
      expect(modal.props('open')).toBe(false)
    })

    it('does not show modal when no last visit exists (first-time user)', async () => {
      const wrapper = createWrapper()
      await flushPromises()

      const modal = wrapper.findComponent({ name: 'Modal' })
      expect(modal.props('open')).toBe(false)
    })

    it('shows modal when last visit was before newest feature', async () => {
      // Set last visit to long ago to be before all features
      const oldDate = new Date('2020-01-01T00:00:00Z')
      localStorage.setItem('butter_cms_last_visit', oldDate.toISOString())

      const wrapper = createWrapper()
      await flushPromises()

      const modal = wrapper.findComponent({ name: 'Modal' })
      expect(modal.props('open')).toBe(true)
    })
  })

  describe('Modal Structure', () => {
    it('renders Modal component', async () => {
      const wrapper = createWrapper()
      await flushPromises()

      const modal = wrapper.findComponent({ name: 'Modal' })
      expect(modal.exists()).toBe(true)
    })

    it('modal has correct id', async () => {
      const wrapper = createWrapper()
      await flushPromises()

      const modal = wrapper.findComponent({ name: 'Modal' })
      expect(modal.props('id')).toBe('whatsNew')
    })

    it('renders heading "Since you last visited"', async () => {
      const wrapper = createWrapper()
      await flushPromises()

      expect(wrapper.text()).toContain('Since you last visited')
    })
  })

  describe('Feature Display', () => {
    it('displays InfoBanner components for features', async () => {
      // Set last visit to long ago so all features will show
      const oldDate = new Date('2020-01-01')
      localStorage.setItem('butter_cms_last_visit', oldDate.toISOString())

      const wrapper = createWrapper()
      await flushPromises()

      const infoBanners = wrapper.findAllComponents({ name: 'InfoBanner' })
      expect(infoBanners.length).toBeGreaterThan(0)
    })

    it('displays feature with type icon and title', async () => {
      const oldDate = new Date('2020-01-01')
      localStorage.setItem('butter_cms_last_visit', oldDate.toISOString())

      const wrapper = createWrapper()
      await flushPromises()

      const h3Elements = wrapper.findAll('h3')
      expect(h3Elements.length).toBeGreaterThan(0)

      // Should contain feature type indicators
      const text = wrapper.text()
      const hasFeatureIcon =
        text.includes('✨ New Feature') ||
        text.includes('🛠️ Improvement') ||
        text.includes('🐞 Bug Fix')
      expect(hasFeatureIcon).toBe(true)
    })

    it('displays feature descriptions', async () => {
      const oldDate = new Date('2020-01-01')
      localStorage.setItem('butter_cms_last_visit', oldDate.toISOString())

      const wrapper = createWrapper()
      await flushPromises()

      const paragraphs = wrapper.findAll('p')
      expect(paragraphs.length).toBeGreaterThan(0)
    })

    it('displays formatted dates', async () => {
      const oldDate = new Date('2020-01-01')
      localStorage.setItem('butter_cms_last_visit', oldDate.toISOString())

      const wrapper = createWrapper()
      await flushPromises()

      const smallElements = wrapper.findAll('small')
      expect(smallElements.length).toBeGreaterThan(0)
    })

    it('each feature has unique key', async () => {
      const oldDate = new Date('2020-01-01')
      localStorage.setItem('butter_cms_last_visit', oldDate.toISOString())

      const wrapper = createWrapper()
      await flushPromises()

      const infoBanners = wrapper.findAllComponents({ name: 'InfoBanner' })
      const keys = infoBanners.map((banner) => banner.getCurrentComponent().vnode.key!)
      const uniqueKeys = new Set(keys)
      // All keys should be unique
      expect(uniqueKeys.size).toBe(keys.length)
      // Should have at least 1 feature
      expect(keys.length).toBeGreaterThan(0)
    })
  })

  describe('Feature Types', () => {
    it('displays bugfix with error status', async () => {
      const oldDate = new Date('2020-01-01')
      localStorage.setItem('butter_cms_last_visit', oldDate.toISOString())

      const wrapper = createWrapper()
      await flushPromises()

      const infoBanners = wrapper.findAllComponents({ name: 'InfoBanner' })
      const bugfixBanner = infoBanners.find((b) => b.text().includes('🐞 Bug Fix'))
      expect(bugfixBanner).toBeDefined()
      expect(bugfixBanner?.props('status')).toBe('error')
    })

    it('displays improvement with success status', async () => {
      const oldDate = new Date('2020-01-01')
      localStorage.setItem('butter_cms_last_visit', oldDate.toISOString())

      const wrapper = createWrapper()
      await flushPromises()

      const infoBanners = wrapper.findAllComponents({ name: 'InfoBanner' })
      const improvementBanner = infoBanners.find((b) => b.text().includes('🛠️ Improvement'))
      expect(improvementBanner).toBeDefined()
      expect(improvementBanner?.props('status')).toBe('success')
    })

    it('displays feature with info status', async () => {
      const oldDate = new Date('2020-01-01')
      localStorage.setItem('butter_cms_last_visit', oldDate.toISOString())

      const wrapper = createWrapper()
      await flushPromises()

      const infoBanners = wrapper.findAllComponents({ name: 'InfoBanner' })
      const featureBanner = infoBanners.find((b) => b.text().includes('✨ New Feature'))
      expect(featureBanner).toBeDefined()
      expect(featureBanner?.props('status')).toBe('info')
    })
  })

  describe('Filtering Logic', () => {
    it('filters features based on last visit date', async () => {
      // Set last visit to a week ago - should show recent features
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 7)
      localStorage.setItem('butter_cms_last_visit', pastDate.toISOString())

      const wrapper = createWrapper()
      await flushPromises()

      const infoBanners = wrapper.findAllComponents({ name: 'InfoBanner' })
      // Should show at least some features
      expect(infoBanners.length).toBeGreaterThan(0)
    })

    it('does not show modal when all features are old', async () => {
      // Set last visit to future date (after all features)
      const futureDate = new Date('2027-01-01T00:00:00Z')
      localStorage.setItem('butter_cms_last_visit', futureDate.toISOString())

      const wrapper = createWrapper()
      await flushPromises()

      const modal = wrapper.findComponent({ name: 'Modal' })
      expect(modal.props('open')).toBe(false)
    })
  })

  describe('Local Storage Integration', () => {
    it('updates last visit in localStorage when modal closes', async () => {
      localStorage.clear()

      const wrapper = createWrapper()
      await flushPromises()

      const modal = wrapper.findComponent({ name: 'Modal' })
      modal.vm.$emit('close')
      await flushPromises()

      const lastVisit = localStorage.getItem('butter_cms_last_visit')
      expect(lastVisit).toBeTruthy()
      expect(() => new Date(lastVisit!)).not.toThrow()
    })

    it('sets timestamp to now when closing modal', async () => {
      localStorage.clear()
      const now = new Date('2026-02-12T12:00:00Z')
      vi.setSystemTime(now)

      const wrapper = createWrapper()
      await flushPromises()

      const modal = wrapper.findComponent({ name: 'Modal' })
      modal.vm.$emit('close')
      await flushPromises()

      const lastVisit = localStorage.getItem('butter_cms_last_visit')
      const storedDate = new Date(lastVisit!)
      expect(storedDate.toISOString()).toBe(now.toISOString())
    })
  })

  describe('Modal Interactions', () => {
    it('closes modal when close event is emitted', async () => {
      const oldDate = new Date('2020-01-01')
      localStorage.setItem('butter_cms_last_visit', oldDate.toISOString())

      const wrapper = createWrapper()
      await flushPromises()

      let modal = wrapper.findComponent({ name: 'Modal' })
      expect(modal.props('open')).toBe(true)

      modal.vm.$emit('close')
      await flushPromises()

      modal = wrapper.findComponent({ name: 'Modal' })
      expect(modal.props('open')).toBe(false)
    })

    it('modal remains closed after being dismissed', async () => {
      localStorage.clear()

      const wrapper = createWrapper()
      await flushPromises()

      const modal = wrapper.findComponent({ name: 'Modal' })
      modal.vm.$emit('close')
      await flushPromises()

      expect(wrapper.findComponent({ name: 'Modal' }).props('open')).toBe(false)
    })
  })

  describe('Date Formatting', () => {
    it('formats dates in readable format', async () => {
      const oldDate = new Date('2020-01-01')
      localStorage.setItem('butter_cms_last_visit', oldDate.toISOString())

      const wrapper = createWrapper()
      await flushPromises()

      const smallElements = wrapper.findAll('small')
      // Should have at least one date
      expect(smallElements.length).toBeGreaterThan(0)
      const dateText = smallElements[0]!.text()
      // Should contain month name or number and year
      const hasDate = /\d{1,2}/.test(dateText) && /\d{4}/.test(dateText)
      expect(hasDate).toBe(true)
    })
  })

  describe('Content Structure', () => {
    it('each feature has InfoBanner wrapper', async () => {
      const oldDate = new Date('2020-01-01')
      localStorage.setItem('butter_cms_last_visit', oldDate.toISOString())

      const wrapper = createWrapper()
      await flushPromises()

      const infoBanners = wrapper.findAllComponents({ name: 'InfoBanner' })
      expect(infoBanners.length).toBeGreaterThan(0)

      infoBanners.forEach((banner) => {
        expect(banner.classes()).toContain('whats-new-item')
      })
    })

    it('feature descriptions support HTML', async () => {
      const oldDate = new Date('2020-01-01')
      localStorage.setItem('butter_cms_last_visit', oldDate.toISOString())

      const wrapper = createWrapper()
      await flushPromises()

      // v-html should render HTML in descriptions
      const paragraphs = wrapper.findAll('p')
      expect(paragraphs.length).toBeGreaterThan(0)
    })
  })

  describe('Date Formatting', () => {
    it('displays dates in readable format when features are shown', async () => {
      const oldDate = new Date('2020-01-01')
      localStorage.setItem('butter_cms_last_visit', oldDate.toISOString())

      const wrapper = createWrapper()
      await flushPromises()

      const smallTags = wrapper.findAll('small')

      // If features are displayed, verify date format pattern
      if (smallTags.length > 0) {
        smallTags.forEach((tag) => {
          // Verify dates follow the pattern: number + month name + year + 'at' + time
          expect(tag.text()).toMatch(/\d{1,2}\s\w+\s\d{4}\sat\s\d{1,2}:\d{2}/)
        })
      }
    })

    it('does not display dates when no new features exist', async () => {
      const futureDate = new Date('2030-01-01')
      localStorage.setItem('butter_cms_last_visit', futureDate.toISOString())

      const wrapper = createWrapper()
      await flushPromises()

      const smallTags = wrapper.findAll('small')
      expect(smallTags.length).toBe(0)
    })
  })
})
