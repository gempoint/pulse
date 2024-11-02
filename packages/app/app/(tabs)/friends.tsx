import { StyleSheet, ActivityIndicator, Animated, RefreshControl, Image, Linking } from 'react-native';
import { View, Button, H1, Text, Input, ScrollView, useTheme, YStack, XStack } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useRef, useState, useMemo, memo } from 'react';
import { fetchFriends } from '@/etc/api';
import { Search, Music2, Instagram } from '@tamagui/lucide-icons';
import { getColors } from 'react-native-image-colors';
//import AppLink from 'react-native-app-link';
import Scrolling from '@/components/Scrolling'
import ScrollingText from '@/components/ScrollingText';
import { router } from 'expo-router';
import InstagramGradientButton from '@/components/InstagramButton';
import ShareToInstagramButton from '@/components/ShareToInstagramButton';
// Separate types into their own file
type State = {
  id: string;
  name: string;
  artist: string;
  img: string;
  color?: string;
  uri: string;
  url: string;
};

type User = {
  id: string;
  verified: boolean;
  staff: boolean;
  artist: boolean;
  bio: string;
  color: string;
  name: string;
  username: string;
  pfp: string;
  state?: State;
};

const Invite = () => {
  return (
    <View style={styles.loadingContainer} space="$2">
      <Text>No friends found</Text>
      <ShareToInstagramButton />
      {/*<Button icon={<Instagram onPress={() => console.log('hi')} />}>Wanna try adding some? ;)</Button>*/}
      {/*<InstagramGradientButton adjustsFontSizeToFit>
        Wanna try adding some? ;)
      </InstagramGradientButton>*/}
    </View>
  )
}

// Separate color utility
const getColorFromImage = async (imageUrl: string): Promise<string> => {
  try {
    const colors = await getColors(imageUrl, {
      fallback: '#6366f1',
      cache: true,
      key: imageUrl,
    });
    return colors.platform === 'ios' ? colors.primary : colors.dominant;
  } catch (error) {
    console.error('Error extracting color:', error);
    return '#6366f1'; // fallback color
  }
};

// Separate Friend Item component
const FriendItem = memo(({ friend }: { friend: User }) => (
  <XStack
    key={friend.id}
    alignItems="center"
    justifyContent="space-between"
    paddingVertical="$3"
    paddingHorizontal="$4"
    pressStyle={{ opacity: 0.7 }}
    onPress={() => {
      router.push('')
    }}
  >
    <XStack alignItems="center" space="$3">
      <Image
        source={{ uri: friend.pfp }}
        style={styles.avatar}
      />
      <YStack>
        <Text fontWeight="bold" color={friend.color}>{friend.name}</Text>
        <Text color="$gray11">@{friend.username}</Text>
      </YStack>
    </XStack>

    {friend.state && (
      <XStack
        backgroundColor={friend.state.color}
        opacity={0.7}
        borderRadius="$4"
        paddingHorizontal="$3"
        paddingVertical="$2"
        space="$2"
        alignItems="center"
        animation="bouncy"
        onPress={async () => {
          if (await Linking.canOpenURL(friend.state?.uri!)) {
            Linking.openURL(friend.state?.uri!)
          } else {
            Linking.openURL(friend.state?.url!)
          }
        }}
      >
        <Image
          source={{ uri: friend.state.img }}
          style={styles.songArt}
        />
        <YStack maxWidth={"$space.15"}>
          {/*<Scrolling style={{
            //width: '100%',
          }} delay={1000} endPaddingWidth={20}>
            <Text>{friend.state.name}</Text>
          </Scrolling>*/}
          <ScrollingText
            //scrollSpeed={500}
            loop
            duration={7000}
            bounce={true}
            animationType={'bounce'}
            bounceSpeed={300}
            marqueeDelay={1000}
            style={{
              color: 'white'
            }}
          >{friend.state.name}</ScrollingText>
          <ScrollingText
            //scrollSpeed={500}
            loop
            duration={8000}
            bounce={true}
            animationType={'bounce'}
            bounceSpeed={300}
            marqueeDelay={1000}
            style={{
              color: 'white'
            }}
          >{friend.state.artist}</ScrollingText>
        </YStack>
        <Music2 size={16} color="white" />
      </XStack>
    )}
  </XStack>
));

export default function FriendsTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friendsData, setFriendsData] = useState<User[] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const theme = useTheme();

  const fetchProfileData = useCallback(async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setIsLoading(true);

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

      setFriendsData(friendsWithColors);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile data');
      setFriendsData(null);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchProfileData(true);
  }, [fetchProfileData]);

  useEffect(() => {
    fetchProfileData();
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
                <FriendItem key={friend.id} friend={friend} />
              ))
            ) : (
              <View style={styles.container}>
                {searchQuery ? (<Text>No friends found matching your search</Text>) : (<Invite />)}
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
  }
});