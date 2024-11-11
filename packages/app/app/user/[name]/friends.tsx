import { fetchUserFriends, User } from "@/etc/api";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React from "react";
import { useEffect, useState } from "react";
import { LinearGradient } from '@tamagui/linear-gradient';
import { ScrollView, Spinner, Text, View, XStack, YStack } from "tamagui";
import UserItem from "@/components/UserItem";

export default function FriendsPage() {
  const { name, user: user_ } = useLocalSearchParams<{ name: string, user: string }>();
  const user: User = JSON.parse(user_);
  const [friends, setFriends] = useState<User[]>()
  const [isLoading, setIsLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fn = async () => {
      let x = await fetchUserFriends(name)
      setFriends(x.msg)
      console.log(x)
      setIsLoading(false)
    }
    fn()
    navigation.setOptions({
      headerTitle: `${user.name}'s friends`
    });
  }, [navigation]);


  if (isLoading) {
    return (
      <View>
        <Spinner />
      </View>
    )
  }

  return (
    <>
      <YStack flex={1} backgroundColor="$background">
        {/* Top section with gradient */}
        <LinearGradient
          height="40%"
          width="100%"
          colors={[`${user.color}80`, '$background']}
          start={[0, 0]}
          end={[0, 1]}
        >
          <XStack padding="$4" space="$4" paddingTop="$12">
            {/*<Text>hi</Text>*/}
            <ScrollView width="100%">
              {friends && friends.length > 0 ? (
                friends.map((friend) => (
                  <View style={{
                    borderColor: 'white',
                    borderRadius: 5,
                    //borderWidth: .5
                  }}>
                    <UserItem key={friend.id} friend={friend} unadded={false} noState />
                  </View>
                ))
              ) : undefined}
            </ScrollView>
          </XStack>
        </LinearGradient>
      </YStack>
    </>
  )
}