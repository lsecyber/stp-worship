export default async function useApiRequest(songName, isFemaleKey) {
  let url = 'http://192.168.1.50:5111/info/'
  if (songName === 'currentInfo' || songName === 'songlist') {
    url += songName + '.json'
  } else {
    url += songName + '--songinfo.json'
  }
  const rawResponse = await fetch(url, {cache: "reload"})
  const jsonResponse = await rawResponse.json()
  return jsonResponse
}
