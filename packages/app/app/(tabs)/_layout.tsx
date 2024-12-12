import isAuthed from "@/hooks/isAuthed";
import { Redirect, router, Tabs, useNavigationContainerRef } from "expo-router";
import { useTheme } from "tamagui";
import React, { useEffect } from "react";
import * as Sentry from "@sentry/react-native";
import { ArrowLeft, CircleUserRound, Home, Users2 } from "@tamagui/lucide-icons";
import SettingsAction from "@/components/SettingsAction";
import { Pressable } from "react-native";

export default function TabLayout() {
  const authed = isAuthed();
  const theme = useTheme();
  console.log("auth", authed);

  if (!authed) {
    return <Redirect href={"/auth"} />;
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
          title: "",
          headerRight: () => <SettingsAction />,
          headerShown: true,
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: "",
          tabBarIcon: ({ color }) => <Users2 size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="edit"
        options={{
          href: null,
          //headerShown: false,
          //headerStyle: {
          //  backgroundColor: "#000",
          //},
          //header: () => { },
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
            //className="p-2 ml-2"
            >
              <ArrowLeft color="white" size={24} />
            </Pressable>
          ),
          headerTitle: "",
          headerTransparent: true,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "",
          headerShown: true,
          headerTransparent: true,
          // headerLeft: () => (
          //   <XStack>
          //     <EditAction />
          //   </XStack>
          // ),
          // headerRight: () => (
          //   <>
          //     <XStack>
          //       <NotificationAction />
          //       <SettingsAction />
          //     </XStack>
          //   </>
          // ),
          tabBarIcon: ({ color }) => (
            <CircleUserRound size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
