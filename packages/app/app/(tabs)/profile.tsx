import { User, userFetch } from "@/etc/api";
import { ShieldHalf, Verified } from "@tamagui/lucide-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, RefreshControl, ScrollView } from "react-native";
import { H2, H4, Image, Spinner, useTheme, View, XStack, Text, Button, Paragraph, Separator } from "tamagui";

interface ProfileBadgeProps {
  isVerified?: boolean;
  isStaff?: boolean;
}

const ProfileBadge = ({ isVerified, isStaff }: ProfileBadgeProps) => (
  <XStack space="$3">
    {isVerified && <Verified size={24} color="#1DA1F2" />}
    {isStaff && <ShieldHalf size={24} color="#FFD700" />}
  </XStack>
);

const ProfileImage = ({ uri }: { uri?: string }) => (
  <Image
    source={{
      uri: uri || 'https://placeholder.com/user',
      width: 200,
      height: 200
    }}
    style={styles.profileImage}
    accessibilityLabel="Profile picture"
  />
);

export default function Profile() {
  const [profileData, setProfileData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  const fetchProfileData = useCallback(async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setIsLoading(true);
      }
      const response = await userFetch();
      setProfileData(response.msg);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile data');
      setProfileData(null);
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

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.centerContainer}>
        <Spinner size="large" color="$accentColor" />
      </View>
    );
  }

  const refreshControl = (
    <RefreshControl
      refreshing={isRefreshing}
      onRefresh={onRefresh}
      tintColor={theme.color.val as string}
      colors={[theme.color.val as string]}
      progressBackgroundColor={theme.background.val as string}
    />
  );

  if (error) {
    return (
      <ScrollView
        contentContainerStyle={styles.centerContainer}
        refreshControl={refreshControl}
      >
        <View style={styles.centerContainer}>
          <Text color="$red10Dark">{error}</Text>
          <Button onPress={() => fetchProfileData()} color="$blue" marginTop="$2">

            Tap to retry
          </Button>
        </View>
      </ScrollView>
    );
  }

  if (!profileData) {
    return (
      <ScrollView
        contentContainerStyle={styles.centerContainer}
        refreshControl={refreshControl}
      >
        <Text>No profile data available</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContainer}
      refreshControl={refreshControl}
      bounces={true}
    >
      <LinearGradient
        style={styles.background}
        colors={[profileData.color, theme.background.val, theme.background.val]}
      >
        <View style={styles.centerContainer} space="$3">
          <ProfileImage uri={profileData.pfp} />

          <View style={styles.profileInfo}>
            <XStack
              space="$3"
              justifyContent="center"
              alignItems="center"
            >
              <H2>{profileData.name}</H2>
              {profileData.verified || profileData.staff ? (
                <ProfileBadge
                  isVerified={profileData.verified}
                  isStaff={profileData.staff}
                />
              ) : undefined}
            </XStack>
            <H4>*{profileData.username}</H4>
            <Paragraph>
              {profileData.bio}
            </Paragraph>
            <Text onPress={() => router.push('/friends')}>{profileData.friends} friends</Text>
          </View>
        </View>
      </LinearGradient>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'white'
  },
  background: {
    minHeight: '100%',
  },
  profileInfo: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});