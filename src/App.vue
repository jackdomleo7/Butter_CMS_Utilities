<template>
  <Header />
  <main>
    <InfoBanner status="info" class="app__privacy-banner">
      <p>
        🔒 All operations run entirely in your browser. No data is transmitted to third-party
        servers. Your Butter CMS token is used only for direct API calls to Butter CMS.
      </p>
    </InfoBanner>

    <ApiConfiguration />

    <Tabs>
      <TabPanel label="Search" icon="🔍" :index="0">
        <SearchContent />
      </TabPanel>
      <TabPanel label="Audit" icon="⚠️" :index="1">
        <AuditContent />
      </TabPanel>
      <TabPanel label="Components" icon="🧩" :index="2">
        <ComponentsContent />
      </TabPanel>
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
import TabPanel from './components/TabPanel.vue'
import WhatsNew from './components/WhatsNew.vue'

const SearchContent = defineAsyncComponent(() => import('./components/Features/SearchContent.vue'))
const AuditContent = defineAsyncComponent(() => import('./components/Features/AuditContent.vue'))
const ComponentsContent = defineAsyncComponent(
  () => import('./components/Features/ComponentsContent.vue'),
)
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
