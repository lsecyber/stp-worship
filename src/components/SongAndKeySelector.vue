<script setup>
import {computed, ref, watchEffect} from "vue";
import {useVModel} from '@vueuse/core'

const props = defineProps({
  songs: {
    type: Array,
    required: true
  },
  keyChoices: {
    type: Object,
    default() {
      return {'Male Worship Leader Key': 'm', 'Female Worship Leader Key': 'f', 'Nashville Number System': 'n'}
    }
  },
  songsDoneAlreadyString: {
    type: String,
    default() {
      return ''
    }
  },
  previousKeyChoice: {
    type: String,
    default() {
      return ''
    }
  },
  modelValue: Boolean
})
const emit = defineEmits(['update:modelValue', 'choice'])

const isDialogOpen = useVModel(props, 'modelValue', emit)


const rawSongChoice = ref('')
const rawKeyChoice = ref(props.previousKeyChoice ? props.previousKeyChoice : '')


// Functions for the random song button
const songsDoneAlreadyString = props.songsDoneAlreadyString && props.songsDoneAlreadyString !== '' ? props.songsDoneAlreadyString : btoa(new Date().toISOString() + JSON.stringify([]));


const encodeCompletedSongs = obj => btoa(new Date().toISOString() + JSON.stringify(obj));
const decodeCompletedSongs = str => ({ date: new Date(atob(str).slice(0, 24)), songs: JSON.parse(atob(str).slice(24)) });

const completedSongs = computed(() => decodeCompletedSongs(songsDoneAlreadyString).songs)
const dateOfCompletedSongs = computed(() => decodeCompletedSongs(songsDoneAlreadyString).date)


const createNewCompletedSongsString = (song) => {
  console.log('running createNewCompletedSongsString')
  // If dateOfCompletedSongs is not today, remove all completed songs from the list. (e.g. it is a new day)
  if (dateOfCompletedSongs.value.toDateString() !== new Date().toDateString()) {
    return encodeCompletedSongs([song])
  } else {
    const newCompletedSongs = completedSongs.value
    newCompletedSongs.push(song)
    return encodeCompletedSongs(newCompletedSongs)
  }
}

const pickRandomSong = () => {
  console.log('running pickRandomSong. completedSongs: ', completedSongs.value)
  const songsNotToPickFrom = completedSongs.value || []
  let songsToPickFrom = props.songs.filter(element => !songsNotToPickFrom.includes(element))
  if (songsNotToPickFrom.length === props.songs.length) {
    songsToPickFrom = props.songs
  }
  rawSongChoice.value = songsToPickFrom[Math.floor(Math.random() * songsToPickFrom.length)]
}
// End functions for the random song button

const handleSubmit = () => {
  isDialogOpen.value = false
  const newSongsCompletedString = createNewCompletedSongsString(rawSongChoice.value)
  emit('choice', {
    'song': rawSongChoice.value,
    'key': props.keyChoices[rawKeyChoice.value ? rawKeyChoice.value : 'n'],
    'songsCompleted': newSongsCompletedString}
  )
}

watchEffect(() => {
  let isDialogClosed = !isDialogOpen.value
  if (isDialogClosed) {
    rawSongChoice.value = ''
  }
})

</script>

<template>
  <v-dialog width="500" v-model="isDialogOpen">
    <v-card title="Change Songs">
      <v-form class="pa-6">
        <v-autocomplete
            :items="props.songs"
            label="Song Name"
            v-model="rawSongChoice"
        >
          <template v-slot:append>
            <v-icon icon="mdi-auto-fix" @click="pickRandomSong"></v-icon>
          </template>
        </v-autocomplete>
        <v-select
            label="Key"
            :items="Object.keys(props.keyChoices)"
            :disabled="!rawSongChoice"
            v-model="rawKeyChoice"
        ></v-select>
      </v-form>

      <v-card-actions>
        <v-btn
            text="Select"
            :disabled="!rawSongChoice || !rawKeyChoice"
            @click="handleSubmit()"
        ></v-btn>
        <v-spacer></v-spacer>

        <v-btn
            text="Cancel"
            color="red"
            @click="isDialogOpen = false; rawSongChoice = '';"
        ></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

</template>