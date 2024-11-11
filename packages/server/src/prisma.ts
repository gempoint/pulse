import { PrismaClient } from '@prisma/client';
import { SpotifyApi, type AccessToken } from '@spotify/web-api-ts-sdk';
import safeAwait from 'safe-await';
import { a, arrToString, AUTH_HEADER, DEFAULT_IMG, freshSDK, MyDeserializer, SPOTIFY_CLIENT_ID } from './utils';
import type { AxiosError } from 'axios';
import axios from 'axios';

let prisma = new PrismaClient().$extends({
  query: {
    profile: {
      async $allOperations({ model, operation, args, query }) {
        let data = await query(args)
        let flag = false
        //console.log('q', data)
        if (args.omit) {
          if (args.omit.state) {
            return data
          }
        }
        if (data === null) {
          return data
        }
        if (!(data instanceof Array)) {
          // terrible small hack
          flag = true
          data = [data]
        }
        //console.log(data)
        if (Array.isArray(data)) {
          for (const ele of data) {
            let user = await prisma.user.findFirst({
              where: {
                id: ele.id
              }
            })

            if (user === null) {
              console.error("wtf is this edge case")
            }
            //@ts-ignore
            let sdk = await freshSDK(user)

            let state = await sdk!.player.getPlaybackState()
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
        } else {
          //console.log(data)
        }
        if (flag) {
          data = data[0]
        }
        return data
      }
    }
  }
})

export default prisma