<script setup>
import {computed} from "vue";

const props = defineProps(['name', 'section', 'lyrics', 'copyright'])

const lyrics = computed(() => {
  if (!props.lyrics) {
    return ''
  }
  return props.lyrics.replaceAll("\n", "<br>")
})

const copyright = computed(() => {
  if (!props.copyright) {
    return ''
  }
  return props.copyright.replaceAll("\n", "<br>") + '<br>For use solely with the SongSelect® Terms of Use.  All rights reserved. www.ccli.com CCLI License #21990925'
})
</script>

<template>
  <div class="w-100">
    <p class="cmg-sans-bold text-center">{{props.name}}</p>
    <v-divider></v-divider>
    <p class="text-center cmg-sans" style="width: 100vw;" v-html="lyrics"></p>
    <p class="cmg-sans bottom-of-screen text-center" v-html="copyright"></p>
  </div>
</template>

<style scoped>
@font-face {
  font-family: 'CMG Sans';
  font-style: normal;
  font-weight: 400;
  src: url('/fonts/CMGSans-Regular.woff2') format('woff2'),
  url('/fonts/CMGSans-Regular.ttf') format('ttf');
}

@font-face {
  font-family: 'CMG Sans';
  font-style: normal;
  font-weight: 700;
  src: url('/fonts/CMGSans-Bold.woff2') format('woff2'),
  url('/fonts/CMGSans-Bold.ttf') format('ttf');
}

.cmg-sans {
  font-family: 'CMG Sans', sans-serif;
  font-weight: 400;
}
.cmg-sans-bold {
  font-family: 'CMG Sans', sans-serif;
  font-weight: 700;
}


.cmg-sans, .cmg-sans-bold {
  font-size: 2em; /* 2% of the viewport width */

}

@media (min-width: 600px) {
  .cmg-sans, .cmg-sans-bold {
    font-size: 3em; /* Adjust font size for screens wider than 600px */
  }
}

@media (min-width: 1200px) {
  .cmg-sans, .cmg-sans-bold {
    font-size: 4em; /* Further adjust font size for screens wider than 1200px */
  }
}

.bottom-of-screen {
  position: fixed;
  bottom: 0;
  left: 0; /* You can adjust the left position if needed */
  font-size: 0.8em;
  width: 100%; /* Optional: Set the width to 100% to span the entire screen */
}
</style>