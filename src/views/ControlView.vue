<script setup>
import ControllerButtons from "@/components/ControllerButtons.vue";
import io from 'socket.io-client'
import {computed, ref, watch} from "vue";
import useApiRequest from "@/composables/apiRequest";

const connected = ref(true)

const baseApiUrl = 'http://192.168.1.1:5111'

// eslint-disable-next-line no-unused-vars
fetch(baseApiUrl + '/info/currentinfo.json').catch(e => {connected.value = false})

watch(connected, (newVal) => {
  console.log('watch ran')
  if (newVal) {
    console.log('updating socket')
    socket.value = io(baseApiUrl)
  }
}, {deep: true})

const socket = ref(io(baseApiUrl))
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
  const rawResponse = await fetchWithTimeout(baseApiUrl + '/info/' + songName + '--songinfo.json').catch(e => {connected.value = false})
  if (connected.value) {
    currentSongInfoFile.value = await rawResponse.json()

  }

  console.log('updated')
}

await updateInfo()

socket.value.on('update', async (data) => {
  connected.value = true
  await updateInfo(data)
})

const sections = computed(() => {
  if (!currentSongInfoFile.value) {
    return []
  }
  return Object.keys(currentSongInfoFile.value.sections_by_page).map(pageNumber => {
    return currentSongInfoFile.value.sections_by_page[pageNumber]
  }).flat()
})

const handleClick = (section) => {
  fetchWithTimeout(baseApiUrl + '/updateinfo?' + new URLSearchParams({'section': section})).then(() => {
    console.log('updated to: ', section)
  }).catch(() => {
    console.log('error updating')
    connected.value = false
  })
}

console.log('done!!')

const helpDialogOpen = ref(false)
</script>

<template>
  <v-app>
    <v-container class="w-100 h-100">
      <v-app-bar>
        <v-spacer></v-spacer>
        <v-app-bar-title class="text-center">
          {{currentSongInfo?.song_name ? currentSongInfo?.song_name : 'STP Worship Controller'}}
        </v-app-bar-title>
        <v-spacer></v-spacer>
        <v-btn icon @click="helpDialogOpen = !helpDialogOpen"><v-icon>mdi-help</v-icon></v-btn>
      </v-app-bar>

      <v-main>

        <v-dialog v-model="helpDialogOpen" width="auto">
          <v-card>
            <v-card-title class="text-center">Help</v-card-title>
            <v-alert type="info">
              <v-alert-title>Experiencing a problem?</v-alert-title>
              <p>Before any other troubleshooting steps, please ensure you are connected to the "STPWorship" WiFi, and refresh the page.</p>
            </v-alert>
            <v-card-text>
              This is a simple controller for the STP worship system. It is not for showing the chords or lyrics.
              This page is commonly used by another person than the worship leader to control the lyrics if the worship
              leader has a two-hand instrument such as guitar. The buttons on this page have the same function as the
              buttons at the top of the chords tablet.
            </v-card-text>
            <v-card-actions>
              <div class="d-flex justify-center w-100">
                <v-btn @click="helpDialogOpen = false">Close</v-btn>
              </div>
            </v-card-actions>
          </v-card>
        </v-dialog>


        <template v-if="connected">
          <ControllerButtons :sections="sections" :current-section="currentSection" @section-button-click="handleClick"/>
        </template>
        <template v-else>
          <v-alert type="error" title="Not Connected">You are disconnected from the controller. Please ensure you are connected to the "STPWorship" WiFi.</v-alert>
        </template>
      </v-main>

    </v-container>
  </v-app>
</template>

<style scoped>

</style>