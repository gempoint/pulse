import type { Context } from "hono";
import { a, AUTH_HEADER, ba, expirationTime, go, REDIS_EXPIRE_KEY, REDIS_GEO_KEY, SECRET, shuffle, SPOTIFY_CLIENT_ID } from "./utils";
import { verify } from "hono/jwt";
import safeAwait from "safe-await";
import redis from "./redis";
import { SpotifyApi, type AccessToken, type Page, type Track } from "@spotify/web-api-ts-sdk";
import prisma from "./prisma";
import type { AxiosError } from "axios";
import axios from "axios";

const SONG_LIST_LIMIT = 10

class MyDeserializer {
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

export default async (c: Context<{}, "/radar", {
  in: {
    json: {
      lat: number;
      long: number;
    };
  };
  out: {
    json: {
      lat: number;
      long: number;
    };
  };
}>) => {
  const v = c.req.valid('json')
  let auth = c.req.header('Authorization')
  console.log(auth)
  if (!auth) {
    return ba(c, 'no auth token')
  }
  auth = auth.replace('Bearer ', '')
  //console.log(auth)

  const [err, dat] = await safeAwait(verify(auth, (SECRET as unknown as string)))
  if (err) {
    console.log(err)
    return ba(c, 'bad token')
  }
  //const { payload } = decode(auth)
  console.log('lat', v.lat)
  console.log('long', v.long)

  const expirationTimestamp = Math.floor(Date.now() / 1000) + expirationTime;

  let x = await redis.geoAdd(REDIS_GEO_KEY, {
    latitude: v.lat!,
    longitude: v.long!,
    member: dat.id! as string,
  })
  console.log(x)

  await redis.zAdd(REDIS_EXPIRE_KEY, {
    score: expirationTimestamp,
    value: dat.id! as string
  })

  //let nearby = await redis.geoRadius(REDIS_GEO_KEY, {
  //  latitude: v.lat,
  //  longitude: v.long,
  //}, 100, 'm')

  // had to change bc of change from redis -> dragonfly for better performance
  let nearby = await redis.geoSearch(REDIS_GEO_KEY, {
    latitude: v.lat,
    longitude: v.long,
  }, {
    radius: 100,
    // weird quirk bc official redis docs use 'm' but dragonflydb uses 'M' ¯\_(ツ)_/¯
    unit: 'M' as 'm',
  });
  console.log(nearby)

  let h = nearby.indexOf(dat.id! as string)

  if (h !== -1) {
    nearby.splice(h, 1)
  }

  let user = await prisma.user.findUnique({
    where: { id: dat.id as unknown as string }
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

  let tracks: Track[] = []
  let i = 0
  // idk something abt the return type
  for (const id of nearby[0]) {
    console.log('id', id)
    let user = await prisma.user.findUnique({
      where: { id }
    })
    //console.log()
    //let token = getAccessToken(user!)
    console.log(`getting token of ${id}`)
    let [err, dat] = await safeAwait(a.post<AccessToken>("https://accounts.spotify.com/api/token", {
      grant_type: 'refresh_token',
      refresh_token: user!.refresh_token,
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
    console.log('name', (await sdk.currentUser.profile()).display_name)

    let tracks_ = await sdk.currentUser.topItems('tracks', 'short_term', 15)

    //console.log(tracks_.items)

    if (tracks_.items.length === 0) {
      console.log(`no `)
    }

    //console.log(tracks)
    //tracks = tracks.concat(tracks_)
    //console.log((await sdk.currentUser.profile()).display_name)
    // TODO: uncomment follow lines when we arent the only person using this
    //if (i === 0) {
    //  return;
    //} else {
    //  tracks.push(...tracks_.items)
    //}
    // TODO: comment follow line when we arent the only person using this
    tracks.push(...tracks_.items)
    tracks = shuffle(tracks)
    //i === 0 ? null : tracks.concat(tracks_)
    i++
  }
  console.log('length', tracks.length)
  tracks.splice(SONG_LIST_LIMIT)
  console.log('point1')

  let [er, profile] = await safeAwait(mainUser.currentUser.profile())
  if (er) {
    console.error(er)
  }
  let y = profile?.product
  //let y = (await mainUser.currentUser.profile()).product

  if (y === 'premium') {
    console.log('point2')

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
    tracks.forEach(async (x) => {
      try {
        await mainUser.player.addItemToPlaybackQueue(x.uri)
      } catch (e) {
        console.log(e)
      }
    })
  } else {
    return ba(c, {
      type: 'NO_PREMIUM'
    })
  }


  return go(c, {
    nearby: nearby.length,
    tracks: tracks.length
  })
}
//