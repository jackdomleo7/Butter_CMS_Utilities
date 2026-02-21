<template>
  <UtilitySection
    title="Component Usage Audit"
    description="Identify which of your known Butter CMS components are actually used across individual pages. Unlike Butter CMS's built-in view (which shows which page types reference a component), this tool shows which individual pages use each component — so you can spot components with zero real-world page usages."
  >
    <!-- Info Banner -->
    <InfoBanner status="info" class="components-content__info">
      <strong>Page types only:</strong> Components are only available in page types — blog posts and
      collections do not support Butter CMS components. Ensure all of your page types are added in
      API Configuration and all are selected below for a complete analysis. A component showing
      <strong>0 usages</strong> only reflects the selected page type scopes. <br /><br />
      <strong>Note:</strong> Butter CMS's built-in component view shows which
      <em>page types</em> reference a component. This tool goes further — it checks whether any
      <em>actual pages</em> use it. A component can be registered in a page type template yet have
      no real page usages.
      <strong>Do not attempt to delete a component without involving a web developer</strong> to
      verify it is not referenced in code.
    </InfoBanner>

    <!-- Guard: no known components configured -->
    <InfoBanner v-if="store.knownComponents.length === 0" status="warning">
      No known components configured. Add your component slugs in
      <strong>API Configuration → Known Components</strong> above to run an analysis.
    </InfoBanner>

    <!-- Scope Selection (page types only) -->
    <ScopeSelection
      v-if="store.knownComponents.length > 0"
      :disabled="hasResults"
      :exclude="['blog', 'collectionKeys']"
      aria-context="component audit"
    >
      <template #legend>Page Type Scopes</template>
    </ScopeSelection>

    <!-- Action Buttons -->
    <Btn v-if="store.knownComponents.length > 0 && !hasResults && !isLoading" @click="executeAudit">
      Run Analysis
    </Btn>

    <Btn v-if="hasResults" type="reset" status="tertiary" @click="resetAudit"> Reset </Btn>

    <!-- Status / Error Message -->
    <InfoBanner v-if="statusMessage && !isLoading" :status="statusType" role="alert">
      <div>{{ statusMessage }}</div>
    </InfoBanner>

    <!-- Partial Failure Warning -->
    <InfoBanner v-if="failedScopes.length > 0 && !isLoading" status="warning">
      <strong>Partial failure:</strong> Failed to fetch {{ failedScopes.join(', ') }}. Results shown
      are from successfully fetched page types only.
    </InfoBanner>

    <!-- Skeleton Loading -->
    <div v-if="isLoading" class="components-content__loading">
      <Card v-for="i in 3" :key="i" :skeleton="true" class="components-content__skeleton-card" />
    </div>

    <!-- Results -->
    <div v-if="hasResults && !isLoading">
      <!-- Summary -->
      <div class="components-content__summary" aria-live="polite" aria-atomic="true">
        Scanned <strong>{{ totalScanned }}</strong>
        {{ pluralize(totalScanned, 'page', 'pages') }} across
        <strong>{{ store.selectedScopes.pageTypes.length }}</strong>
        {{ pluralize(store.selectedScopes.pageTypes.length, 'page type', 'page types') }}. Analysed
        <strong>{{ results.length }}</strong>
        {{ pluralize(results.length, 'component', 'components') }}.
        <span v-if="orphanCount > 0" class="components-content__orphan-count">
          {{ orphanCount }} {{ pluralize(orphanCount, 'component', 'components') }} with 0 usages.
        </span>
      </div>

      <div class="components-content__results-list">
        <Card
          v-for="result in results"
          :key="result.componentSlug"
          v-memo="[result]"
          class="components-content__result-card"
          :class="{
            'components-content__result-card--orphan': result.usageCount === 0,
            'components-content__result-card--used': result.usageCount > 0,
          }"
        >
          <div class="components-content__result-header">
            <div class="components-content__result-header-left">
              <div class="components-content__result-title-wrapper">
                <code class="components-content__component-slug">{{ result.componentSlug }}</code>
              </div>
            </div>
            <Chip
              size="medium"
              class="components-content__usage-chip"
              :class="{
                'components-content__usage-chip--zero': result.usageCount === 0,
              }"
            >
              {{ result.usageCount }} {{ pluralize(result.usageCount, 'usage', 'usages') }}
            </Chip>
          </div>

          <!-- Zero usage warning -->
          <InfoBanner
            v-if="result.usageCount === 0"
            status="warning"
            class="components-content__zero-warning"
          >
            No actual pages found using this component within the selected page type scopes. Note
            that Butter CMS may still list this component as referenced if it appears in a page type
            template — this tool specifically checks individual page usage. Ensure all page types
            are selected for a complete picture.
            <strong
              >Do not delete this component without a web developer verifying it is not used in
              code.</strong
            >
          </InfoBanner>

          <!-- Usage list -->
          <div v-if="result.usages.length > 0" class="components-content__usage-list">
            <div
              v-for="usage in result.usages"
              :key="usage.slug"
              class="components-content__usage-item"
            >
              <div class="components-content__usage-item-content">
                <span
                  v-if="usage.status"
                  class="components-content__status-badge"
                  :class="`components-content__status-badge--${usage.status}`"
                  >{{ usage.status }}</span
                >
                <span class="components-content__usage-title">{{ usage.title }}</span>
                <span class="components-content__usage-meta">
                  <span class="components-content__usage-slug">{{ usage.slug }}</span>
                  <span class="components-content__usage-page-type">({{ usage.pageType }})</span>
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  </UtilitySection>
</template>

<script lang="ts" setup>
import { ref, shallowRef, computed, defineAsyncComponent } from 'vue'
import { useStore } from '@/stores/index'
import UtilitySection from '../UtilitySection.vue'
import ScopeSelection from '../ScopeSelection.vue'
import Btn from '../Btn.vue'
import InfoBanner from '../InfoBanner.vue'
import Chip from '../Chip.vue'
import { auditComponents } from '@/features/components'
import type { ComponentsResponse } from '@/features/components'
import { pluralize } from '@/utils/textNormalization'

const Card = defineAsyncComponent(() => import('../Card.vue'))

const store = useStore()

const isLoading = ref(false)
const statusMessage = ref('')
const statusType = ref<'info' | 'success' | 'error' | 'warning'>('info')
// Use shallowRef for large results array - replaced wholesale, never mutated deeply
const results = shallowRef<ComponentsResponse['results']>([])
const failedScopes = ref<string[]>([])
const totalScanned = ref(0)

const hasResults = computed(() => results.value.length > 0)
const orphanCount = computed(() => results.value.filter((r) => r.usageCount === 0).length)

function resetAudit(): void {
  results.value = []
  failedScopes.value = []
  statusMessage.value = ''
  totalScanned.value = 0
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

async function executeAudit(): Promise<void> {
  const token = store.token

  results.value = []
  failedScopes.value = []
  statusMessage.value = ''
  totalScanned.value = 0

  if (!token) {
    setStatus('Please enter your API token in the configuration above', 'error')
    return
  }

  if (store.knownComponents.length === 0) {
    setStatus(
      'No known components configured. Add component slugs in API Configuration above.',
      'error',
    )
    return
  }

  if (store.selectedScopes.pageTypes.length === 0) {
    setStatus('Please select at least one page type scope to run the analysis.', 'error')
    return
  }

  isLoading.value = true
  setStatus('Scanning pages for component usage...', 'info', true)

  try {
    const response = await auditComponents(
      token,
      store.includePreview,
      store.selectedScopes.pageTypes,
      store.knownComponents,
    )

    if (!response.success) {
      setStatus(response.error ?? 'Analysis failed', 'error')
      return
    }

    totalScanned.value = response.totalScanned
    failedScopes.value = response.failedScopes ?? []
    results.value = response.results

    const usedCount = response.results.filter((r) => r.usageCount > 0).length
    const unusedCount = response.results.length - usedCount
    setStatus(
      `Analysis complete. ${usedCount} ${pluralize(usedCount, 'component', 'components')} in use, ${unusedCount} with 0 usages.`,
      'success',
    )
  } catch (error) {
    setStatus(`Error: ${(error as Error).message}`, 'error')
  } finally {
    isLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
.components-content {
  &__info {
    margin-bottom: var(--space-6);
  }

  &__loading {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    margin-top: var(--space-6);
  }

  &__skeleton-card {
    margin-bottom: 0;
  }

  &__summary {
    background-color: var(--bg-primary);
    border: 1px solid var(--border-light);
    border-radius: var(--radius-lg);
    padding: var(--space-5);
    font-weight: 500;
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
    position: sticky;
    top: var(--space-4);
    z-index: 10;
    box-shadow: var(--shadow-sm);
    margin-bottom: var(--space-6);
  }

  &__orphan-count {
    color: var(--color-warning, #9a6700);
    font-weight: 600;
  }

  &__results-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  &__result-card {
    border-left: 3px solid var(--accent-blue);

    &--orphan {
      border-left-color: var(--color-warning-border, #e6a817);
    }

    &--used {
      border-left-color: var(--accent-blue);
    }
  }

  &__result-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-4);
    margin-bottom: var(--space-3);
    flex-wrap: wrap;
  }

  &__result-header-left {
    flex: 1;
    min-width: 0;
  }

  &__result-title-wrapper {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex-wrap: wrap;
  }

  &__component-slug {
    font-size: var(--font-size-lg);
    font-weight: 600;
    font-family: monospace;
    color: var(--text-primary);
    word-break: break-word;
    background-color: var(--bg-secondary);
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
  }

  &__usage-chip {
    flex-shrink: 0;

    &--zero {
      // Override chip with orange/warning tones for zero usage
      background-color: #fff7ca !important;
      color: #726a3a !important;
      border-color: #e6ce72 !important;
    }
  }

  &__zero-warning {
    margin-bottom: var(--space-3);
  }

  &__usage-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin-top: var(--space-2);
  }

  &__usage-item {
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    gap: var(--space-4);
    padding: var(--space-3);
    background-color: var(--bg-secondary);
    border-radius: var(--radius-sm);
    flex-wrap: wrap;
  }

  &__usage-item-content {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    flex: 1;
    min-width: 0;
  }

  // Status badge colours matching AuditContent
  &__status-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px var(--space-2);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-xs);
    font-weight: 600;
    text-transform: capitalize;
    letter-spacing: 0.03em;

    &--published {
      color: #34824d;
      background-color: #d4f4d2;
    }

    &--draft {
      color: #726a3a;
      background-color: #fff7ca;
    }

    &--scheduled {
      color: #31459a;
      background-color: #eff1ff;
    }
  }

  &__usage-title {
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--text-primary);
  }

  &__usage-meta {
    display: flex;
    gap: var(--space-2);
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
  }

  &__usage-slug {
    font-family: monospace;
  }

  &__usage-page-type {
    color: var(--text-tertiary, var(--text-secondary));
  }
}
</style>
