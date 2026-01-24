<template>
  <section class="utility-section">
    <component :is="titleHeadingLevel" class="utility-section__title">{{ title }}</component>
    <p class="utility-section__description" v-if="description" v-html="description" />
    <div class="utility-section__content">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    titleHeadingLevel?: 'h2' | 'h3'
    description?: string
  }>(),
  {
    titleHeadingLevel: 'h3',
  },
)
</script>

<style lang="scss">
.utility-section {
  margin-block: 2rem;
  background-color: #fff;
  border: 1px solid var(--butter-border);
  border-radius: 0.5rem;
  padding: 1.5rem;

  &__title {
    font-size: 1.5rem;
    color: var(--butter-dark);
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-weight: 600;
  }

  &__description {
    color: var(--text-secondary);
    margin-bottom: 3rem;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
}
</style>
