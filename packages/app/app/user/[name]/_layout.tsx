import { ArrowLeft } from "@tamagui/lucide-icons";
import { router, Stack } from "expo-router";
import { Pressable } from "react-native";

export default function UserLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitle: '',
        //headerShown: true,
        headerTransparent: true,
        headerLeft: () => (
          <Pressable
            onPress={() => router.back()}
          //className="p-2 ml-2"
          >
            <ArrowLeft color="white" size={24} paddingRight="$5" />
          </Pressable>
        ),
        presentation: 'transparentModal'
      }}
    />
  )
}