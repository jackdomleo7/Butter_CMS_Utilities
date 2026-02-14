<script setup lang="ts">
withDefaults(
  defineProps<{
    skeleton?: boolean
    clickable?: boolean
  }>(),
  {
    skeleton: false,
    clickable: false,
  },
)
</script>

<template>
  <div
    class="card"
    :class="{ 'card--skeleton': skeleton, 'card--clickable': clickable }"
    :aria-busy="skeleton"
    :aria-label="skeleton ? 'Loading' : undefined"
  >
    <template v-if="skeleton">
      <div class="skeleton skeleton--badge"></div>
      <div class="skeleton skeleton--title"></div>
      <div class="skeleton skeleton--slug"></div>
      <div class="skeleton skeleton--line skeleton--line-full"></div>
      <div class="skeleton skeleton--line skeleton--line-90"></div>
      <div class="skeleton skeleton--line skeleton--line-70"></div>
    </template>
    <template v-else>
      <slot />
    </template>
  </div>
</template>

<style scoped lang="scss">
.card {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);

  &--clickable {
    cursor: pointer;

    &:hover {
      box-shadow: var(--shadow-md);
      border-color: var(--border-base);
    }
  }

  &--skeleton {
    pointer-events: none;
  }

  @media (forced-colors: active) {
    border: 1px solid CanvasText;
  }

  @media (prefers-reduced-motion: no-preference) {
    transition: all var(--transition-fast);
  }
}

/* Skeleton Loader Styles */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.skeleton {
  background: linear-gradient(90deg, var(--gray-200) 0%, var(--gray-100) 50%, var(--gray-200) 100%);
  background-size: 200% 100%;
  border-radius: var(--radius-sm);

  @media (prefers-reduced-motion: no-preference) {
    animation: shimmer 1.5s ease-in-out infinite;
  }

  &--badge {
    width: 3.75rem;
    height: 1.25rem;
    margin-bottom: var(--space-3);
  }

  &--title {
    width: 80%;
    height: 1.5rem;
    margin-bottom: var(--space-2);
  }

  &--slug {
    width: 40%;
    height: 0.875rem;
    margin-bottom: var(--space-4);
  }

  &--line {
    height: 1rem;
    margin-bottom: var(--space-2);

    &-full {
      width: 100%;
    }

    &-90 {
      width: 90%;
    }

    &-70 {
      width: 70%;
    }

    &:last-child {
      margin-bottom: 0;
    }
  }
}
</style>
