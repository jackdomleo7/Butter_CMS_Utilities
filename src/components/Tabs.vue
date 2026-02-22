<script setup lang="ts">
import { ref, provide, computed, onMounted, onUnmounted, type WritableComputedRef } from 'vue'
import { useStore } from '@/stores'

interface TabMeta {
  label: string
  icon?: string
  index: number
}

const store = useStore()
const tabsRef = ref<HTMLDivElement | null>(null)

// Registry of TabPanel components' metadata
const tabMetas = ref<TabMeta[]>([])

// Sorted tab list for rendering buttons in order
const sortedTabMetas = computed(() => [...tabMetas.value].sort((a, b) => a.index - b.index))

// Keep refs to rendered tab buttons keyed by index (for focus management)
const tabButtonMap = ref(new Map<number, HTMLButtonElement>())

// Ordered button list derived from sorted metas
const sortedTabButtons = computed(() =>
  sortedTabMetas.value
    .map((meta) => tabButtonMap.value.get(meta.index))
    .filter((el): el is HTMLButtonElement => el != null),
)

// Active tab index backed by Pinia store
const activeTabIndexRef: WritableComputedRef<number> = computed({
  get: () => store.activeTabIndex,
  set: (val: number) => {
    store.activeTabIndex = val
  },
})

defineExpose({
  activeTabIndex: activeTabIndexRef,
})

provide('activeTabIndex', activeTabIndexRef)

// Provide registration functions for TabPanel components
provide('registerTabPanel', (meta: TabMeta) => {
  if (!tabMetas.value.some((t) => t.index === meta.index)) {
    tabMetas.value = [...tabMetas.value, meta]
  }
})

provide('unregisterTabPanel', (index: number) => {
  tabMetas.value = tabMetas.value.filter((t) => t.index !== index)
  tabButtonMap.value.delete(index)
})

// Button ref setter used in v-for
function setTabButtonRef(el: Element | null | undefined, index: number): void {
  if (el instanceof HTMLButtonElement) {
    tabButtonMap.value.set(index, el)
  } else {
    tabButtonMap.value.delete(index)
  }
}

function handleTabClick(index: number): void {
  activeTabIndexRef.value = index
}

function handleTabKeydown(event: KeyboardEvent, index: number): void {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    activeTabIndexRef.value = index
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  const buttons = sortedTabButtons.value
  if (buttons.length === 0) return

  // Find current position in sorted order by active tab index
  const currentPosition = sortedTabMetas.value.findIndex(
    (meta) => meta.index === activeTabIndexRef.value,
  )
  if (currentPosition === -1) return

  const lastIndex = buttons.length - 1

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      activeTabIndexRef.value =
        sortedTabMetas.value[currentPosition > 0 ? currentPosition - 1 : lastIndex]!.index
      buttons[currentPosition > 0 ? currentPosition - 1 : lastIndex]?.focus()
      break
    case 'ArrowRight':
      event.preventDefault()
      activeTabIndexRef.value =
        sortedTabMetas.value[currentPosition < lastIndex ? currentPosition + 1 : 0]!.index
      buttons[currentPosition < lastIndex ? currentPosition + 1 : 0]?.focus()
      break
    case 'Home':
      event.preventDefault()
      activeTabIndexRef.value = sortedTabMetas.value[0]!.index
      buttons[0]?.focus()
      break
    case 'End':
      event.preventDefault()
      activeTabIndexRef.value = sortedTabMetas.value[lastIndex]!.index
      buttons[lastIndex]?.focus()
      break
  }
}

onMounted(() => {
  tabsRef.value?.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  tabsRef.value?.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="tabs">
    <div ref="tabsRef" role="tablist" class="tabs__list">
      <button
        v-for="tab in sortedTabMetas"
        :key="tab.index"
        :id="`tab-${tab.index}`"
        :ref="(el) => setTabButtonRef(el as Element | null, tab.index)"
        type="button"
        role="tab"
        :aria-selected="activeTabIndexRef === tab.index"
        :aria-controls="`tab-panel-${tab.index}`"
        :tabindex="activeTabIndexRef === tab.index ? 0 : -1"
        class="tab"
        :class="{ 'tab--active': activeTabIndexRef === tab.index }"
        @click="handleTabClick(tab.index)"
        @keydown="handleTabKeydown($event, tab.index)"
      >
        <span v-if="tab.icon" class="tab__icon" aria-hidden="true">{{ tab.icon }}</span>
        <span class="tab__label">{{ tab.label }}</span>
      </button>
    </div>
    <div class="tabs__panels">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
.tabs {
  width: 100%;

  &__list {
    display: flex;
    gap: var(--space-1);
    border-bottom: 1px solid var(--border-base);
    margin-bottom: var(--space-6);
    overflow-x: auto;
  }

  &__panels {
    width: 100%;
  }
}

.tab {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  min-height: 44px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: 500;
  color: var(--text-secondary);
  position: relative;

  @media (prefers-reduced-motion: no-preference) {
    transition:
      color var(--transition-fast),
      border-color var(--transition-fast);
  }

  &:hover:not(&--active) {
    color: var(--text-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--accent-blue);
    outline-offset: 2px;
    border-radius: var(--radius-sm);
  }

  &--active {
    color: var(--text-primary);
    border-bottom-color: var(--accent-blue);
  }

  &__icon {
    font-size: var(--font-size-lg);
    line-height: 1;
  }

  &__label {
    line-height: 1;
  }

  @media (forced-colors: active) {
    &--active {
      border-bottom-color: Highlight;
      color: Highlight;
    }
  }
}
</style>
