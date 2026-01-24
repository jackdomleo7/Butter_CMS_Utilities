import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

export const useStore = defineStore('store', () => {
  // Initialize token from localStorage or empty string
  const token = ref(localStorage.getItem('butter_cms_token') || '')

  // Watch for changes and save to localStorage
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

  return { token }
})
