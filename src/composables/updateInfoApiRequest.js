import {DeviceUUID} from 'device-uuid'

export default async function useUpdateInfoApiRequest(section = '', songName = '', artist = '', ccliSongNumber = '', keyChoice = '') {

  const deviceUUID = new DeviceUUID().get() + window.location

  const urlQuery = new URLSearchParams({
    source: deviceUUID,
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
