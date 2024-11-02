import { fetchNotifs, User } from '@/etc/api';
import { Bell, BellDot } from '@tamagui/lucide-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { View } from 'tamagui';
const NotificationAction = () => {
  const [pos, setPos] = useState<User[] | null>(null)
  useEffect(() => {
    const fetch = async () => {
      let d = await fetchNotifs()
      setPos(d.msg)
    }
    fetch()
  }, [])
  return (
    <Pressable onPress={() => router.push('/notifications')} >
      <View padding={"$4"}>
        {pos?.length !== 0 ? <BellDot color="white" size={24} /> : <Bell color="white" size={24} />}
      </View>
    </Pressable>
  )
}

export default NotificationAction