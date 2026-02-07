import type { Butter } from '@/types'
import { fetchWithRetry } from './fetch'

/**
 * Get all posts from ButterCMS with automatic pagination handling
 */
export async function getAllPosts(config: {
  token: string
  preview: boolean
}): Promise<Butter.Post[]> {
  const allItems: Butter.Post[] = []

  let page = 1
  let hasMore = true
  while (hasMore) {
    const url = `https://api.buttercms.com/v2/posts/?auth_token=${config.token}&page=${page}&page_size=100${config.preview ? '&preview=1' : ''}`

    try {
      const data = await fetchWithRetry<Butter.Post[]>(url)

      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        allItems.push(...data.data)
        hasMore = data.meta?.next_page !== null
        page++
      } else {
        hasMore = false
      }
    } catch (error) {
      throw new Error(`Failed to fetch posts: ${(error as Error).message}`)
    }
  }

  return allItems
}
