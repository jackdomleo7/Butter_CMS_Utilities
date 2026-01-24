<template>
  <component
    :is="tag"
    :href="href"
    :type="tag === 'button' ? type : undefined"
    class="btn"
    :disabled="disabled"
  >
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
  }>(),
  {
    tag: 'button',
    type: 'button',
    href: undefined,
    disabled: false,
  },
)
</script>

<style lang="scss">
.btn {
  --btn-font-size: 1rem;
  --btn-background-color: var(--butter-yellow);
  --btn-border-color: var(--butter-yellow);
  --btn-color: var(--butter-dark);
  --btn-hover-background-color: #e5a512;
  --btn-hover-border-color: #e5a512;
  --btn-height: calc(var(--btn-font-size) * 2.5);

  background-color: var(--btn-background-color);
  border: 2px solid var(--btn-border-color);
  color: var(--btn-color);
  text-decoration: none;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
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
  gap: 0.5rem;
  user-select: none;
  position: relative;

  &:disabled {
    cursor: default;
    opacity: 0.7;
  }

  &:not(:disabled) {
    &:hover,
    &:active {
      background-color: var(--btn-hover-background-color);
      border-color: var(--btn-hover-border-color);
    }

    &:active {
      @media (prefers-reduced-motion: no-preference) {
        transform: scale(0.98);
      }
    }
  }
}
</style>
