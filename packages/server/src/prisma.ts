import { PrismaClient } from '@prisma/client';
import { SpotifyApi, type AccessToken } from '@spotify/web-api-ts-sdk';
import safeAwait from 'safe-await';
import { a, arrToString, AUTH_HEADER, DEFAULT_IMG, MyDeserializer, SPOTIFY_CLIENT_ID } from './utils';
import type { AxiosError } from 'axios';
import axios from 'axios';

let prisma = new PrismaClient().$extends({
  query: {
    user: {
      async $allOperations({ model, operation, args, query }) {
        console.log('m', model)
        let d = await query(args)
        //console.log('d', d)
        if (Array.isArray(d)) {
          for (const ele of d) {
            //console.log(ele)
            let [e_, keys] = await safeAwait(
              a.post<AccessToken>(
                "https://accounts.spotify.com/api/token",
                {
                  grant_type: "refresh_token",
                  refresh_token: ele.refresh_token,
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
              continue
            }

            let { data } = keys!;
            const sdk = SpotifyApi.withAccessToken(
              SPOTIFY_CLIENT_ID!,
              {
                access_token: data.access_token,
                expires_in: data.expires_in,
                refresh_token: ele?.refresh_token!,
                token_type: "Bearer",
              },
              {
                // https://github.com/spotify/spotify-web-api-ts-sdk/issues/127 ¯\_(ツ)_/¯
                deserializer: new MyDeserializer(),
              },
            );
            let state = await sdk.player.getPlaybackState()
            //console.log('s', state);
            if (state === null) {
              continue
            }
            if (state.currently_playing_type !== 'track') {
              continue
            }
            ele.state = {
              id: state.item.id,
              name: state.item.name,
              // @ts-expect-error
              artist: arrToString(state.item.artists.map(i => i.name)),
              img: state.item.album.images.length === 0 ? DEFAULT_IMG : state.item.album.images.sort((a, b) => a > b ? -1 : 1)[0].url,
              uri: state.item.uri,
              url: state.item.external_urls.spotify

            }
          }
        }
        return d
      }
    },
  }
})
export default prisma