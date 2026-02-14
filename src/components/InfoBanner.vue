<template>
  <div class="info-banner" :class="`info-banner--${status}`">
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    status?: 'info' | 'warning' | 'error' | 'success'
  }>(),
  {
    status: 'info',
  },
)
</script>

<style lang="scss">
.info-banner {
  --info-banner-bg-color: var(--info-bg);
  --info-banner-border-color: var(--info);
  --info-banner-text-color: var(--text-primary);

  background-color: var(--info-banner-bg-color);
  border-left: 4px solid var(--info-banner-border-color);
  color: var(--info-banner-text-color);
  padding: var(--space-4) var(--space-5);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-relaxed);

  &--warning {
    --info-banner-bg-color: var(--warning-bg);
    --info-banner-border-color: var(--warning);
  }

  &--error {
    --info-banner-bg-color: var(--error-bg);
    --info-banner-border-color: var(--error);
  }

  &--success {
    --info-banner-bg-color: var(--success-bg);
    --info-banner-border-color: var(--success);
  }

  p {
    margin: 0;
  }

  strong {
    font-weight: 600;
  }
}
</style>
