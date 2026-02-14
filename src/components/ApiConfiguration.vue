<template>
  <Accordion :open="false" class="api-config">
    <template #title>
      <div class="api-config__summary">
        <div class="api-config__summary-main">
          <span class="api-config__title">API Configuration</span>
          <span v-if="store.token" class="api-config__token-preview">{{ maskedToken }}</span>
        </div>
        <div v-if="store.token" class="api-config__toggle">
          <Toggle
            id="draft-toggle-summary"
            v-model="store.includePreview"
            on-label="Include drafts"
            off-label="Published only"
            @click.stop
          />
        </div>
      </div>
    </template>

    <div class="api-config__content">
      <div class="api-config__token-input-container">
        <TextInput
          root-class="api-config__token-input"
          id="butter-api-token"
          type="password"
          placeholder="Enter your read-only Butter CMS API token"
          :required="true"
          :readonly="store.lockToken"
          v-model="store.token"
        >
          <template v-slot:label>Butter CMS API Token (Read-Only)</template>
          <template v-slot:error v-if="!store.token"
            >Please provide your Butter CMS API token</template
          >
        </TextInput>
        <button
          v-if="store.token"
          @click="toggleTokenLock"
          class="api-config__lock-button"
          :title="store.lockToken ? 'Unlock token' : 'Lock token'"
          :aria-label="store.lockToken ? 'Unlock token' : 'Lock token'"
        >
          {{ store.lockToken ? '🔒' : '🔓' }}
        </button>
      </div>

      <div class="api-config__draft-toggle">
        <Toggle
          id="draft-toggle-panel"
          v-model="store.includePreview"
          on-label="Include draft content in search results"
          off-label="Published content only in search results"
        />
      </div>

      <!-- Page Types Section -->
      <div class="api-config__section">
        <h3 class="api-config__section-title">Page Types</h3>
        <form @submit.prevent="addPageType" class="api-config__form">
          <TextInput
            id="page-type-input"
            type="text"
            v-model="pageTypeInput"
            root-class="api-config__input"
            placeholder="e.g. landing_page"
          >
            <template v-slot:label>Add Page Type</template>
          </TextInput>
          <Btn v-if="pageTypeInput" type="submit" status="secondary" class="api-config__button"
            >Add</Btn
          >
        </form>
        <ul v-if="store.pageTypes.length > 0" class="api-config__list">
          <li v-for="pageType in store.pageTypes" :key="pageType">
            <Chip removable @remove="removePageType(pageType)">
              {{ pageType }}
            </Chip>
          </li>
        </ul>
        <p v-else class="api-config__empty">No page types configured yet</p>
      </div>

      <!-- Collection Keys Section -->
      <div class="api-config__section">
        <h3 class="api-config__section-title">Collection Keys</h3>
        <form @submit.prevent="addCollectionKey" class="api-config__form">
          <TextInput
            id="collection-key-input"
            type="text"
            v-model="collectionKeyInput"
            root-class="api-config__input"
            placeholder="e.g. recipes"
          >
            <template v-slot:label>Add Collection Key</template>
          </TextInput>
          <Btn v-if="collectionKeyInput" type="submit" status="secondary" class="api-config__button"
            >Add</Btn
          >
        </form>
        <ul v-if="store.collectionKeys.length > 0" class="api-config__list">
          <li v-for="collectionKey in store.collectionKeys" :key="collectionKey">
            <Chip removable @remove="removeCollectionKey(collectionKey)">
              {{ collectionKey }}
            </Chip>
          </li>
        </ul>
        <p v-else class="api-config__empty">No collection keys configured yet</p>
      </div>
    </div>
  </Accordion>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useStore } from '@/stores/index'
import Accordion from './Accordion.vue'
import Toggle from './Toggle.vue'
import TextInput from './TextInput.vue'
import Btn from './Btn.vue'
import Chip from './Chip.vue'

const store = useStore()
const pageTypeInput = ref('')
const collectionKeyInput = ref('')

const maskedToken = computed((): string => {
  if (!store.token) return ''
  if (store.token.length <= 8) return '••••••••'
  const first4 = store.token.substring(0, 4)
  const last4 = store.token.substring(store.token.length - 4)
  return `${first4}...${last4}`
})

function toggleTokenLock(): void {
  store.lockToken = !store.lockToken
}

function addPageType(): void {
  const trimmed = pageTypeInput.value.trim()
  if (trimmed && !store.pageTypes.includes(trimmed)) {
    store.pageTypes = [...store.pageTypes, trimmed]
    pageTypeInput.value = ''
  }
}

function removePageType(pageType: string): void {
  store.pageTypes = store.pageTypes.filter((p: string) => p !== pageType)
}

function addCollectionKey(): void {
  const trimmed = collectionKeyInput.value.trim()
  if (trimmed && !store.collectionKeys.includes(trimmed)) {
    store.collectionKeys = [...store.collectionKeys, trimmed]
    collectionKeyInput.value = ''
  }
}

function removeCollectionKey(collectionKey: string): void {
  store.collectionKeys = store.collectionKeys.filter((c: string) => c !== collectionKey)
}
</script>

<style lang="scss" scoped>
.api-config {
  margin: 0 auto var(--space-8);

  &__summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    width: 100%;
    flex-wrap: wrap;
  }

  &__summary-main {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  &__title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
  }

  &__token-preview {
    font-family: 'Courier New', Courier, monospace;
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    background-color: var(--bg-secondary);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
  }

  &__toggle {
    flex-shrink: 0;
    min-width: 10.5rem;
  }

  &__content {
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  &__token-input-container {
    display: flex;
    gap: var(--space-3);
    align-items: flex-start;
  }

  &__token-input {
    flex: 1;
  }

  &__lock-button {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    padding: 0;
    margin-top: 1.875rem;
    background-color: var(--bg-secondary);
    border: 1px solid var(--border-base);
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: var(--font-size-xl);

    @media (prefers-reduced-motion: no-preference) {
      transition: all var(--transition-fast);
    }

    &:hover {
      background-color: var(--bg-tertiary);
    }

    &:active {
      transform: scale(0.98);
    }
  }

  &__draft-toggle {
    padding: var(--space-4);
    background-color: var(--bg-secondary);
    border-radius: var(--radius-md);
    border: 1px solid var(--border-light);
  }

  &__section {
    border-left: 2px solid var(--border-base);
    padding-left: var(--space-4);
  }

  &__section-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin: 0 0 var(--space-4) 0;
    color: var(--text-primary);
  }

  &__form {
    display: flex;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
    align-items: flex-end;
  }

  &__input {
    flex: 1;
  }

  &__button {
    flex-shrink: 0;
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  &__empty {
    color: var(--text-tertiary);
    font-size: var(--font-size-sm);
    font-style: italic;
    margin: 0;
  }
}
</style>
