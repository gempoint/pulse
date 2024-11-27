import axios, { AxiosError } from 'axios';
import type { Context, ValidationTargets } from 'hono';
import { SpotifyApi, type AccessToken, type Track } from '@spotify/web-api-ts-sdk';
import type { RecommendedSong, Song, User } from 'compute';
import _ from 'lodash';
import type { PlaylistViewerProps } from 'etc';
import os from 'os';
import { bearerAuth } from 'hono/bearer-auth'
import safeAwait from 'safe-await';
import { verify } from 'hono/jwt';

import { createMiddleware } from 'hono/factory'
import prisma from './prisma';
import type { Prisma } from '@prisma/client';
import { zValidator } from '@hono/zod-validator';
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

//export const arrToString = (arr: string[]) => {
//  if (arr.length === 0) {
//    return "";
//  } else if (arr.length === 1) {
//    return arr[0];
//  } else if (arr.length === 2) {
//    return arr.join(" & ");
//  } else {
//    return arr.slice(0, -1).join(", ") + " & " + arr[arr.length - 1];
//  }
//}

export const arrToString = (arr: string[]) => arr.length > 0 ? arr.join(", ") : arr[0]
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

  let tracks: Map<string, number> = new Map()


  sd.forEach(async t => {
    t.tracks.forEach(track => {
      if (tracks.has(track.id)) {
        tracks.set(track.id, tracks.get(track.id)! + 1)
      } else {
        tracks.set(track.id, 1)
      }
    })
  })

  //await prisma.stat.upsert({
  //  where: {
  //    type_special: {
  //      type: 'View',
  //      special: 'global'
  //    }
  //  },
  //  create: Object.fromEntries(tracks),
  //  update: {
  //    ...Object.fromEntries(tracks),
  //  }
  //})

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


export const getLocalIP = () => {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const addresses = interfaces[interfaceName];
    for (const address of addresses!) {
      if (address.family === 'IPv4' && !address.internal) {
        return address.address;
      }
    }
  }
};

//export const auth = (optional: boolean) => bearerAuth({
//  verifyToken: async (token, c) => {
//    const [err, dat] = await safeAwait(verify(token, SECRET as unknown as string))
//    if (err) {
//      //return false
//      return ba(c, 'bad token')

//    }
//    if (dat) {
//      return true
//    }
//  },
//  noAuthenticationHeaderMessage: async (c) => {
//    if (optional) {
//      return
//    } else {
//      return ba(c, "no auth header provided")
//    }
//  }
//})

//export const auth = (idk: unknown) => console.log(idk)


export const auth = (optional: boolean = false) => createMiddleware<{
  Variables: {
    id: string
  }
}>(async (c, next) => {
  //console.log(`[${c.req.method}] ${c.req.url}`)
  //await next()
  let auth = c.req.header('Authorization')
  if (!auth && !optional) {
    return ba(c, 'no auth token provided')
  }

  // idk what i was thinking here
  //if (!auth?.startsWith('Bearer ')) {

  //}

  let token = auth!.replace('Bearer ', '')

  const [err, dat] = await safeAwait(verify(token, SECRET))

  if (err) {
    return ba(c, "bad auth token")
  }

  if (dat) {
    // might be a good idea? idk
    //let check = await prisma.user.findUnique({
    //  where: {
    //    id: dat!.id as unknown as string
    //  }
    //})
    //if (check === null) {
    //  return ba(c, "user not found")
    //}
    c.set('id', dat!.id)
    return await next()
  }
})


export const freshSDK = async (user: Prisma.UserSelect) => {
  let [e_, keys] = await safeAwait(
    a.post<AccessToken>(
      "https://accounts.spotify.com/api/token",
      {
        grant_type: "refresh_token",
        refresh_token: user?.refresh_token,
        //client_id: Bun.env.SPOTIFY_CLIENT_ID
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: AUTH_HEADER,
        },
      },
    ),
  );
  if (e_) {
    const errors = e_ as Error | AxiosError;
    if (axios.isAxiosError(errors)) {
      if (errors.response) {
        console.log("get token errored out");
        console.error(errors.response.data);
      }
    }
    return
  }

  let { data } = keys!;
  return SpotifyApi.withAccessToken(
    SPOTIFY_CLIENT_ID!,
    {
      access_token: data.access_token,
      expires_in: data.expires_in,
      refresh_token: user?.refresh_token!,
      token_type: "Bearer",
    },
    {
      // https://github.com/spotify/spotify-web-api-ts-sdk/issues/127 ¯\_(ツ)_/¯
      deserializer: new MyDeserializer(),
    },
  );
}

export const validate = (where: keyof ValidationTargets, schema: ZodType<any, ZodTypeDef, any>) => zValidator(where, schema, (result, c) => {
  if (!result.success) {
    return ba(c, {
      type: "INVALID_DATA"
    })
  }
})
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
    EXPO_TOKEN: string
  }
}