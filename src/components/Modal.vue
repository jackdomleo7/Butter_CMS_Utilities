<template>
  <dialog
    ref="modal"
    :id="id"
    class="modal"
    aria-modal="true"
    :aria-labelledby="`${id}-heading`"
    :aria-describedby="`${id}-description`"
    @cancel="emit('close')"
    @click="handleBackdropClick"
  >
    <div class="modal__content" role="document">
      <div class="modal__header">
        <h2 :id="`${id}-heading`"><slot name="heading" /></h2>
        <button class="modal__close" @click="emit('close')" aria-label="Close dialog">
          &times;
        </button>
      </div>
      <div class="modal__body" :id="`${id}-description`">
        <slot />
      </div>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    id: string
    open?: boolean
  }>(),
  {
    open: false,
  },
)

const modal = ref<HTMLDialogElement | null>(null)
let previousActiveElement: Element | null = null

const emit = defineEmits<{
  (e: 'close'): void
}>()

const getFocusableElements = (): HTMLElement[] => {
  if (!modal.value) return []

  const focusableSelectors = [
    'a[href]',
    'button:not([disabled])',
    'textarea:not([disabled])',
    'input[type="text"]:not([disabled])',
    'input[type="radio"]:not([disabled])',
    'input[type="checkbox"]:not([disabled])',
    'select:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',')

  return Array.from(modal.value.querySelectorAll(focusableSelectors))
}

const handleBackdropClick = (e: MouseEvent) => {
  if (e.target === modal.value) {
    emit('close')
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key !== 'Tab') return

  const focusableElements = getFocusableElements()
  if (focusableElements.length === 0) return

  const activeElement = document.activeElement as HTMLElement
  const focusedIndex = focusableElements.indexOf(activeElement)

  let nextIndex: number

  if (e.shiftKey) {
    // Shift+Tab - go backwards
    nextIndex = focusedIndex <= 0 ? focusableElements.length - 1 : focusedIndex - 1
  } else {
    // Tab - go forwards
    nextIndex = focusedIndex >= focusableElements.length - 1 ? 0 : focusedIndex + 1
  }

  e.preventDefault()
  focusableElements[nextIndex]?.focus()
}

watch(
  () => props.open,
  (newVal) => {
    if (newVal && modal.value) {
      previousActiveElement = document.activeElement
      modal.value.showModal()
      document.body.style.overflow = 'hidden'

      // Focus the first focusable element
      const focusableElements = getFocusableElements()
      if (focusableElements.length > 0) {
        focusableElements[0]?.focus()
      }

      // Add keydown listener for focus trap
      modal.value.addEventListener('keydown', handleKeyDown)
    } else if (modal.value) {
      modal.value.removeEventListener('keydown', handleKeyDown)
      modal.value.close()
      document.body.style.overflow = ''

      // Restore focus to the previously focused element
      if (previousActiveElement instanceof HTMLElement) {
        previousActiveElement.focus()
      }
    }
  },
)
</script>

<style lang="scss" scoped>
.modal {
  text-align: left;
  padding: 0;
  border: none;
  border-radius: 0.5rem;
  max-width: 62.5rem;
  width: calc(100% - 2rem);
  max-height: 90vh;
  box-shadow: 0 0.25rem 1.25rem rgba(0, 0, 0, 0.15);
  overflow-y: hidden;

  @media (forced-colors: active) {
    border: 2px solid CanvasText;
  }

  &::backdrop {
    background: rgba(0, 0, 0, 0.5);

    @media (forced-colors: active) {
      background: rgba(0, 0, 0, 0.8);
    }
  }

  &__content {
    padding: 2rem;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid var(--butter-border);
    gap: 1rem;

    h2 {
      font-size: 1.5rem;
      color: var(--butter-dark);
      font-weight: 600;
      margin: 0;
      line-height: 1.2;
    }
  }

  &__close {
    background: none;
    border: 2px solid transparent;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary);
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    min-width: 2.5rem;
    min-height: 2.5rem;

    @media (min-width: 48.0625rem) {
      min-width: 2rem;
      min-height: 2rem;
    }

    &:hover {
      background-color: var(--butter-light-gray);
      color: var(--text-primary);
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    overflow-y: auto;
  }
}
</style>
