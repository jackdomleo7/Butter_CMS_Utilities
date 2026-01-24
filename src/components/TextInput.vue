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
// Default vars
$inputHeight: 2.5rem;

.textinput {
  position: relative;
  display: flex;
  flex-direction: column;

  &__label {
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--text-primary);
    font-size: 1rem;
  }

  &__input-wrapper {
    position: relative;
  }

  &__input {
    border: 1px solid var(--butter-border);
    border-radius: 0.3125rem;
    padding: 0.5rem;
    font-size: inherit;
    height: $inputHeight;
    min-width: calc($inputHeight * 1.5);
    width: 100%;

    &:disabled,
    &:read-only {
      background-color: #eee;
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
      padding-right: 2rem;
    }
  }

  &__validation-icon {
    position: absolute;
    top: 50%;
    right: 0.5rem;
    transform: translateY(-50%);
    font-size: 1.25rem;
    line-height: 0;
    user-select: none;
    pointer-events: none;
  }

  &__error,
  &__asterisk {
    color: red;
  }

  &__error,
  &__description {
    margin-top: 0.5rem;
    font-size: 0.875rem;

    :deep() {
      p,
      li {
        margin-block: 0.375rem;

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
}
</style>
