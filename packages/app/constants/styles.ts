import { SpotifyScope } from "@wwdrew/expo-spotify-sdk/build/ExpoSpotifySDK.types";
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    alignItems: 'center',
    //flex: 1,
    justifyContent: 'space-between',
    padding: 20,
    margin: 10,
  }
})

export const scopes: SpotifyScope[] = [
  "user-read-currently-playing", // get queue
  //"user-top-read", // get top content
  //"user-read-recently-played", // get recent
  //"user-read-email", // get email
  //"user-read-private", //get subscription
  //"user-follow-read", // get following
  "user-modify-playback-state" //add to queue
]