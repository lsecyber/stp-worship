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
  return uniqueId + window.location
}

// End Random String UUID Functions


export default async function useUpdateInfoApiRequest(section = '', songName = '', artist = '', ccliSongNumber = '', keyChoice = '') {

  const uuid = getUniqueId()

  const urlQuery = new URLSearchParams({
    source: uuid,
    section: section,
    songName: songName,
    artist: artist,
    ccliSongNumber: ccliSongNumber,
    keyChoice: keyChoice,
    token: import.meta.env.VITE_SECRET_TOKEN
  })

  const rawResponse = await fetch(import.meta.env.VITE_BASE_API_URL + '/updateinfo' + '?' + urlQuery.toString())
  return rawResponse.status === 200
}
