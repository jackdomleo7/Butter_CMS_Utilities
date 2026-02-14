<template>
  <UtilitySection
    title="Search Content"
    :description="`Search through pages, blog posts, or collections for content ${negateSearch ? 'NOT' : ''} matching your search term. Results will highlight exactly where matches were ${negateSearch ? 'NOT' : ''} found.`"
  >
    <!-- Search Scopes Selection -->
    <ScopeSelection :disabled="hasResults" aria-context="search">
      <template #legend>Search Scopes</template>
    </ScopeSelection>

    <!-- Negation Option -->
    <div class="search-content__negation-section">
      <div class="search-content__negation-label">Search Mode</div>
      <Toggle
        id="search-mode-toggle"
        v-model="negateSearch"
        :disabled="hasResults"
        off-label="Include matches (show items containing search term)"
        on-label="Exclude matches (show items NOT containing search term)"
      />
    </div>

    <!-- Search Form -->
    <form class="search-content__form" novalidate @submit.prevent="executeSearch">
      <TextInput
        id="search-content-search-term"
        type="text"
        :required="true"
        :disabled="hasResults"
        v-model="searchTerm"
      >
        <template v-slot:label>Search Term</template>
        <template v-slot:error v-if="showMissingSearchTermError"
          >Please enter a search term</template
        >
      </TextInput>

      <Btn type="submit" v-if="!hasResults && !isLoading"> Search </Btn>

      <Btn v-if="hasResults || statusMessage" type="reset" status="tertiary" @click="resetSearch">
        Reset
      </Btn>
    </form>

    <InfoBanner v-if="statusMessage && !isLoading" :status="statusType" role="alert">
      <div>{{ statusMessage }}</div>
    </InfoBanner>

    <!-- Partial Failure Warning -->
    <InfoBanner v-if="failedScopes.length > 0 && !isLoading" status="warning">
      <strong>Partial failure:</strong> Failed to fetch {{ failedScopes.join(', ') }}. Showing
      results from successfully fetched scopes only.
    </InfoBanner>

    <!-- Skeleton Loading States -->
    <div v-if="isLoading" class="search-content__loading">
      <Card v-for="i in 3" :key="i" :skeleton="true" class="search-content__skeleton-card" />
    </div>

    <!-- Results -->
    <div
      v-if="results.length > 0 && !isLoading"
      id="resultsContainer"
      class="search-content__results-container"
    >
      <div class="search-content__summary" aria-live="polite" aria-atomic="true">
        Found {{ matchesSummary }} {{ negateSearch ? 'NOT' : '' }} containing "<strong>{{
          searchTerm
        }}</strong
        >"
      </div>
      <div class="results-list">
        <Card
          v-for="(result, index) in results"
          :key="index"
          v-memo="[result, searchTerm]"
          class="search-content__result-card"
        >
          <div class="search-content__result-header">
            <div class="search-content__result-header-left">
              <div class="search-content__result-title-wrapper">
                <Chip size="small">{{ getResultSourceBadge(result) }}</Chip>
                <span class="search-content__result-title">{{ result.title }}</span>
              </div>
              <div class="search-content__result-slug">{{ result.slug }}</div>
            </div>
            <Chip size="medium" class="search-content__match-count"
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
        </Card>
      </div>
    </div>

    <!-- Failed items -->
    <div v-if="failedResource" class="search-content__failed-items">
      <h4 class="search-content__failed-items-title">⚠️ Failed to retrieve content</h4>
      <p>{{ failedError }}</p>
    </div>
  </UtilitySection>
</template>

<script lang="ts" setup>
import { ref, shallowRef, computed, defineAsyncComponent } from 'vue'
import { useStore } from '@/stores/index'
import UtilitySection from '../UtilitySection.vue'
import ScopeSelection from '../ScopeSelection.vue'
import TextInput from '../TextInput.vue'
import Btn from '../Btn.vue'
import InfoBanner from '../InfoBanner.vue'
import Chip from '../Chip.vue'
import Toggle from '../Toggle.vue'
import { searchContent } from '@/features/searchContent'
import { normalizeWhitespace } from '@/utils/textNormalization'
import type { AsyncReturnType } from 'type-fest'

const Card = defineAsyncComponent(() => import('../Card.vue'))

const store = useStore()
const searchTerm = ref('')
const negateSearch = ref(false)
const showMissingSearchTermError = ref(false)
const isLoading = ref(false)
const statusMessage = ref('')
const statusType = ref<'info' | 'success' | 'error' | 'warning'>('info')
// Use shallowRef for large results array - we replace it wholesale, never mutate deeply
const results = shallowRef<AsyncReturnType<typeof searchContent>['results']>([])
const failedResource = ref<string | null>(null)
const failedError = ref<string | null>(null)
const failedScopes = ref<string[]>([])
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

/**
 * Creates a regex pattern that matches a character and all its normalized variants.
 * For example, '£' should match both '£' and '&pound;'.
 */
function createVariantPattern(char: string): string {
  const variants: Record<string, string[]> = {
    "'": ["'", '&apos;', '&#39;', '\u2018', '\u2019'],
    '"': ['"', '&quot;', '\u201C', '\u201D'],
    '-': ['-', '&ndash;', '&mdash;', '\u2013', '\u2014'],
    '£': ['£', '&pound;'],
    '€': ['€', '&euro;'],
    '&': ['&', '&amp;'],
    '<': ['<', '&lt;'],
    '>': ['>', '&gt;'],
    ' ': [' ', '&nbsp;', '\u00A0'],
  }

  // If this character has known variants, match any of them
  if (variants[char]) {
    const escapedVariants = variants[char].map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    return `(?:${escapedVariants.join('|')})`
  }

  // Otherwise, just escape and match the character itself
  return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightMatches(text: string, searchTerm: string): string {
  const escapedText = escapeHtml(text)

  // Normalize the search term to get the canonical form
  const normalizedSearch = normalizeWhitespace(searchTerm.trim())

  // Build a regex pattern that matches the search term and all its variant forms
  const patternParts = Array.from(normalizedSearch).map(createVariantPattern)
  const pattern = patternParts.join('')

  const regex = new RegExp(`(${pattern})`, 'gi')
  return escapedText.replace(regex, '<mark>$1</mark>')
}

function resetSearch(): void {
  results.value = []
  failedResource.value = null
  failedError.value = null
  failedScopes.value = []
  statusMessage.value = ''
  searchTerm.value = ''
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

function getResultSourceBadge(
  result: AsyncReturnType<typeof searchContent>['results'][number],
): string {
  if (result.sourceType === 'Blog') {
    return 'Blog'
  }
  return `${result.sourceType}`
}

// Main search execution
async function executeSearch(): Promise<void> {
  const token = store.token
  const searchTermValue = searchTerm.value.trim()

  results.value = []
  failedResource.value = null
  failedError.value = null
  failedScopes.value = []
  statusMessage.value = ''

  if (!token) {
    setStatus('Please enter your API token', 'error')
    return
  }

  showMissingSearchTermError.value = !searchTerm.value

  if (showMissingSearchTermError.value) return

  isLoading.value = true
  setStatus('Searching...', 'info', true)

  try {
    const searchResponse = await searchContent(
      searchTermValue,
      token,
      store.includePreview,
      store.selectedScopes.pageTypes,
      store.selectedScopes.collectionKeys,
      store.selectedScopes.blog,
      negateSearch.value,
    )

    if (!searchResponse.success) {
      failedResource.value = searchResponse.error!
      failedError.value = searchResponse.error!
      failedScopes.value = searchResponse.failedScopes || []
      setStatus(searchResponse.error!, 'error')
      return
    }

    totalItems.value = searchResponse.totalItems!
    failedScopes.value = searchResponse.failedScopes || []

    if (searchResponse.results.length === 0) {
      setStatus(
        `No items ${negateSearch.value ? 'NOT' : ''} containing "${searchTermValue}" found in ${searchResponse.totalItems} selected items`,
        'info',
        false,
      )
    } else {
      setStatus(
        `Found ${searchResponse.results.length} items ${negateSearch.value ? 'NOT' : ''} containing "${searchTermValue}" out of ${searchResponse.totalItems} total selected items`,
        'success',
        false,
      )
      results.value = searchResponse.results
    }
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

const matchesByScope = computed(() => {
  const scopeMap = new Map<string, number>()

  results.value.forEach((result) => {
    const sourceType = result.sourceType || 'Unknown'
    const matchCount = result.matches.reduce((sum, m) => sum + (m.count || 1), 0)
    scopeMap.set(sourceType, (scopeMap.get(sourceType) || 0) + matchCount)
  })

  return Array.from(scopeMap.entries())
    .map(([scope, count]) => ({ scope, count }))
    .sort((a, b) => b.count - a.count)
})

const matchesSummary = computed(() => {
  const total = totalMatches.value
  if (matchesByScope.value.length === 0) return ''

  const scopeBreakdown = matchesByScope.value
    .map(({ scope, count }) => `${count} in ${scope}`)
    .join(', ')

  return `${total} ${pluralize(total, 'match', 'matches')}: ${scopeBreakdown}`
})

function getResultMatchCount(
  result: AsyncReturnType<typeof searchContent>['results'][number],
): number {
  return result.matches.reduce((sum, m) => sum + (m.count || 1), 0)
}
</script>

<style lang="scss" scoped>
.search-content {
  // Negation section
  &__negation-section {
    margin: var(--space-2) 0;
    padding: var(--space-4);
    background-color: var(--bg-secondary);
    border-radius: var(--radius-lg);
  }

  &__negation-label {
    display: block;
    font-weight: 500;
    margin-bottom: var(--space-3);
    color: var(--text-primary);
    font-size: var(--font-size-sm);
  }

  // Loading skeleton
  &__loading {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    margin-top: var(--space-6);
  }

  &__skeleton-card {
    margin-bottom: 0;
  }

  // Summary section
  &__summary {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    font-weight: 500;
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
    position: sticky;
    top: var(--space-4);
    z-index: 10;
    box-shadow: var(--shadow-sm);
    margin-bottom: var(--space-6);
  }

  // Results list
  .results-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-5);
  }

  // Result card
  &__result-card {
    margin-bottom: 0;
  }

  // Result header
  &__result-header {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    margin-bottom: var(--space-5);

    @media (min-width: 769px) {
      flex-direction: row;
      justify-content: space-between;
      align-items: flex-start;
    }
  }

  &__result-header-left {
    flex: 1;
  }

  // Result title wrapper
  &__result-title-wrapper {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
    margin-bottom: var(--space-2);
  }

  // Result title
  &__result-title {
    font-weight: 600;
    color: var(--text-primary);
    font-size: var(--font-size-lg);
    line-height: var(--line-height-tight);
  }

  // Result slug
  &__result-slug {
    color: var(--text-tertiary);
    font-size: var(--font-size-sm);
    font-family: 'Courier New', monospace;
  }

  // Match count chip
  &__match-count {
    flex-shrink: 0;
    align-self: flex-start;
  }

  // Matches list
  &__matches-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  // Match item
  &__match-item {
    background-color: var(--bg-secondary);
    border-left: 3px solid var(--accent-blue);
    padding: var(--space-4);
    border-radius: var(--radius-md);
    line-height: var(--line-height-relaxed);
  }

  // Match path
  &__match-path {
    color: var(--text-tertiary);
    font-size: var(--font-size-xs);
    font-family: 'Courier New', monospace;
    margin-bottom: var(--space-2);
    font-weight: 500;
  }

  // Match value
  &__match-value {
    color: var(--text-primary);
    font-size: var(--font-size-sm);
    word-break: break-word;
    line-height: var(--line-height-relaxed);

    :deep(mark) {
      background-color: var(--accent-yellow);
      color: var(--text-primary);
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      font-weight: 600;
    }
  }

  // Failed items section
  &__failed-items {
    background-color: var(--error-bg);
    border: 1px solid var(--error-border);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    margin-top: var(--space-6);
  }

  &__failed-items-title {
    color: var(--error);
    font-size: var(--font-size-base);
    margin-top: 0;
    margin-bottom: var(--space-3);
    font-weight: 600;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);

    :deep(.btn) {
      width: 100%;
    }
  }
}
</style>
