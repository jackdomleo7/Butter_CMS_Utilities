<template>
  <component
    :is="tag"
    :href="href"
    :type="tag === 'button' ? type : undefined"
    class="btn"
    :class="status ? `btn--${status}` : ''"
    :disabled="disabled || loading"
    :aria-busy="loading"
  >
    <span v-if="loading" class="btn__spinner" aria-hidden="true"></span>
    <slot />
  </component>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    /**
     * The HTML element to use.
     * @default "<button>"
     */
    tag?: 'button' | 'a'
    /**
     * The button type. _Ignored if not `<button>`._
     * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#type
     * @default "button"
     */
    type?: 'button' | 'submit' | 'reset'
    /**
     * _Ignored if `<button>`._
     */
    href?: string
    disabled?: boolean
    loading?: boolean
    status?: 'secondary' | 'tertiary'
  }>(),
  {
    tag: 'button',
    type: 'button',
    href: undefined,
    disabled: false,
    loading: false,
  },
)
</script>

<style lang="scss">
.btn {
  --btn-font-size: var(--font-size-base);
  --btn-background-color: var(--gray-900);
  --btn-border-color: var(--gray-900);
  --btn-color: var(--text-inverted);
  --btn-hover-background-color: var(--gray-800);
  --btn-hover-border-color: var(--gray-800);
  --btn-height: 2.75rem;

  background-color: var(--btn-background-color);
  border: 2px solid var(--btn-border-color);
  color: var(--btn-color);
  text-decoration: none;
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-md);
  cursor: pointer;
  outline-offset: 4px;
  height: var(--btn-height);
  line-height: 1;
  font-size: var(--btn-font-size);
  font-weight: 600;
  text-align: center;
  min-width: calc(var(--btn-height) * 2.25);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  user-select: none;
  position: relative;

  @media (prefers-reduced-motion: no-preference) {
    transition: all var(--transition-fast);
  }

  @media (forced-colors: active) {
    border: 1px solid CanvasText;
  }

  &--secondary {
    --btn-background-color: transparent;
    --btn-border-color: var(--gray-300);
    --btn-color: var(--text-primary);
    --btn-hover-background-color: var(--bg-secondary);
    --btn-hover-border-color: var(--gray-400);
  }

  &--tertiary {
    --btn-background-color: transparent;
    --btn-border-color: transparent;
    --btn-color: var(--text-primary);
    --btn-hover-background-color: var(--bg-secondary);
    --btn-hover-border-color: transparent;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &:not(:disabled) {
    &:hover {
      background-color: var(--btn-hover-background-color);
      border-color: var(--btn-hover-border-color);
    }

    &:active {
      @media (prefers-reduced-motion: no-preference) {
        transform: scale(0.98);
      }
    }
  }

  &__spinner {
    display: inline-block;
    width: 1rem;
    height: 1rem;
    border: 2px solid currentColor;
    border-right-color: transparent;
    border-radius: var(--radius-full);

    @media (prefers-reduced-motion: no-preference) {
      animation: spin 0.6s linear infinite;
    }
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
