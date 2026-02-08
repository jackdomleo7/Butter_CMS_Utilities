<template>
  <UtilitySection
    title="Search Content"
    description="Search through pages, blog posts, or collections for content matching your search term. Results will highlight exactly where matches were found."
  >
    <!-- Search Scopes Selection -->
    <fieldset class="search-content__scopes-selection">
      <legend class="search-content__scopes-label">Search Scopes</legend>

      <!-- Blog Checkbox -->
      <label class="search-content__checkbox-option">
        <input
          type="checkbox"
          v-model="includeBlog"
          :disabled="hasResults"
          aria-label="Include blog posts in search"
        />
        <span>Blog</span>
      </label>

      <!-- Page Types Checkboxes -->
      <div v-if="store.pageTypes.length > 0" class="search-content__scope-group">
        <div class="search-content__scope-group-title">Page Types</div>
        <div class="search-content__scope-options">
          <label
            v-for="pageType in store.pageTypes"
            :key="pageType"
            class="search-content__checkbox-option"
          >
            <input
              type="checkbox"
              :value="pageType"
              :checked="store.selectedScopes.pageTypes.includes(pageType)"
              @change="togglePageType(pageType)"
              :disabled="hasResults"
              :aria-label="`Include ${pageType} pages in search`"
            />
            <span>{{ pageType }}</span>
          </label>
        </div>
      </div>

      <!-- Collection Keys Checkboxes -->
      <div v-if="store.collectionKeys.length > 0" class="search-content__scope-group">
        <div class="search-content__scope-group-title">Collection Keys</div>
        <div class="search-content__scope-options">
          <label
            v-for="collectionKey in store.collectionKeys"
            :key="collectionKey"
            class="search-content__checkbox-option"
          >
            <input
              type="checkbox"
              :value="collectionKey"
              :checked="store.selectedScopes.collectionKeys.includes(collectionKey)"
              @change="toggleCollectionKey(collectionKey)"
              :disabled="hasResults"
              :aria-label="`Include ${collectionKey} collection in search`"
            />
            <span>{{ collectionKey }}</span>
          </label>
        </div>
      </div>

      <!-- Message if no page types or collection keys configured -->
      <div
        v-if="store.pageTypes.length === 0 && store.collectionKeys.length === 0"
        class="search-content__empty-scopes"
      >
        <p>
          No page types or collection keys configured. Configure them in API Configuration above.
        </p>
      </div>
    </fieldset>

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

    <Btn v-if="hasResults || statusMessage" type="reset" status="tertiary" @click="resetSearch">
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
        {{ pluralize(results.length, 'item', 'items') }} containing "<strong>{{
          searchTerm
        }}</strong
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
                <Chip class="search-content__source-badge">{{ getResultSourceBadge(result) }}</Chip>
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
import { searchContent } from '@/features/searchContent'
import type { AsyncReturnType } from 'type-fest'

const store = useStore()
const includeBlog = ref(store.selectedScopes.blog)
const searchTerm = ref('')
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

function togglePageType(pageType: string): void {
  const index = store.selectedScopes.pageTypes.indexOf(pageType)
  if (index > -1) {
    store.selectedScopes.pageTypes.splice(index, 1)
  } else {
    store.selectedScopes.pageTypes.push(pageType)
  }
}

function toggleCollectionKey(collectionKey: string): void {
  const index = store.selectedScopes.collectionKeys.indexOf(collectionKey)
  if (index > -1) {
    store.selectedScopes.collectionKeys.splice(index, 1)
  } else {
    store.selectedScopes.collectionKeys.push(collectionKey)
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

  if (showMissingSearchTermError.value) return

  isLoading.value = true
  setStatus('Searching...', 'info', true)

  try {
    // Update the store with the current selection
    store.selectedScopes.blog = includeBlog.value

    const searchResponse = await searchContent(
      searchTermValue,
      token,
      store.includePreview,
      store.selectedScopes.pageTypes,
      store.selectedScopes.collectionKeys,
      includeBlog.value,
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
        `No matches found for "${searchTermValue}" in ${searchResponse.totalItems} selected items`,
        'info',
        false,
      )
    } else {
      setStatus(
        `Found ${searchResponse.results.length} items with matches out of ${searchResponse.totalItems} total selected items`,
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
  // Scopes selection
  &__scopes-selection {
    margin: 0 0 1.5rem 0;
    padding: 0;
    border: 0;
  }

  &__scopes-label {
    display: block;
    font-weight: 500;
    margin-bottom: 0.75rem;
    color: var(--text-primary);
    font-size: 0.9375rem;
  }

  &__checkbox-option {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.9375rem;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    input {
      cursor: inherit;
    }
  }

  &__scope-group {
    margin-top: 1.5rem;
    border-left: 2px solid var(--butter-border);
    padding-left: 1rem;
  }

  &__scope-group-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
  }

  &__scope-options {
    display: flex;
    gap: 0.5rem 1rem;
    flex-wrap: wrap;
  }

  &__empty-scopes {
    color: var(--text-secondary);
    font-size: 0.9375rem;
    margin-top: 1rem;
    padding: 1rem;
    background-color: var(--butter-light-gray);
    border-radius: 6px;
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
}
</style>
