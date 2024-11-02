import { Settings } from '@tamagui/lucide-icons';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { View } from 'tamagui';
const SettingsAction = () => {
  return (
    <Pressable onPress={() => router.push('/settings')}>
      <View padding={"$4"}>
        <Settings color="white" size={24} />
      </View>
    </Pressable>
  )
}

export default SettingsAction