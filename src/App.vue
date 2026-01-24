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
      <TextInput
        id="butter-api-token"
        type="password"
        placeholder="Enter your Butter CMS API Token"
        :required="true"
        v-model="store.token"
      >
        <template v-slot:label>Butter CMS API Token</template>
        <template v-slot:error v-if="!store.token"
          >Please provide your Butter CMS API Token</template
        >
      </TextInput>
    </UtilitySection>

    <h2 style="font-weight: 500">Available Utilities</h2>
    <SearchPages />
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
import SearchPages from './components/Utilities/SearchPages.vue'

const store = useStore()
</script>

<style lang="scss">
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
</style>
