import type { Butter } from '@/types'
import { fetchWithRetry } from './fetch'

/**
 * Get all pages of a specific type from ButterCMS with automatic pagination handling
 */
export async function getAllPages(config: {
  token: string
  preview: boolean
  pageType: string
}): Promise<Butter.Page[]> {
  const allItems: Butter.Page[] = []

  let page = 1
  let hasMore = true
  while (hasMore) {
    const url = `https://api.buttercms.com/v2/pages/${config.pageType}/?auth_token=${config.token}&page=${page}&page_size=100&levels=5&alt_media_text=1${config.preview ? '&preview=1' : ''}`

    try {
      const data = await fetchWithRetry<Butter.Page[]>(url)

      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        allItems.push(...data.data)
        hasMore = data.meta?.next_page !== null
        page++
      } else {
        hasMore = false
      }
    } catch (error) {
      throw new Error(`Failed to fetch page ${config.pageType}: ${(error as Error).message}`)
    }
  }

  return allItems
}
