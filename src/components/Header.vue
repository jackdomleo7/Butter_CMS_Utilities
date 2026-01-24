<template>
  <header class="header">
    <div class="header__content">
      <h1>🧈 Butter CMS Utilities</h1>
      <p>Unofficial client-side tools for Butter CMS</p>
      <p style="font-size: 0.875rem">I can't believe it's not Butter CMS!</p>
    </div>
  </header>
</template>

<style lang="scss">
.header {
  background: linear-gradient(135deg, var(--butter-yellow) 0%, #ffa500 100%);
  color: var(--butter-dark);
  padding: 1.5rem 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  @media (min-width: 768px) {
    padding: 2rem 1.5rem;
  }

  &__content {
    max-width: 1200px;
    margin: 0 auto;

    h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;

      @media (min-width: 768px) {
        font-size: 2rem;
      }
    }

    p {
      font-size: 1rem;
      opacity: 0.9;

      @media (min-width: 768px) {
        font-size: 1.125rem;
      }
    }
  }
}
</style>
