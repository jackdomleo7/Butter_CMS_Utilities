<template>
  <Header />
  <main>
    <InfoBanner status="warning">
      <p>
        <strong>🔒 Privacy First:</strong> All operations run entirely in your browser. No API
        tokens or data are stored or transmitted to any third-party servers. Your Butter CMS token
        is used only for direct API calls to Butter CMS.
      </p>
    </InfoBanner>
    <UtilitySection title="API Configuration" title-heading-level="h2">
      <div class="app__token-input-container">
        <TextInput
          root-class="app__token-input"
          id="butter-api-token"
          type="password"
          placeholder="Enter your read-only Butter CMS API Token"
          :required="true"
          :readonly="store.lockToken"
          v-model="store.token"
        >
          <template v-slot:label>Butter CMS API Token (Read-Only)</template>
          <template v-slot:error v-if="!store.token"
            >Please provide your Butter CMS API Token</template
          >
        </TextInput>
        <button
          v-if="store.token"
          @click="toggleTokenLock"
          class="app__lock-button"
          :title="store.lockToken ? 'Unlock token' : 'Lock token'"
        >
          {{ store.lockToken ? '🔒' : '🔓' }}
        </button>
      </div>

      <label class="app__checkbox-label">
        <input
          type="checkbox"
          v-model="store.includePreview"
          class="app__checkbox-input"
          aria-label="Include preview content in API requests"
        />
        <span>Include draft content in search results</span>
      </label>

      <!-- Page Types Section -->
      <div class="app__config-section">
        <h3 class="app__config-title">Page Types</h3>
        <form @submit.prevent="addPageType" class="app__config-form">
          <TextInput
            id="page-type-input"
            type="text"
            v-model="pageTypeInput"
            placeholder="Enter a page type and press Add"
            root-class="app__config-input"
          >
            <template v-slot:label>Add Page Type</template>
          </TextInput>
          <button type="submit" class="app__form-button">Add</button>
        </form>
        <div v-if="store.pageTypes.length > 0" class="app__items-list">
          <Chip v-for="pageType in store.pageTypes" :key="pageType" class="app__item-chip">
            {{ pageType }}
            <button
              type="button"
              @click="removePageType(pageType)"
              class="app__chip-remove"
              :aria-label="`Remove ${pageType}`"
            >
              ✕
            </button>
          </Chip>
        </div>
        <p v-else class="app__empty-message">No page types configured</p>
      </div>

      <!-- Collection Keys Section -->
      <div class="app__config-section">
        <h3 class="app__config-title">Collection Keys</h3>
        <form @submit.prevent="addCollectionKey" class="app__config-form">
          <TextInput
            id="collection-key-input"
            type="text"
            v-model="collectionKeyInput"
            placeholder="Enter a collection key and press Add"
            root-class="app__config-input"
          >
            <template v-slot:label>Add Collection Key</template>
          </TextInput>
          <button type="submit" class="app__form-button">Add</button>
        </form>
        <div v-if="store.collectionKeys.length > 0" class="app__items-list">
          <Chip
            v-for="collectionKey in store.collectionKeys"
            :key="collectionKey"
            class="app__item-chip"
          >
            {{ collectionKey }}
            <button
              type="button"
              @click="removeCollectionKey(collectionKey)"
              class="app__chip-remove"
              :aria-label="`Remove ${collectionKey}`"
            >
              ✕
            </button>
          </Chip>
        </div>
        <p v-else class="app__empty-message">No collection keys configured</p>
      </div>
    </UtilitySection>

    <h2 style="font-weight: 500">Utilities</h2>
    <SearchContent />
    <ComingSoon>List all draft content</ComingSoon>
    <ComingSoon
      >WYSIWYG Analyzer: Search for unwanted meta HTML caused by copy and pasting</ComingSoon
    >
  </main>
  <Footer />
  <WhatsNew />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useStore } from './stores/index'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import WhatsNew from './components/WhatsNew.vue'
import InfoBanner from './components/InfoBanner.vue'
import UtilitySection from './components/UtilitySection.vue'
import TextInput from './components/TextInput.vue'
import Chip from './components/Chip.vue'
import SearchContent from './components/Features/SearchContent.vue'
import ComingSoon from './components/ComingSoon.vue'

const store = useStore()
const pageTypeInput = ref('')
const collectionKeyInput = ref('')

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
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.app {
  &__token-input-container {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  &__token-input {
    flex: 1;
  }

  &__lock-button {
    margin-top: 1.5rem;
    width: 2.5rem;
    height: 2.5rem;
    padding: 0;
    background-color: #eee;
    border: 1px solid #b3bac2;
    border-radius: 6px;
    font-size: 1.25rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    font-family: monospace;

    &:hover {
      background-color: #ddd;
    }

    &:active {
      background-color: #a8aeb8;
    }
  }

  &__checkbox-label {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 1.5rem;
    cursor: pointer;
    font-size: 0.9375rem;
    user-select: none;
  }

  &__checkbox-input {
    cursor: pointer;
    width: 1.25rem;
    height: 1.25rem;
    flex-shrink: 0;
  }

  &__config-section {
    margin-top: 1.5rem;
    padding: 1rem;
    background-color: var(--butter-light-gray);
    border-radius: 6px;
    border-left: 3px solid var(--butter-border);
  }

  &__config-title {
    font-size: 0.875rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--text-secondary);
    margin: 0 0 0.75rem 0;
  }

  &__items-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  &__empty-message {
    font-size: 0.875rem;
    color: var(--text-secondary);
    margin: 0 0 0.5rem 0;
    font-style: italic;
  }

  &__config-form {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
    align-items: flex-end;
  }

  &__config-input {
    flex: 1;
    min-width: 200px;
  }

  &__form-button {
    padding: 0.625rem 1rem;
    background-color: var(--text-primary);
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: var(--butter-dark);
    }

    &:active {
      background-color: var(--butter-dark);
      opacity: 0.8;
    }
  }

  &__item-chip {
    position: relative;
    padding-right: 0.25rem;
  }

  &__chip-remove {
    margin-left: 0.5rem;
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    font-size: 1rem;
    padding: 0 0.25rem;
    opacity: 0.6;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
    }
  }
}
</style>
