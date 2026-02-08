import type { Butter } from '@/types'

/** Fetch generic data with retry logic */
export async function fetchWithRetry<T>(url: string, maxRetries = 3): Promise<Butter.Response<T>> {
  let lastError: Error | null = null
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
      }
    }
  }
  throw lastError
}
