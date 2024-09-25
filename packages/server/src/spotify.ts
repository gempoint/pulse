import type { User } from "@prisma/client"
import prisma from "./prisma"
import { a, AUTH_HEADER, shuffle, SPOTIFY_CLIENT_ID } from "./utils";
import safeAwait from "safe-await";
import { SpotifyApi, type AccessToken, type Track } from "@spotify/web-api-ts-sdk";

const SONG_LIST_LIMIT = 10

export const getTopTracks = async (ids: string[]): Promise<Track[]> => {
  // TODO: this code is very stupdi based on the fact that we are assuming that when we do redis request for location that we are the first one on the list but if we arent then ¯\_(ツ)_/¯
  let mainUser: SpotifyApi
  let tracks: Track[] = []
  //ids.forEach(async (id) => {

  //})
  //console.log('tracks', tracks)
  //return tracks
  let i = 0
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
    if (i === 0) {
      mainUser = sdk
    }
    let tracks_ = await sdk.currentUser.topItems('tracks', 'short_term', 12)
    //console.log(tracks_)

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
  tracks.splice(SONG_LIST_LIMIT)
  tracks.forEach(async (x) => {
    try {
      await mainUser.player.addItemToPlaybackQueue(x.uri)
    } catch (e) {
      console.log(e)
    }
  })

  return tracks
}
