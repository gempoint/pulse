import { Instagram } from "@tamagui/lucide-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Platform } from "react-native";
import { Button, Text, View } from "tamagui";
import Share from 'react-native-share';
import Constants from 'expo-constants';
import React from "react";
import { fetchUserPN, userFetch } from "@/etc/api";

// Types for our cache structure
type CacheData = {
  data: any;
  timestamp: number;
};

type CachedPN = {
  msg: {
    png: string;
    // Add other properties from fetchUserPN response if needed
  };
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export default function Show() {
  const [showInstagram, setShowInstagram] = useState(false);
  const [user, setUser] = useState();
  const [uri, setUri] = useState();
  const [pnCache, setPNCache] = useState<CacheData | null>(null);

  // Function to check if cache is valid
  const isCacheValid = (cache: CacheData | null): boolean => {
    if (!cache) return false;
    const now = Date.now();
    return now - cache.timestamp < CACHE_DURATION;
  };

  // Function to fetch and cache PN data
  const fetchAndCachePN = async () => {
    try {
      const data = await fetchUserPN();
      setPNCache({
        data,
        timestamp: Date.now(),
      });
      return data;
    } catch (error) {
      console.error('Error fetching PN data:', error);
      return null;
    }
  };

  // Function to get PN data (from cache or fetch new)
  const getPNData = async () => {
    if (isCacheValid(pnCache)) {
      return pnCache.data;
    }
    return fetchAndCachePN();
  };

  useEffect(() => {
    const fn = async () => {
      // Check Instagram availability
      if (Platform.OS === 'ios') {
        try {
          const val = await Linking.canOpenURL('instagram://');
          setShowInstagram(val);
        } catch (err) {
          console.error(err);
        }
      } else {
        try {
          const { isInstalled } = await Share.isPackageInstalled('com.instagram.android');
          setShowInstagram(isInstalled);
        } catch (err) {
          console.error(err);
        }
      }

      // Fetch user data
      try {
        const userData = await userFetch();
        setUser(userData.msg);
      } catch (err) {
        console.error('Error fetching user data:', err);
      }

      // Fetch and cache PN data
      await getPNData();
    };

    fn();
  }, []);

  const shareDummyImage = async () => {
    console.log('r', showInstagram);
    try {
      const pnData = await getPNData();

      if (!pnData) {
        console.error('Failed to get PN data');
        return;
      }

      if (showInstagram) {
        console.log('i', Constants.expoConfig?.extra!.FB_ID);
        const x = await Share.shareSingle({
          social: Share.Social.INSTAGRAM_STORIES,
          appId: Constants.expoConfig?.extra!.FB_ID,
          stickerImage: `${pnData.msg.png}`,
          backgroundBottomColor: '#fff',
          backgroundTopColor: user?.color
        });
        console.log(x);
      } else {
        await Share.open({ url: uri });
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const onCapture = useCallback((uri: unknown) => {
    console.log("do something with ", uri);
    setUri(uri);
  }, []);

  return (
    <View>
      <Button
        onPress={shareDummyImage}
        icon={showInstagram ? <Instagram /> : undefined}
        disabled={!pnCache?.data}
      >
        Wanna try adding some? ;)
      </Button>
    </View>
  );
}