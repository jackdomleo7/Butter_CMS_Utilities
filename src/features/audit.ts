import { getAllPages } from '@/core/pages'
import { getAllPosts } from '@/core/posts'
import { getAllCollections } from '@/core/collections'

/**
 * Predefined patterns for detecting HTML bloat from various sources.
 * These patterns are commonly found in content copied from design tools,
 * word processors, and other applications without proper formatting cleanup.
 *
 * Prevention tip: Always paste content without formatting (Ctrl+Shift+V)
 * to avoid introducing these patterns in the first place.
 *
 * Remediation: Review each finding carefully. Depending on context, you may need to:
 * - Remove just the attribute (e.g., remove data-contrast="auto" but keep the element)
 * - Remove the attribute and its value (e.g., remove onclick="..." entirely)
 * - Remove the entire element if it serves no purpose
 * Always check surrounding HTML to understand the intent before removing anything.
 *
 * Sources:
 * - Microsoft Office: mso-, o:, w:st=, w:wrap, v:, paraid, data-contrast, data-fontsize
 * - Figma: figma, figmeta, data-figma-
 * - Google Docs: google-, docs-
 * - Rich text editors: data-pm-slice (ProseMirror, used by Evernote)
 * - Inline handlers: onclick, onload, onerror (security risk)
 * - Generic data attributes: data-*
 *
 * Related to GitHub issue #5
 */
export const UGLY_HTML_PATTERNS = [
  // Microsoft Office attributes
  'mso-',
  'paraid=',
  'paraeid=',
  'o:gfxdata=',
  'o:p',
  'w:st=',
  'w:wrap=',
  'w:wrap>',
  'v:shapes=',
  'v:imagedata',
  'xml:namespace',
  'xml:lang',
  'data-ccp',
  'data-contrast',
  'data-font',
  'data-listid',
  'data-leveltext',
  'data-defn-prop',

  // Figma attributes
  'figma=',
  'figmeta=',
  'data-figma',

  // Google Docs attributes
  'google-',
  'docs-',

  // ProseMirror rich text editor (used by Evernote and other note platforms)
  'data-pm',

  // Inline event handlers (security and maintenance concerns)
  'onclick=',
  'onload=',
  'onerror=',
  'onmouseover=',
  'onmouseout=',

  // Potentially problematic HTML elements (empty or commonly misused)
  'data-',
] as const

export type UglyHtmlPattern = (typeof UGLY_HTML_PATTERNS)[number]

/**
 * Automatically builds a map of generic patterns to their more specific variants.
 * A pattern is considered generic if other patterns start with it.
 * For example, 'data-' is generic because 'data-contrast', 'data-figma', etc. start with it.
 */
function buildGenericPatternMapping(patterns: readonly string[]): Record<string, string[]> {
  const mapping: Record<string, string[]> = {}

  for (const pattern of patterns) {
    const specifics: string[] = []

    // Find all patterns where this pattern is a prefix
    for (const otherPattern of patterns) {
      if (otherPattern !== pattern && otherPattern.startsWith(pattern)) {
        specifics.push(otherPattern)
      }
    }

    // If this pattern is a prefix of others, it's generic
    if (specifics.length > 0) {
      mapping[pattern] = specifics
    }
  }

  return mapping
}

/**
 * Map of generic fallback patterns to their more specific variants.
 * Automatically generated - when a specific pattern matches, the generic pattern
 * should not also count that same position.
 */
const GENERIC_PATTERN_SPECIFICS = buildGenericPatternMapping(UGLY_HTML_PATTERNS)

interface AuditResponse {
  success: boolean
  results: Array<{
    title: string
    slug: string
    sourceType: string
    issues: Array<{
      pattern: string
      path: string
      value: string
      count: number
    }>
  }>
  totalIssues: number
  patternsFound: string[]
  failedScopes?: string[]
  error?: string
}

interface MatchAccumulator {
  path: string
  snippets: string[]
  count: number
  positions?: number[] // Track match positions for deduplication
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

function searchObjectForPattern(
  obj: unknown,
  pattern: string,
  path = '',
  depth = 0,
  visited = new WeakSet(),
  excludedPositions?: Map<string, Set<number>>, // Positions to exclude for generic patterns
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
    const lowerNormalizedObj = normalizedObj.toLowerCase()
    const patternLower = pattern.toLowerCase()

    // Find all matches for this pattern
    let searchIndex = 0
    let occurrenceCount = 0
    const snippets: string[] = []
    const positions: number[] = []
    const pathKey = path || 'root'
    const excludedSet = excludedPositions?.get(pathKey)

    while ((searchIndex = lowerNormalizedObj.indexOf(patternLower, searchIndex)) !== -1) {
      // Skip this match if it's in an excluded position (already matched by specific pattern)
      if (excludedSet && excludedSet.has(searchIndex)) {
        searchIndex += patternLower.length
        continue
      }

      occurrenceCount++
      positions.push(searchIndex)

      // Limit snippets to first 3 occurrences to prevent bloat
      if (snippets.length < 3) {
        snippets.push(createContextSnippet(normalizedObj, searchIndex, patternLower.length))
      }

      searchIndex += patternLower.length
    }

    if (occurrenceCount > 0) {
      matchMap.set(pathKey, {
        path: pathKey,
        snippets,
        count: occurrenceCount,
        positions,
      })
    }
  } else if (typeof obj === 'number' || typeof obj === 'boolean') {
    const stringValue = String(obj)
    const patternLower = pattern.toLowerCase()
    if (stringValue.toLowerCase().includes(patternLower)) {
      matchMap.set(path || 'root', {
        path: path || 'root',
        snippets: [stringValue],
        count: 1,
      })
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const nestedMatches = searchObjectForPattern(
        item,
        pattern,
        `${path}[${index}]`,
        depth + 1,
        visited,
        excludedPositions,
      )
      nestedMatches.forEach((value, key) => {
        matchMap.set(key, value)
      })
    })
  } else if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const nestedMatches = searchObjectForPattern(
        value,
        pattern,
        path ? `${path}.${key}` : key,
        depth + 1,
        visited,
        excludedPositions,
      )
      nestedMatches.forEach((value, key) => {
        matchMap.set(key, value)
      })
    }
  }

  return matchMap
}

export async function auditContent(
  token: string,
  preview: boolean,
  selectedPageTypes: string[],
  selectedCollectionKeys: string[],
  includeBlog: boolean,
): Promise<AuditResponse> {
  // Validate that at least one scope is selected
  if (!includeBlog && selectedPageTypes.length === 0 && selectedCollectionKeys.length === 0) {
    return {
      success: false,
      results: [],
      totalIssues: 0,
      patternsFound: [],
      error: 'Please select at least one audit scope (Blog, Page Type, or Collection Key)',
    }
  }

  const failedScopes: string[] = []
  let hasAnySuccessfulScope = false
  const patternsFoundSet = new Set<string>()

  try {
    const auditResults: Array<{
      title: string
      slug: string
      sourceType: string
      issues: Array<{
        pattern: string
        path: string
        value: string
        count: number
      }>
    }> = []

    // Build items with source type tracking
    const itemsWithSource: Array<{ data: unknown; sourceType: string }> = []

    // Fetch pages if any page types are selected
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

    // Fetch blog posts if enabled
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

    // Fetch collections if any collection keys are selected
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
        totalIssues: 0,
        patternsFound: [],
        failedScopes,
        error: 'Failed to fetch all selected scopes. Check console for details.',
      }
    }

    // Audit each item for all patterns
    let totalIssuesCount = 0

    for (const { data: itemData, sourceType } of itemsWithSource) {
      const item = itemData as Record<string, unknown>
      const itemIssues: Array<{
        pattern: string
        path: string
        value: string
        count: number
      }> = []

      // First pass: Collect matches for all patterns and track positions for specific patterns
      const allMatches = new Map<string, Map<string, MatchAccumulator>>()
      const matchedPositions = new Map<string, Set<number>>() // path -> set of matched positions
      const genericPatterns = Object.keys(GENERIC_PATTERN_SPECIFICS)

      for (const pattern of UGLY_HTML_PATTERNS) {
        const isGeneric = genericPatterns.includes(pattern)

        // For generic patterns, skip the first pass - we'll do them in second pass with exclusions
        if (isGeneric) {
          continue
        }

        const matchMap = searchObjectForPattern(itemData, pattern)
        if (matchMap.size > 0) {
          allMatches.set(pattern, matchMap)

          // Track positions for specific patterns
          matchMap.forEach((acc, path) => {
            if (acc.positions) {
              if (!matchedPositions.has(path)) {
                matchedPositions.set(path, new Set())
              }
              const posSet = matchedPositions.get(path)!
              acc.positions.forEach((pos) => posSet.add(pos))
            }
          })
        }
      }

      // Second pass: Search generic patterns with position exclusions
      for (const genericPattern of genericPatterns) {
        const matchMap = searchObjectForPattern(
          itemData,
          genericPattern,
          '',
          0,
          new WeakSet(),
          matchedPositions,
        )
        if (matchMap.size > 0) {
          allMatches.set(genericPattern, matchMap)
        }
      }

      // Convert all matches to issues
      for (const [pattern, matchMap] of allMatches) {
        if (matchMap.size > 0) {
          patternsFoundSet.add(pattern)

          matchMap.forEach((acc) => {
            const issueCount = acc.count
            totalIssuesCount += issueCount

            itemIssues.push({
              pattern,
              path: acc.count > 1 ? `${acc.path} (${acc.count} occurrences)` : acc.path,
              value: acc.snippets[0] || '',
              count: acc.count,
            })
          })
        }
      }

      // Only add items that have issues
      if (itemIssues.length > 0) {
        auditResults.push({
          title:
            (item.name as string) || (item.title as string) || (item.slug as string) || 'Untitled',
          slug: (item.slug as string) || 'N/A',
          sourceType: sourceType,
          issues: itemIssues.sort((a, b) => {
            // Sort by pattern first, then by path
            const patternCompare = a.pattern.localeCompare(b.pattern)
            if (patternCompare !== 0) return patternCompare
            return a.path.localeCompare(b.path)
          }),
        })
      }
    }

    // Sort results by slug
    auditResults.sort((a, b) => a.slug.localeCompare(b.slug))

    return {
      success: true,
      results: auditResults,
      totalIssues: totalIssuesCount,
      patternsFound: Array.from(patternsFoundSet).sort(),
      failedScopes: failedScopes.length > 0 ? failedScopes : undefined,
    }
  } catch (error) {
    return {
      success: false,
      results: [],
      totalIssues: 0,
      patternsFound: [],
      failedScopes,
      error: (error as Error).message,
    }
  }
}
