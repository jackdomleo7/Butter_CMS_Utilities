<script setup lang="ts">
import { ref, provide, onMounted, onUnmounted, computed, type WritableComputedRef } from 'vue'
import { useStore } from '@/stores'

const store = useStore()
const tabsRef = ref<HTMLDivElement | null>(null)
const tabButtons = ref<HTMLButtonElement[]>([])

// Create a writable computed that directly accesses the store
// This acts as a proper Ref<number> for provide/inject
const activeTabIndexRef: WritableComputedRef<number> = computed({
  get: () => store.activeTabIndex,
  set: (val: number) => {
    store.activeTabIndex = val
  },
})

// Expose activeTabIndex for use in template slots
defineExpose({
  activeTabIndex: activeTabIndexRef,
})

provide('activeTabIndex', activeTabIndexRef)
provide('registerTab', (tabElement: HTMLButtonElement) => {
  if (!tabButtons.value.includes(tabElement)) {
    tabButtons.value.push(tabElement)
  }
})
provide('unregisterTab', (tabElement: HTMLButtonElement) => {
  const index = tabButtons.value.indexOf(tabElement)
  if (index > -1) {
    tabButtons.value.splice(index, 1)
  }
})

const handleKeydown = (event: KeyboardEvent) => {
  const currentIndex = activeTabIndexRef.value
  const lastIndex = tabButtons.value.length - 1

  switch (event.key) {
    case 'ArrowLeft':
      event.preventDefault()
      activeTabIndexRef.value = currentIndex > 0 ? currentIndex - 1 : lastIndex
      tabButtons.value[activeTabIndexRef.value]?.focus()
      break
    case 'ArrowRight':
      event.preventDefault()
      activeTabIndexRef.value = currentIndex < lastIndex ? currentIndex + 1 : 0
      tabButtons.value[activeTabIndexRef.value]?.focus()
      break
    case 'Home':
      event.preventDefault()
      activeTabIndexRef.value = 0
      tabButtons.value[0]?.focus()
      break
    case 'End':
      event.preventDefault()
      activeTabIndexRef.value = lastIndex
      tabButtons.value[lastIndex]?.focus()
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
      <slot name="tabs" />
    </div>
    <div class="tabs__panels">
      <slot name="panels" :activeTabIndex="store.activeTabIndex" />
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
  }

  &__panels {
    width: 100%;
  }
}
</style>
