<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    id: string
    modelValue: boolean
    disabled?: boolean
    onLabel?: string
    offLabel?: string
  }>(),
  {
    disabled: false,
    onLabel: 'On',
    offLabel: 'Off',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const currentLabel = computed(() => (props.modelValue ? props.onLabel : props.offLabel))

const handleClick = () => {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if ((event.key === ' ' || event.key === 'Enter') && !props.disabled) {
    event.preventDefault()
    emit('update:modelValue', !props.modelValue)
  }
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :id="id"
    :aria-checked="modelValue"
    :aria-label="currentLabel"
    :disabled="disabled"
    class="toggle"
    :class="{ 'toggle--on': modelValue, 'toggle--disabled': disabled }"
    @click="handleClick"
    @keydown="handleKeydown"
  >
    <span class="toggle__track">
      <span class="toggle__thumb" />
    </span>
    <span class="toggle__label">{{ currentLabel }}</span>
  </button>
</template>

<style scoped lang="scss">
.toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);

  @media (prefers-reduced-motion: no-preference) {
    transition: color var(--transition-fast);
  }

  &:hover:not(&--disabled) {
    color: var(--text-primary);
  }

  &--disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  /* Remove default focus outline */
  &:focus-visible {
    outline: none;
  }

  /* Apply focus ring to track only */
  &:focus-visible &__track {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
  }

  &__track {
    position: relative;
    display: inline-block;
    width: 2.75rem;
    height: 1.5rem;
    background-color: var(--gray-300);
    border-radius: var(--radius-full);
    flex-shrink: 0;

    @media (prefers-reduced-motion: no-preference) {
      transition: background-color var(--transition-base);
    }

    @media (forced-colors: active) {
      border: 1px solid CanvasText;
    }

    .toggle--on & {
      background-color: var(--accent-blue);
    }

    .toggle--disabled & {
      background-color: var(--gray-200);
    }
  }

  &__thumb {
    position: absolute;
    top: 0.125rem;
    left: 0.125rem;
    width: 1.25rem;
    height: 1.25rem;
    background-color: var(--bg-primary);
    border-radius: var(--radius-full);
    box-shadow: var(--shadow-sm);

    @media (prefers-reduced-motion: no-preference) {
      transition: transform var(--transition-base);
    }

    .toggle--on & {
      transform: translateX(1.25rem);
    }
  }

  &__label {
    user-select: none;
    font-weight: 500;
  }
}
</style>
