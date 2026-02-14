<template>
  <header class="header">
    <div class="header__content">
      <h1><img src="/favicon.png" alt="" width="36" height="36" /> Butter CMS Utilities</h1>
      <p>Unofficial client-side tools for Butter CMS</p>
      <p class="header__tagline">I can't believe it's not Butter CMS!</p>
    </div>
  </header>
</template>

<style lang="scss">
.header {
  background: var(--bg-primary);
  color: var(--text-primary);
  padding: var(--space-6) var(--space-4);
  border-bottom: 1px solid var(--border-light);
  max-width: 75rem;
  margin: 0 auto;

  @media (forced-colors: active) {
    border: 1px solid CanvasText;
  }

  @media (min-width: 768px) {
    padding: var(--space-8) var(--space-6);
  }

  &__content {
    h1 {
      font-size: var(--font-size-2xl);
      font-weight: 700;
      margin-bottom: var(--space-2);
      display: flex;
      align-items: center;
      gap: var(--space-3);

      @media (min-width: 768px) {
        font-size: var(--font-size-3xl);
      }

      img {
        flex-shrink: 0;
      }
    }

    p {
      font-size: var(--font-size-base);
      color: var(--text-secondary);
      margin: 0;

      @media (min-width: 768px) {
        font-size: var(--font-size-lg);
      }
    }
  }

  &__tagline {
    font-size: var(--font-size-sm) !important;
    color: var(--text-tertiary) !important;
    font-style: italic;
    margin-top: var(--space-2) !important;
  }
}
</style>
