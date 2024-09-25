import styles from "@/constants/styles"
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import { SafeAreaView } from "react-native-safe-area-context"
import { Button, Text, useTheme, View } from "tamagui"
import * as WebBrowser from 'expo-web-browser';
import { apiEndpoint } from '../constants/idk';
import * as Linking from 'expo-linking';
import Icon from '../assets/images/icon.svg'
import isAuthed from "@/hooks/isAuthed";
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import axios from "axios";
import { useEffect } from "react";
import * as Location from 'expo-location';
import SignIn from './login'
//console.log(Linking.createURL('auth'))

export default () => {
  const theme = useTheme()
  const authed = isAuthed()

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync()
      console.log(status)
    })()
  })

  console.log('auth', authed)

  if (authed) {
    return (
      <SafeAreaView>
        <View style={styles.container}>
          <Text>hi</Text>
          <Button alignSelf="center" backgroundColor={"#1DB954"} onTouchEnd={() => signOut()}>Sign Out</Button>
          <Button alignSelf="center" backgroundColor={"white"} color={"black"} onTouchEnd={() => radar()}>Radar</Button>
        </View>
      </SafeAreaView>
    )
  }

  //console.log(JSON.stringify(Constants))
  return (
    //<SafeAreaView>
    //  <View style={{ ...styles.container }}>
    //    {/*<Text style={{ padding: '30' }}>hi</Text>*/}
    //    <Text fontSize={"$10"} fontFamily={"$mono"} paddingBlock={"$3"}>Come join us!</Text>
    //    <View paddingBottom={"$5"}>
    //      <Icon width={100} height={100} />
    //    </View>
    //    <Button alignSelf="center" icon={<FontAwesome5 name="spotify" size={24} color="white" />} backgroundColor={"#1DB954"} onTouchEnd={() => auth()}> Log in with Spotify</Button>
    //  </View>
    //</SafeAreaView>
    <SignIn />
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

const signOut = async () => {
  console.log('token', await SecureStore.getItemAsync('TOKEN'))
  await SecureStore.deleteItemAsync('TOKEN')
  router.push('/')
}

const radar = async () => {
  let loc = await Location.getCurrentPositionAsync({

  });
  let token = await SecureStore.getItemAsync('TOKEN') as string
  let x = await axios.post(`${apiEndpoint()}/radar`, {
    lat: loc.coords.latitude,
    long: loc.coords.longitude
  }, {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
  console.log(x.data)
}