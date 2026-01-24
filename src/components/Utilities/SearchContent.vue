<template>
  <UtilitySection
    title="Search Content"
    description="Search through pages, blog posts, or collections for content matching your search term. Results will highlight exactly where matches were found."
  >
    <!-- Search Scope Selection -->
    <div class="search-content__scope-selection">
      <label class="search-content__scope-label">Search Scope</label>
      <div class="search-content__scope-options">
        <label class="search-content__radio-option">
          <input type="radio" v-model="searchScope" value="pages" :disabled="hasResults" />
          <span>Page Type</span>
        </label>
        <label class="search-content__radio-option">
          <input type="radio" v-model="searchScope" value="blog" :disabled="hasResults" />
          <span>Blog Posts</span>
        </label>
        <label class="search-content__radio-option">
          <input type="radio" v-model="searchScope" value="collections" :disabled="hasResults" />
          <span>Collection</span>
        </label>
      </div>
    </div>

    <!-- Conditional inputs based on scope -->
    <TextInput
      v-if="searchScope === 'pages'"
      id="search-content-page-type"
      type="text"
      :required="true"
      v-model="pageType"
    >
      <template v-slot:label>Page Type</template>
      <template v-slot:error v-if="showMissingPageTypeError">Please enter a page type</template>
    </TextInput>

    <TextInput
      v-if="searchScope === 'collections'"
      id="search-content-collection-key"
      type="text"
      :required="true"
      v-model="collectionKey"
    >
      <template v-slot:label>Collection Key</template>
      <template v-slot:error v-if="showMissingCollectionKeyError"
        >Please enter a collection key</template
      >
    </TextInput>

    <!-- Search Term -->
    <TextInput
      id="search-content-search-term"
      type="text"
      :required="true"
      v-model="searchTerm"
      @keypress.enter="executeSearch"
    >
      <template v-slot:label>Search Term</template>
      <template v-slot:error v-if="showMissingSearchTermError">Please enter a search term</template>
    </TextInput>

    <Btn @click="executeSearch" v-if="!hasResults" :disabled="isLoading">
      {{ isLoading ? 'Searching...' : 'Search' }}
    </Btn>

    <Btn v-if="hasResults || statusMessage" type="reset" status="secondary" @click="resetSearch">
      Reset
    </Btn>

    <InfoBanner v-if="statusMessage" class="status-message" :status="statusType" role="alert">
      <p v-if="isLoading" class="search-content__loading-text">{{ statusMessage }}</p>
      <div v-else>{{ statusMessage }}</div>
    </InfoBanner>

    <!-- Results -->
    <div v-if="results.length > 0" id="resultsContainer" class="search-content__results-container">
      <div class="search-content__summary">
        Found <strong>{{ results.length }}</strong>
        {{ pluralize(results.length, getScopeItemName(), getScopeItemNamePlural()) }} containing
        "<strong>{{ searchTerm }}</strong
        >" with <strong>{{ totalMatches }}</strong> total
        {{ pluralize(totalMatches, 'match', 'matches') }}
      </div>
      <div class="results-list">
        <div v-for="(result, index) in results" :key="index" class="search-content__result-item">
          <div class="search-content__result-header search-content__result-header--desktop">
            <div>
              <div class="search-content__result-title-wrapper">
                <Chip class="search-content__source-badge">{{ getScopeBadgeText() }}</Chip>
                <span class="search-content__result-title">{{ result.title }}</span>
              </div>
              <div class="search-content__result-slug">{{ result.slug }}</div>
            </div>
            <Chip
              >{{ getResultMatchCount(result) }}
              {{ pluralize(getResultMatchCount(result), 'match', 'matches') }}</Chip
            >
          </div>
          <div class="search-content__matches-list">
            <div
              v-for="(match, mIndex) in result.matches"
              :key="mIndex"
              class="search-content__match-item"
            >
              <div class="search-content__match-path">{{ match.path }}</div>
              <div
                class="search-content__match-value"
                v-html="highlightMatches(match.value, searchTerm)"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Failed items -->
    <div v-if="failedItems.length > 0" class="search-content__failed-items">
      <h4 class="search-content__failed-items-title">
        ⚠️ Failed to retrieve {{ failedItems.length }}
        {{ pluralize(failedItems.length, 'item', 'items') }}
      </h4>
      <p>Please check these manually:</p>
      <ul class="search-content__failed-items-list">
        <li v-for="(failed, index) in failedItems" :key="index">
          {{ failed.source }} {{ failed.page }}: {{ failed.error }}
        </li>
      </ul>
    </div>
  </UtilitySection>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useStore } from '@/stores/index'
import UtilitySection from '../UtilitySection.vue'
import TextInput from '../TextInput.vue'
import Btn from '../Btn.vue'
import InfoBanner from '../InfoBanner.vue'
import Chip from '../Chip.vue'

const store = useStore()
const searchScope = ref<'pages' | 'blog' | 'collections'>('pages')
const pageType = ref('')
const collectionKey = ref('')
const searchTerm = ref('')
const showMissingPageTypeError = ref(false)
const showMissingCollectionKeyError = ref(false)
const showMissingSearchTermError = ref(false)
const isLoading = ref(false)
const statusMessage = ref('')
const statusType = ref<'info' | 'success' | 'error' | 'warning'>('info')
const results = ref<Array<SearchResult>>([])
const failedItems = ref<Array<{ page: number; error: string; source: string }>>([])
const totalItems = ref(0)

const hasResults = computed(() => results.value.length > 0)

// Utility functions
function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}

function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

function normalizeWhitespace(str: string): string {
  // Replace &nbsp; HTML entity and non-breaking space character (U+00A0) with regular space
  return str.replace(/&nbsp;/gi, ' ').replace(/\u00A0/g, ' ')
}

function highlightMatches(text: string, searchTerm: string): string {
  const escapedText = escapeHtml(text)
  const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedSearchTerm})`, 'gi')
  return escapedText.replace(regex, '<mark>$1</mark>')
}

function resetSearch(): void {
  results.value = []
  failedItems.value = []
  statusMessage.value = ''
  pageType.value = ''
  collectionKey.value = ''
  searchTerm.value = ''
  showMissingPageTypeError.value = false
  showMissingCollectionKeyError.value = false
  showMissingSearchTermError.value = false
}

function setStatus(
  message: string,
  type: 'info' | 'success' | 'error' | 'warning' = 'info',
  loading = false,
): void {
  statusMessage.value = message
  statusType.value = type
  isLoading.value = loading
}

function getScopeItemName(): string {
  switch (searchScope.value) {
    case 'pages':
      return 'page'
    case 'blog':
      return 'blog post'
    case 'collections':
      return 'collection item'
    default:
      return 'item'
  }
}

function getScopeItemNamePlural(): string {
  switch (searchScope.value) {
    case 'pages':
      return 'pages'
    case 'blog':
      return 'blog posts'
    case 'collections':
      return 'collection items'
    default:
      return 'items'
  }
}

function getScopeBadgeText(): string {
  switch (searchScope.value) {
    case 'pages':
      return `Page (${pageType.value})`
    case 'blog':
      return 'Blog'
    case 'collections':
      return `Collection (${collectionKey.value})`
    default:
      return 'Unknown'
  }
}

// API functions
interface ButterCMSData {
  name?: string
  title?: string
  slug: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

interface ButterCMSApiResponse {
  data: ButterCMSData[] | ButterCMSData
  meta?: {
    next_page: number | null
  }
}

async function fetchWithRetry(url: string, maxRetries = 3): Promise<ButterCMSApiResponse> {
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

interface SearchResult {
  title: string
  slug: string
  matches: Array<{ path: string; value: string; count?: number }>
}

interface SearchResponse {
  results: SearchResult[]
  totalItems: number
  failedItems: Array<{ page: number; error: string; source: string }>
}

function searchObject(
  obj: unknown,
  searchLower: string,
  path = '',
  depth = 0,
): Array<{ path: string; value: string; count?: number }> {
  const matches: Array<{ path: string; value: string; count?: number }> = []

  if (depth > 10) return matches
  if (obj === null || obj === undefined) return matches

  if (typeof obj === 'string') {
    // Normalize whitespace in both the search term and the object string
    const normalizedObj = normalizeWhitespace(obj)
    const normalizedSearchLower = normalizeWhitespace(searchLower)
    const lowerNormalizedObj = normalizedObj.toLowerCase()

    // Count how many times the search term appears
    let occurrenceCount = 0
    let searchIndex = 0
    while ((searchIndex = lowerNormalizedObj.indexOf(normalizedSearchLower, searchIndex)) !== -1) {
      occurrenceCount++
      searchIndex += normalizedSearchLower.length
    }

    if (occurrenceCount > 0) {
      // Find the first occurrence to show context
      const firstMatchIndex = lowerNormalizedObj.indexOf(normalizedSearchLower)
      const contextStart = Math.max(0, firstMatchIndex - 100)
      const contextEnd = Math.min(obj.length, firstMatchIndex + normalizedSearchLower.length + 100)

      let snippet = obj.substring(contextStart, contextEnd)

      // Add ellipsis if we're not at the start/end
      if (contextStart > 0) snippet = '...' + snippet
      if (contextEnd < obj.length) snippet = snippet + '...'

      matches.push({
        path,
        value: snippet,
        count: occurrenceCount,
      })
    }
  } else if (typeof obj === 'number' || typeof obj === 'boolean') {
    const stringValue = String(obj)
    if (stringValue.toLowerCase().includes(searchLower)) {
      matches.push({
        path,
        value: stringValue,
        count: 1,
      })
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      matches.push(...searchObject(item, searchLower, `${path}[${index}]`, depth + 1))
    })
  } else if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      if (key === 'meta' || key === 'url' || key === 'href') continue
      matches.push(...searchObject(value, searchLower, path ? `${path}.${key}` : key, depth + 1))
    }
  }

  return matches
}

async function searchButterCMSPages(
  token: string,
  searchString: string,
  pageTypeParam: string,
): Promise<SearchResponse> {
  const baseUrl = 'https://api.buttercms.com/v2/pages'
  const allItems: ButterCMSData[] = []
  const failedItemsLocal: Array<{ page: number; error: string; source: string }> = []
  let page = 1
  let hasMore = true

  setStatus(`Fetching pages of type "${pageTypeParam}"...`, 'info', true)

  while (hasMore) {
    const url = `${baseUrl}/${pageTypeParam}/?auth_token=${token}&page=${page}&page_size=100`

    try {
      const data = await fetchWithRetry(url)

      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        allItems.push(...data.data)
        hasMore = data.meta?.next_page !== null
        page++
        setStatus(
          `Fetched ${allItems.length} ${pluralize(allItems.length, 'page', 'pages')} so far...`,
          'info',
          true,
        )
      } else {
        hasMore = false
      }
    } catch (error) {
      failedItemsLocal.push({ page, error: (error as Error).message, source: 'Page' })
      hasMore = false
    }
  }

  setStatus(
    `Searching through ${allItems.length} ${pluralize(allItems.length, 'page', 'pages')}...`,
    'info',
    true,
  )

  const searchLower = searchString.toLowerCase()
  const searchResults: SearchResult[] = []

  for (const itemData of allItems) {
    const matches = searchObject(itemData, searchLower)

    if (matches.length > 0) {
      const validMatches = matches.filter((m) => m.value && m.value.trim().length > 0)

      if (validMatches.length > 0) {
        searchResults.push({
          title: itemData.name || itemData.slug || 'Untitled',
          slug: itemData.slug,
          matches: validMatches,
        })
      }
    }
  }

  return { results: searchResults, totalItems: allItems.length, failedItems: failedItemsLocal }
}

async function searchButterCMSBlog(token: string, searchString: string): Promise<SearchResponse> {
  const baseUrl = 'https://api.buttercms.com/v2/posts'
  const allItems: ButterCMSData[] = []
  const failedItemsLocal: Array<{ page: number; error: string; source: string }> = []
  let page = 1
  let hasMore = true

  setStatus('Fetching blog posts...', 'info', true)

  while (hasMore) {
    const url = `${baseUrl}/?auth_token=${token}&page=${page}&page_size=100`

    try {
      const data = await fetchWithRetry(url)

      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        allItems.push(...data.data)
        hasMore = data.meta?.next_page !== null
        page++
        setStatus(
          `Fetched ${allItems.length} ${pluralize(allItems.length, 'blog post', 'blog posts')} so far...`,
          'info',
          true,
        )
      } else {
        hasMore = false
      }
    } catch (error) {
      failedItemsLocal.push({ page, error: (error as Error).message, source: 'Blog' })
      hasMore = false
    }
  }

  setStatus(
    `Searching through ${allItems.length} ${pluralize(allItems.length, 'blog post', 'blog posts')}...`,
    'info',
    true,
  )

  const searchLower = searchString.toLowerCase()
  const searchResults: SearchResult[] = []

  for (const itemData of allItems) {
    const matches = searchObject(itemData, searchLower)

    if (matches.length > 0) {
      const validMatches = matches.filter((m) => m.value && m.value.trim().length > 0)

      if (validMatches.length > 0) {
        searchResults.push({
          title: itemData.title || itemData.slug || 'Untitled',
          slug: itemData.slug,
          matches: validMatches,
        })
      }
    }
  }

  return { results: searchResults, totalItems: allItems.length, failedItems: failedItemsLocal }
}

async function searchButterCMSCollections(
  token: string,
  searchString: string,
  collectionKeyParam: string,
): Promise<SearchResponse> {
  const baseUrl = 'https://api.buttercms.com/v2/content'
  const allItems: ButterCMSData[] = []
  const failedItemsLocal: Array<{ page: number; error: string; source: string }> = []
  let page = 1
  let hasMore = true

  setStatus(`Fetching collection "${collectionKeyParam}"...`, 'info', true)

  while (hasMore) {
    const url = `${baseUrl}/${collectionKeyParam}/?auth_token=${token}&page=${page}&page_size=100`

    try {
      const data = await fetchWithRetry(url)

      // Collections return data differently - it's nested under the collection key
      const collectionData = (data.data as Record<string, ButterCMSData[]>)?.[collectionKeyParam]

      if (collectionData && Array.isArray(collectionData) && collectionData.length > 0) {
        allItems.push(...collectionData)
        hasMore = data.meta?.next_page !== null
        page++
        setStatus(
          `Fetched ${allItems.length} ${pluralize(allItems.length, 'collection item', 'collection items')} so far...`,
          'info',
          true,
        )
      } else {
        hasMore = false
      }
    } catch (error) {
      failedItemsLocal.push({ page, error: (error as Error).message, source: 'Collection' })
      hasMore = false
    }
  }

  setStatus(
    `Searching through ${allItems.length} ${pluralize(allItems.length, 'collection item', 'collection items')}...`,
    'info',
    true,
  )

  const searchLower = searchString.toLowerCase()
  const searchResults: SearchResult[] = []

  for (const itemData of allItems) {
    const matches = searchObject(itemData, searchLower)

    if (matches.length > 0) {
      const validMatches = matches.filter((m) => m.value && m.value.trim().length > 0)

      if (validMatches.length > 0) {
        searchResults.push({
          title: itemData.name || itemData.title || 'Untitled',
          slug: itemData.slug || 'N/A',
          matches: validMatches,
        })
      }
    }
  }

  return { results: searchResults, totalItems: allItems.length, failedItems: failedItemsLocal }
}

// Main search execution
async function executeSearch(): Promise<void> {
  const token = store.token
  const searchTermValue = searchTerm.value.trim()

  results.value = []
  failedItems.value = []
  statusMessage.value = ''

  if (!token) {
    setStatus('Please enter your API token', 'error')
    return
  }

  showMissingSearchTermError.value = !searchTerm.value
  showMissingPageTypeError.value = searchScope.value === 'pages' && !pageType.value
  showMissingCollectionKeyError.value = searchScope.value === 'collections' && !collectionKey.value

  if (
    showMissingSearchTermError.value ||
    showMissingPageTypeError.value ||
    showMissingCollectionKeyError.value
  )
    return

  isLoading.value = true

  try {
    let searchResponse: SearchResponse

    switch (searchScope.value) {
      case 'pages':
        searchResponse = await searchButterCMSPages(token, searchTermValue, pageType.value.trim())
        break
      case 'blog':
        searchResponse = await searchButterCMSBlog(token, searchTermValue)
        break
      case 'collections':
        searchResponse = await searchButterCMSCollections(
          token,
          searchTermValue,
          collectionKey.value.trim(),
        )
        break
      default:
        throw new Error('Invalid search scope')
    }

    const {
      results: searchResults,
      totalItems: totalItemsCount,
      failedItems: failedItemsResults,
    } = searchResponse

    totalItems.value = totalItemsCount

    if (searchResults.length === 0) {
      setStatus(
        `No matches found for "${searchTermValue}" in ${totalItemsCount} ${pluralize(totalItemsCount, getScopeItemName(), getScopeItemNamePlural())}`,
        'info',
        false,
      )
    } else {
      setStatus(
        `Found ${searchResults.length} ${pluralize(searchResults.length, getScopeItemName(), getScopeItemNamePlural())} with matches out of ${totalItemsCount} total ${pluralize(totalItemsCount, getScopeItemName(), getScopeItemNamePlural())}`,
        'success',
        false,
      )
      results.value = searchResults
    }

    failedItems.value = failedItemsResults
  } catch (error) {
    setStatus(`Error: ${(error as Error).message}`, 'error')
  } finally {
    isLoading.value = false
  }
}

const totalMatches = computed(() => {
  return results.value.reduce((sum, r) => {
    return sum + r.matches.reduce((matchSum, m) => matchSum + (m.count || 1), 0)
  }, 0)
})

function getResultMatchCount(result: SearchResult): number {
  return result.matches.reduce((sum, m) => sum + (m.count || 1), 0)
}
</script>

<style lang="scss" scoped>
.search-content {
  // Scope selection
  &__scope-selection {
    margin-bottom: 1rem;
  }

  &__scope-label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: var(--text-primary);
    font-size: 0.9375rem;
  }

  &__scope-options {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  &__radio-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.9375rem;

    input[type='radio'] {
      cursor: pointer;
    }

    &--disabled {
      opacity: 0.5;
      cursor: not-allowed;

      input[type='radio'] {
        cursor: not-allowed;
      }
    }
  }

  // Source badge
  &__source-badge {
    font-size: 0.75rem;
    padding: 0.125rem 0.5rem;
  }

  &__result-title-wrapper {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  // Loading text
  &__loading-text {
    font-weight: 500;
    color: var(--text-secondary);
  }

  // Summary section
  &__summary {
    background-color: white;
    border: 1px solid var(--butter-border);
    border-radius: 6px;
    padding: 1rem;
    font-weight: 500;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  // Result item
  &__result-item {
    background-color: var(--butter-light-gray);
    border: 1px solid var(--butter-border);
    border-radius: 6px;
    padding: 1.25rem;
    margin-bottom: 1rem;
  }

  // Result header
  &__result-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 0.75rem;

    &--desktop {
      @media (min-width: 769px) {
        flex-direction: row;
        justify-content: space-between;
        align-items: start;
      }
    }
  }

  // Result title
  &__result-title {
    font-weight: 600;
    color: var(--butter-dark);
    font-size: 1rem;
  }

  // Result slug
  &__result-slug {
    color: var(--text-secondary);
    font-size: 0.875rem;
    font-family: 'Courier New', monospace;
    margin-top: 0.25rem;
  }

  // Matches list
  &__matches-list {
    margin-top: 0.75rem;
  }

  // Match item
  &__match-item {
    background-color: white;
    border-left: 3px solid var(--butter-yellow);
    padding: 0.75rem;
    margin-bottom: 0.5rem;
    border-radius: 4px;
  }

  // Match path
  &__match-path {
    color: var(--butter-gray);
    font-size: 0.8125rem;
    font-family: 'Courier New', monospace;
    margin-bottom: 0.25rem;
  }

  // Match value
  &__match-value {
    color: var(--text-primary);
    font-size: 0.9375rem;
    word-break: break-word;

    :deep(mark) {
      background-color: var(--butter-yellow);
      color: var(--butter-dark);
      padding: 0.125rem 0.25rem;
      border-radius: 2px;
      font-weight: 600;
    }
  }

  // Failed items section
  &__failed-items {
    background-color: #fef3f2;
    border: 1px solid #fda29b;
    border-radius: 6px;
    padding: 1rem;
    margin-top: 1.5rem;
  }

  &__failed-items-title {
    color: var(--error);
    font-size: 1rem;
    margin-top: 0;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  &__failed-items-list {
    margin-left: 1.5rem;
    color: #b42318;
  }
}
</style>
