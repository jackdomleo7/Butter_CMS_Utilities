<template>
  <UtilitySection
    title="Search Pages"
    description="Search through all pages of a specific type for content matching your search term. Results will highlight exactly where matches were found."
  >
    <TextInput id="search-pages-page-type" type="text" :required="true" v-model="pageType">
      <template v-slot:label>Page Type</template>
      <template v-slot:error v-if="showMissingPageTypeError">Please enter a page type</template>
    </TextInput>
    <TextInput
      id="search-pages-search-term"
      type="text"
      :required="true"
      v-model="searchTerm"
      @keypress.enter="executeSearch"
    >
      <template v-slot:label>Search Term</template>
      <template v-slot:error v-if="showMissingSearchTermError">Please enter a search term</template>
    </TextInput>

    <Btn @click="executeSearch" :disabled="isLoading">
      {{ isLoading ? 'Searching...' : 'Search' }}
    </Btn>

    <InfoBanner v-if="statusMessage" class="status-message" :status="statusType" role="alert">
      <p v-if="isLoading" class="search-pages__loading-text">{{ statusMessage }}</p>
      <div v-else>{{ statusMessage }}</div>
    </InfoBanner>

    <div v-if="results.length > 0" id="resultsContainer" class="search-pages__results-container">
      <div class="search-pages__summary">
        Found <strong>{{ results.length }}</strong>
        {{ pluralize(results.length, 'page', 'pages') }} containing "<strong>{{
          searchTerm
        }}</strong
        >" with <strong>{{ totalMatches }}</strong> total
        {{ pluralize(totalMatches, 'match', 'matches') }}
      </div>
      <div class="results-list">
        <div v-for="(result, index) in results" :key="index" class="search-pages__result-item">
          <div class="search-pages__result-header search-pages__result-header--desktop">
            <div>
              <div class="search-pages__result-title">{{ result.title }}</div>
              <div class="search-pages__result-slug">{{ result.slug }}</div>
            </div>
            <Chip
              >{{ result.matches.length }}
              {{ pluralize(result.matches.length, 'match', 'matches') }}</Chip
            >
          </div>
          <div class="search-pages__matches-list">
            <div
              v-for="(match, mIndex) in result.matches"
              :key="mIndex"
              class="search-pages__match-item"
            >
              <div class="search-pages__match-path">{{ match.path }}</div>
              <div
                class="search-pages__match-value"
                v-html="highlightMatches(match.value, searchTerm)"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="failedPages.length > 0" class="search-pages__failed-pages">
      <h4 class="search-pages__failed-pages-title">
        ⚠️ Failed to retrieve {{ failedPages.length }}
        {{ pluralize(failedPages.length, 'page', 'pages') }}
      </h4>
      <p>Please check these manually:</p>
      <ul class="search-pages__failed-pages-list">
        <li v-for="(failed, index) in failedPages" :key="index">
          Page {{ failed.page }}: {{ failed.error }}
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
const pageType = ref('')
const searchTerm = ref('')
const showMissingPageTypeError = ref(false)
const showMissingSearchTermError = ref(false)
const isLoading = ref(false)
const statusMessage = ref('')
const statusType = ref<'info' | 'success' | 'error' | 'warning'>('info')
const results = ref<
  Array<{
    title: string
    slug: string
    matches: Array<{ path: string; value: string }>
  }>
>([])
const failedPages = ref<Array<{ page: number; error: string }>>([])
const totalPages = ref(0)

// Utility functions
function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}

function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

function highlightMatches(text: string, searchTerm: string): string {
  const escapedText = escapeHtml(text)
  const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedSearchTerm})`, 'gi')
  return escapedText.replace(regex, '<mark>$1</mark>')
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

// API functions
interface ButterCMSPageData {
  name?: string
  slug: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

interface ButterCMSApiResponse {
  data: ButterCMSPageData[]
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
  matches: Array<{ path: string; value: string }>
}

interface SearchResponse {
  results: SearchResult[]
  totalPages: number
  failedPages: Array<{ page: number; error: string }>
}

async function searchButterCMSPages(
  token: string,
  searchString: string,
  pageTypeParam: string,
): Promise<SearchResponse> {
  const baseUrl = 'https://api.buttercms.com/v2/pages'
  const allPages: ButterCMSPageData[] = []
  const failedPagesLocal: Array<{ page: number; error: string }> = []
  let page = 1
  let hasMore = true

  setStatus(`Fetching pages of type "${pageTypeParam}"...`, 'info', true)

  while (hasMore) {
    const url = `${baseUrl}/${pageTypeParam}/?auth_token=${token}&page=${page}&page_size=100`

    try {
      const data = await fetchWithRetry(url)

      if (data.data && data.data.length > 0) {
        allPages.push(...data.data)
        hasMore = data.meta?.next_page !== null
        page++
        setStatus(
          `Fetched ${allPages.length} ${pluralize(allPages.length, 'page', 'pages')} so far...`,
          'info',
          true,
        )
      } else {
        hasMore = false
      }
    } catch (error) {
      failedPagesLocal.push({ page, error: (error as Error).message })
      hasMore = false
    }
  }

  setStatus(
    `Searching through ${allPages.length} ${pluralize(allPages.length, 'page', 'pages')}...`,
    'info',
    true,
  )

  const searchLower = searchString.toLowerCase()
  const searchResults: SearchResult[] = []

  function searchObject(
    obj: unknown,
    path = '',
    depth = 0,
  ): Array<{ path: string; value: string }> {
    const matches: Array<{ path: string; value: string }> = []

    if (depth > 10) return matches
    if (obj === null || obj === undefined) return matches

    if (typeof obj === 'string') {
      if (obj.toLowerCase().includes(searchLower)) {
        matches.push({
          path,
          value: obj.length > 200 ? obj.substring(0, 200) + '...' : obj,
        })
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        matches.push(...searchObject(item, `${path}[${index}]`, depth + 1))
      })
    } else if (typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        if (key === 'meta' || key === 'url' || key === 'href') continue
        matches.push(...searchObject(value, path ? `${path}.${key}` : key, depth + 1))
      }
    }

    return matches
  }

  for (const pageData of allPages) {
    const matches = searchObject(pageData)

    if (matches.length > 0) {
      const validMatches = matches.filter((m) => m.value && m.value.trim().length > 0)

      if (validMatches.length > 0) {
        searchResults.push({
          title: pageData.name || pageData.slug || 'Untitled',
          slug: pageData.slug,
          matches: validMatches,
        })
      }
    }
  }

  return { results: searchResults, totalPages: allPages.length, failedPages: failedPagesLocal }
}

// Main search execution
async function executeSearch(): Promise<void> {
  const token = store.token
  const pageTypeValue = pageType.value.trim()
  const searchTermValue = searchTerm.value.trim()

  results.value = []
  failedPages.value = []
  statusMessage.value = ''

  if (!token) {
    setStatus('Please enter your API token', 'error')
    return
  }

  showMissingPageTypeError.value = !pageType.value
  showMissingSearchTermError.value = !searchTerm.value
  if (showMissingPageTypeError.value || showMissingSearchTermError.value) return

  isLoading.value = true

  try {
    const {
      results: searchResults,
      totalPages: totalPagesCount,
      failedPages: failedPagesResults,
    } = await searchButterCMSPages(token, searchTermValue, pageTypeValue)

    totalPages.value = totalPagesCount

    if (searchResults.length === 0) {
      setStatus(
        `No matches found for "${searchTermValue}" in ${totalPagesCount} ${pluralize(totalPagesCount, 'page', 'pages')}`,
        'info',
        false,
      )
    } else {
      setStatus(
        `Found ${searchResults.length} ${pluralize(searchResults.length, 'page', 'pages')} with matches out of ${totalPagesCount} total ${pluralize(totalPagesCount, 'page', 'pages')}`,
        'success',
        false,
      )
      results.value = searchResults
    }

    failedPages.value = failedPagesResults
  } catch (error) {
    setStatus(`Error: ${(error as Error).message}`, 'error')
  } finally {
    isLoading.value = false
  }
}

const totalMatches = computed(() => {
  return results.value.reduce((sum, r) => sum + r.matches.length, 0)
})
</script>

<style lang="scss" scoped>
.search-pages {
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

    mark {
      background-color: var(--butter-yellow);
      color: var(--butter-dark);
      padding: 0.125rem 0.25rem;
      border-radius: 2px;
      font-weight: 600;
    }
  }

  // Failed pages section
  &__failed-pages {
    background-color: #fef3f2;
    border: 1px solid #fda29b;
    border-radius: 6px;
    padding: 1rem;
    margin-top: 1.5rem;
  }

  &__failed-pages-title {
    color: var(--error);
    font-size: 1rem;
    margin-top: 0;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }

  &__failed-pages-list {
    margin-left: 1.5rem;
    color: #b42318;
  }
}
</style>
