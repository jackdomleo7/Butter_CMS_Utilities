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
          placeholder="Enter your Butter CMS API Token"
          :required="true"
          :readonly="store.lockToken"
          v-model="store.token"
        >
          <template v-slot:label>Butter CMS API Token</template>
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
        <input type="checkbox" v-model="store.includePreview" class="app__checkbox-input" />
        <span>Include draft content in search results</span>
      </label>
    </UtilitySection>

    <h2 style="font-weight: 500">Available Utilities</h2>
    <SearchContent />
    <ComingSoon>List all draft content</ComingSoon>
    <ComingSoon
      >WYSIWYG Analyzer: Search for unwanted meta HTML caused by copy and pasting</ComingSoon
    >
  </main>
  <Footer />
</template>

<script setup lang="ts">
import { useStore } from './stores/index'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import InfoBanner from './components/InfoBanner.vue'
import UtilitySection from './components/UtilitySection.vue'
import TextInput from './components/TextInput.vue'
import SearchContent from './components/Utilities/SearchContent.vue'
import ComingSoon from './components/ComingSoon.vue'

const store = useStore()

function toggleTokenLock(): void {
  store.lockToken = !store.lockToken
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

    &:focus {
      outline: 2px solid #7c8db0;
      outline-offset: 2px;
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
}
</style>
