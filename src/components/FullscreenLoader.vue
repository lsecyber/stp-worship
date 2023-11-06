<script setup>
import { ref } from 'vue';
import { VOverlay, VProgressCircular } from 'vuetify/components';
import {useVModel} from "@vueuse/core";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: true
  },
  transition: {
    type: String,
    default: 'fade-transition'
  }
})
const emit = defineEmits(['update:modelValue'])

const isDialogOpen = useVModel(props, 'modelValue', emit)

const functionThatDoesNothing = () => {}
</script>

<template>

  <v-overlay v-model="isDialogOpen" @click="functionThatDoesNothing" class="align-center justify-center" :persistent="true" :transition="props.transition">
    <v-progress-circular color="primary" indeterminate :size="64" :width="10"></v-progress-circular>
  </v-overlay>


</template>

