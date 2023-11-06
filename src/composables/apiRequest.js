export default async function useApiRequest(songName) {
  let url = import.meta.env.VITE_BASE_API_URL + '/info/'
  if (songName === 'currentInfo' || songName === 'songlist') {
    url += songName + '.json'
  } else {
    url += songName + '--songinfo.json'
  }
  const rawResponse = await fetch(url, {cache: "reload"})
  const jsonResponse = await rawResponse.json()
  return jsonResponse
}
