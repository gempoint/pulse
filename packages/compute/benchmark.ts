import { type User, getRecommendations } from '../compute-js/index';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { run, bench, boxplot } from 'mitata'
import { findTopMatches as findTopMatchesR } from '../compute-rs';


const path = './dat.json'

const file = Bun.file(path)
if (!await file.exists()) {
  Bun.write(file, '{}')
}

// initialize
const api = SpotifyApi.withClientCredentials(
  Bun.env.SPOTIFY_CLIENT_ID as string,
  Bun.env.SPOTIFY_CLIENT_SECRET as string
);

const Playlist: Record<string, string> = {
  MAIN: "7zFKB8u7PSGAj9FASenxvs",
  USER_1: "3MPFi7k4ljTfy7deKU1XsO",
  USER_2: "6KfGH3B2NZzpOKNrYA7OqM",
  USER_3: "3pUYsjspJnl8kNceEevLNj",
  USER_4: "2yH1bWL9GrIhlsBL7UBQUA",
  USER_5: "6DZFHxnFlgYtojHMaXIcjk"
}



const n = () => {
  return {
    id: "",
    songs: []
  }
}

let users: Record<string, User> = {
  MAIN: n(),
  USER_1: n(),
  USER_2: n(),
  USER_3: n(),
  USER_4: n(),
  USER_5: n()
}

let main: User

const rewrite = true

if (rewrite) {
  console.log('rewriting')
  for (const key in Playlist) {
    let id = Playlist[key] as string
    console.log(key, id)
    let list = await api.playlists.getPlaylist(id)
    //console.log(list)
    users[key]!.id = list.id
    for (const song in list.tracks.items) {
      let { danceability, energy, acousticness, valence } = await api.tracks.audioFeatures(list.tracks.items[song].track.id)
      users[key].songs[song] = {
        danceability,
        energy,
        acousticness,
        valence,
        id: list.tracks.items[song].track.id,
      }
      //console.log(list.tracks.items[song])
    }
  }
  Bun.write(file, JSON.stringify(users))
} else {
  console.log('using cache')
  users = await file.json()
}
console.log(users)
console.log('run')
let js = getRecommendations(users.MAIN, [users.USER_1, users.USER_2, users.USER_3], 5)
console.log('js', js)
//let rs = findTopMatchesR(JSON.stringify(users.MAIN), JSON.stringify([users.USER_1, users.USER_2]), 5)
//console.log('rs', rs)
console.log('run')