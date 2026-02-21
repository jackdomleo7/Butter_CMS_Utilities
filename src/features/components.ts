import type { Butter } from '@/types'
import { getAllPages } from '@/core/pages'

export interface ComponentUsage {
  title: string
  slug: string
  pageType: string
  status: 'published' | 'draft' | 'scheduled' | undefined
}

export interface ComponentResult {
  componentSlug: string
  usageCount: number
  usages: ComponentUsage[]
}

export interface ComponentsResponse {
  success: boolean
  results: ComponentResult[]
  totalScanned: number
  failedScopes?: string[]
  error?: string
}

const MAX_DEPTH = 20

/**
 * Recursively walk a JSON tree to count how many times each known component slug appears.
 * Component slugs are matched in two ways:
 *  1. As object keys in `fields` (permanent components permanently added to a page type)
 *  2. As the value of a `type` field inside an object (Butter CMS Component Picker)
 */
function walkJson(
  node: unknown,
  slugSet: Set<string>,
  counts: Map<string, number>,
  visited: WeakSet<object>,
  depth: number,
): void {
  if (depth > MAX_DEPTH) return
  if (node === null || node === undefined) return

  if (Array.isArray(node)) {
    for (const item of node) {
      walkJson(item, slugSet, counts, visited, depth + 1)
    }
    return
  }

  if (typeof node === 'object') {
    if (visited.has(node as object)) return
    visited.add(node as object)

    const obj = node as Record<string, unknown>

    // Strategy 1: check if any key matches a component slug
    for (const key of Object.keys(obj)) {
      if (slugSet.has(key)) {
        counts.set(key, (counts.get(key) ?? 0) + 1)
      }
    }

    // Strategy 2: check if this object has a `type` field matching a component slug
    if (typeof obj['type'] === 'string' && slugSet.has(obj['type'])) {
      counts.set(obj['type'], (counts.get(obj['type']) ?? 0) + 1)
    }

    // Recurse into all values
    for (const value of Object.values(obj)) {
      walkJson(value, slugSet, counts, visited, depth + 1)
    }
  }
}

/**
 * Audit component usage across selected page types.
 * Returns, for each known component, how many times it appears and on which pages.
 */
export async function auditComponents(
  token: string,
  preview: boolean,
  selectedPageTypes: string[],
  knownComponents: string[],
): Promise<ComponentsResponse> {
  if (!token) {
    return { success: false, results: [], totalScanned: 0, error: 'No API token provided' }
  }

  if (knownComponents.length === 0) {
    return {
      success: false,
      results: [],
      totalScanned: 0,
      error: 'No known components configured',
    }
  }

  if (selectedPageTypes.length === 0) {
    return {
      success: false,
      results: [],
      totalScanned: 0,
      error: 'No page types selected',
    }
  }

  const slugSet = new Set(knownComponents)
  // Map: componentSlug -> list of pages where it appears
  const usageMap = new Map<string, ComponentUsage[]>()
  for (const slug of knownComponents) {
    usageMap.set(slug, [])
  }

  const failedScopes: string[] = []
  let totalScanned = 0

  for (const pageType of selectedPageTypes) {
    let pages: Butter.Page[]
    try {
      pages = await getAllPages({ token, preview, pageType })
    } catch {
      failedScopes.push(pageType)
      continue
    }

    for (const page of pages) {
      totalScanned++

      const counts = new Map<string, number>()
      const visited = new WeakSet<object>()
      walkJson(page.fields, slugSet, counts, visited, 0)

      if (counts.size > 0) {
        const usage: ComponentUsage = {
          title: (page as Butter.Page).name ?? page.slug,
          slug: page.slug,
          pageType,
          status: page.status,
        }

        for (const [componentSlug, count] of counts.entries()) {
          if (count > 0) {
            const existingUsages = usageMap.get(componentSlug) ?? []
            // Store one entry per page (the count per page is folded into a single entry)
            existingUsages.push(usage)
            usageMap.set(componentSlug, existingUsages)
          }
        }
      }

      // Yield to the main thread between pages to avoid blocking during large crawls
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
    }
  }

  const results: ComponentResult[] = knownComponents.map((componentSlug) => {
    const usages = usageMap.get(componentSlug) ?? []
    return {
      componentSlug,
      usageCount: usages.length,
      usages,
    }
  })

  // Sort: 0-usage components first, then ascending by usage count
  results.sort((a, b) => a.usageCount - b.usageCount)

  return {
    success: true,
    results,
    totalScanned,
    failedScopes: failedScopes.length > 0 ? failedScopes : undefined,
  }
}
