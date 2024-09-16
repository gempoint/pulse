import styles from "@/constants/styles"
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { SafeAreaView } from "react-native-safe-area-context"
import { Button, Text, useTheme, View } from "tamagui"
import { isAvailable, Authenticate } from "@wwdrew/expo-spotify-sdk";
import { scopes } from '../constants/styles';

export default () => {
  const theme = useTheme()
  return (
    <SafeAreaView>
      <View style={{ ...styles.container }}>
        {/*<Text style={{ padding: '30' }}>hi</Text>*/}
        <Button alignSelf="center" icon={<FontAwesome5 name="spotify" size={24} color="white" />} backgroundColor={"#1DB954"} onTouchEnd={() => auth()}> Log in with Spotify</Button>
      </View>
    </SafeAreaView>
  )
}


const auth = async () => {
  try {
    let x = await Authenticate.authenticateAsync({

      tokenSwapURL: "http://192.168.1.120:3000/swap",
      scopes
    })
    console.log(x)
  } catch (err) {
    console.error(err)
  }
}