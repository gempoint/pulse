import { StyleSheet, ActivityIndicator, Animated, RefreshControl, Image, Linking, AppState } from 'react-native';
import { View, Button, H1, Text, Input, ScrollView, useTheme, YStack, XStack, Spinner, Separator } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useRef, useState, useMemo, memo } from 'react';
import { fetchFriends, searchUsers, sendFriReq, User } from '@/etc/api';
import { Search, Music2, Instagram } from '@tamagui/lucide-icons';
import { getColors } from 'react-native-image-colors';
import ScrollingText from '@/components/ScrollingText';
import { router } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import ShareToInstagramButton from '@/components/ShareToInstagramButton';
import Spin from '@/components/Spin';
import UserItem from '@/components/UserItem';
import { getColorFromImage } from '@/components/etc';

const Invite = () => {
  return (
    <View style={styles.loadingContainer} space="$2">
      <Text>No friends found</Text>
      <ShareToInstagramButton />
    </View>
  )
}

//const SearchResults = memo(({ name } : { name: string } => {

const SearchResults = memo(({ name }: { name: string }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<Omit<User[], "state"> | null>(null);

  const fetch = useMemo(() => {
    setIsLoading(true)
    return searchUsers(name)
  }, [name])

  useEffect(() => {
    fetch.then((res) => {
      setIsLoading(false)
      setUserData(res.msg)
    })
  }, [fetch]) // Added dependency array

  if (isLoading) {
    return (
      <View style={styles.searchResultsContainer}>
        <Spin />
      </View>
    )
  }

  return (
    <View style={styles.searchResultsContainer}>
      <Text>Users you might know:</Text>
      <Separator marginVertical={15} />
      <View minWidth="100%">
        {userData && userData.length > 0 ? (
          userData.map(user => (
            <UserItem key={user.id} friend={user} unadded />
          ))
        ) : (
          <Text>No users found matching your search</Text>
        )}
      </View>
    </View>
  )
})

// Separate color utility



// Separate Friend Item component
export default function FriendsTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friendsData, setFriendsData] = useState<User[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();
  const isFocused = useIsFocused();

  // Add refs
  const isMounted = useRef(true);
  const autoRefreshTimeout = useRef<NodeJS.Timeout>();

  const fetchProfileData = useCallback(async (isRefreshing = false) => {
    if (!isMounted.current) return;

    try {
      if (!isRefreshing) {
        setIsLoading(true);
      }

      const response = await fetchFriends();
      const friendsWithColors = await Promise.all(
        response.msg.map(async (friend: User) => {
          if (friend.state?.img) {
            const color = await getColorFromImage(friend.state.img);
            return {
              ...friend,
              state: { ...friend.state, color }
            };
          }
          return friend;
        })
      );

      if (isMounted.current) {
        setFriendsData(friendsWithColors);
        setError(null);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch profile data');
        setFriendsData(null);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchProfileData(true);
  }, [fetchProfileData]);

  // Handle focus changes and start/stop refresh
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    const startAutoRefresh = () => {
      // Clear any existing interval
      if (intervalId) {
        clearInterval(intervalId);
      }

      // Start new interval
      intervalId = setInterval(() => {
        if (isMounted.current) {
          fetchProfileData(true);
        }
      }, 30000);
    };

    // If screen is focused, start auto-refresh
    if (isFocused) {
      fetchProfileData(true);
      startAutoRefresh();
    }

    // Cleanup function
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isFocused, fetchProfileData]);

  // Initial data fetch and cleanup
  useEffect(() => {
    fetchProfileData();

    return () => {
      isMounted.current = false;
      if (autoRefreshTimeout.current) {
        clearInterval(autoRefreshTimeout.current);
      }
    };
  }, [fetchProfileData]);

  const filteredFriends = useMemo(() =>
    friendsData?.filter(friend =>
      friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      friend.username.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [friendsData, searchQuery]
  );

  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      tintColor={theme.color.val as string}
      colors={[theme.color.val as string]}
      progressBackgroundColor={theme.background.val as string}
    />
  ), [isRefreshing, onRefresh, theme]);

  if (isLoading && !isRefreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.color.val as string} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container} space="$4">
        <H1 marginBottom="$2">Friends</H1>

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
            <Button onPress={() => fetchProfileData()}>Retry</Button>
          </YStack>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            refreshControl={refreshControl}
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
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 20,
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