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

    <Tabs>
      <template #tabs>
        <Tab label="Search" icon="🔍" panel-id="search-panel" :index="0" />
        <Tab label="Audit" icon="⚠️" panel-id="audit-panel" :index="1" />
      </template>
      <template #panels="{ activeTabIndex }">
        <div id="search-panel" role="tabpanel" aria-labelledby="tab-0" v-if="activeTabIndex === 0">
          <SearchContent />
        </div>
        <div
          id="audit-panel"
          role="tabpanel"
          aria-labelledby="tab-1"
          v-else-if="activeTabIndex === 1"
        >
          <AuditContent />
        </div>
      </template>
    </Tabs>
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
import Tabs from './components/Tabs.vue'
import Tab from './components/Tab.vue'
import WhatsNew from './components/WhatsNew.vue'

const SearchContent = defineAsyncComponent(() => import('./components/Features/SearchContent.vue'))
const AuditContent = defineAsyncComponent(() => import('./components/Features/AuditContent.vue'))
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
}
</style>
