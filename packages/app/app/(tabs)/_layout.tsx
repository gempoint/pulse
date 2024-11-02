import isAuthed from '@/hooks/isAuthed';
import { Redirect, router, Tabs, useNavigationContainerRef } from 'expo-router';
import { Text, useTheme, XStack } from 'tamagui';
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import * as Sentry from '@sentry/react-native';
import { Pressable } from 'react-native';
import { CircleUserRound, Home, Settings, Users2 } from '@tamagui/lucide-icons';
import SettingsAction from '@/components/SettingsAction';
import NotificationAction from '@/components/NotificationAction';
import React from 'react';

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
    return <Redirect href={"/auth"} />
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
          headerRight: () => (
            <SettingsAction />
          ),
          headerShown: true,
          tabBarIcon: ({ color }) => <Home size={24} color={color} />
        }}
      />
      <Tabs.Screen
        name='friends'
        options={{
          title: '',
          tabBarIcon: ({ color }) => <Users2 size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: '',
          headerShown: true,
          headerTransparent: true,
          headerRight: () => (
            <>
              <XStack>
                <NotificationAction />
                <SettingsAction />
              </XStack>
            </>
          ),
          tabBarIcon: ({ color }) => <CircleUserRound size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
