<script setup>
import {computed} from "vue";

const props = defineProps(['name', 'section', 'lyrics', 'copyright'])

function highlightText(inputText) {
  let result = '<span class="blue-text">'; // Start with blue text
  let inParentheses = false;
  let justFinishedParentheses = false;

  for (let i = 0; i < inputText.length; i++) {
    const char = inputText[i];

    // Handle opening parenthesis
    if (char === '(' && !inParentheses) {
      inParentheses = true;
      // Close blue-text span and open red-text span
      result += '</span><span class="red-text">';
    } else if (char === ')' && inParentheses) {
      // Handle closing parenthesis
      inParentheses = false;
      justFinishedParentheses = true;
      // Close red-text span and open blue-text span
      result += '</span><span class="blue-text">';
    }

    // Add character to result
    result += char;


  }

  // Close the last opened span
  result += '</span>';

  // Post-process to remove empty spans and handle special cases
  result = result.replace(/<span class="red-text"><\/span>/g, '');
  result = result.replace(/<span class="blue-text"><\/span>/g, '');

  return result;
}

const lyrics = computed(() => {
  if (!props.lyrics) {
    return '';
  }
  let lyrics = props.lyrics.replaceAll("\n", "<br>");
  if (lyrics.includes('Male (Female)<br>')) {
    lyrics = highlightText(lyrics);
  }

  lyrics = lyrics.replaceAll('(', '').replaceAll(')', '')

  return lyrics;
});

const copyright = computed(() => {
  if (!props.copyright) {
    return ''
  }
  return props.copyright.replaceAll("\n", "<br>") + '<br>For use solely with the SongSelect® Terms of Use.  All rights reserved. www.ccli.com CCLI License #21990925'
})

const lyricsHash = computed(() => {
  return lyrics.value.split('').reduce((acc, char) => {
    acc = (acc << 5) - acc + char.charCodeAt(0);
    return acc & acc;
  }, 0);
})

const sectionHash = computed(() => {
  return props.section.split('').reduce((acc, char) => {
    acc = (acc << 5) - acc + char.charCodeAt(0);
    return acc & acc;
  }, 0);
})
</script>

<template>
  <div class="w-100">
    <v-row>
      <v-col cols="1">
        <transition name="fade">
          <p class="cmg-sans small-text section-text" :key="sectionHash" style="">{{props.section}}</p>
        </transition>

      </v-col>
      <v-col cols="10">
        <p class="cmg-sans-bold text-center">{{props.name}}</p>

      </v-col>
      <v-col cols="1">
        <v-img class="rounded-circle logo" src="stp-logo.jpeg" height="85" width="85"></v-img>

      </v-col>
    </v-row>
    <div id="lyrics" class="lyrics-container">
      <transition name="fade">
        <p class="text-center cmg-sans" style="width: 100vw;" v-html="lyrics" :key="lyricsHash"></p>
      </transition>
    </div>
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
  .cmg-sans {
    font-size: 4em; /* Further adjust font size for screens wider than 1200px */
  }
  .cmg-sans-bold {
    font-size: 3.8em; /* Further adjust font size for screens wider than 1200px */

  }
}

.bottom-of-screen {
  position: fixed;
  bottom: 0;
  left: 0; /* You can adjust the left position if needed */
  font-size: 0.7em;
  width: 100%; /* Optional: Set the width to 100% to span the entire screen */
}


</style>

<style>
.blue-text {
  color: darkblue !important;
}

.red-text {
  color: darkred !important;
  font-style: italic;
}

.lyrics-container {
  position: relative;
  min-height: 1px; /* Adjust based on your content, ensures container doesn't collapse */
  width: 100%;
}

.fade-enter-active, .fade-leave-active {
  position: absolute;
  width: 100%;
  transition: opacity 0.5s ease;
}

.section-text {
  position: absolute !important;
  top: 1.4rem !important;
  left: 15px !important;
}

.logo {
  position: absolute;
  top: 1px;
  right: 15px;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

.fade-enter-to, .fade-leave-from {
  opacity: 1;
}

.small-text {
  font-size: 1.8em !important;
}

</style>