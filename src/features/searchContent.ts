import { getAllPages } from '@/core/pages'
import { getAllPosts } from '@/core/posts'
import { getAllCollections } from '@/core/collections'

interface SearchResponse {
  success: boolean
  results: Array<{
    title: string
    slug: string
    matches: Array<{ path: string; value: string; count: number }>
  }>
  totalItems: number | null
  error?: string
}

interface MatchAccumulator {
  path: string
  snippets: string[]
  count: number
}

function normalizeWhitespace(str: string): string {
  return str
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
}

function createContextSnippet(
  normalizedText: string,
  matchIndex: number,
  matchLength: number,
  contextSize = 100,
): string {
  const contextStart = Math.max(0, matchIndex - contextSize)
  const contextEnd = Math.min(normalizedText.length, matchIndex + matchLength + contextSize)

  let snippet = normalizedText.substring(contextStart, contextEnd)

  if (contextStart > 0) snippet = '...' + snippet
  if (contextEnd < normalizedText.length) snippet = snippet + '...'

  return snippet
}

function searchObject(
  obj: unknown,
  searchLower: string,
  path = '',
  depth = 0,
  visited = new WeakSet(),
): Map<string, MatchAccumulator> {
  const matchMap = new Map<string, MatchAccumulator>()

  // Guard against excessive depth and circular references
  if (depth > 10) return matchMap
  if (obj === null || obj === undefined) return matchMap

  // Prevent circular reference issues
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    if (visited.has(obj as object)) return matchMap
    visited.add(obj as object)
  }

  if (typeof obj === 'string') {
    const normalizedObj = normalizeWhitespace(obj)
    const normalizedSearchLower = normalizeWhitespace(searchLower)
    const lowerNormalizedObj = normalizedObj.toLowerCase()

    // Find all matches in this string
    let searchIndex = 0
    let occurrenceCount = 0
    const snippets: string[] = []

    while ((searchIndex = lowerNormalizedObj.indexOf(normalizedSearchLower, searchIndex)) !== -1) {
      occurrenceCount++

      // Limit snippets to first 3 occurrences to prevent bloat
      if (snippets.length < 3) {
        snippets.push(
          createContextSnippet(normalizedObj, searchIndex, normalizedSearchLower.length),
        )
      }

      searchIndex += normalizedSearchLower.length
    }

    if (occurrenceCount > 0) {
      matchMap.set(path || 'root', {
        path: path || 'root',
        snippets,
        count: occurrenceCount,
      })
    }
  } else if (typeof obj === 'number' || typeof obj === 'boolean') {
    const stringValue = String(obj)
    if (stringValue.toLowerCase().includes(searchLower)) {
      matchMap.set(path || 'root', {
        path: path || 'root',
        snippets: [stringValue],
        count: 1,
      })
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const nestedMatches = searchObject(item, searchLower, `${path}[${index}]`, depth + 1, visited)
      nestedMatches.forEach((value, key) => {
        matchMap.set(key, value)
      })
    })
  } else if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const nestedMatches = searchObject(
        value,
        searchLower,
        path ? `${path}.${key}` : key,
        depth + 1,
        visited,
      )
      nestedMatches.forEach((value, key) => {
        matchMap.set(key, value)
      })
    }
  }

  return matchMap
}

export async function searchContent(
  scope: 'pages' | 'blog' | 'collections',
  searchString: string,
  token: string,
  preview: boolean,
  pageType?: string,
  collectionKey?: string,
): Promise<SearchResponse> {
  // Validate and normalize search input
  const trimmedSearch = searchString.trim()
  if (!trimmedSearch) {
    return {
      success: true,
      results: [],
      totalItems: 0,
    }
  }

  const searchLower = trimmedSearch.toLowerCase()

  try {
    let allItems: unknown[] = []

    if (scope === 'pages' && pageType) {
      allItems = await getAllPages({
        token,
        pageType,
        preview,
      })
    } else if (scope === 'blog') {
      allItems = await getAllPosts({
        token,
        preview,
      })
    } else if (scope === 'collections' && collectionKey) {
      allItems = await getAllCollections({
        token,
        collectionType: collectionKey,
        preview,
      })
    } else {
      throw new Error('Invalid search scope or missing required parameter')
    }

    const searchResults: Array<{
      title: string
      slug: string
      matches: Array<{ path: string; value: string; count: number }>
    }> = []

    for (const itemData of allItems) {
      const matchMap = searchObject(itemData, searchLower)

      if (matchMap.size > 0) {
        const item = itemData as Record<string, unknown>

        // Convert map to array of matches
        const matches = Array.from(matchMap.values()).map((acc) => {
          // For multiple occurrences, show count in path and use first snippet
          if (acc.count > 1) {
            return {
              path: `${acc.path} (${acc.count} occurrences)`,
              value: acc.snippets[0] || '',
              count: acc.count,
            }
          }
          // For single occurrence, return as-is
          return {
            path: acc.path,
            value: acc.snippets[0] || '',
            count: acc.count,
          }
        })

        const validMatches = matches.filter((m) => m.value && m.value.trim().length > 0)

        if (validMatches.length > 0) {
          searchResults.push({
            title:
              (item.name as string) ||
              (item.title as string) ||
              (item.slug as string) ||
              'Untitled',
            slug: (item.slug as string) || 'N/A',
            matches: validMatches,
          })
        }
      }
    }

    searchResults.sort((a, b) => a.slug.localeCompare(b.slug))
    return { success: true, results: searchResults, totalItems: allItems.length }
  } catch (error) {
    return {
      success: false,
      results: [],
      totalItems: null,
      error: (error as Error).message,
    }
  }
}
