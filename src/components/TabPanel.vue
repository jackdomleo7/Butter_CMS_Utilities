<script setup lang="ts">
import { inject, computed, onMounted, onUnmounted, type WritableComputedRef } from 'vue'

const props = defineProps<{
  label: string
  icon?: string
  index: number
}>()

const activeTabIndex = inject<WritableComputedRef<number>>('activeTabIndex')!
const registerTabPanel =
  inject<(meta: { label: string; icon?: string; index: number }) => void>('registerTabPanel')!
const unregisterTabPanel = inject<(index: number) => void>('unregisterTabPanel')!

const panelId = computed(() => `tab-panel-${props.index}`)
const isActive = computed(() => activeTabIndex.value === props.index)

onMounted(() => {
  registerTabPanel({ label: props.label, icon: props.icon, index: props.index })
})

onUnmounted(() => {
  unregisterTabPanel(props.index)
})
</script>

<template>
  <div :id="panelId" role="tabpanel" :aria-labelledby="`tab-${index}`" v-if="isActive">
    <slot />
  </div>
</template>
