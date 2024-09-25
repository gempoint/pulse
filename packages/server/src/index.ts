import { Hono, type Context } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { SpotifyApi, type AccessToken } from "@spotify/web-api-ts-sdk";
import { logger } from 'hono/logger'
import { AxiosError } from 'axios';
import qs from 'qs'
import safeAwait from 'safe-await';
import { sign, verify, decode } from 'hono/jwt'
import { createBunWebSocket } from 'hono/bun'
import type { ServerWebSocket } from 'bun'
import os from 'os';
import { bearerAuth } from 'hono/bearer-auth'

const { upgradeWebSocket, websocket } =
  createBunWebSocket<ServerWebSocket>()
import prisma from './prisma';
import redis from './redis';
import ws from './ws'
import { a, AUTH_HEADER, SECRET, SPOTIFY_ACCOUNTS_ENDPOINT, SPOTIFY_CLIENT_ID } from './utils'
import { getTopTracks } from './spotify';




const getLocalIP = () => {
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

const go = (x: Context, y: unknown) => x.json({ msg: y, ok: true });

const ba = (x: Context, y: unknown) => x.json({ msg: y, ok: false });


const app = new Hono()

const redirect_uri = `http://${getLocalIP()}:3000/callback`;

app.use(logger())

app.onError((err, c) => {
  console.error(err)
  return c.json({
    msg: err.message,
    ok: false
  })
})

app.get('/', (c) => c.text('sadly i run'))


const scopes: string = [
  "user-read-currently-playing", // get queue
  "user-top-read", // get top content
  "user-read-recently-played", // get recent
  "user-read-email", // get email
  "user-read-private", //get subscription
  "user-follow-read", // get following
  "user-modify-playback-state" //add to queue
].join(" ");


app.get('/login', (c) => {
  let code = crypto.randomUUID();
  return c.redirect(`${SPOTIFY_ACCOUNTS_ENDPOINT}/authorize?` +
    qs.stringify({
      response_type: 'code',
      client_id: SPOTIFY_CLIENT_ID,
      scope: scopes,
      redirect_uri: redirect_uri,
      state: code
    }));
})

app.get('/callback', async (c) => {
  let dat = c.req.query()

  if (dat === undefined) {
    return ba(c, 'required part is blank')
  }
  console.log(dat)

  let [aErr, res] = await safeAwait(a.post<AccessToken>(`${SPOTIFY_ACCOUNTS_ENDPOINT}/api/token`, {
    code: dat.code,
    redirect_uri: redirect_uri,
    grant_type: 'authorization_code'
  }, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': AUTH_HEADER
    }
  }))


  if (aErr as AxiosError) {
    // @ts-ignore
    console.log(aErr?.response?.data)
    return ba(c, 'something with wrong communicating with spotify')
  }
  console.log(res?.data)
  let sdk = SpotifyApi.withAccessToken(SPOTIFY_CLIENT_ID as unknown as string, res?.data as AccessToken, {})
  let spotifyId = (await sdk.currentUser.profile()).id
  let pos
  pos = await prisma.user.findFirst({
    where: {
      id: spotifyId,
    }
  })
  await prisma.user.update({
    where: {
      id: pos?.id
    },
    data: {
      access_token: res?.data.access_token as string,
      refresh_token: res?.data.refresh_token as string,
    }
  })


  if (!pos) {
    pos = await prisma.user.create({
      data: {
        id: spotifyId,
        access_token: res?.data.access_token as string,
        refresh_token: res?.data.refresh_token as string,
        token: "",
        verified: false,
      }
    })
  }

  let jwt = await sign({
    id: spotifyId
  }, SECRET as unknown as string)


  return c.redirect(`pulse://auth?code=${jwt}`)
})

app.get('/valid', async (c) => {
  let auth = c.req.header('Authorization')
  console.log(auth)
  if (!auth) {
    return ba(c, 'no auth token')
  }
  const [err, dat] = await safeAwait(verify(auth.replace('Bearer ', ''), (SECRET as unknown as string)))

  if (err) {
    console.log(err)
    return ba(c, 'bad token')
  }

  if (dat) {
    return go(c, '')
  }
})

const radarValid = z.object({
  lat: z.number(),
  long: z.number(),
})

app.post('/radar', zValidator('json', radarValid), async (c) => {
  const v = c.req.valid('json')
  let auth = c.req.header('Authorization')
  console.log(auth)
  if (!auth) {
    return ba(c, 'no auth token')
  }
  auth = auth.replace('Bearer ', '')
  console.log(auth)

  const [err, dat] = await safeAwait(verify(auth, (SECRET as unknown as string)))
  if (err) {
    console.log(err)
    return ba(c, 'bad token')
  }
  //const { payload } = decode(auth)
  console.log('lat', v.lat)
  console.log('long', v.long)
  let x = await redis.geoAdd('user_loc', {
    latitude: v.lat!,
    longitude: v.long!,
    member: dat.id!
  })
  console.log(x)

  let nearby = await redis.geoRadius('user_loc', {
    latitude: v.lat,
    longitude: v.long,
  }, 100, 'm')
  console.log(nearby)
  let tracks = await getTopTracks(nearby)
  return go(c, {
    nearby: nearby.length,
    tracks: tracks.length
  })

})

app.get('/ws', upgradeWebSocket((c) => ws(c)))


Bun.serve({
  fetch: app.fetch,
  port: 3000,
  websocket,
})

//export default app