import React from 'react'
import { Button, Text, YStack, styled } from 'tamagui'
import Icon from '../assets/images/icon.svg'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import * as WebBrowser from 'expo-web-browser';
import { apiEndpoint, SPOTIFY_GREEN } from '../constants/idk';
import { useToastController } from '@tamagui/toast';
import { ping } from '@/etc/api';

const LogoContainer = styled(YStack, {
  alignItems: 'center',
  marginBottom: '$4',
})

const WelcomeText = styled(Text, {
  fontSize: '$8',
  fontWeight: 'bold',
  color: '$accentColor',
  textAlign: 'center',
  marginTop: '$3',
})

const SubText = styled(Text, {
  fontSize: '$4',
  color: '$gray11',
  textAlign: 'center',
  marginTop: '$1',
})


import { useColorScheme } from 'react-native';

const getThemeColor = () => {
  const colorScheme = useColorScheme();
  console.log('colorScheme', colorScheme)

  return colorScheme === 'dark' ? '#FFFFFF' : '#000000';
};

export default function SpotifyLoginScreen() {
  const toastController = useToastController()
  const handleSpotifyLogin = () => {
    // Implement Spotify OAuth login logic here
    console.log('Initiating Spotify login...')
    auth()
  }

  const auth = async () => {
    try {
      //console.log(await ping())
      let available = await ping()
      if (!available) {
        toastController.show("server aint up i think", {
          customData: {
            error: true
          }
        })
      } else {
        let result = await WebBrowser.openAuthSessionAsync(`${apiEndpoint()}/login`, 'auth');
        //console.log(result)
        if (result.type === 'success') {
          console.log("hm")
        }
      }
      //console.log(apiEndpoint())

    } catch (err) {
      console.error(err)
    }
  }

  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      padding="$4"
      space="$4"
      backgroundColor="$background"
    >
      <LogoContainer>
        {/*<SpotifyLogo size={120} />*/}
        <Icon width={200} height={200} />
        <WelcomeText>Pulse</WelcomeText>
        <SubText>¯\_(ツ)_/¯</SubText>
      </LogoContainer>
      <Button
        size="$6"
        //theme="green"
        icon={<FontAwesome5 name="spotify" size={24} color={'white'} />}
        backgroundColor={SPOTIFY_GREEN}
        onPress={handleSpotifyLogin}
      >
        Login with Spotify
      </Button>
    </YStack>
  )
}
