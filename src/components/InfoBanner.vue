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
  --info-banner-bg-color: #eff8ff;
  --info-banner-border-color: #2e90fa;
  --info-banner-text-color: #175cd3;

  background-color: var(--info-banner-bg-color);
  border-left: 4px solid var(--info-banner-border-color);
  color: var(--info-banner-text-color);
  padding: 1rem 1.25rem;
  margin-bottom: 2rem;
  border-radius: 4px;
  font-size: 1rem;
  line-height: 1.5rem;

  &--warning {
    --info-banner-bg-color: #fef6e7;
    --info-banner-border-color: var(--warning);
    --info-banner-text-color: var(--text-secondary);
  }

  &--error {
    --info-banner-bg-color: #fef3f2;
    --info-banner-border-color: var(--error);
    --info-banner-text-color: #b42318;
  }

  &--success {
    --info-banner-bg-color: #ecfdf3;
    --info-banner-border-color: var(--success);
    --info-banner-text-color: #027a48;
  }

  p {
    margin: 0;
  }
}
</style>
