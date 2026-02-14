<template>
  <UtilitySection
    title="Audit HTML Bloat"
    description="Detects bloated HTML attributes from design tools (Figma), word processors (Microsoft Office, Google Docs), rich text editors, and inline handlers that inflate page size. Review each finding to determine if it needs the attribute and value removed, or the entire element removed. Some issues flagged may be false positives depending on your content and use of attributes, so manual review is recommended."
  >
    <!-- Information Banner -->
    <InfoBanner status="info" class="audit-content__info">
      <strong>What this checks:</strong> HTML attributes from Microsoft Office (<code>mso-</code>,
      <code>data-contrast</code>, <code>paraid=</code>), Figma (<code>figma=</code>,
      <code>data-figma-</code>), Google Docs (<code>google-</code>), rich text editors
      (<code>data-pm-slice</code>), generic data attributes (<code>data-*</code>), and inline
      handlers (<code>onclick=</code>). These often appear when content is copied without proper
      formatting. <strong>Prevention tip:</strong> Always paste content without formatting
      (Ctrl+Shift+V). <strong>Remediation:</strong> Review surrounding HTML - you may need to remove
      just the attribute and value, or the entire element.
    </InfoBanner>

    <!-- Audit Scopes Selection -->
    <ScopeSelection :disabled="hasResults" aria-context="audit">
      <template #legend>Audit Scopes</template>
    </ScopeSelection>

    <!-- Action Buttons -->
    <Btn @click="executeAudit" v-if="!hasResults && !isLoading"> Run Audit </Btn>

    <Btn v-if="hasResults || statusMessage" type="reset" status="tertiary" @click="resetAudit">
      Reset
    </Btn>

    <!-- Status Message -->
    <InfoBanner v-if="statusMessage && !isLoading" :status="statusType" role="alert">
      <div>{{ statusMessage }}</div>
    </InfoBanner>

    <!-- Partial Failure Warning -->
    <InfoBanner v-if="failedScopes.length > 0 && !isLoading" status="warning">
      <strong>Partial failure:</strong> Failed to fetch {{ failedScopes.join(', ') }}. Showing
      results from successfully fetched scopes only.
    </InfoBanner>

    <!-- Skeleton Loading States -->
    <div v-if="isLoading" class="audit-content__loading">
      <Card v-for="i in 3" :key="i" :skeleton="true" class="audit-content__skeleton-card" />
    </div>

    <!-- Results -->
    <div v-if="results.length > 0 && !isLoading" id="auditResultsContainer">
      <div class="audit-content__summary" aria-live="polite" aria-atomic="true">
        Found <strong>{{ issuesSummary }}</strong
        >. Patterns detected:
        <strong>{{ patternsFound.join(', ') }}</strong>
      </div>
      <div class="results-list">
        <Card
          v-for="(result, index) in results"
          :key="index"
          v-memo="[result]"
          class="audit-content__result-card"
        >
          <div class="audit-content__result-header">
            <div class="audit-content__result-header-left">
              <div class="audit-content__result-title-wrapper">
                <Chip size="small">{{ result.sourceType }}</Chip>
                <span class="audit-content__result-title">{{ result.title }}</span>
              </div>
              <div class="audit-content__result-slug">{{ result.slug }}</div>
            </div>
            <Chip size="medium" class="audit-content__issue-count">
              {{ getResultIssueCount(result) }}
              {{ pluralize(getResultIssueCount(result), 'issue', 'issues') }}
            </Chip>
          </div>
          <div class="audit-content__issues-list">
            <div
              v-for="(issue, iIndex) in result.issues"
              :key="iIndex"
              class="audit-content__issue-item"
            >
              <div class="audit-content__issue-header">
                <Chip size="small" class="audit-content__issue-pattern">{{ issue.pattern }}</Chip>
                <span class="audit-content__issue-path">{{ issue.path }}</span>
              </div>
              <div
                class="audit-content__issue-value"
                v-html="highlightPattern(issue.value, issue.pattern)"
              ></div>
            </div>
          </div>
        </Card>
      </div>
    </div>

    <!-- No Results Message -->
    <div v-if="!isLoading && hasResults && results.length === 0" class="audit-content__no-issues">
      <InfoBanner status="success">
        <strong>Great!</strong> No HTML bloat detected in the audited content.
      </InfoBanner>
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
import { auditContent } from '@/features/audit'
import type { AsyncReturnType } from 'type-fest'

const Card = defineAsyncComponent(() => import('../Card.vue'))

const store = useStore()

const isLoading = ref(false)
const statusMessage = ref('')
const statusType = ref<'info' | 'success' | 'error' | 'warning'>('info')
// Use shallowRef for large results array - we replace it wholesale, never mutate deeply
const results = shallowRef<AsyncReturnType<typeof auditContent>['results']>([])
const failedScopes = ref<string[]>([])
const totalIssues = ref(0)
const patternsFound = ref<string[]>([])

const hasResults = computed(() => results.value.length > 0 || statusMessage.value !== '')

// Utility functions
function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural
}

function escapeHtml(str: string): string {
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

function highlightPattern(text: string, pattern: string): string {
  const escapedText = escapeHtml(text)
  const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escapedPattern})`, 'gi')
  return escapedText.replace(regex, '<mark>$1</mark>')
}

function resetAudit(): void {
  results.value = []
  failedScopes.value = []
  statusMessage.value = ''
  totalIssues.value = 0
  patternsFound.value = []
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

// Main audit execution
async function executeAudit(): Promise<void> {
  const token = store.token

  results.value = []
  failedScopes.value = []
  statusMessage.value = ''
  totalIssues.value = 0
  patternsFound.value = []

  if (!token) {
    setStatus('Please enter your API token in the configuration above', 'error')
    return
  }

  isLoading.value = true
  setStatus('Auditing content...', 'info', true)

  try {
    const auditResponse = await auditContent(
      token,
      store.includePreview,
      store.selectedScopes.pageTypes,
      store.selectedScopes.collectionKeys,
      store.selectedScopes.blog,
    )

    if (!auditResponse.success) {
      failedScopes.value = auditResponse.failedScopes || []
      setStatus(auditResponse.error!, 'error')
      return
    }

    totalIssues.value = auditResponse.totalIssues
    patternsFound.value = auditResponse.patternsFound
    failedScopes.value = auditResponse.failedScopes || []

    if (auditResponse.results.length === 0) {
      setStatus('No HTML bloat detected! Your content is clean.', 'success', false)
    } else {
      setStatus(
        `Found ${auditResponse.totalIssues} potential ${pluralize(auditResponse.totalIssues, 'issue', 'issues')} across ${auditResponse.results.length} ${pluralize(auditResponse.results.length, 'item', 'items')}`,
        'success',
        false,
      )
      results.value = auditResponse.results
    }
  } catch (error) {
    setStatus(`Error: ${(error as Error).message}`, 'error')
  } finally {
    isLoading.value = false
  }
}

function getResultIssueCount(
  result: AsyncReturnType<typeof auditContent>['results'][number],
): number {
  return result.issues.reduce((sum, issue) => sum + issue.count, 0)
}

// Computed property for issues summary with scope breakdown (matching SearchContent format)
const issuesSummary = computed(() => {
  if (results.value.length === 0) return ''

  // Group issues by source type
  const issuesByScope: Record<string, number> = {}
  results.value.forEach((result) => {
    const count = getResultIssueCount(result)
    issuesByScope[result.sourceType] = (issuesByScope[result.sourceType] || 0) + count
  })

  // Build scope breakdown string
  const scopeBreakdown = Object.entries(issuesByScope)
    .map(([scope, count]) => `${count} in ${scope}`)
    .join(', ')

  return `${totalIssues.value} potential ${pluralize(totalIssues.value, 'issue', 'issues')}: ${scopeBreakdown}`
})
</script>

<style lang="scss" scoped>
.audit-content {
  // Info banner
  &__info {
    margin-bottom: var(--space-6);

    code {
      background-color: var(--bg-secondary);
      padding: 0 var(--space-1);
      border-radius: var(--radius-sm);
      font-size: var(--font-size-sm);
      font-family: monospace;
    }
  }

  // Loading skeleton
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

  // Result cards
  &__result-card {
    margin-bottom: var(--space-4);
    border-left: 3px solid var(--accent-blue);
  }

  &__result-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
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
    margin-bottom: var(--space-2);
    flex-wrap: wrap;
  }

  &__result-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--text-primary);
    word-break: break-word;
  }

  &__result-slug {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    font-family: monospace;
    word-break: break-all;
  }

  &__issue-count {
    flex-shrink: 0;
  }

  // Issues list
  &__issues-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  &__issue-item {
    padding: var(--space-3);
    background-color: var(--bg-secondary);
    border-radius: var(--radius-sm);
    border-left: 3px solid var(--accent-blue);
  }

  &__issue-header {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-2);
    flex-wrap: wrap;
  }

  &__issue-pattern {
    font-family: monospace;
    flex-shrink: 0;
  }

  &__issue-path {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    font-family: monospace;
    word-break: break-word;
  }

  &__issue-value {
    font-size: var(--font-size-sm);
    font-family: monospace;
    color: var(--text-secondary);
    padding: var(--space-2);
    background-color: var(--bg-primary);
    border-radius: var(--radius-sm);
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;

    :deep(mark) {
      background-color: var(--accent-yellow);
      color: var(--text-primary);
      padding: 0 2px;
      border-radius: 2px;
    }
  }

  // No issues message
  &__no-issues {
    margin-top: var(--space-6);
  }
}

.results-list {
  display: flex;
  flex-direction: column;
}
</style>
