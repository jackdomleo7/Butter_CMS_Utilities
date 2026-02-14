import { getAllPages } from '@/core/pages'
import { getAllPosts } from '@/core/posts'
import { getAllCollections } from '@/core/collections'

interface SearchResponse {
  success: boolean
  results: Array<{
    title: string
    slug: string
    sourceType?: string
    matches: Array<{ path: string; value: string; count: number }>
  }>
  totalItems: number | null
  failedScopes?: string[]
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
  searchString: string,
  token: string,
  preview: boolean,
  selectedPageTypes: string[],
  selectedCollectionKeys: string[],
  includeBlog: boolean,
  negate: boolean = false,
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

  // Validate that at least one search scope is selected
  if (!includeBlog && selectedPageTypes.length === 0 && selectedCollectionKeys.length === 0) {
    return {
      success: false,
      results: [],
      totalItems: null,
      error: 'Please select at least one search scope (Blog, Page Type, or Collection Key)',
    }
  }

  const searchLower = trimmedSearch.toLowerCase()

  const failedScopes: string[] = []
  let hasAnySuccessfulScope = false

  try {
    const searchResults: Array<{
      title: string
      slug: string
      sourceType?: string
      matches: Array<{ path: string; value: string; count: number }>
    }> = []

    // Build items with source type tracking
    const itemsWithSource: Array<{ data: unknown; sourceType: string }> = []

    // Search pages if any page types are selected
    if (selectedPageTypes.length > 0) {
      for (const pageType of selectedPageTypes) {
        try {
          const pages = await getAllPages({ token, pageType, preview })
          pages.forEach((page) => {
            itemsWithSource.push({ data: page, sourceType: pageType })
          })
          hasAnySuccessfulScope = true
        } catch (error) {
          console.error(`Failed to fetch page type "${pageType}":`, error)
          failedScopes.push(`Page Type: ${pageType}`)
        }
      }
    }

    // Search blog posts if enabled
    if (includeBlog) {
      try {
        const posts = await getAllPosts({ token, preview })
        posts.forEach((post) => {
          itemsWithSource.push({ data: post, sourceType: 'Blog' })
        })
        hasAnySuccessfulScope = true
      } catch (error) {
        console.error('Failed to fetch Blog posts:', error)
        failedScopes.push('Blog')
      }
    }

    // Search collections if any collection keys are selected
    if (selectedCollectionKeys.length > 0) {
      for (const collectionKey of selectedCollectionKeys) {
        try {
          const collections = await getAllCollections({
            token,
            collectionType: collectionKey,
            preview,
          })
          collections.forEach((collection) => {
            itemsWithSource.push({ data: collection, sourceType: collectionKey })
          })
          hasAnySuccessfulScope = true
        } catch (error) {
          console.error(`Failed to fetch collection "${collectionKey}":`, error)
          failedScopes.push(`Collection: ${collectionKey}`)
        }
      }
    }

    // If all scopes failed, return error
    if (!hasAnySuccessfulScope) {
      return {
        success: false,
        results: [],
        totalItems: null,
        failedScopes,
        error: `Failed to fetch all selected scopes. Check console for details.`,
      }
    }

    for (const { data: itemData, sourceType } of itemsWithSource) {
      const matchMap = searchObject(itemData, searchLower)
      const hasMatches = matchMap.size > 0

      // When negating: include items WITHOUT matches. When not negating: include items WITH matches
      if (hasMatches === !negate) {
        const item = itemData as Record<string, unknown>

        // When negating, we don't show any matches since we're looking for items that DON'T contain the term
        if (negate) {
          searchResults.push({
            title:
              (item.name as string) ||
              (item.title as string) ||
              (item.slug as string) ||
              'Untitled',
            slug: (item.slug as string) || 'N/A',
            sourceType: sourceType,
            matches: [],
          })
        } else {
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
              sourceType: sourceType,
              matches: validMatches,
            })
          }
        }
      }
    }

    searchResults.sort((a, b) => a.slug.localeCompare(b.slug))
    return {
      success: true,
      results: searchResults,
      totalItems: itemsWithSource.length,
      failedScopes: failedScopes.length > 0 ? failedScopes : undefined,
    }
  } catch (error) {
    return {
      success: false,
      results: [],
      totalItems: null,
      failedScopes,
      error: (error as Error).message,
    }
  }
}
