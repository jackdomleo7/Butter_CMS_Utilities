<template>
  <section class="coming-soon">
    Coming soon...&nbsp;
    <slot />
  </section>
</template>

<style lang="scss">
.coming-soon {
  background-color: var(--butter-light-gray);
  border: 2px dashed var(--butter-border);
  margin-block: 2rem;
  padding: 3rem 2rem;
  text-align: center;
  border-radius: 0.5rem;
  position: relative;

  p {
    margin: 0;
  }
}
</style>
