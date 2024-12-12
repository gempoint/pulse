import { sendFriReq, User } from "@/etc/api";
import { router } from "expo-router";
import { memo, useCallback, useEffect, useState } from "react";
import { Linking, StyleSheet } from "react-native";
import { Button, Image, Text, useTheme, XStack, YStack } from "tamagui";
import ScrollingText from '@/components/ScrollingText';
import { Music2 } from "@tamagui/lucide-icons";
import { getColorFromImage } from "./etc";

const UserItem = memo(({ friend, unadded, noState }: { friend: User, unadded: boolean, noState?: boolean }) => {
  noState = noState || false
  const theme = useTheme();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(friend.pending);

  const handleAddFriend = async () => {
    setIsAdding(true);
    try {
      await sendFriReq(friend.id);
      setIsAdded(true);
    } catch (error) {
      console.error('Error adding friend:', error);
      // Reset the adding state if there's an error
      setIsAdded(false);
    } finally {
      setIsAdding(false);
    }
  };


  const [clr, setClr] = useState("");

  // Use useCallback to memoize color extraction
  const extractImageColor = useCallback(async () => {
    if (friend.state?.img) {
      try {
        const color = await getColorFromImage(friend.state.img);
        setClr(color);
      } catch (error) {
        console.error("Color extraction error:", error);
      }
    }
  }, [friend.state?.img]);

  useEffect(() => {
    extractImageColor();
  }, [extractImageColor]);

  return (
    <XStack
      key={friend.id}
      alignItems="center"
      justifyContent="space-between"
      paddingVertical="$3"
      paddingHorizontal="$4"
      pressStyle={{ opacity: 0.7 }}
      onPress={() => {
        router.push(`user/${friend.id}/info`);
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

      {(friend.state && !noState) && (
        <XStack
          backgroundColor={clr || friend.color}
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
            <ScrollingText
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

      {unadded && (
        <XStack
          borderRadius="$4"
          paddingHorizontal="$3"
          paddingVertical="$2"
          space="$2"
          alignItems="center"
          animation="bouncy">
          <Button
            style={{
              backgroundColor: isAdded ? theme.gray8.val : theme.green10.val
            }}
            disabled={isAdding || isAdded}
            onPress={handleAddFriend}
          >
            {isAdding ? 'Adding...' : isAdded ? 'Added' : 'Add'}
          </Button>
        </XStack>
      )}
    </XStack>
  )
});


const styles = StyleSheet.create({
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  songArt: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
})
export default UserItem