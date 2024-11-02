import { acceptFriReq, declineFriReq, fetchNotifs, User } from "@/etc/api";
import { router } from "expo-router";
import { memo, useEffect, useState, useCallback } from "react";
import { StyleSheet, RefreshControl } from "react-native";
import { Button, H1, Image, ScrollView, Text, View, XStack, YStack } from "tamagui";

const FriendItem = memo(({ friend: user, onActionComplete }: { friend: User; onActionComplete: () => void }) => {
  const handleAccept = async () => {
    try {
      await acceptFriReq(user.id);
      onActionComplete();
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleDecline = async () => {
    try {
      await declineFriReq(user.id);
      onActionComplete();
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  };

  return (
    <XStack
      key={user.id}
      alignItems="center"
      justifyContent="space-between"
      paddingVertical="$3"
      paddingHorizontal="$4"
      pressStyle={{ opacity: 0.7 }}
      onPress={() => {
        router.push(`/user/${user.id}`);
      }}
    >
      <XStack alignItems="center" space="$3">
        <Image
          source={{ uri: user.pfp }}
          style={styles.avatar}
        />
        <YStack>
          <Text fontWeight="bold" color={user.color}>{user.name}</Text>
          <Text color="$gray11">@{user.username}</Text>
        </YStack>
      </XStack>
      <XStack space="$2">
        <Button backgroundColor="$green10Light" onPress={handleAccept}>Accept</Button>
        <Button backgroundColor="$red10Light" onPress={handleDecline}>Decline</Button>
      </XStack>
    </XStack>
  );
});

export default function Notifications() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userData, setUserData] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      let dat = await fetchNotifs();
      setUserData(dat.msg);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile data');
      setUserData(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchData();
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <View style={styles.container}>
      <H1>Notifications</H1>
      <ScrollView
        style={{
          width: '100%',
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {error && (
          <View>
            <Text>{error}</Text>
          </View>
        )}
        {userData?.map(x => (
          <FriendItem
            key={x.id}
            friend={x}
            onActionComplete={fetchData}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    //flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    width: '100%',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});