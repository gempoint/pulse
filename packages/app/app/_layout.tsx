//import '../tamagui-web.css'

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack, useNavigationContainerRef } from 'expo-router'
import { Linking, useColorScheme } from 'react-native'
import { TamaguiProvider } from 'tamagui'
import { tamaguiConfig } from '../tamagui.config'
import { useFonts } from 'expo-font'
import { useEffect } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import { isDev } from '@/constants/idk'
import isAuthed from '@/hooks/isAuthed'
//Linking.addEventListener('url', (u) => {
//  console.log(u)
//  WebBrowser.dismissBrowser()
//})

const routingInstrumentation = new Sentry.ReactNavigationInstrumentation();

Sentry.init({
  dsn: Constants.expoConfig?.extra!.DSN,
  debug: true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
  enabled: isDev,
  integrations: [
    new Sentry.ReactNativeTracing({
      // Pass instrumentation to be used as `routingInstrumentation`
      routingInstrumentation,
      enableNativeFramesTracking: !isRunningInExpoGo(),
      // ...
    }),
  ],
});


function RootLayout() {
  const authed = isAuthed()
  const colorScheme = useColorScheme()
  const [loaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  })
  const ref = useNavigationContainerRef();


  useEffect(() => {
    if (loaded) {
      // can hide splash screen here
    }
    if (ref) {
      routingInstrumentation.registerNavigationContainer(ref);
    }

  }, [loaded, ref])

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
            {authed ? <Stack.Screen name="(tabs)" options={{ headerShown: false, }} /> : <Stack.Screen name="index" options={{ headerShown: false }} />}
          </Stack>
        </SafeAreaProvider>
      </ThemeProvider>
    </TamaguiProvider>
  )
}

export default Sentry.wrap(RootLayout);

