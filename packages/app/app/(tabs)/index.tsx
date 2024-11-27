import { View, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { Button, Text } from 'tamagui';
import * as Location from 'expo-location';
import { useState, useRef } from 'react';
import { useToastController } from '@tamagui/toast';
import safeAwait from 'safe-await';
import { router } from 'expo-router';
import { radar } from '@/etc/api';
import RadarAnimation from '@/components/RadarAnimation';

export default function Tab() {
  const toastController = useToastController();
  const [isLoading, setIsLoading] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const animatePress = () => {
    // Scale down and fade slightly
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();
  };

  const animateRelease = () => {
    // Scale back up and restore opacity
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  };

  const apiRadar = async () => {
    setIsLoading(true);
    try {
      let test = await Location.getForegroundPermissionsAsync();
      console.log(test);
      if (!test.granted) {
        await Location.requestForegroundPermissionsAsync();
      }
      let loc
      loc = await Location.getLastKnownPositionAsync({});
      if (!loc) {
        return;
      }

      console.log('loc', loc);
      let [err, data] = await safeAwait(radar(loc.coords.latitude, loc.coords.longitude));

      if (err) {
        toastController.show('something wrong happened', {
          customData: {
            error: true
          }
        });
        return;
      }

      console.log('d', data);
      if (!data?.ok) {
        switch (data?.msg.type) {
          case "NO_PLAYER":
            toastController.show(`no active player detected`, {
              customData: {
                error: true
              }
            });
            break;
          case "NO_PREMIUM":
            toastController.show(`you dont have spotify premium`, {
              customData: {
                error: true
              }
            });
            break;
        }
      } else {
        console.log(data.msg)
        router.push({
          pathname: '/selector',
          params: { data: JSON.stringify(data.msg) }
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Custom animated button wrapper
  const AnimatedButton = ({ children, onPress }) => {
    return (
      <Animated.View
        style={[
          styles.buttonWrapper,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          }
        ]}
      >
        <Button
          alignSelf="center"
          color="black"
          disabled={isLoading}
          onPressIn={animatePress}
          onPressOut={animateRelease}
          onPress={onPress}
        >
          {children}
        </Button>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <RadarAnimation />
      <AnimatedButton onPress={apiRadar}>
        {isLoading ? (
          <View style={styles.buttonContent}>
            <ActivityIndicator color="white" style={styles.loader} />
            <Text color="white">Loading...</Text>
          </View>
        ) : (
          "Radar"
        )}
      </AnimatedButton>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonWrapper: {
    width: 120,  // Adjust based on your needs
    height: 40,  // Adjust based on your needs
  },
  button: {
    width: '100%',
    height: '100%',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginRight: 8,
  },
});