<script setup>
import useApiRequest from "@/composables/apiRequest";
import {computed, ref} from "vue";

import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import SwipeDetector from "@/components/SwipeDetector.vue";
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist/build/pdf.worker.min.js"

const baseApiUrl = 'http://192.168.1.50:5111'

const currentSongInfo = ref(null)

const songListResponse = await useApiRequest('songlist')
const songList = ref(songListResponse.sort())

const rawKeyChoice = ref(null)
const isFemaleKey = computed(() => {
  return rawKeyChoice.value === 'Female Worship Leader Key'
})




const changeSongPopupPresent = ref(false)

const newSongSearchBoxValue = ref('')

const currentPage = ref(1)

const totalPages = ref(1)

const currentSection = ref('')

const changeCurrentSong = async (song) => {
  changeSongPopupPresent.value = false
  currentSongInfo.value = await useApiRequest(song, isFemaleKey)
  loadPDF(baseApiUrl + '/pdfs/' + currentSongInfo.value.title + '-chords-' + currentSongInfo.value.key + '.pdf')
}
// await changeCurrentSong('Great Are You Lord')

const pdfViewerDivRef = ref(null)

// /pdfs/{{currentSongInfo.title}}-chords-{{currentSongInfo.key}}.pdf

// Reference to the PDF document
let pdfDoc = null;

// Function to render a specific page
function renderPage(pageNumber) {
  pdfDoc.getPage(pageNumber).then(function(page) {
    const canvas = pdfViewerDivRef.value
    const context = canvas.getContext('2d');

    const viewport = page.getViewport({ scale: 1.5 });

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
    };

    page.render(renderContext);

    currentPage.value = pageNumber
  });
}

// Function to load the PDF
function loadPDF(url) {
  pdfjsLib.getDocument(url).promise.then(function(doc) {
    pdfDoc = doc;
    totalPages.value = pdfDoc.numPages

    fetch(baseApiUrl + '/updateinfo?' + new URLSearchParams({'song_name': currentSongInfo.value.title, 'section': listOfSectionsInChordChart.value[0]})).then(() => {
      console.log('updated')
    }).catch(() => {
      console.log('error updating')
    })

    // Assuming you want to render the first page initially
    renderPage(1);
    currentPage.value = 1
    currentSection.value = listOfSectionsInChordChart.value[0]
  });
}

// Call the function to load the PDF
//loadPDF(baseApiUrl + '/pdfs/sample-pdf-2-page.pdf');

const whatPageIsSection = (section) => {
  let page = 1  // Fallback
  let sectionFound = false
  Object.keys(currentSongInfo.value.sections_by_page).every(pageNumber => {
    page = parseInt(pageNumber.replace('Page ', '').trim())
    currentSongInfo.value.sections_by_page[pageNumber].every(sectionOnPage => {
      if (sectionOnPage.toUpperCase().includes(section.toUpperCase())) {
        console.log('returning: ', page)
        sectionFound = true
        return false // break the every loop
      } else {
        return true  // Keep going in the loop
      }
    })
    return !sectionFound // break the every loop if section was found
  })

  return page
}

const processSectionButtonClick = (section) => {
  renderPage(whatPageIsSection(section))
  currentSection.value = section
  fetch(baseApiUrl + '/updateinfo?' + new URLSearchParams({'section': section})).then(() => {
    console.log('updated')
  }).catch(() => {
    console.log('error updating')
  })
}

const listOfSectionsInChordChart = computed(() => {
  if (!currentSongInfo.value) {
    return []
  }
  return Object.keys(currentSongInfo.value.sections_by_page).map(pageNumber => {
    return currentSongInfo.value.sections_by_page[pageNumber]
  }).flat()
})

</script>

<template>
  <main class="mx-2">
    <v-dialog width="500" v-model="changeSongPopupPresent">
      <v-card title="Change Songs">
        <v-form class="pa-6">
          <v-autocomplete :items="songList" label="Song Name" v-model="newSongSearchBoxValue"></v-autocomplete>
          <v-select
              label="Key"
              :items="['Male Worship Leader Key', 'Female Worship Leader Key']"
              :disabled="!newSongSearchBoxValue"
              v-model="rawKeyChoice"
          ></v-select>
        </v-form>

        <v-card-actions>
          <v-btn
              text="Select"
              :disabled="!newSongSearchBoxValue || !rawKeyChoice"
              @click="changeCurrentSong(newSongSearchBoxValue)"
          ></v-btn>
          <v-spacer></v-spacer>

          <v-btn
              text="Cancel"
              color="red"
              @click="changeSongPopupPresent = false; newSongSearchBoxValue = '';"
          ></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <v-card class="" style="">
      <v-row>
        <v-col cols="auto">
          <v-btn icon="mdi-help" @click="renderPage(2)"></v-btn>
        </v-col>
        <v-col></v-col>
        <v-col cols="auto">
          <v-card-title class="text-center">
            <v-btn variant="outlined" @click="currentPage !== 1 ? renderPage(currentPage - 1) : renderPage(currentPage)">&lt;</v-btn>
          </v-card-title>
        </v-col>
        <v-col cols="auto">
          <v-card-title class="text-center">{{ currentSongInfo?.title || 'Choose A Song' }} (p. {{currentPage}}/{{totalPages}})</v-card-title>
        </v-col>
        <v-col cols="auto">
          <v-card-title class="text-center">
            <v-btn variant="outlined" @click="currentPage !== totalPages ? renderPage(currentPage + 1) : renderPage(currentPage)">&gt;</v-btn>
          </v-card-title>
        </v-col>
        <v-col></v-col>
        <v-col cols="auto">
          <v-btn icon="mdi-magnify" @click="changeSongPopupPresent = true"></v-btn>
        </v-col>
      </v-row>
      <v-card-actions class="d-flex justify-center flex-column my-0 py-0" v-if="currentSongInfo">
          <template v-for="row in [...Array(Math.ceil((listOfSectionsInChordChart.length - 1) / 5)).keys()].map(i => i * 5)" :key="row">
            <div class="d-flex align-content-center justify-center align-center">
              <v-row class="align-center">
                <v-col></v-col>
                <template v-for="(section, index) in listOfSectionsInChordChart.slice(row, (row + 5))" :key="index">
                  <v-col cols="auto">
                    <v-btn @click="processSectionButtonClick(section)">{{ section }}</v-btn>
                  </v-col>
                </template>

                <v-col></v-col>
              </v-row>
            </div>

          </template>


      </v-card-actions>
        <v-card-text class="mb-0 pb-0">
          <SwipeDetector
              @swipeleft="currentPage !== totalPages ? renderPage(currentPage + 1) : renderPage(currentPage)"
              @swiperight="currentPage !== 1 ? renderPage(currentPage - 1) : renderPage(currentPage)"
          >
            <div class="d-flex align-content-center justify-center">
              <canvas ref="pdfViewerDivRef" style="border: 1px solid black; border-radius: 20px; max-height: 85vh; width: 95vw; max-width: 1150px;">
                <!-- PDF will be rendered here -->
              </canvas>
            </div>
          </SwipeDetector>

        </v-card-text>
      <!--<v-card-actions class="ma-0 pa-0">
        <v-row class="ma-0 pa-0">
          <v-col></v-col>
          <v-col cols="auto">
            <v-btn @click="renderPage(currentPage - 1)" variant="text" size="small" class="pa-0 ma-0">
              <v-icon icon="mdi-menu-left" size="x-large"></v-icon>
            </v-btn>
          </v-col>
          <v-col cols="auto" class="px-0 mx-0">
            <v-chip >{{currentPage}}</v-chip>
          </v-col>
          <v-col></v-col>
        </v-row>
      </v-card-actions>-->

    </v-card>
  </main>
</template>
