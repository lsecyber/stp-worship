<script setup>
import { RouterLink, RouterView } from 'vue-router'
import FullscreenLoader from "@/components/FullscreenLoader.vue";
</script>

<template>
<div id="app" class="" style="">
  <Suspense>
    <template #default>
      <RouterView />
    </template>
    <template #fallback>
      <FullscreenLoader model-value="true" transition="none" />
    </template>
  </Suspense>
</div>
</template>
