export default async function useUpdateInfoApiRequest(section = '', songName = '', artist = '', ccliSongNumber = '') {
  const urlQuery = new URLSearchParams({
    section: section,
    songName: songName,
    artist: artist,
    ccliSongNumber: ccliSongNumber
  })

  const rawResponse = await fetch('http://192.168.1.50:5111/updateinfo' + '?' + urlQuery.toString())
  return rawResponse.status === 200
}
