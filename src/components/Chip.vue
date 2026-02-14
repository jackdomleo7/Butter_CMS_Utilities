<template>
  <span class="chip" :class="{ 'chip--medium': size === 'medium', 'chip--removable': removable }">
    <slot />
    <button
      v-if="removable"
      type="button"
      class="chip__remove"
      aria-label="Remove"
      @click="emit('remove')"
    >
      ×
    </button>
  </span>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'small' | 'medium'
    removable?: boolean
  }>(),
  {
    size: 'small',
    removable: false,
  },
)

const emit = defineEmits<{
  remove: []
}>()
</script>

<style lang="scss">
.chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  background-color: var(--gray-100);
  color: var(--text-primary);
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
  border: 1px solid var(--border-light);

  &--medium {
    padding: var(--space-2) var(--space-4);
    font-size: var(--font-size-sm);
  }

  &--removable {
    padding-right: var(--space-2);
  }

  &__remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-1);
    margin: 0;
    background: none;
    border: none;
    cursor: pointer;
    font-size: var(--font-size-base);
    line-height: 1;
    color: var(--text-secondary);
    min-width: 1.5rem;
    min-height: 1.5rem;

    @media (prefers-reduced-motion: no-preference) {
      transition: color var(--transition-fast);
    }

    @media (forced-colors: active) {
      border: 1px solid CanvasText;
    }

    &:hover {
      color: var(--text-primary);
    }
  }
}
</style>
