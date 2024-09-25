import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'tamagui';
import * as Location from 'expo-location';
import axios from "axios";
import { apiEndpoint } from '@/constants/idk';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import { useToastController } from '@tamagui/toast';


export default function Tab() {
  const [nearby, setNearby] = useState<number | null>(null)
  const [tracks, setTracks] = useState<number | null>(null)
  const toastController = useToastController()


  const radar = async () => {
    let loc = await Location.getCurrentPositionAsync({});
    let token = await SecureStore.getItemAsync('TOKEN') as string
    axios.post<{
      nearby: number,
      tracks: number
    }>(`${apiEndpoint()}/radar`, {
      lat: loc.coords.latitude,
      long: loc.coords.longitude
    }, {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    }).then(x => {
      console.log(x.data)
      toastController.show(`added ${x.data.tracks} tracks from ${x.data.nearby} users nearby`)

      setNearby(x.data.nearby)
      setTracks(x.data.tracks)
    })

  }

  return (
    <View style={styles.container}>
      {/*<Text>Tab [Home|Index]</Text>*/}
      {nearby ? <Text>{nearby}</Text> : null}
      {tracks ? null : <Text>{tracks}</Text>}
      <Button alignSelf="center" backgroundColor={"white"} color={"black"} onTouchEnd={() => radar()}>Radar</Button>
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
