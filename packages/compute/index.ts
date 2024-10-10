import { type User, findTopMatches } from './../compute-js/index';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import { run, bench, boxplot } from 'mitata'
import { findTopMatches as findTopMatchesR } from './../compute-rs';


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
    user_id: "",
    songs: []
  }
}

let users_: Record<string, User> = {
  MAIN: n(),
  USER_1: n(),
  USER_2: n(),
  USER_3: n(),
  USER_4: n(),
  USER_5: n()
}

let users = new Proxy(users_, {
  set(obj, prop, val) {
    obj[prop as string] = val
    console.log(obj)
    Bun.write(path, JSON.stringify(obj))
    //return true
    return Reflect.set(...arguments);
  },
})

let main: User

for (const key in Playlist) {
  let id = Playlist[key] as string
  console.log(key, id)
  let list = await api.playlists.getPlaylist(id)
  //console.log(list)
  users[key]!.user_id = list.id
  for (const song in list.tracks.items) {
    let { danceability, energy, acousticness, valence } = await api.tracks.audioFeatures(list.tracks.items[song].track.id)
    users[key].songs[song] = {
      danceability,
      energy,
      acousticness,
      valence,
      song_id: list.tracks.items[song].track.id,
      origin: id
    }
    //console.log(list.tracks.items[song])
  }
}
console.log(users)
console.log('run')
findTopMatches(users.MAIN, [users.USER_1, users.USER_2, users.USER_3], 5).then(x => console.log('ts', x))
console.log('rs', findTopMatchesR(JSON.stringify(users.MAIN), JSON.stringify([users.USER_1, users.USER_2, users.USER_3]), 5))
console.log('run')