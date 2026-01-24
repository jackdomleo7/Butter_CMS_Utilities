import { ref, watch, computed } from 'vue'
import { defineStore } from 'pinia'

export const useStore = defineStore('store', () => {
  // Initialize useLocalStorage from localStorage (defaults to true)
  const useLocalStorage = ref(localStorage.getItem('butter_cms_use_localstorage') !== 'false')

  // Initialize config from localStorage or default object (only if useLocalStorage is enabled)
  const config = ref(
    (() => {
      if (useLocalStorage.value) {
        const stored = localStorage.getItem('butter_cms_config')
        if (stored) {
          try {
            return JSON.parse(stored)
          } catch {
            console.warn('Failed to parse stored config, using defaults')
          }
        }
      }
      return { token: '', lockToken: false, includePreview: false }
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

  // Watch for useLocalStorage changes and save to localStorage
  watch(
    () => useLocalStorage.value,
    (newValue) => {
      localStorage.setItem('butter_cms_use_localstorage', String(newValue))
      if (!newValue) {
        localStorage.removeItem('butter_cms_config')
      }
    },
  )

  // Watch for config changes and save to localStorage (only if useLocalStorage is enabled)
  watch(
    config,
    (newConfig) => {
      if (useLocalStorage.value) {
        localStorage.setItem('butter_cms_config', JSON.stringify(newConfig))
      } else {
        localStorage.removeItem('butter_cms_config')
      }
    },
    { deep: true },
  )

  return { token, lockToken, includePreview, useLocalStorage }
})
