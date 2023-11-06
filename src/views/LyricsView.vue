<script setup>
import LyricsViewer from "@/components/LyricsViewer.vue";
import useApiRequest from "@/composables/apiRequest";
import {ref} from "vue";

const baseApiUrl = import.meta.env.VITE_BASE_API_URL

const currentSongInfo = ref({})

currentSongInfo.value = await useApiRequest('currentInfo')


import io from 'socket.io-client'

const socket = io(baseApiUrl)

socket.on('update', (data) => {
  currentSongInfo.value = data
  console.log('updated')
})
</script>

<template>
  <div class="w-100 h-100">
    <div class="d-flex justify-center align-center">
      <LyricsViewer
          :name="currentSongInfo?.song_name"
          :section="currentSongInfo?.section"
          :lyrics="currentSongInfo?.lyrics"
          :copyright="currentSongInfo?.copyright"
      />
    </div>

  </div>
</template>