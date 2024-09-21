import React from 'react'
import { Button, Text, YStack, styled } from 'tamagui'
import { Music } from '@tamagui/lucide-icons'
import Icon from '../assets/images/icon.svg'
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import * as WebBrowser from 'expo-web-browser';
import { apiEndpoint } from '../constants/idk';



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


export default function SpotifyLoginScreen() {
  const handleSpotifyLogin = () => {
    // Implement Spotify OAuth login logic here
    console.log('Initiating Spotify login...')
    auth()
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
        icon={<FontAwesome5 name="spotify" size={24} color="white" />}
        backgroundColor={"#1DB954"}
        onPress={handleSpotifyLogin}
      >
        Login with Spotify
      </Button>
    </YStack>
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