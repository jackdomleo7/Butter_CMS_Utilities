<template>
  <section class="utility-section">
    <h2 class="utility-section__title">{{ title }}</h2>
    <p class="utility-section__description" v-if="description" v-html="description" />
    <div class="utility-section__content">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<style lang="scss">
.utility-section {
  margin-block: var(--space-8);
  background-color: var(--bg-primary);
  border: 1px solid var(--border-base);
  border-radius: var(--radius-md);
  padding: var(--space-6);

  &__title {
    font-size: var(--font-size-2xl);
    color: var(--text-primary);
    margin-top: 0;
    margin-bottom: var(--space-6);
    font-weight: 600;
  }

  &__description {
    color: var(--text-secondary);
    margin-bottom: var(--space-12);
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }
}
</style>
