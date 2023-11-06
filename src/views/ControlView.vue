<script setup>
import ControllerButtons from "@/components/ControllerButtons.vue";
import io from 'socket.io-client'
import {computed, ref, watch} from "vue";
import useApiRequest from "@/composables/apiRequest";
import useUpdateInfoApiRequest from "@/composables/updateInfoApiRequest";
import FullscreenLoader from "@/App.vue";

const pageIsLoading = ref(true)

const connected = ref(true)

const baseApiUrl = import.meta.env.VITE_BASE_API_URL

import {DeviceUUID} from 'device-uuid'
import SongAndKeySelector from "@/components/SongAndKeySelector.vue";
const deviceUUID = new DeviceUUID().get() + window.location

// eslint-disable-next-line no-unused-vars
fetch(baseApiUrl + '/info/currentinfo.json').catch(e => {connected.value = false})


const socket = io(baseApiUrl)


const songListResponse = await useApiRequest('songlist')
const songList = ref(songListResponse.sort())

const songsDoneAlreadyString = ref('')
const previousKeyChoice = ref('n')



async function fetchWithTimeout(resource, timeToTimeout = 5000, options = {}) {
  const { timeout = timeToTimeout } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  let error = null;
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal
  }).catch(err => {
    console.log('error!!!!!!!!!!!!!!')
    error = err;
  });
  clearTimeout(id);

  if (!error) {
    connected.value = true
  }

  return error ? Promise.reject(error) : response
}

const currentSongInfo = ref({})

const currentSongInfoFile = ref({})

const currentSection = computed(() => {
  return currentSongInfo.value ? currentSongInfo.value['section'] : ''
})

const updateInfo = async (songInfo = null) => {
  currentSongInfo.value = songInfo ? songInfo : await useApiRequest('currentInfo')
  let songName = currentSongInfo.value['song_name']
  const rawResponse = await fetchWithTimeout(baseApiUrl + '/info/' + songName + '--songinfo.json')
  if (connected.value) {
    currentSongInfoFile.value = await rawResponse.json()
    if (currentSongInfoFile.value?.keyChoice !== previousKeyChoice.value && currentSongInfoFile.value?.keyChoice !== '') {
      previousKeyChoice.value = currentSongInfoFile.value?.keyChoice
    }
  }
}

await updateInfo()

socket.on('update', async (data) => {
  connected.value = true
  if (data['deviceUUID'] !== deviceUUID) {
    await updateInfo(data)
  } else {
    console.log('Ignoring update because source is self.')
  }

})

const sections = computed(() => {
  if (!currentSongInfoFile.value) {
    return []
  }
  return Object.keys(currentSongInfoFile.value.sections_by_page).map(pageNumber => {
    return currentSongInfoFile.value.sections_by_page[pageNumber]
  }).flat()
})


const updateSectionAndOrSong = async (song, section='', key='') => {
  useUpdateInfoApiRequest(section, song, '', '', key).then(() => {
    console.log('updated')
  }).catch(() => {
    console.log('error updating')
  })
}

const handleSectionClick = (section) => {
  pageIsLoading.value = true
  updateSectionAndOrSong('', section, previousKeyChoice.value)
  setTimeout(() => {
    console.log('done loading')
    pageIsLoading.value = false
  }, 1000)
}

console.log('done!!')

const helpDialogOpen = ref(false)


// Below is for SongAndKeySelector.


const processNewSong = (choice) => {
  updateSectionAndOrSong(choice.song, '', choice.key)
  songsDoneAlreadyString.value = choice.songsCompleted
  previousKeyChoice.value = choice.key
}
const songSelectorIsOpen = ref(false)
// End for SongAndKeySelector

pageIsLoading.value = false
</script>

<template>
  <FullscreenLoader v-model="pageIsLoading" />

  <v-app>
    <v-container class="w-100 h-100">
      <v-app-bar>
        <template #prepend>
          <v-btn icon @click="helpDialogOpen = !helpDialogOpen"><v-icon>mdi-help</v-icon></v-btn>

        </template>

        <v-app-bar-title class="text-center" style="font-size: 1rem;">
          {{currentSongInfo?.song_name ? currentSongInfo?.song_name : 'STP Worship Controller'}}
        </v-app-bar-title>

        <template #append>
          <v-btn icon @click="songSelectorIsOpen = true"><v-icon>mdi-magnify</v-icon></v-btn>

        </template>
      </v-app-bar>

      <v-main>

        <v-dialog v-model="helpDialogOpen" width="auto">
          <v-card>
            <v-card-title class="text-center">Help</v-card-title>
            <v-alert type="info">
              <v-alert-title>Experiencing a problem?</v-alert-title>
              <p>Try rebooting the phone. This can be done by holding down the lock button on the side and choosing "Reboot" when the options appear. A simple restart can fix many issues!</p>
            </v-alert>
            <v-card-text>
              This is a simple controller for the STP worship system. It is not for showing the chords or lyrics.
              This page is commonly used by another person than the worship leader to control the lyrics if the worship
              leader has a two-hand instrument such as guitar. The buttons on this page have the same function as the
              buttons at the top of the chords tablet.<br><br>
              You can also change the current song from this phone by clicking the magnifying glass in the top right.<br><br>
              If you have further problems, please contact Luke E at (910) 264-6503.
            </v-card-text>
            <v-card-actions>
              <div class="d-flex justify-center w-100">
                <v-btn @click="helpDialogOpen = false">Close</v-btn>
              </div>
            </v-card-actions>
          </v-card>
        </v-dialog>


        <SongAndKeySelector
            :songs="songList"
            :songs-done-already-string="songsDoneAlreadyString"
            :previous-key-choice="previousKeyChoice"
            @choice="processNewSong"
            v-model="songSelectorIsOpen"
        />


        <template v-if="connected">
          <ControllerButtons :sections="sections" :current-section="currentSection" @section-button-click="handleSectionClick"/>
        </template>
        <template v-else>
          <v-alert type="error" title="Not Connected">You are disconnected from the controller. Please try again in a few minutes, or click the "?" button in the top right for help.</v-alert>
        </template>
      </v-main>

    </v-container>
  </v-app>
</template>

<style scoped>

</style>