<script setup>

// bridge.java 525:         settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);


import useApiRequest from "@/composables/apiRequest";
import {computed, ref, watchEffect} from "vue";
import io from 'socket.io-client'

import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import SwipeDetector from "@/components/SwipeDetector.vue";

pdfjsLib.GlobalWorkerOptions.workerSrc = "/js/pdf.worker.min.js"

const baseApiUrl = ref('http://192.168.1.1:5111')

const currentSongInfo = ref(null)

const songListResponse = await useApiRequest('songlist')
const songList = ref(songListResponse.sort())

const rawKeyChoice = ref(null)
const keyChoices = {'Male Worship Leader Key': 'm', 'Female Worship Leader Key': 'f', 'Nashville Number System': 'n'}
const keyChoice = computed(() => {
  console.log('rawKeyChoice: ', rawKeyChoice.value)
  console.log('returning: ', rawKeyChoice.value ? keyChoices[rawKeyChoice.value] : null)
  return rawKeyChoice.value ? keyChoices[rawKeyChoice.value] : null
})


const socket = io(baseApiUrl.value)

socket.on('update', (data) => {
  setTimeout(() => {
    if (data.section !== currentSection.value) {
      renderPage(whatPageIsSection(data.section))
      currentSection.value = data.section
    }
  }, 500)

})


const changeSongPopupPresent = ref(false)

const newSongSearchBoxValue = ref('')

const currentPage = ref(1)

const totalPages = ref(1)

const currentSection = ref('')

const changeCurrentSong = async (song) => {
  changeSongPopupPresent.value = false
  currentSongInfo.value = await useApiRequest(song)
  let pdfurl = baseApiUrl.value + '/pdfs/' + currentSongInfo.value.title + '-chords-'
  pdfurl += keyChoice.value
  pdfurl += '.pdf'
  loadPDF(pdfurl)
}

const pdfViewerDivRef = ref(null)

// /pdfs/{{currentSongInfo.title}}-chords-{{currentSongInfo.key}}.pdf

// Reference to the PDF document
let pdfDoc = null;

// Function to render a specific page
function renderPage(pageNumber, force = false) {
  if (pageNumber === currentPage.value && !force) {
    return
  }
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

    fetch(baseApiUrl.value + '/updateinfo?' + new URLSearchParams({'song_name': currentSongInfo.value.title, 'section': listOfSectionsInChordChart.value[0]})).then(() => {
      console.log('updated')
    }).catch(() => {
      console.log('error updating')
    })

    // Assuming you want to render the first page initially
    renderPage(1, true); // Force is true because it's a new document
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
  fetch(baseApiUrl.value + '/updateinfo?' + new URLSearchParams({'section': section})).then(() => {
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

const songsDoneAlready = ref([])

const pickRandomSong = () => {
  if (songsDoneAlready.value.length === songList.value.length) {
    songsDoneAlready.value = []
  }
  console.log('songsDoneAlready = ', songsDoneAlready.value)
  let songsNotDone = songList.value.filter(element => !songsDoneAlready.value.includes(element))
  console.log(songsNotDone)
  newSongSearchBoxValue.value = songsNotDone[Math.floor(Math.random() * songsNotDone.length)]
  songsDoneAlready.value.push(newSongSearchBoxValue.value)
}

const helpDialogOpen = ref(false)

const helpClickCounter = ref(0)

watchEffect(() => {
  let helpCount = helpClickCounter.value
  if (helpCount >= 15) {
    advancedDialogOpen.value = true
    helpClickCounter.value = 0
  } else {
    console.log('not enough')
  }
})

watchEffect(() => {
  let helpOpen = helpDialogOpen.value
  if (!helpOpen) {
    helpClickCounter.value = 0
    console.log('reset helpClickCounter')
  }
})

const closeHelpDialog = () => {
  helpDialogOpen.value = false
  helpClickCounter.value = 0
}

const advancedDialogOpen = ref(false)

const openChangeSongDialog = () => {
  changeSongPopupPresent.value = true
  newSongSearchBoxValue.value = ''
}
</script>

<template>
  <main class="mx-2">
    <v-dialog v-model="helpDialogOpen" width="auto">
      <v-card>
        <v-card-title class="text-center" @click="helpClickCounter += 1">Help</v-card-title>
        <v-card-text>
          This is the STP Worship tablet. It is used to both show the pdf of a chord chart for the current song, and to
          control the tv displaying lyrics.<br><br>
          To start, click the magnifying glass icon in the top right corner to choose
          a song. Click in the "song name" box and start typing the song name. Select it from the list that appears.
          If the song is not in the list, please choose another song. Alternatively, you can click the "magic choose"
          icon to have a song randomly selected. The magic choose feature will select a random song that has not been
          done recently. Next, select one of three options from the "Key" box. Female/male worship leader key will
          load the key generally suited for a male or female worship leader. The Nashville Number System will load the
          chords in the Nashville Number System. Finally, click the "Select" button. The chord chart will load, and
          it will default to the first section of the song. The TV's title should also update.<br><br>
          To change the PDF to the correct part of the song and change the lyrics on screen, please select the section
          at the top of the screen. Alternatively, you can have someone else run the sections part by having them scan
          the QR code on the wall to run it. They can then select sections for lyrics and pages instead of the worship
          leader having to.<br><br>

          If you have any questions, please see a TTA (all current TTAs are trained on the system), or contact Luke E.
          for further assistance or troubleshooting.
        </v-card-text>
        <v-card-actions>
          <div class="d-flex justify-center w-100">
            <v-btn @click="closeHelpDialog">Close</v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="advancedDialogOpen" width="auto">
      <v-card>
        <v-card-title>Advanced</v-card-title>
        <v-card-text>
          <p>If you did not mean to open this dialog, please click the "Close" button below.</p>
          <v-text-field label="Base API Url" v-model="baseApiUrl"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <div class="d-flex justify-center w-100">
            <v-btn @click="advancedDialogOpen = false">Close</v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <v-dialog width="500" v-model="changeSongPopupPresent">
      <v-card title="Change Songs">
        <v-form class="pa-6">
          <v-autocomplete
              :items="songList"
              label="Song Name"

              v-model="newSongSearchBoxValue"
          >
            <template v-slot:append>
              <v-icon icon="mdi-auto-fix" @click="pickRandomSong"></v-icon>
            </template>
          </v-autocomplete>
          <v-select
              label="Key"
              :items="Object.keys(keyChoices)"
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
          <v-btn icon="mdi-help" @click="helpDialogOpen = !helpDialogOpen"></v-btn>
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
          <v-btn icon="mdi-magnify" @click="openChangeSongDialog"></v-btn>
        </v-col>
      </v-row>
      <v-card-actions class="d-flex justify-center flex-column my-0 py-0" v-if="currentSongInfo">
          <template v-for="row in [...Array(Math.ceil((listOfSectionsInChordChart.length - 1) / 5)).keys()].map(i => i * 5)" :key="row">
            <div class="d-flex align-content-center justify-center align-center">
              <v-row class="align-center">
                <v-col></v-col>
                <template v-for="(section, index) in listOfSectionsInChordChart.slice(row, (row + 5))" :key="index">
                  <v-col cols="auto">
                    <v-btn @click="processSectionButtonClick(section)" :disabled="currentSection === section">{{ section }}</v-btn>
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
              @swipeup="currentPage !== totalPages ? renderPage(currentPage + 1) : renderPage(currentPage)"
              @swiperight="currentPage !== 1 ? renderPage(currentPage - 1) : renderPage(currentPage)"
              @swipedown="currentPage !== 1 ? renderPage(currentPage - 1) : renderPage(currentPage)"
          >
            <div class="d-flex align-content-center justify-center">
              <canvas ref="pdfViewerDivRef" style="border: 1px solid black; border-radius: 20px; max-height: 85vh; width: 95vw; max-width: 1000px;">
                <!-- PDF will be rendered here -->
              </canvas>
            </div>
          </SwipeDetector>
        </v-card-text>

    </v-card>
  </main>
</template>
