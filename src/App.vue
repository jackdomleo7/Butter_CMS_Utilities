<template>
  <Header />
  <main>
    <InfoBanner status="info" class="app__privacy-banner">
      <p>
        <strong>🔒 Privacy First:</strong> All operations run entirely in your browser. No data is
        transmitted to third-party servers. Your Butter CMS token is used only for direct API calls
        to Butter CMS.
      </p>
    </InfoBanner>

    <ApiConfiguration />

    <h2 class="app__utilities-title">Utilities</h2>
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
import { defineAsyncComponent } from 'vue'
import Header from './components/Header.vue'
import Footer from './components/Footer.vue'
import InfoBanner from './components/InfoBanner.vue'
import ApiConfiguration from './components/ApiConfiguration.vue'
import SearchContent from './components/Features/SearchContent.vue'
import ComingSoon from './components/ComingSoon.vue'

const WhatsNew = defineAsyncComponent(() => import('./components/WhatsNew.vue'))
</script>

<style lang="scss" scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
  padding: var(--space-8) var(--space-4);
  max-width: 75rem;
  margin-inline: auto;
}

.app {
  &__privacy-banner {
    margin-bottom: var(--space-8);
  }

  &__utilities-title {
    font-size: var(--font-size-2xl);
    font-weight: 600;
    margin-bottom: var(--space-6);
    color: var(--text-primary);
  }
}
</style>
