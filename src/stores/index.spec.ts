import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useStore } from './index'

describe('useStore', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()

    // Create fresh Pinia instance
    setActivePinia(createPinia())

    // Spy on console.warn
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  describe('Initialization', () => {
    it('should initialize with default values when localStorage is empty', () => {
      const store = useStore()

      expect(store.token).toBe('')
      expect(store.lockToken).toBe(false)
      expect(store.includePreview).toBe(false)
      expect(store.pageTypes).toEqual([])
      expect(store.collectionKeys).toEqual([])
      expect(store.selectedScopes).toEqual({
        blog: false,
        pageTypes: [],
        collectionKeys: [],
      })
    })

    it('should load from localStorage when available', () => {
      const mockConfig = {
        token: 'test-token',
        lockToken: true,
        includePreview: true,
        pageTypes: ['landing_page'],
        collectionKeys: ['products'],
        selectedScopes: {
          blog: true,
          pageTypes: ['landing_page'],
          collectionKeys: ['products'],
        },
      }

      localStorage.setItem('butter_cms_config', JSON.stringify(mockConfig))

      // Create new pinia to force re-initialization
      setActivePinia(createPinia())
      const store = useStore()

      expect(store.token).toBe('test-token')
      expect(store.lockToken).toBe(true)
      expect(store.includePreview).toBe(true)
      expect(store.pageTypes).toEqual(['landing_page'])
      expect(store.collectionKeys).toEqual(['products'])
      expect(store.selectedScopes).toEqual({
        blog: true,
        pageTypes: ['landing_page'],
        collectionKeys: ['products'],
      })
    })

    it('should use defaults when localStorage contains invalid JSON', () => {
      localStorage.setItem('butter_cms_config', 'invalid json')

      setActivePinia(createPinia())
      const store = useStore()

      expect(store.token).toBe('')
      expect(consoleWarnSpy).toHaveBeenCalledWith('Failed to parse stored config, using defaults')
    })
  })

  describe('Token Management', () => {
    it('should update token', () => {
      const store = useStore()

      store.token = 'new-token'

      expect(store.token).toBe('new-token')
    })

    it('should persist token to localStorage', async () => {
      const store = useStore()

      store.token = 'persisted-token'

      // Wait for watch to trigger
      await new Promise((resolve) => setTimeout(resolve, 0))

      const stored = JSON.parse(localStorage.getItem('butter_cms_config')!)
      expect(stored.token).toBe('persisted-token')
    })

    it('should update lockToken', () => {
      const store = useStore()

      store.lockToken = true

      expect(store.lockToken).toBe(true)
    })

    it('should toggle lockToken', () => {
      const store = useStore()

      expect(store.lockToken).toBe(false)
      store.lockToken = true
      expect(store.lockToken).toBe(true)
      store.lockToken = false
      expect(store.lockToken).toBe(false)
    })
  })

  describe('Preview Management', () => {
    it('should update includePreview', () => {
      const store = useStore()

      store.includePreview = true

      expect(store.includePreview).toBe(true)
    })

    it('should toggle includePreview', () => {
      const store = useStore()

      expect(store.includePreview).toBe(false)
      store.includePreview = true
      expect(store.includePreview).toBe(true)
      store.includePreview = false
      expect(store.includePreview).toBe(false)
    })
  })

  describe('Page Types Management', () => {
    it('should add page types', () => {
      const store = useStore()

      store.pageTypes = ['landing_page', 'article']

      expect(store.pageTypes).toEqual(['landing_page', 'article'])
    })

    it('should remove page types', () => {
      const store = useStore()

      store.pageTypes = ['landing_page', 'article']
      store.pageTypes = ['landing_page']

      expect(store.pageTypes).toEqual(['landing_page'])
    })

    it('should clear page types', () => {
      const store = useStore()

      store.pageTypes = ['landing_page']
      store.pageTypes = []

      expect(store.pageTypes).toEqual([])
    })
  })

  describe('Collection Keys Management', () => {
    it('should add collection keys', () => {
      const store = useStore()

      store.collectionKeys = ['products', 'customers']

      expect(store.collectionKeys).toEqual(['products', 'customers'])
    })

    it('should remove collection keys', () => {
      const store = useStore()

      store.collectionKeys = ['products', 'customers']
      store.collectionKeys = ['products']

      expect(store.collectionKeys).toEqual(['products'])
    })

    it('should clear collection keys', () => {
      const store = useStore()

      store.collectionKeys = ['products']
      store.collectionKeys = []

      expect(store.collectionKeys).toEqual([])
    })
  })

  describe('Selected Scopes Management', () => {
    it('should update blog scope', () => {
      const store = useStore()

      store.selectedScopes = {
        blog: true,
        pageTypes: [],
        collectionKeys: [],
      }

      expect(store.selectedScopes.blog).toBe(true)
    })

    it('should update selected page types', () => {
      const store = useStore()

      store.selectedScopes = {
        blog: false,
        pageTypes: ['landing_page'],
        collectionKeys: [],
      }

      expect(store.selectedScopes.pageTypes).toEqual(['landing_page'])
    })

    it('should update selected collection keys', () => {
      const store = useStore()

      store.selectedScopes = {
        blog: false,
        pageTypes: [],
        collectionKeys: ['products'],
      }

      expect(store.selectedScopes.collectionKeys).toEqual(['products'])
    })

    it('should update all selected scopes together', () => {
      const store = useStore()

      store.selectedScopes = {
        blog: true,
        pageTypes: ['landing_page', 'article'],
        collectionKeys: ['products'],
      }

      expect(store.selectedScopes).toEqual({
        blog: true,
        pageTypes: ['landing_page', 'article'],
        collectionKeys: ['products'],
      })
    })
  })

  describe('Scope Cleanup', () => {
    it('should remove selected page types when page types are removed', async () => {
      const store = useStore()

      // Set up initial state
      store.pageTypes = ['landing_page', 'article']
      store.selectedScopes = {
        blog: false,
        pageTypes: ['landing_page', 'article'],
        collectionKeys: [],
      }

      // Wait for initial watch to complete
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Remove one page type
      store.pageTypes = ['landing_page']

      // Wait for watch to trigger
      await new Promise((resolve) => setTimeout(resolve, 0))

      // Selected scopes should be cleaned up
      expect(store.selectedScopes.pageTypes).toEqual(['landing_page'])
    })

    it('should remove selected collection keys when collection keys are removed', async () => {
      const store = useStore()

      // Set up initial state
      store.collectionKeys = ['products', 'customers']
      store.selectedScopes = {
        blog: false,
        pageTypes: [],
        collectionKeys: ['products', 'customers'],
      }

      await new Promise((resolve) => setTimeout(resolve, 0))

      // Remove one collection key
      store.collectionKeys = ['products']

      await new Promise((resolve) => setTimeout(resolve, 0))

      // Selected scopes should be cleaned up
      expect(store.selectedScopes.collectionKeys).toEqual(['products'])
    })

    it('should clear selected scopes when all page types are removed', async () => {
      const store = useStore()

      store.pageTypes = ['landing_page']
      store.selectedScopes = {
        blog: false,
        pageTypes: ['landing_page'],
        collectionKeys: [],
      }

      await new Promise((resolve) => setTimeout(resolve, 0))

      store.pageTypes = []

      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(store.selectedScopes.pageTypes).toEqual([])
    })

    it('should preserve blog selection during cleanup', async () => {
      const store = useStore()

      store.pageTypes = ['landing_page', 'article']
      store.selectedScopes = {
        blog: true,
        pageTypes: ['landing_page', 'article'],
        collectionKeys: [],
      }

      await new Promise((resolve) => setTimeout(resolve, 0))

      store.pageTypes = ['landing_page']

      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(store.selectedScopes.blog).toBe(true)
      expect(store.selectedScopes.pageTypes).toEqual(['landing_page'])
    })
  })

  describe('LocalStorage Persistence', () => {
    it('should save all changes to localStorage', async () => {
      const store = useStore()

      store.token = 'test-token'
      store.lockToken = true
      store.includePreview = true
      store.pageTypes = ['landing_page']
      store.collectionKeys = ['products']
      store.selectedScopes = {
        blog: true,
        pageTypes: ['landing_page'],
        collectionKeys: ['products'],
      }

      await new Promise((resolve) => setTimeout(resolve, 0))

      const stored = JSON.parse(localStorage.getItem('butter_cms_config')!)
      expect(stored).toEqual({
        token: 'test-token',
        lockToken: true,
        includePreview: true,
        pageTypes: ['landing_page'],
        collectionKeys: ['products'],
        activeTabIndex: 0,
        selectedScopes: {
          blog: true,
          pageTypes: ['landing_page'],
          collectionKeys: ['products'],
        },
      })
    })

    it('should persist changes across store instances', async () => {
      const store1 = useStore()

      store1.token = 'persistent-token'

      await new Promise((resolve) => setTimeout(resolve, 0))

      // Create new Pinia instance (simulates page reload)
      setActivePinia(createPinia())
      const store2 = useStore()

      expect(store2.token).toBe('persistent-token')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      const store = useStore()

      store.token = ''

      expect(store.token).toBe('')
    })

    it('should handle undefined selected scopes gracefully', () => {
      // Simulate corrupted data without selectedScopes
      localStorage.setItem(
        'butter_cms_config',
        JSON.stringify({
          token: 'test',
          lockToken: false,
          includePreview: false,
          pageTypes: [],
          collectionKeys: [],
        }),
      )

      setActivePinia(createPinia())
      const store = useStore()

      // Should use defaults
      expect(store.selectedScopes).toEqual({
        blog: false,
        pageTypes: [],
        collectionKeys: [],
      })
    })

    it('should handle null pageTypes gracefully', () => {
      localStorage.setItem(
        'butter_cms_config',
        JSON.stringify({
          token: 'test',
          lockToken: false,
          includePreview: false,
          pageTypes: null,
          collectionKeys: [],
          selectedScopes: { blog: false, pageTypes: [], collectionKeys: [] },
        }),
      )

      setActivePinia(createPinia())
      const store = useStore()

      // Should return empty array for null
      expect(store.pageTypes).toEqual([])
    })
  })
})
