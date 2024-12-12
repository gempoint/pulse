import { Search } from "@tamagui/lucide-icons";
import { memo, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet } from "react-native";
import { H1, Input, View, XStack, YStack, useTheme, Button, Text, ScrollView, Separator } from "tamagui";
import UserItem from '@/components/UserItem';
import ShareToInstagramButton from "@/components/ShareToInstagramButton";
import { fetchFriends, searchUsers, sendFriReq, User } from '@/etc/api';
import Spin from "@/components/Spin";
import { getColorFromImage } from "@/components/etc";
import LoadingScreen from "@/components/LoadingScreen";

const Invite = () => {
  return (
    <View style={styles.loadingContainer} space="$2">
      <Text>No friends found</Text>
      <ShareToInstagramButton />
    </View>
  )
}

const SearchResults = memo(({ name }: { name: string }) => {
  //const [userData, setUserData] = useState<Omit<User[], "state"> | null>(null);
  let { data, isLoading, error } = searchUsers(name, {})

  if (isLoading) {
    return (
      <View style={styles.searchResultsContainer}>
        <Spin />
      </View>
    )
  }

  if (error) {
    <View>

    </View>
  }

  return (
    <View style={styles.searchResultsContainer}>
      <Text>Users you might know:</Text>
      <Separator marginVertical={15} />
      <View minWidth="100%">
        {data.ok && data?.msg.length > 0 ? (
          data?.msg.map(user => (
            <UserItem key={user.id} friend={user} unadded />
          ))
        ) : (
          <Text alignSelf="center">No users found matching your search</Text>
        )}
      </View>
    </View>
  )
})

export default function FriendsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();
  // const { friends, isLoading, error, mutate } = useFriends();
  const { data, isLoading, error, mutate } = fetchFriends({})

  const filteredFriends = useMemo(() =>
    data?.msg.filter(friend =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.username.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [data, searchQuery]
  );

  if (isLoading) {
    <LoadingScreen />
  }

  if (error) {
    <SafeAreaView>
      <Text>err</Text>
    </SafeAreaView>
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container} space="$4">
        <H1>Friends</H1>

        <XStack
          width="90%"
          marginBottom="$4"
          backgroundColor="$gray3"
          borderRadius="$4"
          paddingHorizontal="$3"
          alignItems="center"
        >
          <Search size={20} color={theme.gray11.val} />
          <Input
            size="$4"
            placeholder="Search friends..."
            flex={1}
            borderWidth={0}
            backgroundColor="transparent"
            value={searchQuery}
            onChangeText={setSearchQuery}
            cursorColor={theme.accentColor.val}
            enterKeyHint='search'
          />
        </XStack>

        {error ? (
          <YStack space="$3" alignItems="center">
            <Text color="$red10">{error}</Text>
            <Button onPress={() => mutate()}>Retry</Button>
          </YStack>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {filteredFriends && filteredFriends.length > 0 ? (
              filteredFriends.map(friend => (
                <UserItem key={friend.id} friend={friend} unadded={false} />
              ))
            ) : (
              <View style={styles.container}>
                <Invite />
                {searchQuery && <SearchResults name={searchQuery} />}
              </View>
            )}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 35,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  songArt: {
    width: 24,
    height: 24,
    borderRadius: 4,
  }, scrollingTextWrapper: {
    width: 150, // Fixed width for the container
    overflow: 'hidden', // Prevent content from showing outside
  },
  noTextWrap: {
    flexShrink: 0, // Prevent text from wrapping
    whiteSpace: 'nowrap', // Ensure text stays on one line
  },
  animatedTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spacer: {
    marginLeft: 8,
  },
  container2: {
    overflow: 'hidden',
  },
  searchResultsContainer: {
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 16,
  },
});