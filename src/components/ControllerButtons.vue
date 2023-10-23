<script setup>
import {computed} from "vue";

const props = defineProps(['sections', 'currentSection'])

// eslint-disable-next-line no-unused-vars
const emit = defineEmits(['sectionButtonClick'])

const listOfSections = computed(() => {
  return props.sections ? props.sections : []
})
</script>

<template>
    <div class="d-flex align-content-center justify-center align-center">
      <v-row class="align-center">
        <template v-for="(section, index) in listOfSections" :key="index">
          <v-col cols="auto">
            <v-btn
                @click="emit('sectionButtonClick', section)"
                :disabled="currentSection === section"
                size="large"
            >
              {{ section }}
            </v-btn>
          </v-col>
        </template>
      </v-row>
    </div>
</template>


<style scoped>

</style>