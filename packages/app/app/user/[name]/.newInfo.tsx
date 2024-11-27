import { router, useLocalSearchParams } from "expo-router";
import { Stack, XStack, YStack, Text, Image, View, H3, styled, ScrollView } from 'tamagui';
import { LinearGradient } from '@tamagui/linear-gradient';
import { Check, Star, Music, Music2 } from '@tamagui/lucide-icons';
import { useEffect, useState } from "react";
import { fetchUserStats, userFetch } from "@/etc/api";
import ScrollingText from '@/components/ScrollingText';
import { Linking, Pressable } from "react-native";
import { getColors } from 'react-native-image-colors';
import LoadingScreen from "@/components/LoadingScreen";

// Styled Components
const ProfileImage = styled(Image, {
  width: 120,
  height: 120,
  borderRadius: 20,
});

const BadgeContainer = styled(XStack, {
  backgroundColor: '$background',
  paddingHorizontal: '$2',
  paddingVertical: '$1',
  borderRadius: '$4',
  alignItems: 'center',
  space: '$1',
  variants: {
    type: {
      verified: { backgroundColor: '$blue8' },
      staff: { backgroundColor: '$yellow8' },
      artist: { backgroundColor: '$purple8' },
    },
  },
});

const ScrollableSection = styled(View, {
  position: 'relative',
  width: '100%',
});

const ShadowGradient = styled(LinearGradient, {
  position: 'absolute',
  top: 0,
  bottom: 0,
  width: 20,
  zIndex: 1,
  borderRadius: '$2',
});

const MediaCard = styled(Pressable, {
  borderRadius: '$4',
  padding: '$2',
  marginHorizontal: '$1',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
});

// Components
const Badge = ({ type, icon: Icon }) => (
  <BadgeContainer type={type}>
    <Icon size={12} color="white" />
  </BadgeContainer>
);

const UserBadges = ({ user }) => (
  <XStack space="$1">
    {user.verified && <Badge type="verified" icon={Check} />}
    {user.staff && <Badge type="staff" icon={Star} />}
    {user.artist && <Badge type="artist" icon={Music} />}
  </XStack>
);

const CurrentlyPlaying = ({ state, stateColor, onPress }) => (
  <XStack
    width="100%"
    backgroundColor={stateColor}
    opacity={0.9}
    padding="$4"
    space="$4"
    alignItems="center"
    animation="bouncy"
    borderRadius="$6"
    pressStyle={{ opacity: 0.8 }}
    onPress={onPress}
  >
    <Image
      source={{ uri: state.img }}
      width={24}
      height={24}
      borderRadius={12}
    />
    <YStack flex={1} maxWidth="70%">
      <ScrollingText
        loop
        duration={7000}
        bounce
        animationType="bounce"
        bounceSpeed={300}
        marqueeDelay={1000}
        style={{
          color: 'white',
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: 4
        }}
      >
        {state.name}
      </ScrollingText>
      <ScrollingText
        loop
        duration={8000}
        bounce
        animationType="bounce"
        bounceSpeed={300}
        marqueeDelay={1000}
        style={{ color: 'white', fontSize: 14 }}
      >
        {state.artist}
      </ScrollingText>
    </YStack>
    <Music2 size={24} color="white" />
  </XStack>
);

const MediaScroller = ({ data, onItemPress }) => (
  <ScrollableSection>
    <ShadowGradient
      colors={['$background', 'transparent']}
      start={[0, 0]}
      end={[1, 0]}
      style={{ left: 0 }}
    />
    <ShadowGradient
      colors={['transparent', '$background']}
      start={[0, 0]}
      end={[1, 0]}
      style={{ right: 0 }}
    />
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16 }}
    >
      <XStack space="$2">
        {data.map((item, index) => (
          <MediaCard
            key={index}
            onPress={() => onItemPress(item)}
          >
            <YStack space="$1" alignItems="center">
              <Image
                source={{ uri: item.image }}
                width={80}
                height={80}
                borderRadius={20}
              />
              <Text
                fontSize="$2"
                fontWeight="bold"
                textAlign="center"
                numberOfLines={1}
                paddingBlock="$2"
              >
                {item.name}
              </Text>
            </YStack>
          </MediaCard>
        ))}
      </XStack>
    </ScrollView>
  </ScrollableSection>
);

// Hooks
const useImageColor = (imageUrl: string) => {
  const [color, setColor] = useState('#2089dc');

  useEffect(() => {
    const fetchColor = async () => {
      try {
        const colors = await getColors(imageUrl, {
          fallback: '#2089dc',
          cache: true,
          key: imageUrl,
        });
        setColor(colors.platform === 'android' ? colors.dominant : colors.primary || '#2089dc');
      } catch (error) {
        console.error('Error getting color:', error);
      }
    };

    if (imageUrl) {
      fetchColor();
    }
  }, [imageUrl]);

  return color;
};

// Main Component
export default function UserProfile() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { data: user, isLoading } = userFetch(name, { refreshInterval: 30000 });
  const { data: stats, isLoading: statsLoading } = fetchUserStats(name);
  const stateColor = useImageColor(user?.msg?.state?.img);

  if (isLoading) return <LoadingScreen />;

  const handleMediaItemPress = async (item) => {
    const url = await Linking.canOpenURL(item.uri) ? item.uri : item.url;
    Linking.openURL(url);
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      <LinearGradient
        height="40%"
        width="100%"
        colors={
          user.msg.state
            ? [`${user.msg.color}90`, `${user.msg.color}90`, `${stateColor}80`, '$background']
            : [`${user.msg.color}90`, '$background']
        }
        start={[0, 0]}
        end={[0, 1]}
      >
        <XStack padding="$4" space="$4" paddingTop="$12">
          <ProfileImage source={{ uri: user.msg.pfp }} />
          <YStack flex={1} justifyContent="center" space="$2">
            <XStack alignItems="center" space="$2">
              <Text color="$color" fontSize="$6" fontWeight="bold">
                {user.msg.name}
              </Text>
              <UserBadges user={user.msg} />
            </XStack>
            <Text color="$gray11" fontSize="$4">@{user.msg.username}</Text>
            <Text color="$color" fontSize="$3" numberOfLines={3}>
              {user.msg.bio}
            </Text>
            <Pressable
              onPress={() => router.push({
                pathname: "./friends",
                params: { user: JSON.stringify(user.msg) }
              })}
            >
              <XStack
                backgroundColor={user.msg.color}
                paddingHorizontal="$2"
                paddingVertical="$1"
                borderRadius="$4"
                alignItems="center"
                space="$1"
              >
                <Text>
                  {user.msg?.friends > 1
                    ? `${user.msg.friends} friends`
                    : user.msg.friends === 1
                      ? "1 friend"
                      : "0 friends"}
                </Text>
              </XStack>
            </Pressable>
          </YStack>
        </XStack>
      </LinearGradient>

      <YStack flex={1} padding="$4" marginTop="$-13" space="$5">
        {user.msg.state && (
          <View space="$3">
            <H3>Currently Playing</H3>
            <CurrentlyPlaying
              state={user.msg.state}
              stateColor={stateColor}
              onPress={() => handleMediaItemPress(user.msg.state)}
            />
          </View>
        )}

        {!statsLoading && (
          <>
            <YStack space="$2" marginBottom="$4">
              <H3>Favorite Artists</H3>
              <MediaScroller
                data={stats.msg.artists}
                onItemPress={handleMediaItemPress}
              />
            </YStack>
            <YStack space="$2" marginBottom="$4">
              <H3>Favorite Songs</H3>
              <MediaScroller
                data={stats.msg.songs}
                onItemPress={handleMediaItemPress}
              />
            </YStack>
          </>
        )}
      </YStack>

      <View alignItems="center" paddingBottom="$4">
        <Text color="$gray10Light">
          account created {new Date(user?.msg.createdAt).toDateString().toLowerCase()}
        </Text>
      </View>
    </YStack>
  );
}