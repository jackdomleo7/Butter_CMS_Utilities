import type { Butter } from '@/types'
import { fetchWithRetry } from './fetch'

/**
 * Get all collections of a specific type from ButterCMS with automatic pagination handling
 */
export async function getAllCollections(config: {
  token: string
  preview: boolean
  collectionType: string
}): Promise<Butter.Collection[]> {
  const allItems: Butter.Collection[] = []

  let page = 1
  let hasMore = true
  while (hasMore) {
    const url = `https://api.buttercms.com/v2/content/${config.collectionType}/?auth_token=${config.token}&page=${page}&page_size=100&levels=5&alt_media_text=1${config.preview ? '&preview=1' : ''}`

    try {
      const data = await fetchWithRetry<{
        [key: typeof config.collectionType]: Butter.Collection[]
      }>(url)

      if (
        data.data &&
        Array.isArray(data.data[config.collectionType]) &&
        data.data[config.collectionType]!.length > 0
      ) {
        allItems.push(...data.data[config.collectionType]!)
        hasMore = data.meta?.next_page !== null
        page++
      } else {
        hasMore = false
      }
    } catch (error) {
      throw new Error(
        `Failed to fetch collection ${config.collectionType}: ${(error as Error).message}`,
      )
    }
  }

  return allItems
}
