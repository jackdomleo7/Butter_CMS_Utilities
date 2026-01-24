import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

export const useStore = defineStore('store', () => {
  // Initialize token from localStorage or empty string
  const token = ref(localStorage.getItem('butter_cms_token') || '')

  // Initialize lock token state from localStorage (defaults to false)
  const lockToken = ref(localStorage.getItem('butter_cms_lock_token') === 'true')

  // Initialize preview mode from localStorage (defaults to false - published content only)
  const includePreview = ref(localStorage.getItem('butter_cms_include_preview') === 'true')

  // Watch for token changes and save to localStorage
  watch(
    () => token.value,
    (newValue) => {
      if (newValue) {
        localStorage.setItem('butter_cms_token', newValue)
      } else {
        localStorage.removeItem('butter_cms_token')
      }
    },
  )

  // Watch for lock token changes and save to localStorage
  watch(
    () => lockToken.value,
    (newValue) => {
      localStorage.setItem('butter_cms_lock_token', String(newValue))
    },
  )

  // Watch for preview mode changes and save to localStorage
  watch(
    () => includePreview.value,
    (newValue) => {
      localStorage.setItem('butter_cms_include_preview', String(newValue))
    },
  )

  return { token, lockToken, includePreview }
})
