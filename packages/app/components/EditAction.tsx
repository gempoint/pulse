import { Pencil } from "@tamagui/lucide-icons";
import { router } from "expo-router";
import { Pressable } from "react-native";
import { View } from "tamagui";

export default function EditAction() {
  return (
    <Pressable onPress={() => router.push('/edit')}>
      <View padding="$4">
        <Pencil />
      </View>
    </Pressable>
  )
}