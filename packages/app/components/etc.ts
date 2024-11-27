import AsyncStorage from "@react-native-async-storage/async-storage";
import { getColors } from "react-native-image-colors";
import * as Application from 'expo-application';
import * as BackgroundFetch from 'expo-background-fetch';
import { RADAR } from "@/constants/idk";
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from "react-native";
import Constants from 'expo-constants';

export const getColorFromImage = async (imageUrl: string): Promise<string> => {
  try {
    const colors = await getColors(imageUrl, {
      fallback: '#6366f1',
      cache: true,
      key: imageUrl,
    });
    return colors.platform === 'ios' ? colors.primary : colors.dominant;
  } catch (error) {
    console.error('Error extracting color:', error);
    return '#6366f1'; // fallback color
  }
};

export const init = async () => {
  try {
    const background = async () => {
      let init = await AsyncStorage.getItem('init')
      if (init === null) {
        // first time?
        await AsyncStorage.setItem('build', Application.nativeBuildVersion!)
        BackgroundFetch.registerTaskAsync(RADAR, {
          minimumInterval: 60 * 60, // 15 minutes
          stopOnTerminate: false,
          startOnBoot: true
        });
        // an hr is good enough?
        await AsyncStorage.setItem('radarRefresh', (60 * 60).toString())
        await AsyncStorage.setItem('init', "anything")
      }
    }
    const notifs = async () => {
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.LOW,
          vibrationPattern: [125, 250, 0, 125],
          lightColor: '#EB459E'
        })
      }

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          throw 'Permission not granted to get push token for push notification!'
          //return;
        }
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
        const pushString = (await Notifications.getExpoPushTokenAsync({
          projectId
        })).data
        //setExpo
      }
    }
    background()
  } catch (err) {
    console.error("failed to init");
    console.error("init err", err);
  }
}