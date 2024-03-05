<script setup>

// bridge.java 525:         settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

const pageIsLoading = ref(true)

import useApiRequest from "@/composables/apiRequest";
import useUpdateInfoApiRequest from "@/composables/updateInfoApiRequest";
import {computed, ref} from "vue";
import io from 'socket.io-client'

import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import SwipeDetector from "@/components/SwipeDetector.vue";
import SongAndKeySelector from "@/components/SongAndKeySelector.vue";
import FullscreenLoader from "@/components/FullscreenLoader.vue";


// Start Random String UUID Functions
const generateRandomString = () => {
  return Math.random().toString(36).substr(2)
}
const generateUniqueId = () => {
  const timestamp = Date.now().toString(36)
  return timestamp + generateRandomString()
      + generateRandomString()
      + generateRandomString()
      + generateRandomString()
      + generateRandomString()
      + generateRandomString()
      + generateRandomString()
      + generateRandomString()
}
const saveNewUniqueId = () => {
  const uniqueId = generateUniqueId()
  localStorage.setItem('uniqueId', uniqueId)
  return uniqueId
}
const getUniqueId = () => {
  let uniqueId = localStorage.getItem('uniqueId')
  if (!uniqueId) {
    uniqueId = saveNewUniqueId()
  }
  return uniqueId
}
const deviceUUID = computed(() => {
  console.log('3434343434343434343434343434 returning: ', getUniqueId() + window.location)
  console.log('3434343434343434343434343434 returning: ', getUniqueId() + window.location)

  return getUniqueId() + window.location
})
// End Random String UUID Functions

pdfjsLib.GlobalWorkerOptions.workerSrc = "/js/pdf.worker.min.js"

const baseApiUrl = ref(import.meta.env.VITE_BASE_API_URL)

const currentSongInfo = ref(null)

const songListResponse = await useApiRequest('songlist')
const songList = ref(songListResponse.sort())


const socket = io(baseApiUrl.value)

socket.on('update', (data) => {
  console.log('socket.on fired!!! data: ', data)
  if (data.source !== deviceUUID.value) {
    setTimeout(async () => {
      if (data.keyChoice && data.keyChoice !== previousKeyChoice.value && data.keyChoice !== '') {
        previousKeyChoice.value = data.keyChoice
        if (data.song_name === currentSongInfo.value?.title) {
          await changeCurrentSong(currentSongInfo.value.title, data.keyChoice, false)
        }
      }

      if (data.song_name !== currentSongInfo.value?.title) {
        console.log('about to update from socket - new song is: ', data.song_name)
        await changeCurrentSong(data.song_name, data.keyChoice, false)
      } else if (data.section !== currentSection.value) {
        console.log('about to update from socket - new section is: ', data.section)
        safeRenderPage(whatPageIsSection(data.section))
        currentSection.value = data.section
      }
    }, 200)
  } else {
    console.log('socket update received, but source is this device. Ignoring.')
  }


})


const changeSongPopupPresent = ref(false)

const currentPage = ref(1)

const totalPages = ref(1)

const currentSection = ref('')

const changeCurrentSong = async (song, key, emitUpdateInfo = true) => {
  console.log('running changeCurrentSong')
  if (currentSongInfo.value?.title === song && currentSongInfo.value?.key === key) {
    console.log('song and key are the same. Not changing.')
    // Returns a promise that resolves immediately
    return Promise.resolve()
  }
  changeSongPopupPresent.value = false
  currentSongInfo.value = await useApiRequest(song)

  let pdfurl = baseApiUrl.value + '/pdfs/' + currentSongInfo.value.title + '-chords-'
  pdfurl += key === '' ? 'n' : key
  if (key === '') {
    console.warn('key is empty string. Defaulting to n')
  }
  pdfurl += '.pdf'

  if (emitUpdateInfo) {
    useUpdateInfoApiRequest('', currentSongInfo.value.title, '', '', key).then(() => {
      console.log('just updated!!!!!!!!!')
      console.log('loading pdfurl: ', pdfurl)
      loadPDF(pdfurl)
    }).catch((e) => {
      console.log('error updating line 124')
      console.log('full error: ')
      console.log(e)
    })
  } else {
    loadPDF(pdfurl)
  }


}

const pdfViewerDivRef = ref(null)

// /pdfs/{{currentSongInfo.title}}-chords-{{currentSongInfo.key}}.pdf

// Reference to the PDF document
let pdfDoc = null;

// Function to render a specific page
function renderPage(pageNumber, force = false) {
  console.log('rendering: ', pageNumber, '; force: ', force)
  if ((!currentSongInfo.value) || (pageNumber === currentPage.value && !force)) {
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

    try {
      page.render(renderContext);
      currentPage.value = pageNumber

    } catch (e) {
      console.log('error rendering page: ', e)
    }

  });
}


const renderPageTimer = ref(0)
const safeRenderPage = (pageNumber, force = false) => {
  clearTimeout(renderPageTimer.value)
  renderPageTimer.value = setTimeout(() => {
    console.log('Rendering Page!!')
    renderPage(pageNumber, force)
  }, 250)

}

// Function to load the PDF
function loadPDF(url) {
  pdfjsLib.getDocument(url).promise.then(function(doc) {
    pdfDoc = doc;
    totalPages.value = pdfDoc.numPages

    useUpdateInfoApiRequest(listOfSectionsInChordChart.value[0], currentSongInfo.value.title).then(() => {
      console.log('updated')
    }).catch((e) => {
      console.log('error updating line 194')
      console.log('full error: ')
      console.log(e)
    })

    // Assuming you want to render the first page initially
    safeRenderPage(1, true); // Force is true because it's a new document
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
        sectionFound = true
        return false // break the every loop
      } else {
        return true  // Keep going in the loop
      }
    })
    return !sectionFound // break the every loop if section was found
  })

  console.log('page is: ', page)
  if (sectionFound) {
    return page
  } else {
    return 1 // Fallback
  }

}

const processSectionButtonClick = (section) => {
  console.log('running processSectionButtonClick')
  renderPage(whatPageIsSection(section))
  currentSection.value = section
  useUpdateInfoApiRequest(section).then(() => {
    console.log('updated')
  }).catch((e) => {
    console.log('error updating line 241')
    console.log('full error: ')
    console.log(e)
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


const helpDialogOpen = ref(false)

const closeHelpDialog = () => {
  helpDialogOpen.value = false
}


// Below is for SongAndKeySelector.
const songsDoneAlreadyString = ref('')
const previousKeyChoice = ref('')

const processNewSong = (choice) => {
  console.log('processing new choice:', choice)
  changeCurrentSong(choice.song, choice.key)
  songsDoneAlreadyString.value = choice.songsCompleted
  previousKeyChoice.value = choice.key
}
const songSelectorIsOpen = ref(false)
// End for SongAndKeySelector

const refreshPage = () => {
  pageIsLoading.value = true
  setTimeout(() => {
    window.location.reload()
  }, 1000)

}

pageIsLoading.value = false
</script>

<template>
  <FullscreenLoader v-model="pageIsLoading" />
  <main class="mx-2">
    <v-dialog v-model="helpDialogOpen" width="auto">
      <v-card>
        <v-card-title class="text-center">Help</v-card-title>
        <v-card-text>
          <v-alert type="info">
            <v-alert-title>Experiencing a problem?</v-alert-title>
            <p>
              First, try clicking the below button to reload the app. If that doesn't work, try rebooting the phone.
              This can be done by holding down the lock button on the side and choosing "Reboot" when the options
              appear. A simple restart can fix many issues!
            </p>
            <v-btn @click="refreshPage()">Reload App</v-btn>
          </v-alert>
          <br>
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
          at the top of the screen. Alternatively, you can have someone else run the sections part by having them use
          the phone provided. They can then select sections for lyrics and pages as well as change the song instead of
          the worship leader having to.<br><br>

          If you have any questions, please see a TTA (all current TTAs are trained on the system), or contact Luke E.
          for further assistance or troubleshooting.<br><br>
        </v-card-text>
        <v-card-actions>
          <div class="d-flex justify-center w-100">
            <v-btn @click="closeHelpDialog">Close</v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <SongAndKeySelector
      :songs="songList"
      :songs-done-already-string="songsDoneAlreadyString"
      v-model:previous-key-choice="previousKeyChoice"
      @choice="processNewSong"
      v-model="songSelectorIsOpen"
    />

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
          <v-btn icon="mdi-magnify" @click="songSelectorIsOpen = true"></v-btn>
        </v-col>
      </v-row>
      <v-card-actions class="d-flex justify-center flex-column my-0 py-0" v-if="currentSongInfo">
          <template v-for="row in [...Array(Math.ceil((listOfSectionsInChordChart.length) / 6)).keys()].map(i => i * 6)" :key="row">
            <div class="d-flex align-content-center justify-center align-center">
              <v-row class="align-center">
                <v-col></v-col>
                <template v-for="(section, index) in listOfSectionsInChordChart.slice(row, (row + 6))" :key="index">
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
