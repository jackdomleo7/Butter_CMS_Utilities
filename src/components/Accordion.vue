<script setup lang="ts">
import { ref, watch } from 'vue'

const detailsElement = ref<HTMLDetailsElement | null>(null)

const props = withDefaults(
  defineProps<{
    open?: boolean
  }>(),
  {
    open: false,
  },
)

const isOpen = ref(props.open)

watch(
  () => props.open,
  (newValue) => {
    isOpen.value = newValue
  },
)

const handleToggle = (): void => {
  if (detailsElement.value) {
    isOpen.value = detailsElement.value.open
  }
}
</script>

<template>
  <div class="accordion">
    <details ref="detailsElement" :open="open" @toggle="handleToggle">
      <summary class="accordion__title">
        <span class="accordion__title-content">
          <slot name="title" />
        </span>
        <span class="accordion__chevron" aria-hidden="true">▼</span>
      </summary>
    </details>
    <div class="accordion__content" role="region" :inert="!isOpen">
      <div class="accordion__content-inner">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.accordion {
  width: 100%;
  max-width: 100%;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  background-color: var(--bg-primary);

  @media (forced-colors: active) {
    border: 1px solid CanvasText;
  }

  details {
    margin: 0;

    &::-webkit-details-marker {
      display: none;
    }

    &[open] {
      + .accordion__content {
        padding: var(--space-4);
        padding-top: 0;
        border-width: 1px;
        grid-template-rows: 1fr;
      }

      .accordion__title {
        background-color: var(--bg-secondary);
      }

      .accordion__chevron {
        transform: rotate(-180deg);
      }
    }
  }

  &__title {
    padding: var(--space-4);
    margin: 0;
    display: flex;
    gap: var(--space-3);
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    list-style: none;
    user-select: none;
    background: transparent;
    border: none;
    border-radius: calc(var(--radius-lg) - 2px);

    @media (prefers-reduced-motion: no-preference) {
      transition: background-color var(--transition-fast);
    }

    &:hover {
      background-color: var(--bg-secondary);
    }
  }

  &__title-content {
    flex: 1;
    display: flex;
    align-items: center;
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  &__chevron {
    display: inline-block;
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    flex-shrink: 0;

    @media (prefers-reduced-motion: no-preference) {
      transition: transform var(--transition-base);
    }
  }

  &__content {
    display: grid;
    grid-template-rows: 0fr;
    padding: 0 var(--space-4);
    padding-top: 0;
    border-width: 0;

    @media (prefers-reduced-motion: no-preference) {
      transition: var(--transition-slow);
      transition-property: grid-template-rows, padding, border-width;
    }
  }

  &__content-inner {
    overflow: hidden;
    margin: 0;
    padding: 0;

    > :first-child {
      margin-top: 0;
    }

    > :last-child {
      margin-bottom: 0;
    }
  }
}
</style>
