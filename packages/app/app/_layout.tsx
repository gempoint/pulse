//import '../tamagui-web.css'

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { Linking, useColorScheme } from 'react-native'
import { TamaguiProvider } from 'tamagui'
//import DiffMain from '.'
import { tamaguiConfig } from '../tamagui.config'
import { useFonts } from 'expo-font'
import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as WebBrowser from 'expo-web-browser';

//Linking.addEventListener('url', (u) => {
//  console.log(u)
//  WebBrowser.dismissBrowser()
//})


export default function RootLayout() {
  const colorScheme = useColorScheme()
  const [loaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  })


  useEffect(() => {
    if (loaded) {
      // can hide splash screen here
    }
  }, [loaded])

  if (!loaded) {
    return null
  }
  console.log(colorScheme)
  return (
    // add this
    <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme!}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <SafeAreaProvider>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
          </Stack>
        </SafeAreaProvider>
      </ThemeProvider>
    </TamaguiProvider>
  )
}

