<template>
  <div class="chip">
    <slot />
  </div>
</template>

<style lang="scss">
.chip {
  background-color: var(--butter-yellow);
  color: var(--butter-dark);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
}
</style>
