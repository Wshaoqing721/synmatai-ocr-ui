<script setup lang="ts">
import { computed } from 'vue'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  size?: 'small' | 'medium' | 'large'
  isLoading?: boolean
  disabled?: boolean
}

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'primary',
  size: 'medium',
  isLoading: false,
  disabled: false
})

const buttonClasses = computed(() => {
  return [
    'flex items-center justify-center font-medium transition duration-150 ease-in-out rounded focus:outline-none focus:ring-2 focus:ring-offset-2',
    // Color variants
    {
      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500': props.variant === 'primary',
      'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500': props.variant === 'secondary',
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500': props.variant === 'danger',
      'border border-gray-300 text-gray-700 hover:bg-gray-100 focus:ring-gray-300': props.variant === 'outline',
    },
    // Size adjustments
    {
      'px-2 py-1 text-xs': props.size === 'small',
      'px-4 py-2 text-sm': props.size === 'medium',
      'px-6 py-3 text-lg': props.size === 'large',
    },
    // Disabled and loading states
    {
      'opacity-50 cursor-not-allowed': props.disabled || props.isLoading,
    }
  ]
})
</script>

<template>
  <button
    :class="buttonClasses"
    :disabled="disabled || isLoading"
  >
    <slot name="leftIcon" v-if="!isLoading"></slot>
    <span v-if="isLoading" class="loader mr-2 inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
    <slot v-else></slot>
    <slot name="rightIcon" v-if="!isLoading"></slot>
  </button>
</template>

<style scoped>
.loader {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
