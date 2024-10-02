import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'tamagui';
import * as Location from 'expo-location';
import axios from "axios";
import { apiEndpoint } from '@/constants/idk';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { useToastController } from '@tamagui/toast';
import safeAwait from 'safe-await';


export default function Tab() {
  const [nearby, setNearby] = useState<number | null>(null)
  const [tracks, setTracks] = useState<number | null>(null)
  const toastController = useToastController()

  interface Nearby {
    msg: {
      nearby: number,
      tracks: number
    },
    ok: true
  }

  interface Error {
    msg: {
      type: "NO_PREMIUM" | "NO_PLAYER"
    },
    ok: false
  }

  const radar = async () => {
    let test = await Location.getForegroundPermissionsAsync()
    console.log(test)
    if (!test.granted) {
      await Location.requestForegroundPermissionsAsync();
    }
    let loc = await Location.getCurrentPositionAsync({});
    if (!loc) {
      return
    }
    let token = await SecureStore.getItemAsync('TOKEN') as string
    let [err, x] = await safeAwait(axios.post<Nearby | Error>(`${apiEndpoint()}/radar`, {
      lat: loc.coords.latitude,
      long: loc.coords.longitude
    }, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    })
    )

    if (err) {
      toastController.show('something wrong happened', {
        customData: {
          error: true
        }
      })
      return
    }
    let { data } = x
    console.log(data)
    if (!data.ok) {
      switch (data.msg.type) {
        case "NO_PLAYER":
          toastController.show(`no active player detected`, {
            customData: {
              error: true
            }
          })
          break;
        case "NO_PREMIUM":
          toastController.show(`you dont have spotify premium`, {
            customData: {
              error: true
            }
          })
          break;
      }
    } else {
      //toastController.show(`added ${data.msg.tracks} tracks from ${data.msg.nearby} users nearby`)
      setNearby(data.msg.nearby)
      setTracks(data.msg.tracks)

    }

  }

  return (
    <View style={styles.container}>
      {/*<Text>Tab [Home|Index]</Text>*/}
      {nearby && <Text>{nearby}</Text>}
      {tracks && <Text>{tracks}</Text>}
      <Button alignSelf="center" backgroundColor={"white"} color={"black"} onTouchEnd={radar}>Radar</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
