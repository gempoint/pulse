import { a, auth, AUTH_HEADER, ba, expirationTime, go, MyDeserializer, playlistOut, REDIS_EXPIRE_KEY, REDIS_GEO_KEY, SECRET, shuffle, spotify, SPOTIFY_CLIENT_ID, userConverter, usersConverter } from "./utils";
import safeAwait from "safe-await";
import redis from "./redis";
import { SpotifyApi, type AccessToken, type Page, type Track } from "@spotify/web-api-ts-sdk";
import prisma from "./prisma";
import type { AxiosError } from "axios";
import axios from "axios";
import { Hono } from 'hono'
import { zValidator } from "@hono/zod-validator";
import { z } from 'zod'
import _ from "lodash"
import { getRecommendations } from 'compute';

const app = new Hono()

const SONG_LIST_LIMIT = 10
const RANDOM_ASS_CALLBACK_LIMIT = 5

const radarValid = z.object({
  lat: z.number(),
  long: z.number(),
  src: z.literal("queue").or(z.literal("top")).default("top")
})

const radarFinalValid = z.object({
  songs: z.array(z.string())
})

app.post('/radar', zValidator('json', radarValid), auth(), async (c) => {
  const v = c.req.valid('json')

  //const { payload } = decode(auth)
  console.log('lat', v.lat)
  console.log('long', v.long)

  const expirationTimestamp = Math.floor(Date.now() / 1000) + expirationTime;

  let x = await redis.geoAdd(REDIS_GEO_KEY, {
    latitude: v.lat!,
    longitude: v.long!,
    member: c.get('id')
  })
  console.log(x)

  await redis.zAdd(REDIS_EXPIRE_KEY, {
    score: expirationTimestamp,
    value: c.get('id')
  })

  // had to change bc of change from redis -> dragonfly for better performance
  let nearby_ = await redis.geoSearch(REDIS_GEO_KEY, {
    latitude: v.lat,
    longitude: v.long,
  }, {
    radius: 100,
    // weird quirk bc official redis docs use 'm' but dragonflydb uses 'M' ¯\_(ツ)_/¯
    unit: 'M' as 'm',
  });
  console.log('n_', nearby_)

  let nearby = _.flatten(nearby_)
  console.log('n', nearby)

  // comment out to most likely keep user id
  //let h = nearby.indexOf(dat.id! as string)

  //if (h !== -1) {
  //  nearby.splice(h, 1)
  //}

  let user = await prisma.user.findUnique({
    where: { id: c.get('id') }
  })

  console.log(user?.id)
  console.log('getting token')
  let [e_, keys] = await safeAwait(a.post<AccessToken>("https://accounts.spotify.com/api/token", {
    grant_type: 'refresh_token',
    refresh_token: user!.refresh_token,
    //client_id: Bun.env.SPOTIFY_CLIENT_ID
  }, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': AUTH_HEADER
    }
  }))
  if (e_) {
    const errors = e_ as Error | AxiosError;
    if (axios.isAxiosError(errors)) {
      if (errors.response) {
        console.log('get token errored out')
        console.error(errors.response.data);
      }
    }

  }

  let { data } = keys!
  //console.log(data)

  console.log('spotify sdk')
  let mainUser = SpotifyApi.withAccessToken(SPOTIFY_CLIENT_ID!, {
    access_token: data.access_token,
    expires_in: data.expires_in,
    refresh_token: user?.refresh_token!,
    token_type: "Bearer"
  }, {
    // https://github.com/spotify/spotify-web-api-ts-sdk/issues/127 ¯\_(ツ)_/¯
    deserializer: new MyDeserializer()
  })

  let [er, profile] = await safeAwait(mainUser.currentUser.profile())
  if (er) {
    console.error(er)
  }
  let y = profile?.product

  if (y !== 'premium') {
    return ba(c, {
      type: 'NO_PREMIUM'
    })
  } else {
    let [err, state] = await safeAwait(mainUser.player.getPlaybackState())
    if (err) {
      console.log('stateError', err)
      //return 
    }
    console.log('state', state)
    if (state === null) {
      return ba(c, {
        type: 'NO_PLAYER'
      })
    }
  }

  let userTracks: Track[] = []
  //if (v.src === 'top') {
  //  userTracks = (await mainUser.currentUser.topItems('tracks', 'short_term', RANDOM_ASS_CALLBACK_LIMIT)).items
  //} else {
  //  let tracks_ = (await mainUser.player.getRecentlyPlayedTracks(RANDOM_ASS_CALLBACK_LIMIT)).items
  //  userTracks = _.uniqBy(tracks_.map(i => i.track), (i => i.id));
  //}
  userTracks = (await mainUser.currentUser.topItems('tracks', 'short_term', RANDOM_ASS_CALLBACK_LIMIT)).items


  //let tracks: Track[] = []
  let list: Record<string, Track[]> = {}
  //let i = 0
  // idk something abt the return type
  for (const id of nearby) {
    if (id.startsWith("p_")) {
      let dat = await spotify.playlists.getPlaylist(id.slice(2))
      //console.log('dat', dat)

      list[id] = dat.tracks.items.map(i => i.track)
    } else {
      console.log('id', id)
      let [e, user] = await safeAwait(prisma.user.findUnique({
        where: { id }
      }))

      if (user === null) {
        console.error('user doesnt exist?')
        continue
      }
      //console.log()
      //let token = getAccessToken(user!)
      console.log(`getting token of ${id}`)
      let [err, dat] = await safeAwait(a.post<AccessToken>("https://accounts.spotify.com/api/token", {
        grant_type: 'refresh_token',
        refresh_token: user.refresh_token,
        //client_id: Bun.env.SPOTIFY_CLIENT_ID
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': AUTH_HEADER
        }
      }))
      if (err) {
        const errors = err as Error | AxiosError;
        if (axios.isAxiosError(errors)) {
          if (errors.response) {
            console.log('get token errored out')
            console.error(errors.response.data);
          }
        }

      }
      //console.log(dat)
      let { data } = dat!
      let sdk = SpotifyApi.withAccessToken(SPOTIFY_CLIENT_ID!, {
        access_token: data.access_token,
        expires_in: data.expires_in,
        refresh_token: user?.refresh_token!,
        token_type: "Bearer"
      }, {
        // https://github.com/spotify/spotify-web-api-ts-sdk/issues/127 ¯\_(ツ)_/¯
        deserializer: new MyDeserializer()
      })
      //console.log('name', (await sdk.currentUser.profile()).display_name)
      let tracks: Track[] = []

      if (v.src === 'top') {
        tracks = (await sdk.currentUser.topItems('tracks', 'short_term', RANDOM_ASS_CALLBACK_LIMIT)).items
      } else {
        let tracks_ = (await sdk.player.getRecentlyPlayedTracks(RANDOM_ASS_CALLBACK_LIMIT)).items
        tracks = _.uniqBy(tracks_.map(i => i.track), (i => i.id));
      }

      //console.log(tracks_.items)

      if (tracks.length === 0) {
        console.log(`no tracks from a user?`)
        continue
      } else {
        list[id] = tracks
      }

    }
  }
  let main = await userConverter("main", userTracks)
  //console.log('main:', main)
  let others = await usersConverter(list)
  //console.log('users:', others)

  let output = (getRecommendations(JSON.stringify(main), JSON.stringify(others), SONG_LIST_LIMIT))
  //console.log('o', output)
  let hell = await playlistOut(output)
  //console.log('h', hell)
  return go(c, hell)
})

app.post('/radarFinal', zValidator('json', radarFinalValid), auth(), async (c) => {
  const v = c.req.valid('json')

  let user = await prisma.user.findUnique({
    where: { id: c.get('id') }
  })

  console.log(user?.id)
  console.log('getting token')
  let [e_, keys] = await safeAwait(a.post<AccessToken>("https://accounts.spotify.com/api/token", {
    grant_type: 'refresh_token',
    refresh_token: user!.refresh_token,
    //client_id: Bun.env.SPOTIFY_CLIENT_ID
  }, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': AUTH_HEADER
    }
  }))
  if (e_) {
    const errors = e_ as Error | AxiosError;
    if (axios.isAxiosError(errors)) {
      if (errors.response) {
        console.log('get token errored out')
        console.error(errors.response.data);
      }
    }

  }


  let { data } = keys!
  //console.log(data)

  console.log('spotify sdk')
  let mainUser = SpotifyApi.withAccessToken(SPOTIFY_CLIENT_ID!, {
    access_token: data.access_token,
    expires_in: data.expires_in,
    refresh_token: user?.refresh_token!,
    token_type: "Bearer"
  }, {
    // https://github.com/spotify/spotify-web-api-ts-sdk/issues/127 ¯\_(ツ)_/¯
    deserializer: new MyDeserializer()
  })

  let [er, profile] = await safeAwait(mainUser.currentUser.profile())
  if (er) {
    console.error(er)
  }
  let y = profile?.product

  if (y !== 'premium') {
    return ba(c, {
      type: 'NO_PREMIUM'
    })
  } else {
    let [err, state] = await safeAwait(mainUser.player.getPlaybackState())
    if (err) {
      console.log('stateError', err)
      //return 
    }
    console.log('state', state)
    if (state === null) {
      return ba(c, {
        type: 'NO_PLAYER'
      })
    }
  }

  let good = 0
  let bad = 0

  //v.songs.forEach(async (song) => {
  //  try {
  //    let d = await mainUser.player.addItemToPlaybackQueue(`spotify:track:${song}`)
  //    good++
  //  } catch (err) {
  //    console.error(err)
  //    bad++
  //  }
  //})
  for (let song of v.songs) {
    try {
      let d = await mainUser.player.addItemToPlaybackQueue(`spotify:track:${song}`)
      good++
    } catch (err) {
      console.error(err)
      bad++
    }
  }

  return go(c, {
    good, bad
  })

})

export default app