import axios from 'axios';
import type { Context } from 'hono';
import { SpotifyApi, type Track } from '@spotify/web-api-ts-sdk';
import type { RecommendedSong, Song, User } from 'compute';
import _ from 'lodash';
import type { PlaylistViewerProps } from 'etc';

export const a = axios.create({
  headers: {
    'User-Agent': 'Pulse-API (idk)'
  }
})

export const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SECRET } = Bun.env
export const SPOTIFY_ACCOUNTS_ENDPOINT = "https://accounts.spotify.com";
export const AUTH_SECRET = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
export const AUTH_HEADER = `Basic ${AUTH_SECRET}`;
export const DEFAULT_IMG = 'https://i.scdn.co/image/ab676161000051747baf6a3e4e70248079e48c5a'

export const SAFE_VALUES = [
  "id",
  "verified",
  "staff",
  "artist",
  "bio",
  "color",
  "name",
  "username",
  "pfp",
  "state"
];

export function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
};


export const spotify = SpotifyApi.withClientCredentials(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET)


export const go = (x: Context, y: unknown) => x.json({ msg: y, ok: true });

export const ba = (x: Context, y: unknown) => x.json({ msg: y, ok: false });

export const REDIS_GEO_KEY = 'user_loc'

export const REDIS_EXPIRE_KEY = 'geo_expire'

export const expirationTime = 3600;  // Expire in 1 hour (3600 seconds)

//export const usersConverter = async (x: Record<string, Track[]>) => await Promise.all(
//  Object.entries(x).map(async ([id, tracks]) => await userConverter(id, tracks))
//);

export const usersConverter = async (x: Record<string, Track[]>) => {
  let users: User[] = [];
  for (const [id, tracks] of Object.entries(x)) {
    let z = await userConverter(id, tracks)
    users.push(z)
  }
  //console.log('u', users)
  return users;
  //return await Promise.all(y.map(async ([id, tracks]) => await userConverter(id, tracks)))
}

export const userConverter = async (id: string, tracks: Track[]): Promise<User> => {
  let x = (await spotify.tracks.audioFeatures(tracks.map(i => i.id)))
  let y = x.map(i => {
    //console.log(i)
    //return i
    //return _.pick(i, "id danceability energy acousticness valence".split(" "))
    //console.log('o', i)
    return _.pick(i, ['id', 'danceability', 'energy', 'acousticness', 'valence'])
  }) as unknown as Song[]
  //console.log('lll', y)
  return {
    id,
    songs: y
  }
}

export const arrToString = (arr: string[]) => {
  if (arr.length === 0) {
    return "";
  } else if (arr.length === 1) {
    return arr[0];
  } else if (arr.length === 2) {
    return arr.join(" & ");
  } else {
    return arr.slice(0, -1).join(", ") + " & " + arr[arr.length - 1];
  }
}

export const playlistOut = async (x: RecommendedSong[]): Promise<PlaylistViewerProps> => {
  let i: PlaylistViewerProps = {}
  let r: Record<string, RecommendedSong[]> = {}
  x.forEach(x => {
    //console.log('x', x)
    if (!r[x.userId]) {
      r[x.userId] = []
    }
    r[x.userId].push(x)
  })
  let sd = []
  for (const [id, s] of Object.entries(r)) {
    let dat
    if (id.startsWith("p_")) {
      //console.log('p')
      //console.log(id)
      dat = await spotify.playlists.getPlaylist(id.slice(2))
      //dat.
    } else {
      //console.log('pr')
      //console.log('id', id)
      dat = await spotify.users.profile(id)
      //dat.
    }
    let t_ = []
    for (const song of s) {
      let info = await spotify.tracks.get(song.id)
      //console.log('i', info)
      t_.push({
        id: song.id,
        name: info.name,
        artist: arrToString(info.artists.map(i => i.name)),
        img: info.album.images.length === 0 ? DEFAULT_IMG : info.album.images.sort((a, b) => a > b ? -1 : 1)[0].url,
        preview_mp3: info.preview_url
      })
    }
    sd.push({
      id,
      name: id.startsWith("p_") ? dat.name : dat.display_name,
      img: dat.images.length === 0 ? DEFAULT_IMG : dat.images.sort((a, b) => a > b ? -1 : 1)[0].url,
      tracks: t_
    })
  }
  return {
    data: {
      info: sd,
      count: x.length
    }
  }
}

//source: https://stackoverflow.com/a/55251598
/**
 * Flatten a multidimensional object
 *
 * For example:
 *   flattenObject{ a: 1, b: { c: 2 } }
 * Returns:
 *   { a: 1, c: 2}
 */
export const flatten = (obj) => {
  const flattened = {}

  Object.keys(obj).forEach((key) => {
    const value = obj[key]

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(flattened, flatten(value))
    } else {
      flattened[key] = value
    }
  })

  return flattened
}


export class MyDeserializer {
  async deserialize(e: any) {
    const t = await e.text();
    if (t.length > 0 && this.isParseable(t)) {
      const e = JSON.parse(t)
      return e
    }
    return null
  }

  isParseable(string: string) {
    try {
      const e = JSON.parse(string)
      return true
    } catch (error) {
      return false
    }
  }
}

declare module "bun" {
  interface Env {
    SPOTIFY_CLIENT_ID: string
    SPOTIFY_CLIENT_SECRET: string
    SECRET: string
  }
}