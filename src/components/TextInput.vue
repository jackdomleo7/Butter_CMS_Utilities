<template>
  <div class="textinput" :class="rootClass" :style="rootStyle">
    <label class="textinput__label" :for="id" :class="{ 'sr-only': hiddenLabel }">
      <slot name="label" /><template v-if="$attrs.required"
        ><span class="textinput__asterisk" aria-hidden="true">*</span>
        <span class="sr-only">(required)</span></template
      >
    </label>
    <div class="textinput__input-wrapper">
      <input
        v-bind="$attrs"
        class="textinput__input"
        :id="id"
        :type="type"
        :value="modelValue"
        :aria-invalid="status === 'error' ? 'true' : status === 'success' ? 'false' : undefined"
        :aria-errormessage="$slots.error ? `${id}-error` : undefined"
        :aria-describedby="$slots.description ? `${id}-description` : undefined"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <span v-if="status" class="textinput__validation-icon" aria-hidden="true"
        ><template v-if="status === 'error'">✘</template
        ><template v-if="status === 'success'">✔</template></span
      >
    </div>
    <div v-if="$slots.error" class="textinput__error" :id="`${id}-error`">
      <slot name="error" />
    </div>
    <div v-if="$slots.description" class="textinput__description" :id="`${id}-description`">
      <slot name="description" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useAttrs, type PropType } from 'vue'

const $attrs = useAttrs()

defineOptions({
  inheritAttrs: false,
})

defineProps({
  rootClass: {
    type: String,
    default: undefined,
  },
  rootStyle: {
    type: String,
    default: undefined,
  },
  id: {
    type: String,
    required: true,
    validator: (value: string): boolean => !/\s/g.test(value), // no whitespace
  },
  /**
   * The type of the input. Will only allow text-based types. If another type is needed, see other components.
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input#input_types
   */
  type: {
    type: String as PropType<'text' | 'email' | 'tel' | 'url' | 'password' | 'search'>,
    default: 'text',
  },
  status: {
    type: String as PropType<'success' | 'error'>,
    default: undefined,
  },
  hiddenLabel: {
    type: Boolean,
    default: false,
  },

  // v-model
  modelValue: {
    type: String,
    default: '',
  },
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<style lang="scss">
.textinput {
  position: relative;
  display: flex;
  flex-direction: column;

  &__label {
    margin-bottom: var(--space-2);
    font-weight: 500;
    color: var(--text-primary);
    font-size: var(--font-size-sm);
  }

  &__input-wrapper {
    position: relative;
  }

  &__input {
    border: 1px solid var(--border-base);
    border-radius: var(--radius-md);
    padding: var(--space-3);
    font-size: var(--font-size-base);
    height: 2.75rem;
    min-width: 15rem;
    width: 100%;
    color: var(--text-primary);
    background-color: var(--bg-primary);

    @media (prefers-reduced-motion: no-preference) {
      transition: all var(--transition-fast);
    }

    @media (forced-colors: active) {
      border: 2px solid CanvasText;

      &:focus {
        outline: 2px solid Highlight;
      }
    }

    &::placeholder {
      color: var(--text-tertiary);
    }

    &:disabled,
    &:read-only {
      background-color: var(--bg-tertiary);
      color: var(--text-secondary);
      cursor: not-allowed;
    }

    &[aria-invalid='true'] {
      border-color: var(--error);

      + .textinput__validation-icon {
        color: var(--error);
      }
    }

    &[aria-invalid='false'] {
      border-color: var(--success);

      + .textinput__validation-icon {
        color: var(--success);
      }
    }

    &:has(+ .textinput__validation-icon) {
      padding-right: 2.5rem;
    }
  }

  &__validation-icon {
    position: absolute;
    top: 50%;
    right: var(--space-3);
    transform: translateY(-50%);
    font-size: var(--font-size-lg);
    line-height: 0;
    user-select: none;
    pointer-events: none;
  }

  &__error,
  &__asterisk {
    color: var(--error);
    font-weight: 600;
  }

  &__error,
  &__description {
    margin-top: var(--space-2);
    font-size: var(--font-size-sm);

    :deep() {
      p,
      li {
        margin-block: var(--space-2);

        &:first-of-type {
          margin-top: 0;
        }

        &:last-of-type {
          margin-bottom: 0;
        }
      }

      ul {
        margin: 0;
        padding: 0;
        list-style: none;
      }
    }
  }

  &__description {
    color: var(--text-secondary);
  }
}
</style>
