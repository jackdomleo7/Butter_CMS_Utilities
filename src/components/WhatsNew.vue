<template>
  <Modal id="whatsNew" :open="showModal" @close="showModal = false">
    <template #heading>Since you last visited</template>
    <InfoBanner
      v-for="feature in newFeatures"
      :key="feature.id"
      :status="
        feature.type === 'bugfix' ? 'error' : feature.type === 'improvement' ? 'success' : 'info'
      "
      class="whats-new-item"
    >
      <h3>
        {{
          feature.type === 'bugfix'
            ? '🐞 Bug Fix'
            : feature.type === 'improvement'
              ? '🛠️ Improvement'
              : '✨ New Feature'
        }}: {{ feature.title }}
      </h3>
      <p v-html="feature.description" />
      <small>{{ formatDate(feature.utcDatetimeAdded) }}</small>
    </InfoBanner>
  </Modal>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import InfoBanner from './InfoBanner.vue'
import Modal from './Modal.vue'

interface Feature {
  id: string
  type: 'feature' | 'improvement' | 'bugfix'
  title: string
  description: string
  utcDatetimeAdded: Date
}

const showModal = ref<boolean>(false)

const features: Feature[] = [
  {
    id: 'complete-ui-redesign',
    type: 'improvement',
    title: 'Complete UI/UX redesign',
    description:
      "To celebrate Valentine's Day, I put all my love into a complete UI/UX redesign. The entire application has been redesigned with a focus on clean, functional minimalism and content legibility. Apologies to anyone who felt like they needed to wear sunglasses to use the previous design because of all the yellow. The new design also contains various accessibility improvements.",
    utcDatetimeAdded: new Date('2026-02-14T13:45:00Z'),
  },
  {
    id: 'api-config-delete-keys',
    type: 'bugfix',
    title: 'Deleting page types or collection keys may have caused errors when searching content',
    description:
      'If you deleted a page type or a collection key from the API Configuration section, you may have encountered errors when searching content that belonged to those page types or collection keys because they were still included in the search scope if you had them selected when you deleted them. This has now been fixed so that deleting page types or collection keys will no longer cause errors in the Search Content utility.',
    utcDatetimeAdded: new Date('2026-02-10T20:45:00Z'),
  },
  {
    id: 'search-content-negate',
    type: 'improvement',
    title: 'Ability to negate search in Search Content to find items NOT containing search term',
    description:
      'You can now negate your search in the Search Content utility to find items that do NOT contain your search term. This is useful for finding items that may be missing a term you expected to be there, or for excluding common terms to find more specific results. Simply check the "Show items NOT containing search term" checkbox.',
    utcDatetimeAdded: new Date('2026-02-08T20:30:00Z'),
  },
  {
    id: 'search-content-multi-scope',
    type: 'improvement',
    title:
      'Define and store your known page types & collections keys, and search across them simultaneously',
    description:
      'You can now use the API Configuration UI to store your known page types and collection keys. These will be remembered on your device. Use these to use the new checkbox-UI in the Search Content utility to search across all your content simultaneously, instead of having to search each page type and collection separately.',
    utcDatetimeAdded: new Date('2026-02-08T20:15:00Z'),
  },
  {
    id: 'search-content-alt-text',
    type: 'bugfix',
    title: 'Fix Search Content not searching new alt text API',
    description:
      "The Search Content utility now searches Butter CMS's new embedded alt text field for images, which was recently added to their API.",
    utcDatetimeAdded: new Date('2026-02-06T15:00:00Z'),
  },
  {
    id: 'search-content-skip-meta',
    type: 'bugfix',
    title: 'Fix Search Content skipping meta fields',
    description:
      'The Search Content utility was skipping over <code>meta</code> fields, which is unideal if one of your custom fields is called <code>meta</code>. This has now been fixed so that <code>meta</code> fields are included in search results.',
    utcDatetimeAdded: new Date('2026-02-06T15:00:00Z'),
  },
  {
    id: 'search-content-levels5-search',
    type: 'bugfix',
    title: 'Fix Search Content to include maximum level of JSON nesting',
    description:
      'The Search Content utility now correctly searches through all levels of nested JSON content, ensuring that deeply nested fields are included in search results instead of the default shallow JSON.',
    utcDatetimeAdded: new Date('2026-02-04T08:30:00Z'),
  },
  {
    id: 'search-content-nbsp-whitespace-fix',
    type: 'bugfix',
    title: 'Normalise &nbsp; and spaces',
    description:
      'Searching for a "<code> </code>" (space) now also returns results with non-breaking spaces (<code>&amp;nbsp;</code>), and vice versa.',
    utcDatetimeAdded: new Date('2026-01-24T19:30:00Z'),
  },
  {
    id: 'search-content',
    type: 'feature',
    title: 'Search Content',
    description:
      'New feature to search through all Butter CMS content, including drafts, page types, collections, and the blog.',
    utcDatetimeAdded: new Date('2026-01-24T15:00:00Z'),
  },
]

const newFeatures = ref<Feature[]>([])

const LAST_VISIT_KEY = 'butter_cms_last_visit'

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).format(date)
}

function getLastVisitDate(): Date | null {
  const stored = localStorage.getItem(LAST_VISIT_KEY)
  return stored ? new Date(stored) : null
}

function updateLastVisitDate(): void {
  localStorage.setItem(LAST_VISIT_KEY, new Date().toISOString())
}

function getNewFeatures(): Feature[] {
  const lastVisit = getLastVisitDate()

  if (!lastVisit) {
    // First visit, user does not need to see the recent changes
    return []
  }

  // Filter features newer than last visit
  return features.filter((feature) => feature.utcDatetimeAdded > lastVisit)
}

onMounted(() => {
  newFeatures.value = getNewFeatures()

  if (newFeatures.value.length > 0) {
    showModal.value = true
    console.log('New features since last visit:', newFeatures.value)
  }

  updateLastVisitDate()
})
</script>

<style lang="scss" scoped>
.whats-new-item {
  margin-bottom: var(--space-4);

  &:last-child {
    margin-bottom: 0;
  }

  h3 {
    margin: 0;
    font-size: var(--font-size-base);
    font-weight: 600;
  }

  p {
    margin-block: var(--space-3);
    font-size: var(--font-size-sm);
    line-height: var(--line-height-relaxed);
  }

  small {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    display: block;
    margin-top: var(--space-2);
  }
}
</style>
