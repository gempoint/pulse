import { Instagram } from "@tamagui/lucide-icons";
import { useEffect, useState } from "react";
import { Linking, Platform } from "react-native";
import { Button } from "tamagui";
import Share from 'react-native-share';
import Constants from 'expo-constants';
import known from './known'

export default function ShitShow() {

  const [showInstagramStory, setShowInstagramStory] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'ios') {
      Linking.canOpenURL('instagram://')
        .then((val) => setShowInstagramStory(val))
        .catch((err) => console.error(err));
    } else {
      Share.isPackageInstalled('com.instagram.android')
        .then(({ isInstalled }) => setShowInstagramStory(isInstalled))
        .catch((err) => console.error(err));
    }
  }, []);


  const shareDummyImage = () => {
    console.log('r', showInstagramStory)
    const fn = async () => {
      console.log(2)
      try {
        console.log('i', Constants.expoConfig?.extra!.FB_ID)
        if (showInstagramStory) {
          let x = await Share.shareSingle({
            stickerImage: known,
            social: Share.Social.INSTAGRAM_STORIES,
            backgroundBottomColor: '#FF0000',
            backgroundTopColor: '#FF0000',
            appId: Constants.expoConfig?.extra!.FB_ID
          });
          console.log(x)
        } else {
          await Share.open({ url: uri });
        }
      } catch (err) {
        console.error(err);
      }
    }
    fn()
  };

  return (
    <Button onPress={() => shareDummyImage()} icon={<Instagram />}>Wanna try adding some? ;)</Button>

  )
}