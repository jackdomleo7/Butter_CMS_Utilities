<script setup lang="ts">
import { inject, ref, computed, onMounted, onUnmounted, type Ref } from 'vue'

const props = defineProps<{
  label: string
  icon?: string
  panelId: string
  index: number
}>()

const tabRef = ref<HTMLButtonElement | null>(null)
const activeTabIndex = inject<Ref<number>>('activeTabIndex')!
const registerTab = inject<(el: HTMLButtonElement) => void>('registerTab')!
const unregisterTab = inject<(el: HTMLButtonElement) => void>('unregisterTab')!

const isSelected = computed(() => activeTabIndex.value === props.index)

const handleClick = () => {
  activeTabIndex.value = props.index
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === ' ' || event.key === 'Enter') {
    event.preventDefault()
    activeTabIndex.value = props.index
  }
}

onMounted(() => {
  if (tabRef.value) {
    registerTab(tabRef.value)
  }
})

onUnmounted(() => {
  if (tabRef.value) {
    unregisterTab(tabRef.value)
  }
})
</script>

<template>
  <button
    :id="`tab-${index}`"
    ref="tabRef"
    type="button"
    role="tab"
    :aria-selected="isSelected"
    :aria-controls="panelId"
    :tabindex="isSelected ? 0 : -1"
    class="tab"
    :class="{ 'tab--active': isSelected }"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <span v-if="icon" class="tab__icon" aria-hidden="true">{{ icon }}</span>
    <span class="tab__label">{{ label }}</span>
  </button>
</template>

<style scoped lang="scss">
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
