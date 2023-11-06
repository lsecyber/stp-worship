<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
const emit = defineEmits(['swipeleft', 'swiperight', 'swipeup', 'swipedown'])
const touchStartX = ref(0)
const touchStartY = ref(0)
const touchEndX = ref(0)
const touchEndY = ref(0)
const minDistanceXAxis = ref(40)
const maxDistanceYAxis = ref(40)
const swipeDetected = ref(false)
const swipeDirection = ref(null)

const swipeContainer = ref(null)

const handleTouchStart = (event) => {
  touchStartX.value = event.changedTouches[0].screenX
  touchStartY.value = event.changedTouches[0].screenY
}

const handleTouchEnd = (event) => {
  touchEndX.value = event.changedTouches[0].screenX
  touchEndY.value = event.changedTouches[0].screenY
  handleGesture()
}

const handleGesture = () => {
  console.log('Handling Gesture inside SwipeDetector')

  const distanceX = touchEndX.value - touchStartX.value
  const distanceY = touchEndY.value - touchStartY.value
  if (Math.abs(distanceX) > Math.abs(distanceY)) {
    // horizontal movement
    if (Math.abs(distanceX) > minDistanceXAxis.value) {
      // left or right swipe
      swipeDetected.value = true
      if (distanceX > 0) {
        swipeDirection.value = 'right'
        emit('swiperight')
      } else {
        swipeDirection.value = 'left'
        emit('swipeleft')
      }
    }
  } else {
    // vertical movement
    if (Math.abs(distanceY) > maxDistanceYAxis.value) {
      // up or down swipe
      swipeDetected.value = true
      if (distanceY > 0) {
        swipeDirection.value = 'down'
      } else {
        swipeDirection.value = 'up'
      }
    }
  }
  if (swipeDetected.value) {
    touchEndX.value = 0
    touchStartX.value = 0
    touchEndY.value = 0
    touchStartY.value = 0
    swipeDetected.value = false
  }
}

onMounted(() => {
  swipeContainer.value.addEventListener('touchstart', handleTouchStart, false)
  swipeContainer.value.addEventListener('touchend', handleTouchEnd, false)
  swipeContainer.value.addEventListener('touchmove', function(e) {e.preventDefault()}, false)
})
</script>

<template>
<div ref="swipeContainer">
  <slot></slot>
</div>
</template>

<style scoped>

</style>