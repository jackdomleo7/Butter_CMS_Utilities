import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import type { ComponentPublicInstance } from 'vue'
import ApiConfiguration from './ApiConfiguration.vue'
import Accordion from './Accordion.vue'
import TextInput from './TextInput.vue'
import Toggle from './Toggle.vue'
import Btn from './Btn.vue'
import Chip from './Chip.vue'
import { useStore } from '@/stores/index'

const EXAMPLE_TOKEN = '4f4433c31718b6821b9850fe1921255020be6dc2'
const EXAMPLE_PAGE_TYPES = ['landing-page', 'product_page']
const EXAMPLE_COLLECTION_KEYS = ['navigation_menu', 'recipe']
const EXAMPLE_KNOWN_COMPONENTS = [
  'features',
  'hero',
  'seo',
  'two_column_with_image',
  'some_unused_component',
]

// Type helper for accessing component internals in tests
interface ApiConfigurationInstance extends ComponentPublicInstance {
  store: ReturnType<typeof useStore>
  pageTypeInput: string
  collectionKeyInput: string
  knownComponentInput: string
}

// Helper to get typed component instance
const getVm = (wrapper: ReturnType<typeof mount>) =>
  wrapper.vm as unknown as ApiConfigurationInstance

describe('ApiConfiguration.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  describe('Rendering', () => {
    it('renders the accordion component', () => {
      const wrapper = mount(ApiConfiguration)
      const accordion = wrapper.findComponent(Accordion)
      expect(accordion.exists()).toBe(true)
    })

    it('renders the token TextInput component', () => {
      const wrapper = mount(ApiConfiguration)
      const inputs = wrapper.findAllComponents(TextInput)
      const tokenInput = inputs.find((input) => input.props('id') === 'butter-api-token')!
      expect(tokenInput.exists()).toBe(true)
    })

    it('renders the draft Toggle component in summary', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = 'test_token'
      await wrapper.vm.$nextTick()
      const toggle = wrapper.find('#draft-toggle-summary')
      expect(toggle.exists()).toBe(true)
    })

    it('renders the draft Toggle component in panel', () => {
      const wrapper = mount(ApiConfiguration)
      const toggle = wrapper.find('#draft-toggle-panel')
      expect(toggle.exists()).toBe(true)
    })

    it('renders the page type TextInput', () => {
      const wrapper = mount(ApiConfiguration)
      const pageTypeInput = wrapper.find('#page-type-input')
      expect(pageTypeInput.exists()).toBe(true)
    })

    it('renders the collection key TextInput', () => {
      const wrapper = mount(ApiConfiguration)
      const collectionInput = wrapper.find('#collection-key-input')
      expect(collectionInput.exists()).toBe(true)
    })

    it('renders page types section heading', () => {
      const wrapper = mount(ApiConfiguration)
      expect(wrapper.text()).toContain('Page Types')
    })

    it('renders collection keys section heading', () => {
      const wrapper = mount(ApiConfiguration)
      expect(wrapper.text()).toContain('Collection Keys')
    })
  })

  describe('Token Lock Button', () => {
    it('does not show lock button when token is empty', () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = ''
      const lockButton = wrapper.find('.api-config__lock-button')
      expect(lockButton.exists()).toBe(false)
    })

    it('shows lock button when token is present', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = 'test_token_12345'
      await wrapper.vm.$nextTick()
      const lockButton = wrapper.find('.api-config__lock-button')
      expect(lockButton.exists()).toBe(true)
    })

    it('displays unlock icon when token is not locked', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = 'test_token'
      getVm(wrapper).store.lockToken = false
      await wrapper.vm.$nextTick()
      const lockButton = wrapper.find('.api-config__lock-button')
      expect(lockButton.text()).toBe('🔓')
    })

    it('displays lock icon when token is locked', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = 'test_token'
      getVm(wrapper).store.lockToken = true
      await wrapper.vm.$nextTick()
      const lockButton = wrapper.find('.api-config__lock-button')
      expect(lockButton.text()).toBe('🔒')
    })

    it('toggles lock state when clicked', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = 'test_token'
      getVm(wrapper).store.lockToken = false
      await wrapper.vm.$nextTick()
      const lockButton = wrapper.find('.api-config__lock-button')
      await lockButton.trigger('click')
      expect(getVm(wrapper).store.lockToken).toBe(true)
    })

    it('unlocks token when clicking lock button while locked', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = 'test_token'
      getVm(wrapper).store.lockToken = true
      await wrapper.vm.$nextTick()
      const lockButton = wrapper.find('.api-config__lock-button')
      await lockButton.trigger('click')
      expect(getVm(wrapper).store.lockToken).toBe(false)
    })

    it('makes token input readonly when locked', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = 'test_token'
      getVm(wrapper).store.lockToken = true
      await wrapper.vm.$nextTick()
      const inputs = wrapper.findAllComponents(TextInput)
      const tokenInput = inputs.find((input) => input.props('id') === 'butter-api-token')!
      const inputElement = tokenInput.find('input')
      expect(inputElement.attributes('readonly')).toBeDefined()
    })

    it('makes token input editable when unlocked', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = 'test_token'
      getVm(wrapper).store.lockToken = false
      await wrapper.vm.$nextTick()
      const inputs = wrapper.findAllComponents(TextInput)
      const tokenInput = inputs.find((input) => input.props('id') === 'butter-api-token')!
      const inputElement = tokenInput.find('input')
      expect(inputElement.attributes('readonly')).toBeUndefined()
    })
  })

  describe('Token Masking', () => {
    it('does not show masked token in summary when token is empty', () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = ''
      const tokenPreview = wrapper.find('.api-config__token-preview')
      expect(tokenPreview.exists()).toBe(false)
    })

    it('shows masked token in summary when token is present', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = 'test_token_12345'
      await wrapper.vm.$nextTick()
      const tokenPreview = wrapper.find('.api-config__token-preview')
      expect(tokenPreview.exists()).toBe(true)
    })

    it('masks short tokens with all dots', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = 'short'
      await wrapper.vm.$nextTick()
      const tokenPreview = wrapper.find('.api-config__token-preview')
      expect(tokenPreview.text()).toBe('••••••••')
    })

    it('masks long tokens showing first 4 and last 4 characters', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = 'abcdefghijklmnop'
      await wrapper.vm.$nextTick()
      const tokenPreview = wrapper.find('.api-config__token-preview')
      expect(tokenPreview.text()).toBe('abcd...mnop')
    })

    it('masks exactly 8 character tokens with all dots', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = '12345678'
      await wrapper.vm.$nextTick()
      const tokenPreview = wrapper.find('.api-config__token-preview')
      expect(tokenPreview.text()).toBe('••••••••')
    })

    it('masks 9 character tokens showing first 4 and last 4', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = '123456789'
      await wrapper.vm.$nextTick()
      const tokenPreview = wrapper.find('.api-config__token-preview')
      expect(tokenPreview.text()).toBe('1234...6789')
    })
  })

  describe('Draft Preview Toggle', () => {
    it('does not show draft toggle in summary when token is empty', () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = ''
      const toggle = wrapper.find('.api-config__toggle')
      expect(toggle.exists()).toBe(false)
    })

    it('shows draft toggle in summary when token is present', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = 'test_token'
      await wrapper.vm.$nextTick()
      const toggle = wrapper.find('.api-config__toggle')
      expect(toggle.exists()).toBe(true)
    })

    it('shows "Include drafts" label when includePreview is true', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = 'test_token'
      getVm(wrapper).store.includePreview = true
      await wrapper.vm.$nextTick()
      const summaryToggle = wrapper
        .findAllComponents(Toggle)
        .find((t) => t.props('id') === 'draft-toggle-summary')!
      expect(summaryToggle.props('onLabel')).toBe('Include drafts')
    })

    it('shows "Published only" label when includePreview is false', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = 'test_token'
      getVm(wrapper).store.includePreview = false
      await wrapper.vm.$nextTick()
      const summaryToggle = wrapper
        .findAllComponents(Toggle)
        .find((t) => t.props('id') === 'draft-toggle-summary')!
      expect(summaryToggle.props('offLabel')).toBe('Published only')
    })

    it('updates store when draft toggle is changed in summary', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = 'test_token'
      getVm(wrapper).store.includePreview = false
      await wrapper.vm.$nextTick()
      const summaryToggle = wrapper
        .findAllComponents(Toggle)
        .find((t) => t.props('id') === 'draft-toggle-summary')!
      await summaryToggle.setValue(true)
      expect(getVm(wrapper).store.includePreview).toBe(true)
    })

    it('updates store when draft toggle is changed in panel', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.includePreview = false
      await wrapper.vm.$nextTick()
      const panelToggle = wrapper
        .findAllComponents(Toggle)
        .find((t) => t.props('id') === 'draft-toggle-panel')!
      await panelToggle.setValue(true)
      expect(getVm(wrapper).store.includePreview).toBe(true)
    })
  })

  describe('Page Types Section', () => {
    it('shows empty state when no page types configured', () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.pageTypes = []
      expect(wrapper.text()).toContain('No page types configured yet')
    })

    it('does not show Add button when input is empty', () => {
      const wrapper = mount(ApiConfiguration)
      const buttons = wrapper.findAllComponents(Btn)
      const hasAddButton = buttons.some((btn) => btn.text() === 'Add')
      expect(hasAddButton).toBe(false)
    })

    it('shows Add button when page type input has value', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).pageTypeInput = 'landing_page'
      await wrapper.vm.$nextTick()
      const buttons = wrapper.findAllComponents(Btn)
      const addButton = buttons.find((btn) => btn.text() === 'Add')!
      expect(addButton.exists()).toBe(true)
    })

    it('adds page type to store when form is submitted', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.pageTypes = []
      getVm(wrapper).pageTypeInput = 'landing_page'
      await wrapper.vm.$nextTick()
      const form = wrapper.findAll('form')[0]!
      await form.trigger('submit')
      expect(getVm(wrapper).store.pageTypes).toContain('landing_page')
    })

    it('clears input after adding page type', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).pageTypeInput = 'landing_page'
      await wrapper.vm.$nextTick()
      const form = wrapper.findAll('form')[0]!
      await form.trigger('submit')
      expect(getVm(wrapper).pageTypeInput).toBe('')
    })

    it('trims whitespace when adding page type', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.pageTypes = []
      getVm(wrapper).pageTypeInput = '  landing_page  '
      await wrapper.vm.$nextTick()
      const form = wrapper.findAll('form')[0]!
      await form.trigger('submit')
      expect(getVm(wrapper).store.pageTypes).toContain('landing_page')
      expect(getVm(wrapper).store.pageTypes).not.toContain('  landing_page  ')
    })

    it('does not add duplicate page types', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.pageTypes = ['landing_page']
      getVm(wrapper).pageTypeInput = 'landing_page'
      await wrapper.vm.$nextTick()
      const form = wrapper.findAll('form')[0]!
      await form.trigger('submit')
      expect(getVm(wrapper).store.pageTypes.length).toBe(1)
    })

    it('does not add empty page type', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.pageTypes = []
      getVm(wrapper).pageTypeInput = '   '
      await wrapper.vm.$nextTick()
      const form = wrapper.findAll('form')[0]!
      await form.trigger('submit')
      expect(getVm(wrapper).store.pageTypes.length).toBe(0)
    })

    it('displays page types as chips', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.pageTypes = ['landing_page', 'product_page']
      await wrapper.vm.$nextTick()
      const chips = wrapper.findAllComponents(Chip)
      expect(chips.length).toBeGreaterThanOrEqual(2)
    })

    it('removes page type when chip remove is clicked', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.pageTypes = ['landing_page', 'product_page']
      await wrapper.vm.$nextTick()
      const chips = wrapper.findAllComponents(Chip)
      const landingChip = chips.find((chip) => chip.text().includes('landing_page'))!
      await landingChip.vm.$emit('remove')
      expect(getVm(wrapper).store.pageTypes).not.toContain('landing_page')
      expect(getVm(wrapper).store.pageTypes).toContain('product_page')
    })

    it('hides empty state when page types are added', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.pageTypes = []
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('No page types configured yet')
      getVm(wrapper).store.pageTypes = ['landing_page']
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).not.toContain('No page types configured yet')
    })
  })

  describe('Collection Keys Section', () => {
    it('shows empty state when no collection keys configured', () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.collectionKeys = []
      expect(wrapper.text()).toContain('No collection keys configured yet')
    })

    it('shows Add button when collection key input has value', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).collectionKeyInput = 'recipes'
      await wrapper.vm.$nextTick()
      const buttons = wrapper.findAllComponents(Btn)
      const addButtons = buttons.filter((btn) => btn.text() === 'Add')
      expect(addButtons.length).toBeGreaterThan(0)
    })

    it('adds collection key to store when form is submitted', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.collectionKeys = []
      getVm(wrapper).collectionKeyInput = 'recipes'
      await wrapper.vm.$nextTick()
      const forms = wrapper.findAll('form')
      await forms[1]!.trigger('submit')
      expect(getVm(wrapper).store.collectionKeys).toContain('recipes')
    })

    it('clears input after adding collection key', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).collectionKeyInput = 'recipes'
      await wrapper.vm.$nextTick()
      const forms = wrapper.findAll('form')
      await forms[1]!.trigger('submit')
      expect(getVm(wrapper).collectionKeyInput).toBe('')
    })

    it('trims whitespace when adding collection key', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.collectionKeys = []
      getVm(wrapper).collectionKeyInput = '  recipes  '
      await wrapper.vm.$nextTick()
      const forms = wrapper.findAll('form')
      await forms[1]!.trigger('submit')
      expect(getVm(wrapper).store.collectionKeys).toContain('recipes')
      expect(getVm(wrapper).store.collectionKeys).not.toContain('  recipes  ')
    })

    it('does not add duplicate collection keys', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.collectionKeys = ['recipes']
      getVm(wrapper).collectionKeyInput = 'recipes'
      await wrapper.vm.$nextTick()
      const forms = wrapper.findAll('form')
      await forms[1]!.trigger('submit')
      expect(getVm(wrapper).store.collectionKeys.length).toBe(1)
    })

    it('does not add empty collection key', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.collectionKeys = []
      getVm(wrapper).collectionKeyInput = '   '
      await wrapper.vm.$nextTick()
      const forms = wrapper.findAll('form')
      await forms[1]!.trigger('submit')
      expect(getVm(wrapper).store.collectionKeys.length).toBe(0)
    })

    it('displays collection keys as chips', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.collectionKeys = ['recipes', 'products']
      await wrapper.vm.$nextTick()
      const chips = wrapper.findAllComponents(Chip)
      expect(chips.length).toBeGreaterThanOrEqual(2)
    })

    it('removes collection key when chip remove is clicked', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.collectionKeys = ['recipes', 'products']
      await wrapper.vm.$nextTick()
      const chips = wrapper.findAllComponents(Chip)
      const recipesChip = chips.find((chip) => chip.text().includes('recipes'))!
      await recipesChip.vm.$emit('remove')
      expect(getVm(wrapper).store.collectionKeys).not.toContain('recipes')
      expect(getVm(wrapper).store.collectionKeys).toContain('products')
    })

    it('hides empty state when collection keys are added', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.collectionKeys = []
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('No collection keys configured yet')
      getVm(wrapper).store.collectionKeys = ['recipes']
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).not.toContain('No collection keys configured yet')
    })
  })

  describe('Comma-Separated Values', () => {
    describe('Page Types', () => {
      it('adds multiple page types when separated by commas', async () => {
        const wrapper = mount(ApiConfiguration)
        getVm(wrapper).store.pageTypes = []
        getVm(wrapper).pageTypeInput = 'landing_page,product_page,about_page'
        await wrapper.vm.$nextTick()
        const form = wrapper.findAll('form')[0]!
        await form.trigger('submit')
        expect(getVm(wrapper).store.pageTypes).toContain('landing_page')
        expect(getVm(wrapper).store.pageTypes).toContain('product_page')
        expect(getVm(wrapper).store.pageTypes).toContain('about_page')
        expect(getVm(wrapper).store.pageTypes.length).toBe(3)
      })

      it('trims whitespace from each comma-separated page type', async () => {
        const wrapper = mount(ApiConfiguration)
        getVm(wrapper).store.pageTypes = []
        getVm(wrapper).pageTypeInput = '  landing_page  , product_page ,  about_page  '
        await wrapper.vm.$nextTick()
        const form = wrapper.findAll('form')[0]!
        await form.trigger('submit')
        expect(getVm(wrapper).store.pageTypes).toHaveLength(3)
        expect(getVm(wrapper).store.pageTypes).toEqual(
          expect.arrayContaining(['about_page', 'landing_page', 'product_page']),
        )
      })

      it('filters out empty values in comma-separated page types', async () => {
        const wrapper = mount(ApiConfiguration)
        getVm(wrapper).store.pageTypes = []
        getVm(wrapper).pageTypeInput = 'landing_page,,product_page,  ,about_page'
        await wrapper.vm.$nextTick()
        const form = wrapper.findAll('form')[0]!
        await form.trigger('submit')
        expect(getVm(wrapper).store.pageTypes).toHaveLength(3)
        expect(getVm(wrapper).store.pageTypes).toEqual(
          expect.arrayContaining(['about_page', 'landing_page', 'product_page']),
        )
      })

      it('does not add duplicate page types in comma-separated input', async () => {
        const wrapper = mount(ApiConfiguration)
        getVm(wrapper).store.pageTypes = ['landing_page']
        getVm(wrapper).pageTypeInput = 'landing_page,product_page,landing_page'
        await wrapper.vm.$nextTick()
        const form = wrapper.findAll('form')[0]!
        await form.trigger('submit')
        expect(getVm(wrapper).store.pageTypes).toEqual(['landing_page', 'product_page'])
        expect(getVm(wrapper).store.pageTypes.length).toBe(2)
      })

      it('handles mixed duplicates and new values in comma-separated input', async () => {
        const wrapper = mount(ApiConfiguration)
        getVm(wrapper).store.pageTypes = ['landing_page', 'contact_page']
        getVm(wrapper).pageTypeInput = 'landing_page,product_page,about_page,contact_page'
        await wrapper.vm.$nextTick()
        const form = wrapper.findAll('form')[0]!
        await form.trigger('submit')
        expect(getVm(wrapper).store.pageTypes).toContain('landing_page')
        expect(getVm(wrapper).store.pageTypes).toContain('contact_page')
        expect(getVm(wrapper).store.pageTypes).toContain('product_page')
        expect(getVm(wrapper).store.pageTypes).toContain('about_page')
        expect(getVm(wrapper).store.pageTypes.length).toBe(4)
      })

      it('clears input after adding comma-separated page types', async () => {
        const wrapper = mount(ApiConfiguration)
        getVm(wrapper).pageTypeInput = 'landing_page,product_page,about_page'
        await wrapper.vm.$nextTick()
        const form = wrapper.findAll('form')[0]!
        await form.trigger('submit')
        expect(getVm(wrapper).pageTypeInput).toBe('')
      })
    })

    describe('Collection Keys', () => {
      it('adds multiple collection keys when separated by commas', async () => {
        const wrapper = mount(ApiConfiguration)
        getVm(wrapper).store.collectionKeys = []
        getVm(wrapper).collectionKeyInput = 'recipes,articles,products'
        await wrapper.vm.$nextTick()
        const forms = wrapper.findAll('form')
        await forms[1]!.trigger('submit')
        expect(getVm(wrapper).store.collectionKeys).toContain('recipes')
        expect(getVm(wrapper).store.collectionKeys).toContain('articles')
        expect(getVm(wrapper).store.collectionKeys).toContain('products')
        expect(getVm(wrapper).store.collectionKeys.length).toBe(3)
      })

      it('trims whitespace from each comma-separated collection key', async () => {
        const wrapper = mount(ApiConfiguration)
        getVm(wrapper).store.collectionKeys = []
        getVm(wrapper).collectionKeyInput = '  recipes  , articles ,  products  '
        await wrapper.vm.$nextTick()
        const forms = wrapper.findAll('form')
        await forms[1]!.trigger('submit')
        expect(getVm(wrapper).store.collectionKeys).toHaveLength(3)
        expect(getVm(wrapper).store.collectionKeys).toEqual(
          expect.arrayContaining(['articles', 'products', 'recipes']),
        )
      })

      it('filters out empty values in comma-separated collection keys', async () => {
        const wrapper = mount(ApiConfiguration)
        getVm(wrapper).store.collectionKeys = []
        getVm(wrapper).collectionKeyInput = 'recipes,,articles,  ,products'
        await wrapper.vm.$nextTick()
        const forms = wrapper.findAll('form')
        await forms[1]!.trigger('submit')
        expect(getVm(wrapper).store.collectionKeys).toHaveLength(3)
        expect(getVm(wrapper).store.collectionKeys).toEqual(
          expect.arrayContaining(['articles', 'products', 'recipes']),
        )
      })

      it('does not add duplicate collection keys in comma-separated input', async () => {
        const wrapper = mount(ApiConfiguration)
        getVm(wrapper).store.collectionKeys = ['recipes']
        getVm(wrapper).collectionKeyInput = 'recipes,articles,recipes'
        await wrapper.vm.$nextTick()
        const forms = wrapper.findAll('form')
        await forms[1]!.trigger('submit')
        expect(getVm(wrapper).store.collectionKeys).toHaveLength(2)
        expect(getVm(wrapper).store.collectionKeys).toEqual(
          expect.arrayContaining(['articles', 'recipes']),
        )
      })

      it('handles mixed duplicates and new values in comma-separated input', async () => {
        const wrapper = mount(ApiConfiguration)
        getVm(wrapper).store.collectionKeys = ['recipes', 'news']
        getVm(wrapper).collectionKeyInput = 'recipes,articles,products,news'
        await wrapper.vm.$nextTick()
        const forms = wrapper.findAll('form')
        await forms[1]!.trigger('submit')
        expect(getVm(wrapper).store.collectionKeys).toContain('recipes')
        expect(getVm(wrapper).store.collectionKeys).toContain('news')
        expect(getVm(wrapper).store.collectionKeys).toContain('articles')
        expect(getVm(wrapper).store.collectionKeys).toContain('products')
        expect(getVm(wrapper).store.collectionKeys.length).toBe(4)
      })

      it('clears input after adding comma-separated collection keys', async () => {
        const wrapper = mount(ApiConfiguration)
        getVm(wrapper).collectionKeyInput = 'recipes,articles,products'
        await wrapper.vm.$nextTick()
        const forms = wrapper.findAll('form')
        await forms[1]!.trigger('submit')
        expect(getVm(wrapper).collectionKeyInput).toBe('')
      })
    })
  })

  describe('Store Integration', () => {
    it('reads token from store', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = 'store_token_value'
      await wrapper.vm.$nextTick()
      const inputs = wrapper.findAllComponents(TextInput)
      const tokenInput = inputs.find((input) => input.props('id') === 'butter-api-token')!
      expect(tokenInput.props('modelValue')).toBe('store_token_value')
    })

    it('updates store when token is changed', async () => {
      const wrapper = mount(ApiConfiguration)
      const inputs = wrapper.findAllComponents(TextInput)
      const tokenInput = inputs.find((input) => input.props('id') === 'butter-api-token')!
      await tokenInput.vm.$emit('update:modelValue', 'new_token')
      expect(getVm(wrapper).store.token).toBe('new_token')
    })

    it('reads includePreview from store', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.includePreview = true
      await wrapper.vm.$nextTick()
      const panelToggle = wrapper
        .findAllComponents(Toggle)
        .find((t) => t.props('id') === 'draft-toggle-panel')!
      expect(panelToggle.props('modelValue')).toBe(true)
    })

    it('reads lockToken from store', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = 'test_token'
      getVm(wrapper).store.lockToken = true
      await wrapper.vm.$nextTick()
      const inputs = wrapper.findAllComponents(TextInput)
      const tokenInput = inputs.find((input) => input.props('id') === 'butter-api-token')!
      const inputElement = tokenInput.find('input')
      expect(inputElement.attributes('readonly')).toBeDefined()
    })

    it('reads pageTypes array from store', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.pageTypes = ['page1', 'page2', 'page3']
      await wrapper.vm.$nextTick()
      const chips = wrapper.findAllComponents(Chip)
      const chipTexts = chips.map((chip) => chip.text())
      expect(chipTexts.some((text) => text.includes('page1'))).toBe(true)
      expect(chipTexts.some((text) => text.includes('page2'))).toBe(true)
      expect(chipTexts.some((text) => text.includes('page3'))).toBe(true)
    })

    it('reads collectionKeys array from store', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.collectionKeys = ['col1', 'col2', 'col3']
      await wrapper.vm.$nextTick()
      const chips = wrapper.findAllComponents(Chip)
      const chipTexts = chips.map((chip) => chip.text())
      expect(chipTexts.some((text) => text.includes('col1'))).toBe(true)
      expect(chipTexts.some((text) => text.includes('col2'))).toBe(true)
      expect(chipTexts.some((text) => text.includes('col3'))).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('has proper section headings with h3 tags', () => {
      const wrapper = mount(ApiConfiguration)
      const headings = wrapper.findAll('h3')
      expect(headings.length).toBeGreaterThanOrEqual(2)
    })

    it('has Page Types heading', () => {
      const wrapper = mount(ApiConfiguration)
      const headings = wrapper.findAll('.api-config__section-title')
      const pageTypesHeading = headings.find((h) => h.text() === 'Page Types')!
      expect(pageTypesHeading.exists()).toBe(true)
    })

    it('has Collection Keys heading', () => {
      const wrapper = mount(ApiConfiguration)
      const headings = wrapper.findAll('.api-config__section-title')
      const collectionHeading = headings.find((h) => h.text() === 'Collection Keys')!
      expect(collectionHeading.exists()).toBe(true)
    })

    it('has proper label for token input', () => {
      const wrapper = mount(ApiConfiguration)
      const inputs = wrapper.findAllComponents(TextInput)
      const tokenInput = inputs.find((input) => input.props('id') === 'butter-api-token')!
      expect(tokenInput.exists()).toBe(true)
    })

    it('lock button has aria-label when locked', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = 'test_token'
      getVm(wrapper).store.lockToken = true
      await wrapper.vm.$nextTick()
      const lockButton = wrapper.find('.api-config__lock-button')
      expect(lockButton.attributes('aria-label')).toBe('Unlock token')
    })

    it('lock button has aria-label when unlocked', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = 'test_token'
      getVm(wrapper).store.lockToken = false
      await wrapper.vm.$nextTick()
      const lockButton = wrapper.find('.api-config__lock-button')
      expect(lockButton.attributes('aria-label')).toBe('Lock token')
    })

    it('lock button has title attribute when locked', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = 'test_token'
      getVm(wrapper).store.lockToken = true
      await wrapper.vm.$nextTick()
      const lockButton = wrapper.find('.api-config__lock-button')
      expect(lockButton.attributes('title')).toBe('Unlock token')
    })

    it('lock button has title attribute when unlocked', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = 'test_token'
      getVm(wrapper).store.lockToken = false
      await wrapper.vm.$nextTick()
      const lockButton = wrapper.find('.api-config__lock-button')
      expect(lockButton.attributes('title')).toBe('Lock token')
    })
  })

  describe('Form Buttons - Conditional Rendering', () => {
    it('does not show Add button for page types when input is empty', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).pageTypeInput = ''
      await wrapper.vm.$nextTick()

      const forms = wrapper.findAll('form')
      const pageTypeForm = forms[0]!
      const buttons = pageTypeForm.findAllComponents(Btn)
      expect(buttons.length).toBe(0)
    })

    it('shows Add button for page types when input has value', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).pageTypeInput = 'landing_page'
      await wrapper.vm.$nextTick()

      const forms = wrapper.findAll('form')
      const pageTypeForm = forms[0]!
      const buttons = pageTypeForm.findAllComponents(Btn)
      expect(buttons.length).toBe(1)
      expect(buttons[0].text()).toBe('Add')
    })

    it('does not show Add button for collections when input is empty', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).collectionKeyInput = ''
      await wrapper.vm.$nextTick()

      const forms = wrapper.findAll('form')
      const collectionForm = forms[1]!
      const buttons = collectionForm.findAllComponents(Btn)
      expect(buttons.length).toBe(0)
    })

    it('shows Add button for collections when input has value', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).collectionKeyInput = 'recipes'
      await wrapper.vm.$nextTick()

      const forms = wrapper.findAll('form')
      const collectionForm = forms[1]!
      const buttons = collectionForm.findAllComponents(Btn)
      expect(buttons.length).toBe(1)
      expect(buttons[0].text()).toBe('Add')
    })
  })

  describe('Known Components Section', () => {
    it('renders known components section heading', () => {
      const wrapper = mount(ApiConfiguration)
      expect(wrapper.text()).toContain('Components')
    })

    it('renders the known component TextInput', () => {
      const wrapper = mount(ApiConfiguration)
      const input = wrapper.find('#known-component-input')
      expect(input.exists()).toBe(true)
    })

    it('shows empty state message when no known components are configured', () => {
      const store = useStore()
      store.knownComponents = []

      const wrapper = mount(ApiConfiguration)
      expect(wrapper.text()).toContain('No known components configured yet')
    })

    it('does not show Add button when known component input is empty', () => {
      const wrapper = mount(ApiConfiguration)
      const forms = wrapper.findAll('form')
      const knownComponentForm = forms[2]!
      const buttons = knownComponentForm.findAllComponents(Btn)
      expect(buttons.length).toBe(0)
    })

    it('shows Add button when known component input has value', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).knownComponentInput = 'hero_banner'
      await wrapper.vm.$nextTick()

      const forms = wrapper.findAll('form')
      const knownComponentForm = forms[2]!
      const buttons = knownComponentForm.findAllComponents(Btn)
      expect(buttons.length).toBe(1)
      expect(buttons[0].text()).toBe('Add')
    })

    it('adds a known component on form submit', async () => {
      const store = useStore()
      store.knownComponents = []

      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).knownComponentInput = 'hero_banner'
      await wrapper.vm.$nextTick()

      const forms = wrapper.findAll('form')
      await forms[2]!.trigger('submit')
      await wrapper.vm.$nextTick()

      expect(store.knownComponents).toContain('hero_banner')
    })

    it('adds multiple components from comma-separated input', async () => {
      const store = useStore()
      store.knownComponents = []

      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).knownComponentInput = 'hero_banner, cta_block, testimonial'
      await wrapper.vm.$nextTick()

      const forms = wrapper.findAll('form')
      await forms[2]!.trigger('submit')
      await wrapper.vm.$nextTick()

      expect(store.knownComponents).toContain('hero_banner')
      expect(store.knownComponents).toContain('cta_block')
      expect(store.knownComponents).toContain('testimonial')
    })

    it('trims whitespace from component slugs', async () => {
      const store = useStore()
      store.knownComponents = []

      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).knownComponentInput = '  hero_banner  ,  cta_block  '
      await wrapper.vm.$nextTick()

      const forms = wrapper.findAll('form')
      await forms[2]!.trigger('submit')
      await wrapper.vm.$nextTick()

      expect(store.knownComponents).toContain('hero_banner')
      expect(store.knownComponents).toContain('cta_block')
    })

    it('does not add duplicate known components', async () => {
      const store = useStore()
      store.knownComponents = ['hero_banner']

      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).knownComponentInput = 'hero_banner'
      await wrapper.vm.$nextTick()

      const forms = wrapper.findAll('form')
      await forms[2]!.trigger('submit')
      await wrapper.vm.$nextTick()

      const heroCount = store.knownComponents.filter((c) => c === 'hero_banner').length
      expect(heroCount).toBe(1)
    })

    it('clears the input after adding a component', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).knownComponentInput = 'hero_banner'
      await wrapper.vm.$nextTick()

      const forms = wrapper.findAll('form')
      await forms[2]!.trigger('submit')
      await wrapper.vm.$nextTick()

      expect(getVm(wrapper).knownComponentInput).toBe('')
    })

    it('renders existing known components as chips', () => {
      const store = useStore()
      store.knownComponents = ['hero_banner', 'cta_block']

      const wrapper = mount(ApiConfiguration)
      const chips = wrapper.findAllComponents(Chip)
      const chipTexts = chips.map((c) => c.text())
      expect(chipTexts.some((t) => t.includes('hero_banner'))).toBe(true)
      expect(chipTexts.some((t) => t.includes('cta_block'))).toBe(true)
    })

    it('removes a known component when its chip is closed', async () => {
      const store = useStore()
      store.knownComponents = ['hero_banner', 'cta_block']

      const wrapper = mount(ApiConfiguration)
      await wrapper.vm.$nextTick()

      const chips = wrapper.findAllComponents(Chip)
      const heroBannerChip = chips.find((c) => c.text().includes('hero_banner'))!
      // Chip emits 'remove' from its internal button click
      await heroBannerChip.find('.chip__remove').trigger('click')
      await wrapper.vm.$nextTick()

      expect(store.knownComponents).not.toContain('hero_banner')
      expect(store.knownComponents).toContain('cta_block')
    })
  })

  describe('Example Configuration', () => {
    it('renders the example config block when token is empty', () => {
      const wrapper = mount(ApiConfiguration)
      const block = wrapper.find('.api-config__example')
      expect(block.exists()).toBe(true)
    })

    it('does not render the example config block when token is set', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.token = 'my_real_token'
      await wrapper.vm.$nextTick()
      const block = wrapper.find('.api-config__example')
      expect(block.exists()).toBe(false)
    })

    it('renders descriptive text inside the example block', () => {
      const wrapper = mount(ApiConfiguration)
      const text = wrapper.find('.api-config__example-text')
      expect(text.exists()).toBe(true)
      expect(text.text()).toContain('New to Butter CMS Utilities?')
    })

    it('renders a "Load Example Configuration" button', () => {
      const wrapper = mount(ApiConfiguration)
      const btn = wrapper.find('.api-config__example-btn')
      expect(btn.exists()).toBe(true)
      expect(btn.text()).toBe('Load Example Configuration')
    })

    it('sets store.token to the example token when clicked', async () => {
      const wrapper = mount(ApiConfiguration)
      await wrapper.find('.api-config__example-btn').trigger('click')
      expect(getVm(wrapper).store.token).toBe(EXAMPLE_TOKEN)
    })

    it('sets store.lockToken to true when clicked', async () => {
      const wrapper = mount(ApiConfiguration)
      await wrapper.find('.api-config__example-btn').trigger('click')
      expect(getVm(wrapper).store.lockToken).toBe(true)
    })

    it('adds example page types to store.pageTypes when clicked', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.pageTypes = []
      await wrapper.find('.api-config__example-btn').trigger('click')
      EXAMPLE_PAGE_TYPES.forEach((pt) => {
        expect(getVm(wrapper).store.pageTypes).toContain(pt)
      })
    })

    it('adds example collection keys to store.collectionKeys when clicked', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.collectionKeys = []
      await wrapper.find('.api-config__example-btn').trigger('click')
      EXAMPLE_COLLECTION_KEYS.forEach((ck) => {
        expect(getVm(wrapper).store.collectionKeys).toContain(ck)
      })
    })

    it('overwrites existing page types when loading example config', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.pageTypes = ['my_existing_type']
      await wrapper.find('.api-config__example-btn').trigger('click')
      expect(getVm(wrapper).store.pageTypes).not.toContain('my_existing_type')
      EXAMPLE_PAGE_TYPES.forEach((pt) => {
        expect(getVm(wrapper).store.pageTypes).toContain(pt)
      })
    })

    it('overwrites existing collection keys when loading example config', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.collectionKeys = ['my_existing_key']
      await wrapper.find('.api-config__example-btn').trigger('click')
      expect(getVm(wrapper).store.collectionKeys).not.toContain('my_existing_key')
      EXAMPLE_COLLECTION_KEYS.forEach((ck) => {
        expect(getVm(wrapper).store.collectionKeys).toContain(ck)
      })
    })

    it('sets page types to exactly the example values', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.pageTypes = ['some_other_type']
      await wrapper.find('.api-config__example-btn').trigger('click')
      expect(getVm(wrapper).store.pageTypes).toEqual(EXAMPLE_PAGE_TYPES)
    })

    it('sets collection keys to exactly the example values', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.collectionKeys = ['some_other_key']
      await wrapper.find('.api-config__example-btn').trigger('click')
      expect(getVm(wrapper).store.collectionKeys).toEqual(EXAMPLE_COLLECTION_KEYS)
    })

    it('hides example block after loading example config', async () => {
      const wrapper = mount(ApiConfiguration)
      await wrapper.find('.api-config__example-btn').trigger('click')
      await wrapper.vm.$nextTick()
      expect(wrapper.find('.api-config__example').exists()).toBe(false)
    })

    it.each(EXAMPLE_KNOWN_COMPONENTS)(
      'adds "%s" to store.knownComponents when clicked',
      async (component) => {
        const wrapper = mount(ApiConfiguration)
        getVm(wrapper).store.knownComponents = []
        await wrapper.find('.api-config__example-btn').trigger('click')
        expect(getVm(wrapper).store.knownComponents).toContain(component)
      },
    )

    it('overwrites existing known components when loading example config', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.knownComponents = ['my_existing_component']
      await wrapper.find('.api-config__example-btn').trigger('click')
      expect(getVm(wrapper).store.knownComponents).not.toContain('my_existing_component')
      EXAMPLE_KNOWN_COMPONENTS.forEach((c) => {
        expect(getVm(wrapper).store.knownComponents).toContain(c)
      })
    })

    it('sets known components to exactly the example values', async () => {
      const wrapper = mount(ApiConfiguration)
      getVm(wrapper).store.knownComponents = [...EXAMPLE_KNOWN_COMPONENTS]
      await wrapper.find('.api-config__example-btn').trigger('click')
      expect(getVm(wrapper).store.knownComponents).toEqual(EXAMPLE_KNOWN_COMPONENTS)
    })
  })
})
