<template>
  <UtilitySection
    title="Search Content"
    description="Search through pages, blog posts, or collections for content matching your search term. Results will highlight exactly where matches were found."
  >
    <ComingSoon style="padding: 1rem"
      >Search <span style="text-transform: uppercase">everything</span></ComingSoon
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
        <div
          v-for="(result, index) in results"
          :key="index"
          v-memo="[result, searchTerm]"
          class="search-content__result-item"
        >
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
    <div v-if="failedResource" class="search-content__failed-items">
      <h4 class="search-content__failed-items-title">⚠️ Failed to retrieve content</h4>
      <p>{{ failedError }}</p>
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
import ComingSoon from '../ComingSoon.vue'
import { searchContent } from '@/features/searchContent'
import type { AsyncReturnType } from 'type-fest'

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
const results = ref<AsyncReturnType<typeof searchContent>['results']>([])
const failedResource = ref<string | null>(null)
const failedError = ref<string | null>(null)
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

function highlightMatches(text: string, searchTerm: string): string {
  const escapedText = escapeHtml(text)
  const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedSearchTerm})`, 'gi')
  return escapedText.replace(regex, '<mark>$1</mark>')
}

function resetSearch(): void {
  results.value = []
  failedResource.value = null
  failedError.value = null
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

// Main search execution
async function executeSearch(): Promise<void> {
  const token = store.token
  const searchTermValue = searchTerm.value.trim()

  results.value = []
  failedResource.value = null
  failedError.value = null
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
  setStatus('Searching...', 'info', true)

  try {
    const searchResponse = await searchContent(
      searchScope.value,
      searchTermValue,
      token,
      store.includePreview,
      pageType.value.trim() || undefined,
      collectionKey.value.trim() || undefined,
    )

    if (!searchResponse.success) {
      failedResource.value = searchResponse.error!
      failedError.value = searchResponse.error!
      setStatus(searchResponse.error!, 'error')
      return
    }

    totalItems.value = searchResponse.totalItems!

    if (searchResponse.results.length === 0) {
      setStatus(
        `No matches found for "${searchTermValue}" in ${searchResponse.totalItems} ${pluralize(searchResponse.totalItems!, getScopeItemName(), getScopeItemNamePlural())}`,
        'info',
        false,
      )
    } else {
      setStatus(
        `Found ${searchResponse.results.length} ${pluralize(searchResponse.results.length, getScopeItemName(), getScopeItemNamePlural())} with matches out of ${searchResponse.totalItems} total ${pluralize(searchResponse.totalItems!, getScopeItemName(), getScopeItemNamePlural())}`,
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

function getResultMatchCount(
  result: AsyncReturnType<typeof searchContent>['results'][number],
): number {
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
    line-height: 1.4;
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
