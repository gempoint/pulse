import { Hono, type Context } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { SpotifyApi, type AccessToken } from "@spotify/web-api-ts-sdk";
import { logger } from 'hono/logger'
import axios, { AxiosError } from 'axios';
import qs from 'qs'
import safeAwait from 'safe-await';
import { sign, verify } from 'hono/jwt'

import prisma from './prisma';

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SECRET } = Bun.env
const SPOTIFY_ACCOUNTS_ENDPOINT = "https://accounts.spotify.com";
const AUTH_SECRET = btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`);
const AUTH_HEADER = `Basic ${AUTH_SECRET}`;

const go = (x: Context, y: unknown) => x.json({ msg: y, ok: true });

const ba = (x: Context, y: unknown) => x.json({ msg: y, ok: false });


const app = new Hono()

const a = axios.create({
  headers: {
    'User-Agent': 'Pulse-API (idk)'
  }
})
const redirect_uri = 'http://192.168.1.215:3000/callback';

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


export default app