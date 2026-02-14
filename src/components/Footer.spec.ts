import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Footer from './Footer.vue'

describe('Footer.vue', () => {
  const createWrapper = () => {
    return mount(Footer, {
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

  describe('Rendering', () => {
    it('renders footer element', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('footer').exists()).toBe(true)
    })

    it('has footer class', () => {
      const wrapper = createWrapper()
      expect(wrapper.find('footer').classes()).toContain('footer')
    })

    it('renders creator attribution', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('Created by')
    })

    it('renders Jack Domleo link', () => {
      const wrapper = createWrapper()
      const link = wrapper.find('a[href="https://jackdomleo.dev"]')
      expect(link.exists()).toBe(true)
      expect(link.text()).toBe('Jack Domleo')
    })

    it('Jack Domleo link opens in new tab', () => {
      const wrapper = createWrapper()
      const link = wrapper.find('a[href="https://jackdomleo.dev"]')
      expect(link.attributes('target')).toBe('_blank')
      expect(link.attributes('rel')).toBe('noopener noreferrer')
    })

    it('renders disclaimer text', () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('Not affiliated with Butter CMS')
    })

    it('renders privacy policy button', () => {
      const wrapper = createWrapper()
      const button = wrapper.find('.footer__secondary button')
      expect(button.exists()).toBe(true)
      expect(button.text()).toBe('Privacy Policy')
    })
  })

  describe('Privacy Modal', () => {
    it('modal is closed by default', async () => {
      const wrapper = createWrapper()
      await flushPromises()
      const modal = wrapper.findComponent({ name: 'Modal' })
      expect(modal.exists()).toBe(true)
      expect(modal.props('open')).toBe(false)
    })

    it('opens modal when privacy button is clicked', async () => {
      const wrapper = createWrapper()
      const button = wrapper.find('.footer__secondary button')
      await button.trigger('click')
      await flushPromises()

      const modal = wrapper.findComponent({ name: 'Modal' })
      expect(modal.props('open')).toBe(true)
    })

    it('closes modal when close event is emitted', async () => {
      const wrapper = createWrapper()
      const button = wrapper.find('.footer__secondary button')

      // Open modal
      await button.trigger('click')
      await flushPromises()

      let modal = wrapper.findComponent({ name: 'Modal' })
      expect(modal.props('open')).toBe(true)

      // Close modal
      modal.vm.$emit('close')
      await flushPromises()

      modal = wrapper.findComponent({ name: 'Modal' })
      expect(modal.props('open')).toBe(false)
    })

    it('modal has correct id', async () => {
      const wrapper = createWrapper()
      const modal = wrapper.findComponent({ name: 'Modal' })
      expect(modal.props('id')).toBe('privacyModal')
    })

    it('modal has privacy-policy-modal class', async () => {
      const wrapper = createWrapper()
      const modal = wrapper.findComponent({ name: 'Modal' })
      expect(modal.classes()).toContain('privacy-policy-modal')
    })
  })

  describe('Privacy Policy Content', () => {
    it('renders privacy policy heading', async () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('Privacy Policy')
    })

    it('contains data collection section', async () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('Data Collection')
    })

    it('contains local storage section', async () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('Local Storage')
    })

    it('contains how it works section', async () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('How It Works')
    })

    it('contains third-party services section', async () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('Third-Party Services')
    })

    it('contains your responsibility section', async () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('Your Responsibility')
    })

    it('contains questions section with Jack Domleo link', async () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('Questions')
      const allLinks = wrapper.findAll('a[href="https://jackdomleo.dev"]')
      expect(allLinks.length).toBeGreaterThanOrEqual(2) // One in footer, one in modal
    })

    it('mentions no server-side data collection', async () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('never on our servers')
    })

    it('mentions client-side execution', async () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('client-side')
    })

    it('mentions read-only API token requirement', async () => {
      const wrapper = createWrapper()
      expect(wrapper.text()).toContain('read-only API token')
    })
  })

  describe('Structure', () => {
    it('has correct paragraph structure', () => {
      const wrapper = createWrapper()
      const paragraphs = wrapper.findAll('p')
      expect(paragraphs.length).toBeGreaterThan(0)
    })

    it('secondary text has correct class', () => {
      const wrapper = createWrapper()
      const secondary = wrapper.find('.footer__secondary')
      expect(secondary.exists()).toBe(true)
    })

    it('privacy button is a button element', () => {
      const wrapper = createWrapper()
      const button = wrapper.find('.footer__secondary button')
      expect(button.element.tagName).toBe('BUTTON')
    })
  })

  describe('Accessibility', () => {
    it('external link has proper security attributes', () => {
      const wrapper = createWrapper()
      const link = wrapper.find('a[href="https://jackdomleo.dev"]')
      expect(link.attributes('rel')).toContain('noopener')
      expect(link.attributes('rel')).toContain('noreferrer')
    })

    it('uses semantic footer element', () => {
      const wrapper = createWrapper()
      expect(wrapper.element.tagName).toBe('FOOTER')
    })

    it('privacy button is keyboard accessible', () => {
      const wrapper = createWrapper()
      const button = wrapper.find('.footer__secondary button')
      expect(button.element.tagName).toBe('BUTTON')
    })
  })

  describe('Interactions', () => {
    it('clicking privacy button updates modal state', async () => {
      const wrapper = createWrapper()
      const button = wrapper.find('.footer__secondary button')

      await button.trigger('click')
      await flushPromises()

      const modal = wrapper.findComponent({ name: 'Modal' })
      expect(modal.props('open')).toBe(true)
    })

    it('can toggle modal multiple times', async () => {
      const wrapper = createWrapper()
      const button = wrapper.find('.footer__secondary button')

      // Open
      await button.trigger('click')
      await flushPromises()
      expect(wrapper.findComponent({ name: 'Modal' }).props('open')).toBe(true)

      // Close
      wrapper.findComponent({ name: 'Modal' }).vm.$emit('close')
      await flushPromises()
      expect(wrapper.findComponent({ name: 'Modal' }).props('open')).toBe(false)

      // Open again
      await button.trigger('click')
      await flushPromises()
      expect(wrapper.findComponent({ name: 'Modal' }).props('open')).toBe(true)
    })
  })
})
