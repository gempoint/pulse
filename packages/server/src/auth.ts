import { sign, verify } from "hono/jwt";
import { a, auth, AUTH_HEADER, ba, DEFAULT_IMG, getLocalIP, go, SECRET, SPOTIFY_ACCOUNTS_ENDPOINT, SPOTIFY_CLIENT_ID } from "./utils";
import safeAwait from "safe-await";
import prisma from "./prisma";
import type { AxiosError } from "axios";
import { SpotifyApi, type AccessToken } from "@spotify/web-api-ts-sdk";
import { Hono } from "hono";
import qs from 'qs';
import { getAverageColor } from 'fast-average-color-node';

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

const app = new Hono()




const redirect_uri = `http://${getLocalIP()}:3000/callback`;

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
  let profile = await sdk.currentUser.profile()
  let spotifyId = profile.id
  let pos
  pos = await prisma.user.findFirst({
    where: {
      id: spotifyId,
    }
  })

  let pfp, color

  if (profile?.images.length === 0) {
    pfp = DEFAULT_IMG
  } else {
    pfp = profile?.images.sort((a, b) => (a > b ? -1 : 1))[0].url
    color = (await getAverageColor(pfp)).hex
  }


  if (!pos) {
    pos = await prisma.user.create({
      data: {
        id: spotifyId,
        access_token: res?.data.access_token as string,
        refresh_token: res?.data.refresh_token as string,
        token: "",
        profile: {
          create: {
            color,
            pfp,
            name: profile.display_name,
          }
        }
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

  if (!pos.finished) {
    return c.redirect(`pulse://onboard?code=${jwt}`)
  } else {
    return c.redirect(`pulse://auth?code=${jwt}`)
  }
})



app.get('/valid', auth(), async (c) => {
  if (c.get('id')) {
    return go(c, '')
  }
})

export default app