<template>
  <fieldset class="scope-selection">
    <legend class="scope-selection__label">
      <slot name="legend">Scopes</slot>
    </legend>

    <!-- Blog Checkbox -->
    <label class="scope-selection__checkbox-option">
      <input
        type="checkbox"
        v-model="includeBlog"
        :disabled="disabled"
        :aria-label="blogAriaLabel"
      />
      <span>Blog</span>
    </label>

    <!-- Page Types Checkboxes -->
    <div v-if="store.pageTypes.length > 0" class="scope-selection__scope-group">
      <div class="scope-selection__scope-group-title">Page Types</div>
      <div class="scope-selection__scope-options">
        <label
          v-for="pageType in store.pageTypes"
          :key="pageType"
          class="scope-selection__checkbox-option"
        >
          <input
            type="checkbox"
            :value="pageType"
            :checked="store.selectedScopes.pageTypes.includes(pageType)"
            @change="togglePageType(pageType)"
            :disabled="disabled"
            :aria-label="`Include ${pageType} pages in ${ariaContext}`"
          />
          <span>{{ pageType }}</span>
        </label>
      </div>
    </div>

    <!-- Collection Keys Checkboxes -->
    <div v-if="store.collectionKeys.length > 0" class="scope-selection__scope-group">
      <div class="scope-selection__scope-group-title">Collection Keys</div>
      <div class="scope-selection__scope-options">
        <label
          v-for="collectionKey in store.collectionKeys"
          :key="collectionKey"
          class="scope-selection__checkbox-option"
        >
          <input
            type="checkbox"
            :value="collectionKey"
            :checked="store.selectedScopes.collectionKeys.includes(collectionKey)"
            @change="toggleCollectionKey(collectionKey)"
            :disabled="disabled"
            :aria-label="`Include ${collectionKey} collection in ${ariaContext}`"
          />
          <span>{{ collectionKey }}</span>
        </label>
      </div>
    </div>

    <!-- Message if no page types or collection keys configured -->
    <div
      v-if="store.pageTypes.length === 0 && store.collectionKeys.length === 0"
      class="scope-selection__empty-scopes"
    >
      <p>No page types or collection keys configured. Configure them in API Configuration above.</p>
    </div>
  </fieldset>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useStore } from '@/stores/index'

defineProps<{
  disabled?: boolean
  ariaContext?: string
}>()

const store = useStore()

const includeBlog = computed({
  get: () => store.selectedScopes.blog,
  set: (val: boolean) => {
    store.selectedScopes = { ...store.selectedScopes, blog: val }
  },
})

const blogAriaLabel = computed(() => {
  const context = store.selectedScopes.blog ? 'exclude' : 'include'
  return `${context} blog posts`
})

function togglePageType(pageType: string): void {
  const index = store.selectedScopes.pageTypes.indexOf(pageType)
  const newPageTypes =
    index > -1
      ? store.selectedScopes.pageTypes.filter((pt) => pt !== pageType)
      : [...store.selectedScopes.pageTypes, pageType]
  store.selectedScopes = { ...store.selectedScopes, pageTypes: newPageTypes }
}

function toggleCollectionKey(collectionKey: string): void {
  const index = store.selectedScopes.collectionKeys.indexOf(collectionKey)
  const newCollectionKeys =
    index > -1
      ? store.selectedScopes.collectionKeys.filter((ck) => ck !== collectionKey)
      : [...store.selectedScopes.collectionKeys, collectionKey]
  store.selectedScopes = { ...store.selectedScopes, collectionKeys: newCollectionKeys }
}
</script>

<style lang="scss" scoped>
.scope-selection {
  margin: 0 0 var(--space-6) 0;
  padding: 0;
  border: 0;

  &__label {
    display: block;
    font-weight: 500;
    margin-bottom: var(--space-3);
    color: var(--text-primary);
    font-size: var(--font-size-sm);
  }

  &__checkbox-option {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    cursor: pointer;
    font-size: var(--font-size-sm);

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    input[type='checkbox'] {
      cursor: inherit;
      width: 1rem;
      height: 1rem;
      margin-top: 0.125rem;
      flex-shrink: 0;
      accent-color: var(--accent-blue);
    }
  }

  &__scope-group {
    margin-top: var(--space-5);
    border-left: 2px solid var(--border-base);
    padding-left: var(--space-4);
  }

  &__scope-group-title {
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: var(--space-3);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__scope-options {
    display: flex;
    gap: var(--space-2) var(--space-4);
    flex-wrap: wrap;
  }

  &__empty-scopes {
    color: var(--text-secondary);
    font-size: var(--font-size-sm);
    margin-top: var(--space-4);
    padding: var(--space-4);
    background-color: var(--bg-secondary);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-light);

    p {
      margin: 0;
    }
  }
}
</style>
