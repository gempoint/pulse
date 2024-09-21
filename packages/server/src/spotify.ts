import type { User } from "@prisma/client"
import prisma from "./prisma"
import { a, AUTH_HEADER, shuffle, SPOTIFY_CLIENT_ID } from "./utils";
import safeAwait from "safe-await";
import { SpotifyApi, type AccessToken, type Track } from "@spotify/web-api-ts-sdk";

export const getTopTracks = async (ids: string[]): Promise<Track[]> => {
  let tracks: Track[] = []
  //ids.forEach(async (id) => {

  //})
  //console.log('tracks', tracks)
  //return tracks

  for (const id of ids) {
    let user = await prisma.user.findUnique({
      where: { id }
    })
    //let token = getAccessToken(user!)
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
      if (err.response) {
        console.error(err.response.data);
      }
    }
    //console.log(dat)
    let { data } = dat!
    let sdk = SpotifyApi.withAccessToken(SPOTIFY_CLIENT_ID!, {
      access_token: data.access_token,
      expires_in: data.expires_in,
      refresh_token: user?.refresh_token!,
      token_type: "Bearer"
    })
    let tracks_ = await sdk.currentUser.topItems('tracks', 'short_term', 25)
    //console.log(tracks_)
    let x = tracks.push(...tracks_.items)
    console.log(x)
    //console.log(tracks)
    tracks = shuffle(tracks)
    //tracks = tracks.concat(tracks_)
    //console.log((await sdk.currentUser.profile()).display_name)

  }
  return tracks
}
