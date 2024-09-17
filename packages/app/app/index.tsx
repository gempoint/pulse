import styles from "@/constants/styles"
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { SafeAreaView } from "react-native-safe-area-context"
import { Button, Text, useTheme, View } from "tamagui"
import * as WebBrowser from 'expo-web-browser';
//import { isAvailable, Authenticate } from "@wwdrew/expo-spotify-sdk";
import { apiEndpoint, scopes } from '../constants/idk';
import * as Linking from 'expo-linking';
import Icon from '../assets/images/icon.svg'
import isAuthed from "@/hooks/isAuthed";

console.log(Linking.createURL('auth'))

export default () => {
  const theme = useTheme()
  const authed = isAuthed()

  if (authed) {
    return (
      <Text>hi</Text>
    )
  }

  //console.log(JSON.stringify(Constants))
  return (
    <SafeAreaView>
      <View style={{ ...styles.container }}>
        {/*<Text style={{ padding: '30' }}>hi</Text>*/}
        <Text fontSize={"$10"} fontFamily={"$mono"} paddingBlock={"$3"}>Come join us!</Text>
        <View paddingBottom={"$5"}>
          <Icon width={100} height={100} />
        </View>
        <Button alignSelf="center" icon={<FontAwesome5 name="spotify" size={24} color="white" />} backgroundColor={"#1DB954"} onTouchEnd={() => auth()}> Log in with Spotify</Button>
      </View>
    </SafeAreaView>
  )
}


const auth = async () => {
  try {
    //console.log(apiEndpoint())
    let result = await WebBrowser.openAuthSessionAsync(`${apiEndpoint()}/login`, 'auth');
    //console.log(result)
    if (result.type === 'success') {
      console.log("hm")
    }

  } catch (err) {
    console.error(err)
  }
}