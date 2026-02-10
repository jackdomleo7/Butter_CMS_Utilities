import { ref, watch, computed } from 'vue'
import { defineStore } from 'pinia'

export const useStore = defineStore('store', () => {
  // Initialize config from localStorage or default object
  const config = ref<{
    token: string
    lockToken: boolean
    includePreview: boolean
    pageTypes: string[]
    collectionKeys: string[]
    selectedScopes: {
      blog: boolean
      pageTypes: string[]
      collectionKeys: string[]
    }
  }>(
    (() => {
      const stored = localStorage.getItem('butter_cms_config')
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch {
          console.warn('Failed to parse stored config, using defaults')
        }
      }
      return {
        token: '',
        lockToken: false,
        includePreview: false,
        pageTypes: [],
        collectionKeys: [],
        selectedScopes: {
          blog: false,
          pageTypes: [],
          collectionKeys: [],
        },
      }
    })(),
  )

  // Create computed properties for individual access
  const token = computed({
    get: () => config.value.token,
    set: (val: string) => {
      config.value.token = val
    },
  })

  const lockToken = computed({
    get: () => config.value.lockToken,
    set: (val: boolean) => {
      config.value.lockToken = val
    },
  })

  const includePreview = computed({
    get: () => config.value.includePreview,
    set: (val: boolean) => {
      config.value.includePreview = val
    },
  })

  const pageTypes = computed({
    get: () => config.value.pageTypes ?? [],
    set: (val: string[]) => {
      config.value.pageTypes = val
    },
  })

  const collectionKeys = computed({
    get: () => config.value.collectionKeys ?? [],
    set: (val: string[]) => {
      config.value.collectionKeys = val
    },
  })

  const selectedScopes = computed({
    get: () => config.value.selectedScopes ?? { blog: false, pageTypes: [], collectionKeys: [] },
    set: (val: { blog: boolean; pageTypes: string[]; collectionKeys: string[] }) => {
      config.value.selectedScopes = val
    },
  })

  // Watch for config changes and save to localStorage
  watch(
    config,
    (newConfig) => {
      localStorage.setItem('butter_cms_config', JSON.stringify(newConfig))
    },
    { deep: true },
  )

  // Watch for changes in pageTypes and collectionKeys to clean up selectedScopes
  watch(
    () => ({ pageTypes: config.value.pageTypes, collectionKeys: config.value.collectionKeys }),
    (newValues) => {
      const cleanedPageTypes = config.value.selectedScopes.pageTypes.filter((pt) =>
        newValues.pageTypes.includes(pt),
      )
      const cleanedCollectionKeys = config.value.selectedScopes.collectionKeys.filter((ck) =>
        newValues.collectionKeys.includes(ck),
      )

      if (
        cleanedPageTypes.length !== config.value.selectedScopes.pageTypes.length ||
        cleanedCollectionKeys.length !== config.value.selectedScopes.collectionKeys.length
      ) {
        config.value.selectedScopes = {
          ...config.value.selectedScopes,
          pageTypes: cleanedPageTypes,
          collectionKeys: cleanedCollectionKeys,
        }
      }
    },
  )

  return { token, lockToken, includePreview, pageTypes, collectionKeys, selectedScopes }
})
