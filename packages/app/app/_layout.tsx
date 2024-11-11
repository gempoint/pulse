import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { router, Slot, Stack, useNavigationContainerRef } from 'expo-router'
import { Linking, Text, View, useColorScheme } from 'react-native'
import { TamaguiProvider } from 'tamagui'
import { tamaguiConfig } from '../tamagui.config'
import { useFonts } from 'expo-font'
import { useEffect } from 'react'
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Sentry from '@sentry/react-native';
import { ToastProvider, ToastViewport } from '@tamagui/toast'
import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import CurrentToast from '@/components/CurrentToast'
import { ArrowLeft } from '@tamagui/lucide-icons'
import { Pressable } from 'react-native'
import { ErrorBoundary } from "react-error-boundary";

const routingInstrumentation = new Sentry.ReactNavigationInstrumentation();
console.log('devMode:', __DEV__)
Sentry.init({
  dsn: Constants.expoConfig?.extra!.DSN,
  debug: !true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
  enabled: true,
  integrations: [
    new Sentry.ReactNativeTracing({
      // Pass instrumentation to be used as `routingInstrumentation`
      routingInstrumentation,
      enableNativeFramesTracking: !isRunningInExpoGo(),
      // ...
    }),
  ],
});


function fallbackRender({ error, resetErrorBoundary }) {
  // Call resetErrorBoundary() to reset the error boundary and retry the render.

  return (
    <View role="alert">
      <Text>Something went wrong:</Text>
      <Text style={{ color: "red" }}>{error.message}</Text>
    </View>
  );
}

function RootLayout() {
  const colorScheme = useColorScheme()
  const [loaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
  })
  const ref = useNavigationContainerRef();
  const { left, top, right } = useSafeAreaInsets()

  useEffect(() => {
    if (loaded) {
      // can hide splash screen here
    }
    if (ref) {
      routingInstrumentation.registerNavigationContainer(ref);
    }

  }, [loaded, ref])

  if (!loaded) {
    return undefined
  }
  console.log(colorScheme)
  return (
    // add this
    <ErrorBoundary fallbackRender={fallbackRender}>
      <TamaguiProvider config={tamaguiConfig} defaultTheme={'dark'}>
        <ThemeProvider value={DarkTheme}>
          <SafeAreaProvider>
            <ToastProvider>
              <CurrentToast />
              <ToastViewport flexDirection="column-reverse" top={top} left={left} right={right} />
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="auth" options={{ headerShown: false }} />
                <Stack.Screen name="onboard" options={{ headerShown: false }} />
                <Stack.Screen name="user/[name]" options={{ headerShown: false }} />
                <Stack.Screen
                  name="selector"
                  options={{
                    //headerShown: false,
                    headerStyle: {
                      backgroundColor: '#000',
                    },
                    //header: () => { },
                    headerLeft: () => (
                      <Pressable
                        onPress={() => router.back()}
                      //className="p-2 ml-2"
                      >
                        <ArrowLeft color="white" size={24} />
                      </Pressable>
                    ),
                    headerTitle: '',
                    presentation: 'containedModal',
                  }}
                />
                <Stack.Screen
                  name="settings"
                  options={{
                    //headerShown: false,
                    headerStyle: {
                      backgroundColor: '#000',
                    },
                    //header: () => { },
                    headerLeft: () => (
                      <Pressable
                        onPress={() => router.back()}
                      //className="p-2 ml-2"
                      >
                        <ArrowLeft color="white" size={24} />
                      </Pressable>
                    ),
                    headerTitle: '',
                    presentation: 'containedModal',
                  }}
                />
                <Stack.Screen
                  name="feedback"
                  options={{
                    //headerShown: false,
                    headerStyle: {
                      backgroundColor: '#000',
                    },
                    //header: () => { },
                    headerLeft: () => (
                      <Pressable
                        onPress={() => router.back()}
                      //className="p-2 ml-2"
                      >
                        <ArrowLeft color="white" size={24} />
                      </Pressable>
                    ),
                    headerTitle: '',
                    presentation: 'containedModal',
                  }}
                />
                <Stack.Screen
                  name="notifications"
                  options={{
                    //headerShown: false,
                    headerStyle: {
                      backgroundColor: '#000',
                    },
                    //header: () => { },
                    headerLeft: () => (
                      <Pressable
                        onPress={() => router.back()}
                      //className="p-2 ml-2"
                      >
                        <ArrowLeft color="white" size={24} />
                      </Pressable>
                    ),
                    headerTitle: '',
                    presentation: 'containedModal',
                  }}
                />
              </Stack>
            </ToastProvider>
          </SafeAreaProvider>
        </ThemeProvider>
      </TamaguiProvider>
    </ErrorBoundary>
  )
}

export default RootLayout;
