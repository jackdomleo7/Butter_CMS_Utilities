import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TextInput from './TextInput.vue'

describe('TextInput', () => {
  describe('Props - Basic', () => {
    it('should render with required props', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
          modelValue: '',
        },
        slots: {
          label: 'Label Text',
        },
      })

      expect(wrapper.find('input').exists()).toBe(true)
      expect(wrapper.find('input').attributes('id')).toBe('test-input')
      expect(wrapper.find('label').attributes('for')).toBe('test-input')
    })

    it('should have text type by default', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
        },
        slots: {
          label: 'Label',
        },
      })

      expect(wrapper.find('input').attributes('type')).toBe('text')
    })

    it('should accept different input types', () => {
      const types: Array<'text' | 'email' | 'tel' | 'url' | 'password' | 'search'> = [
        'text',
        'email',
        'tel',
        'url',
        'password',
        'search',
      ]

      types.forEach((type) => {
        const wrapper = mount(TextInput, {
          props: {
            id: 'test-input',
            type,
          },
          slots: {
            label: 'Label',
          },
        })

        expect(wrapper.find('input').attributes('type')).toBe(type)
      })
    })

    it('should bind modelValue to input value', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
          modelValue: 'Test value',
        },
        slots: {
          label: 'Label',
        },
      })

      expect(wrapper.find('input').element.value).toBe('Test value')
    })
  })

  describe('v-model', () => {
    it('should emit update:modelValue on input', async () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
          modelValue: '',
        },
        slots: {
          label: 'Label',
        },
      })

      await wrapper.find('input').setValue('New value')

      expect(wrapper.emitted()).toHaveProperty('update:modelValue')
      expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['New value'])
    })

    it('should update when modelValue prop changes', async () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
          modelValue: 'Initial',
        },
        slots: {
          label: 'Label',
        },
      })

      expect(wrapper.find('input').element.value).toBe('Initial')

      await wrapper.setProps({ modelValue: 'Updated' })

      expect(wrapper.find('input').element.value).toBe('Updated')
    })
  })

  describe('Label', () => {
    it('should render label from slot', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
        },
        slots: {
          label: 'Username',
        },
      })

      expect(wrapper.find('label').text()).toContain('Username')
    })

    it('should show label by default', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
        },
        slots: {
          label: 'Visible Label',
        },
      })

      expect(wrapper.find('label').classes()).not.toContain('sr-only')
    })

    it('should hide label visually when hiddenLabel is true', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
          hiddenLabel: true,
        },
        slots: {
          label: 'Hidden Label',
        },
      })

      expect(wrapper.find('label').classes()).toContain('sr-only')
    })

    it('should show asterisk when required attribute is present', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
          required: true,
        },
        attrs: {
          required: true,
        },
        slots: {
          label: 'Required Field',
        },
      })

      expect(wrapper.find('.textinput__asterisk').exists()).toBe(true)
      expect(wrapper.find('.textinput__asterisk').text()).toBe('*')
      expect(wrapper.find('.textinput__asterisk').attributes('aria-hidden')).toBe('true')
    })

    it('should include sr-only required text when required', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
          required: true,
        },
        attrs: {
          required: true,
        },
        slots: {
          label: 'Required Field',
        },
      })

      expect(wrapper.html()).toContain('(required)')
      expect(wrapper.find('label .sr-only').text()).toBe('(required)')
    })
  })

  describe('Validation Status', () => {
    it('should not show status by default', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
        },
        slots: {
          label: 'Label',
        },
      })

      expect(wrapper.find('.textinput__validation-icon').exists()).toBe(false)
      expect(wrapper.find('input').attributes('aria-invalid')).toBeUndefined()
    })

    it('should show error status', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
          status: 'error',
        },
        slots: {
          label: 'Label',
        },
      })

      expect(wrapper.find('.textinput__validation-icon').exists()).toBe(true)
      expect(wrapper.find('.textinput__validation-icon').text()).toBe('✘')
      expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')
    })

    it('should show success status', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
          status: 'success',
        },
        slots: {
          label: 'Label',
        },
      })

      expect(wrapper.find('.textinput__validation-icon').exists()).toBe(true)
      expect(wrapper.find('.textinput__validation-icon').text()).toBe('✔')
      expect(wrapper.find('input').attributes('aria-invalid')).toBe('false')
    })

    it('should hide validation icon on aria-hidden', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
          status: 'error',
        },
        slots: {
          label: 'Label',
        },
      })

      const icon = wrapper.find('.textinput__validation-icon')
      expect(icon.attributes('aria-hidden')).toBe('true')
    })
  })

  describe('Error Slot', () => {
    it('should not render error container without error slot', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
        },
        slots: {
          label: 'Label',
        },
      })

      expect(wrapper.find('.textinput__error').exists()).toBe(false)
    })

    it('should render error message from slot', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
          status: 'error',
        },
        slots: {
          label: 'Label',
          error: 'This field is required',
        },
      })

      expect(wrapper.find('.textinput__error').exists()).toBe(true)
      expect(wrapper.find('.textinput__error').text()).toBe('This field is required')
    })

    it('should have correct id for error message', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
        },
        slots: {
          label: 'Label',
          error: 'Error message',
        },
      })

      expect(wrapper.find('.textinput__error').attributes('id')).toBe('test-input-error')
    })

    it('should link input to error message via aria-errormessage', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
        },
        slots: {
          label: 'Label',
          error: 'Error message',
        },
      })

      expect(wrapper.find('input').attributes('aria-errormessage')).toBe('test-input-error')
    })

    it('should not have aria-errormessage without error slot', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
        },
        slots: {
          label: 'Label',
        },
      })

      expect(wrapper.find('input').attributes('aria-errormessage')).toBeUndefined()
    })
  })

  describe('Description Slot', () => {
    it('should not render description container without description slot', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
        },
        slots: {
          label: 'Label',
        },
      })

      expect(wrapper.find('.textinput__description').exists()).toBe(false)
    })

    it('should render description from slot', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
        },
        slots: {
          label: 'Label',
          description: 'Please enter your username',
        },
      })

      expect(wrapper.find('.textinput__description').exists()).toBe(true)
      expect(wrapper.find('.textinput__description').text()).toBe('Please enter your username')
    })

    it('should have correct id for description', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
        },
        slots: {
          label: 'Label',
          description: 'Description text',
        },
      })

      expect(wrapper.find('.textinput__description').attributes('id')).toBe(
        'test-input-description',
      )
    })

    it('should link input to description via aria-describedby', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
        },
        slots: {
          label: 'Label',
          description: 'Description text',
        },
      })

      expect(wrapper.find('input').attributes('aria-describedby')).toBe('test-input-description')
    })

    it('should not have aria-describedby without description slot', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
        },
        slots: {
          label: 'Label',
        },
      })

      expect(wrapper.find('input').attributes('aria-describedby')).toBeUndefined()
    })
  })

  describe('Additional Attributes', () => {
    it('should forward attributes to input element', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
          placeholder: 'Enter text',
          disabled: true,
          maxlength: 50,
        },
        attrs: {
          placeholder: 'Enter text',
          disabled: true,
          maxlength: 50,
        },
        slots: {
          label: 'Label',
        },
      })

      const input = wrapper.find('input')
      expect(input.attributes('placeholder')).toBe('Enter text')
      expect(input.attributes('disabled')).toBeDefined()
      expect(input.attributes('maxlength')).toBe('50')
    })

    it('should support readonly attribute', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
          readonly: true,
        },
        attrs: {
          readonly: true,
        },
        slots: {
          label: 'Label',
        },
      })

      expect(wrapper.find('input').attributes('readonly')).toBeDefined()
    })
  })

  describe('Root Element Customization', () => {
    it('should not apply rootClass by default', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
        },
        slots: {
          label: 'Label',
        },
      })

      expect(wrapper.classes()).toEqual(['textinput'])
    })

    it('should apply custom rootClass', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
          rootClass: 'custom-class',
        },
        slots: {
          label: 'Label',
        },
      })

      expect(wrapper.classes()).toContain('textinput')
      expect(wrapper.classes()).toContain('custom-class')
    })

    it('should not apply rootStyle by default', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
        },
        slots: {
          label: 'Label',
        },
      })

      expect(wrapper.attributes('style')).toBeUndefined()
    })

    it('should apply custom rootStyle', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
          rootStyle: 'margin: 10px;',
        },
        slots: {
          label: 'Label',
        },
      })

      expect(wrapper.attributes('style')).toBe('margin: 10px;')
    })
  })

  describe('Edge Cases', () => {
    it('should render with both description and error', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
          status: 'error',
        },
        slots: {
          label: 'Label',
          description: 'Helpful text',
          error: 'Error message',
        },
      })

      expect(wrapper.find('.textinput__description').text()).toBe('Helpful text')
      expect(wrapper.find('.textinput__error').text()).toBe('Error message')
      expect(wrapper.find('input').attributes('aria-describedby')).toBe('test-input-description')
      expect(wrapper.find('input').attributes('aria-errormessage')).toBe('test-input-error')
    })

    it('should handle empty modelValue', () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
          modelValue: '',
        },
        slots: {
          label: 'Label',
        },
      })

      expect(wrapper.find('input').element.value).toBe('')
    })

    it('should transition between validation states', async () => {
      const wrapper = mount(TextInput, {
        props: {
          id: 'test-input',
          status: 'error',
        },
        slots: {
          label: 'Label',
        },
      })

      expect(wrapper.find('.textinput__validation-icon').text()).toBe('✘')
      expect(wrapper.find('input').attributes('aria-invalid')).toBe('true')

      await wrapper.setProps({ status: 'success' })

      expect(wrapper.find('.textinput__validation-icon').text()).toBe('✔')
      expect(wrapper.find('input').attributes('aria-invalid')).toBe('false')

      await wrapper.setProps({ status: undefined })

      expect(wrapper.find('.textinput__validation-icon').exists()).toBe(false)
      expect(wrapper.find('input').attributes('aria-invalid')).toBeUndefined()
    })
  })
})
