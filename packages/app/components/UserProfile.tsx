import React, { useState } from "react";
import { router } from "expo-router";
import { Linking, Pressable } from "react-native";
import {
  Button,
  H3,
  Image,
  ScrollView,
  styled,
  Text,
  View,
  XStack,
  YStack,
} from "tamagui";
import { LinearGradient } from "@tamagui/linear-gradient";
import {
  Check,
  Instagram,
  Music,
  Music2,
  Settings,
  Star,
} from "@tamagui/lucide-icons";
import { getColors } from "react-native-image-colors";

import ScrollingText from "@/components/ScrollingText";
import LoadingScreen from "@/components/LoadingScreen";
import { fetchUserStats, StatInfo, userFetch } from "@/etc/api";
import tinycolor from "tinycolor2";

// Styled Components
const StyledImage = styled(Image, {
  width: "$6",
  height: "$6",
  borderRadius: "$2",
});

const ScrollContainer = styled(View, {
  position: "relative",
  width: "100%",
});

const ShadowGradient = styled(LinearGradient, {
  position: "absolute",
  top: 0,
  bottom: 0,
  width: 20,
  zIndex: 1,
  borderRadius: "$2",
});

const ArtistCard = styled(View, {
  maxWidth: "100%",
  borderRadius: "$.5",
  padding: "$1.5",
  marginHorizontal: "$.5",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 8,
});

// Type Definitions
type UserProfileProps =
  | {
    username?: string;
    me: true;
  }
  | {
    username: string;
    me: boolean;
  };

// Utility Functions
const getColorFromImage = async (imageUrl: string): Promise<string> => {
  try {
    const colors = await getColors(imageUrl, {
      fallback: "#2089dc",
      cache: true,
      key: imageUrl,
    });

    if (colors.platform === "android") {
      return colors.dominant || "#2089dc";
    } else if (colors.platform === "ios") {
      return colors.primary || "#2089dc";
    }
    return "#2089dc";
  } catch (error) {
    console.error("Error getting color:", error);
    return "#2089dc";
  }
};

// Badges Component
const UserBadges: React.FC<{
  verified?: boolean;
  staff?: boolean;
  artist?: boolean;
}> = ({ verified, staff, artist }) => (
  <XStack space="$1">
    {verified && (
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

    {staff && (
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

    {artist && (
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
);

// Artist/Song List Renderer
const ArtistList: React.FC<{
  artists: StatInfo[];
  songs?: boolean;
}> = ({ artists, songs }) => (
  <ScrollContainer>
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
        contentContainerStyle={{
          // paddingHorizontal: 14,
        }}
      >
        <XStack space="$.5">
          {artists &&
            artists.map((artist, index) => (
              <Pressable
                key={index}
                onPress={async () => {
                  const url = (await Linking.canOpenURL(artist.uri))
                    ? artist.uri
                    : artist.url;
                  Linking.openURL(url);
                }}
              >
                <ArtistCard>
                  <YStack space="$.5" alignItems="center">
                    <Image
                      source={{ uri: artist.image }}
                      width={80}
                      height={80}
                      borderRadius={10}
                    />
                    <Text
                      fontSize={songs ? 8 : "$2"}
                      fontWeight="bold"
                      textAlign="center"
                      numberOfLines={1}
                      paddingBlock="$2"
                      textOverflow="ellipsis"
                      ellipsizeMode="tail"
                      width={100}
                    >
                      {artist.name}
                    </Text>
                  </YStack>
                </ArtistCard>
              </Pressable>
            ))}
        </XStack>
      </ScrollView>
    </>
  </ScrollContainer>
);

// Current State / Now Playing Renderer
const CurrentState: React.FC<{
  state: any;
  stateColor: string;
}> = ({ state, stateColor }) => (
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
      borderRadius="$6"
      onPress={async () => {
        const url = (await Linking.canOpenURL(state?.uri!))
          ? state?.uri!
          : state?.url!;
        console.log(url);
        Linking.openURL(url);
      }}
    >
      <StyledImage source={{ uri: state.img }} />

      <YStack flex={1} maxWidth="70%">
        <ScrollingText
          loop
          duration={7000}
          bounce={true}
          animationType="bounce"
          bounceSpeed={300}
          marqueeDelay={1000}
          style={{
            color: "white",
            fontSize: 16,
            fontWeight: "bold",
            marginBottom: 4,
          }}
        >
          {state.name}
        </ScrollingText>
        <ScrollingText
          loop
          duration={8000}
          bounce={true}
          animationType="bounce"
          bounceSpeed={300}
          marqueeDelay={1000}
          style={{
            color: "white",
            fontSize: 14,
          }}
        >
          {state.artist}
        </ScrollingText>
      </YStack>

      <Music2 size={24} color="white" />
    </XStack>
  </View>
);

// Profile Action Buttons Component
const ProfileActionButtons: React.FC<{
  me: boolean;
  user: User;
  isFriend: boolean;
}> = ({ me, user, isFriend }) => (
  <View paddingTop="$3">
    <XStack gap="$2" flex={1} alignItems="center" alignContent="center">
      {me ? (
        <>
          <Button
            size="$4"
            backgroundColor={tinycolor(user.color).darken(20).toHexString()}
            width="50%"

            opacity={50}
            onPressOut={() => router.push("/edit")}
          >
            Edit
          </Button>
          <Button
            icon={<Instagram />}
            size="$4"
            width="33.3%"
            backgroundColor="$d62976"
          >
            Share
          </Button>
          <Button
            icon={<Settings />}
            size="$4"
            backgroundColor="$d62976"
            onPressOut={() => router.push("/settings")}
          />
        </>
      ) : isFriend ? (
        <Button
          size="$4"
          backgroundColor="$red10Light"
          width="50%"
          onPressOut={() => router.push("/")}
        >
          Remove
        </Button>
      ) : user.isPending ? (
        <>
          <Button width="50%" size="$3" onPressOut={() => router.push("/")}>Remove Friend Request</Button>
          <Button width="50%" size="$3">Remove Friend Request</Button>
        </>
      ) : (
        <>
          <Button
            size="$4"
            backgroundColor="$green10Light"
            width="50%"
            onPressOut={() => router.push("/")}
          >
            Add
          </Button>
          <Button
            size="$4"
            backgroundColor="$red10Light"
            width="50%"
            onPressOut={() => router.push("/")}
          >
            Decline
          </Button>
        </>
      )}
    </XStack>
  </View>
);

const UserProfile: React.FC<UserProfileProps> = ({ username, me }) => {
  if (me) {
    username = "";
  }
  const [stateColor, setStateColor] = useState<string>("#2089dc");
  const [shouldFetch, setShouldFetch] = useState<boolean>(false)

  // Fetch user data
  const { data: userData, isLoading: userLoading, error, mutate } = userFetch(username, {
    refreshInterval: 30000,
    onSuccess: async (res) => {
      setShouldFetch(true)
      console.log("dat", res);
      if (res.msg.state) {
        const color = await getColorFromImage(res.msg.state.img);
        setStateColor(color);
      }
    },
  });

  // Fetch stats data
  const { data: statsData, isLoading: statsLoading, error: statsError } = fetchUserStats(shouldFetch ? username! : undefined, {});

  //if (error) {
  //  return (
  //    <View flex={1} alignContent="center" alignItems="center">

  //    </View>
  //  )
  //}

  // Show loading screen while data is being fetched
  if (userLoading || statsLoading || !userData || !statsData) {
    return <LoadingScreen />;
  }


  const user = userData.msg;
  const stats = statsData;


  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView flex={1} backgroundColor="$background">
        <LinearGradient
          height="40%"
          width="100%"
          colors={
            user.state
              ? [
                `${user.color}90`,
                `${user.color}90`,
                `${stateColor}80`,
                "$background",
              ]
              : [`${user.color}90`, "$background"]
          }
          start={[0, 0]}
          end={[0, 1]}
          style={{
            paddingTop: me ? "$3" : undefined,
          }}
        >
          <View padding="$4" paddingTop="$11">
            <XStack space="$4">
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

                  <UserBadges
                    verified={user.verified}
                    staff={user.staff}
                    artist={user.artist}
                  />
                </XStack>

                <Text color="$gray11" fontSize="$4">
                  @{user.username}
                </Text>

                <Text color="$color" fontSize="$3" numberOfLines={3}>
                  {user.bio}
                </Text>
              </YStack>
            </XStack>

            <ProfileActionButtons
              me={me}
              user={user}
              isFriend={user.isFriend}
            />
          </View>
        </LinearGradient>

        <YStack
          flex={1}
          padding="$4"
          marginTop={user.state ? "$-10" : "$-5"}
          space="$3"
        >
          {user.state && (
            <CurrentState state={user.state} stateColor={stateColor} />
          )}

          {stats.ok ? (
            <>
              <YStack space="$2" marginBottom="$2">
                <H3>Favorite Artists</H3>
                <ArtistList artists={stats.msg.artists} />
              </YStack>

              <YStack space="$2" marginBottom="$2">
                <H3>Favorite Songs</H3>
                <ArtistList artists={stats.msg.songs} songs />
              </YStack>
            </>
          ) : (
            <YStack space="$2" marginBottom="$2" paddingTop="$20">
              <Text>{stats.msg.type}</Text>
            </YStack>
          )}
        </YStack>
        <Text>hello</Text>

        <View alignItems="center" paddingBottom="$2">
          <Text color="$gray10Light">
            account created{" "}
            {new Date(user.createdAt).toDateString().toLowerCase()}
          </Text>
        </View>
      </ScrollView>
    </YStack>
  );
};

export default UserProfile;
