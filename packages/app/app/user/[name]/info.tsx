import { router, useLocalSearchParams } from "expo-router";
import { Stack, XStack, YStack, Text, Image, View, Spinner, Square, ScrollView, styled, H3, H1 } from 'tamagui';
import { LinearGradient } from '@tamagui/linear-gradient';
import { Check, Star, Music, Music2 } from '@tamagui/lucide-icons';
import { useEffect, useState, useCallback } from "react";
import { Artist, fetchUserStats, User, userFetch } from "@/etc/api";
import React from "react";
import ScrollingText from '@/components/ScrollingText';
import { Linking, Pressable } from "react-native";
import { getColors } from 'react-native-image-colors';

const StyledImage = styled(Image, {
  width: '$6',
  height: '$6',
  borderRadius: '$4',
})

const ScrollContainer = styled(View, {
  position: 'relative',
  width: '100%',
})

const ShadowGradient = styled(LinearGradient, {
  position: 'absolute',
  top: 0,
  bottom: 0,
  width: 20,
  zIndex: 1,
  borderRadius: '$2'
})

const ArtistCard = styled(View, {
  //backgroundColor: '$background',
  borderRadius: '$4',
  padding: '$2',
  marginHorizontal: '$1',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
  elevation: 3,
})

const getColorFromImage = async (imageUrl: string): Promise<string> => {
  try {
    const colors = await getColors(imageUrl, {
      fallback: '#2089dc',
      cache: true,
      key: imageUrl,
    });

    if (colors.platform === 'android') {
      return colors.dominant || '#2089dc';
    } else if (colors.platform === 'ios') {
      return colors.primary || '#2089dc';
    }
    return '#2089dc';
  } catch (error) {
    console.error('Error getting color:', error);
    return '#2089dc';
  }
};

export default function U() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stateColor, setStateColor] = useState<string>('#2089dc');
  const [favoriteArtists, setFavoriteArtists] = useState<Artist[]>([]);

  const fetchUserData = useCallback(async () => {
    try {
      const response = await userFetch(name);
      const userData = response.msg;

      // Get color from state image if available
      if (userData?.state?.img) {
        const color = await getColorFromImage(userData.state.img);
        setStateColor(color);
      }

      setUser(userData);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setIsLoading(false);
    }
  }, [name]);

  // Initial data fetch
  useEffect(() => {
    const fn = async () => {
      const artists = await fetchUserStats(name)
      //console.log('a', artists)
      setFavoriteArtists(artists.msg);
    }
    fn()
    fetchUserData();
  }, [fetchUserData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchUserData();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [fetchUserData]);

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" />
      </YStack>
    );
  }

  if (!user) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Text>User not found</Text>
      </YStack>
    );
  }

  return (
    <>
      <YStack flex={1} backgroundColor="$background">
        <LinearGradient
          height="40%"
          width="100%"
          colors={user.state !== null ? [`${user.color}90`, `${user.color}90`, `${stateColor}80`, '$background'] : [`${user.color}90`, '$background']}
          start={[0, 0]}
          end={[0, 1]}
        >
          {/* Existing profile header code remains the same */}
          <XStack padding="$4" space="$4" paddingTop="$12">
            <Image
              source={{ uri: user.pfp }}
              width={120}
              height={120}
              borderRadius={20}
            />

            <YStack flex={1} justifyContent="center" space="$2">
              <XStack alignItems="center" space="$2">
                <Text color="$color" fontSize="$6" fontWeight="bold">
                  {user.name}
                </Text>

                <XStack space="$1">
                  {user.verified && (
                    <XStack
                      backgroundColor="$blue8"
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$4"
                      alignItems="center"
                      space="$1"
                    >
                      <Check size={12} color="white" />
                    </XStack>
                  )}

                  {user.staff && (
                    <XStack
                      backgroundColor="$yellow8"
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$4"
                      alignItems="center"
                      space="$1"
                    >
                      <Star size={12} color="white" />
                    </XStack>
                  )}

                  {user.artist && (
                    <XStack
                      backgroundColor="$purple8"
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$4"
                      alignItems="center"
                      space="$1"
                    >
                      <Music size={12} color="white" />
                    </XStack>
                  )}
                </XStack>
              </XStack>

              <Text color="$gray11" fontSize="$4">
                @{user.username}
              </Text>

              <Text color="$color" fontSize="$3" numberOfLines={3}>
                {user.bio}
              </Text>

              <Pressable onPress={() => router.push({
                pathname: "./friends",
                params: {
                  user: JSON.stringify(user)
                }
              })}>
                <XStack
                  backgroundColor={user.color}
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius="$4"
                  alignItems="center"
                  space="$1">
                  <Text>{user?.friends && user.friends > 1 ? `${user.friends} friends` : user.friends === 1 ? "1 friend" : "0 friends"}</Text>
                </XStack>
              </Pressable>
            </YStack>
          </XStack>
        </LinearGradient>

        <YStack flex={1} padding="$4" marginTop="$-13" space="$5">
          {/* Currently Playing Section */}
          {user.state && (
            <View space="$3">
              <H3>Currently Playing</H3>
              <XStack
                width="100%"
                backgroundColor={stateColor}
                opacity={0.9}
                paddingHorizontal="$4"
                paddingVertical="$4"
                space="$4"
                alignItems="center"
                animation="bouncy"
                borderRadius={"$6"}
                onPress={async () => {
                  const url = await Linking.canOpenURL(user.state?.uri!)
                    ? user.state?.uri!
                    : user.state?.url!;
                  Linking.openURL(url);
                }}
              >
                <StyledImage
                  source={{ uri: user.state.img }}
                />

                <YStack flex={1} maxWidth="70%">
                  <ScrollingText
                    loop
                    duration={7000}
                    bounce={true}
                    animationType={'bounce'}
                    bounceSpeed={300}
                    marqueeDelay={1000}
                    style={{
                      color: 'white',
                      fontSize: 16,
                      fontWeight: 'bold',
                      marginBottom: 4
                    }}
                  >
                    {user.state.name}
                  </ScrollingText>
                  <ScrollingText
                    loop
                    duration={8000}
                    bounce={true}
                    animationType={'bounce'}
                    bounceSpeed={300}
                    marqueeDelay={1000}
                    style={{
                      color: 'white',
                      fontSize: 14
                    }}
                  >
                    {user.state.artist}
                  </ScrollingText>
                </YStack>

                <Music2 size={24} color="white" />
              </XStack>
            </View>
          )}
          {/* Favorite Artists Section */}
          <YStack space="$2" marginBottom="$4">
            {favoriteArtists.length > 0 ? (
              <>
                <H3>Favorite Artists</H3>
                {/* Left shadow */}
                <ScrollContainer>
                  <ShadowGradient
                    colors={['$background', 'transparent']}
                    start={[0, 0]}
                    end={[1, 0]}
                    style={{ left: 0 }}
                  />

                  {/* Right shadow */}
                  <ShadowGradient
                    colors={['transparent', '$background']}
                    start={[0, 0]}
                    end={[1, 0]}
                    style={{ right: 0 }}
                  />

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                      paddingHorizontal: 16, // Add padding to offset shadows
                    }}
                  >
                    <XStack space="$2">
                      {favoriteArtists.map((artist, index) => (
                        <Pressable
                          key={index}
                          onPress={async () => {
                            console.log(1)
                            const url = await Linking.canOpenURL(artist.uri) ? artist.uri : artist.url;
                            Linking.openURL(url);
                          }}
                        >
                          <ArtistCard>
                            <YStack space="$1" alignItems="center">
                              <Image
                                source={{ uri: artist.image }}
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
                                {artist.name}
                              </Text>
                            </YStack>
                          </ArtistCard>
                        </Pressable>
                      ))}
                    </XStack>
                  </ScrollView>
                </ScrollContainer>
              </>
            ) : (
              <View style={{
                alignItems: "center",
                alignContent: 'center'
              }}>
                <H3>No stats to show</H3>
              </View>
            )}
          </YStack>
        </YStack>
      </YStack >
    </>
  );
}