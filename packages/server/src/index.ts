import { Hono } from 'hono'

import { SpotifyApi, type AccessToken } from "@spotify/web-api-ts-sdk";
import { logger } from 'hono/logger'
import { AxiosError } from 'axios';
import qs from 'qs'
import safeAwait from 'safe-await';
import { sign, verify, decode } from 'hono/jwt'
import os from 'os';
import { sentry } from '@hono/sentry'
import prisma from './prisma';
import { a, AUTH_HEADER, ba, go, SECRET, SPOTIFY_ACCOUNTS_ENDPOINT, SPOTIFY_CLIENT_ID } from './utils'
import radar from './radar';


//console.log()

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

const app = new Hono()

const redirect_uri = `http://${getLocalIP()}:3000/callback`;

app.use(logger())
app.use('*', sentry())

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
  "user-modify-playback-state", //add to queue,
  "user-read-playback-state" //read state
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
  } else {
    await prisma.user.update({
      where: {
        id: pos?.id
      },
      data: {
        access_token: res?.data.access_token as string,
        refresh_token: res?.data.refresh_token as string,
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



app.route('/', radar)


Bun.serve({
  fetch: app.fetch,
  port: 3000,
})

//const worker = new Worker("./worker.ts");
const worker = new Worker(new URL("worker.ts", import.meta.url).href, {
  // @ts-expect-error
  smol: true
});

worker.addEventListener("open", event => {
  console.log("worker is being open");
});


worker.addEventListener("close", event => {
  console.log("worker is being closed");
});


//export default app