import isAuthed from '@/hooks/isAuthed';
import { Redirect, Tabs, useNavigationContainerRef } from 'expo-router';
import { Text, useTheme } from 'tamagui';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import * as Sentry from '@sentry/react-native';

const routingInstrumentation = new Sentry.ReactNavigationInstrumentation();


export default function TabLayout() {
  const authed = isAuthed()
  const theme = useTheme()
  console.log('auth', authed)
  const ref = useNavigationContainerRef();

  useEffect(() => {
    if (ref) {
      routingInstrumentation.registerNavigationContainer(ref);
    }

  }, [ref])

  if (!authed) {
    return <Redirect href="/auth" />
  }
  //console.log(theme.background)
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.background.val,
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
          paddingTop: 15,
          //marginBottom: 10
        },
        tabBarActiveTintColor: theme.accentColor.val,

      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          tabBarIcon: ({ color }) => <AntDesign name="home" size={24} color={color} />
        }}
      />
      <Tabs.Screen
        name="feedback"
        options={{
          title: '',
          tabBarIcon: ({ color }) => <Ionicons name="chatbox-outline" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '',
          tabBarIcon: ({ color }) => <AntDesign name="setting" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
