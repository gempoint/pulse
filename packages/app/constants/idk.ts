import { SpotifyScope } from "@wwdrew/expo-spotify-sdk/build/ExpoSpotifySDK.types";
import Constants from 'expo-constants'
const { packagerOpts } = Constants
export const scopes: SpotifyScope[] = [
  "user-read-currently-playing", // get queue
  "user-top-read", // get top content
  "user-read-recently-played", // get recent
  "user-read-email", // get email
  "user-read-private", //get subscription
  "user-follow-read", // get following
  "user-modify-playback-state" //add to queue
]

export const apiEndpoint = () => {
  //console.log(Constants.executionEnvironment)
  if (Constants.expoConfig?.hostUri) {
    const PORT = 3000
    return `${`http://${Constants.expoConfig?.hostUri?.split(':')[0]}:${PORT}`}`
    // for mock testing, dont expect actual responses back
    //return 'https://852bef76-cad2-4a9f-b58e-17d08cda6df4.mock.pstmn.io'
  } else {
    return `https://www.i0x0.wtf`
  }
}
//export const isDev = packagerOpts && packagerOpts.dev -- idk wtf this is
export const isDev = __DEV__