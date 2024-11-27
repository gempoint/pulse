import { a, APIResponse, checkUsernameValid, User, userUpdate } from "@/etc/api";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { Animated, Keyboard, Linking, Platform, StyleSheet } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, H1, H2, H3, H4, Image, Input, Label, Sheet, Spinner, Text, useTheme, View, XStack, YStack } from "tamagui";
import * as SecureStore from 'expo-secure-store';
import { router } from "expo-router";
import React from "react";
import { ArrowDown } from "@tamagui/lucide-icons";
import * as Notifications from 'expo-notifications';
import { startActivityAsync, ActivityAction } from 'expo-intent-launcher';
import * as Application from 'expo-application';
import Constants from 'expo-constants';


type ValidationStatus = 'off' | 'submitting' | 'submitted' | 'error';

const validateUsername = (username: string): { isValid: boolean; message?: string } => {
  // Check length
  if (username.length > 30) {
    return { isValid: false, message: 'Username must be 30 characters or less' };
  }

  // Check for valid characters using regex
  const validUsernameRegex = /^[a-zA-Z0-9._]+$/;
  if (!validUsernameRegex.test(username)) {
    return {
      isValid: false,
      message: 'Username can only contain letters, numbers, periods, and underscores'
    };
  }

  return { isValid: true };
};

export default function Onboard() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [data, setData] = useState<User>();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<ValidationStatus>('off');
  const [errorMessage, setErrorMessage] = useState('');
  const [position, setPosition] = useState(0)
  const [open, setOpen] = useState(false)
  const [notifStatus, setNotifStatus] = useState<Notifications.PermissionStatus>()

  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const usernameCheckTimeout = useRef<NodeJS.Timeout>();
  const theme = useTheme();

  const fetchUserData = async () => {
    try {
      const response = await a.get<APIResponse<true, User>>('/user/me', {
        headers: {
          'Authorization': `Bearer ${code}`
        }
      });
      setData(response.data.msg);
      setName(response.data.msg.name);
    } catch (error) {
      setErrorMessage('Failed to fetch user data');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const validateAndSubmit = async () => {
    if (!name.trim() || !username.trim()) {
      setErrorMessage('Name and username are required');
      setStatus('error');
      startShake();
      return;
    }

    // Validate username format
    const validation = validateUsername(username);
    if (!validation.isValid) {
      setErrorMessage(validation.message || 'Invalid username');
      setStatus('error');
      startShake();
      return;
    }

    setStatus('submitting');
    try {
      const isValid = await checkUsernameValid(username);
      if (!isValid) {
        setErrorMessage('Username is not available');
        setStatus('error');
        startShake();
        return;
      }

      Keyboard.dismiss()
      await sheet()
      //await SecureStore.setItemAsync('TOKEN', code)
      //userUpdate({
      //  name, username
      //})
      //router.push('/')

      // Here you would typically make an API call to save the user data
      // await saveUserData({ name, username });

      setStatus('submitted');
    } catch (error) {
      setErrorMessage('An error occurred while validating username');
      setStatus('error');
      startShake();
    }
  };

  const sheet = async () => {
    setOpen(true)
    let finalStatus = notifStatus

    if (notifStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
  }

  const ask = async () => {
    const x = await Notifications.requestPermissionsAsync()
    console.log(x)
    if (x.status === 'denied') {
      // said no so we go to settings
      if (Platform.OS === "android") {
        startActivityAsync(ActivityAction.APP_NOTIFICATION_SETTINGS, {
          extra: {
            'android.provider.extra.APP_PACKAGE': Application.applicationId
          }
        })
      } else {
        Linking.openSettings()
      }
    }
    Notifications.getPermissionsAsync().then(async y => {
      if (y.granted) {
        let token = ""

        token = (await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig!.extra!.eas.projectId,
        })).data
        await SecureStore.setItemAsync('TOKEN', code)
        // i dont feel like updating this
        // @ts-ignore
        userUpdate({
          name, username, token
        })
        router.push('/')
        setOpen(false)

      }
    })
  }

  const justGo = async () => {
    await SecureStore.setItemAsync('TOKEN', code)
    // i dont feel like updating this
    // @ts-ignore
    userUpdate({
      name, username
    })
    router.push('/')
    setOpen(false)
  }

  const startShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true })
    ]).start();
  };

  const handleUsernameChange = (text: string) => {
    setUsername(text);
    setStatus('off');
    setErrorMessage('');

    // Validate username format immediately
    const validation = validateUsername(text);
    if (!validation.isValid && text.length > 0) {
      setErrorMessage(validation.message || 'Invalid username');
      setStatus('error');
      return;
    }

    if (usernameCheckTimeout.current) {
      clearTimeout(usernameCheckTimeout.current);
    }

    // Only check availability if format is valid
    if (validation.isValid && text.length > 0) {
      usernameCheckTimeout.current = setTimeout(async () => {
        try {
          const isValid = await checkUsernameValid(text);
          if (!isValid) {
            setErrorMessage('Username is not available');
            setStatus('error');
          }
        } catch (error) {
          setErrorMessage('Failed to validate username');
          setStatus('error');
        }
      }, 500);
    }
  };

  useEffect(() => {
    Notifications.getPermissionsAsync().then((permissions) => {
      setNotifStatus(permissions.status!)
    })

    fetchUserData();

    return () => {
      if (usernameCheckTimeout.current) {
        clearTimeout(usernameCheckTimeout.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Spinner size="large" color={"$accentColor"} />
      </View>
    );
  }

  const animatedContainerStyle = {
    transform: [{ translateX: shakeAnimation }],
    width: '100%',
  };

  return (
    <>
      <LinearGradient
        style={styles.background}
        colors={[data!.color, theme.background.val as string]}
      >
        <View style={[styles.container, styles.up]} paddingTop="$-3" space="$3">
          <View flexDirection="row" alignItems="center">
            <H3>finish creating your account</H3>
            <ArrowDown />
          </View>
          <Image
            style={styles.rounded}
            source={{
              uri: data?.pfp,
              width: 200,
              height: 200
            }}
          />

          <Animated.View style={animatedContainerStyle}>
            <View width="70%" alignSelf="center" space="$4">
              <View space="$2">
                <Label textAlign="center">Name</Label>
                <Input
                  textAlign="center"
                  value={name}
                  onChangeText={setName}
                  borderColor={status === 'error' ? '$red10' : undefined}
                />
              </View>

              <View space="$2">
                <Label textAlign="center">Username</Label>
                <Input
                  textAlign="center"
                  value={username}
                  onChangeText={handleUsernameChange}
                  borderColor={status === 'error' ? '$red10' : undefined}
                  maxLength={30} // Prevent typing more than 30 characters
                />
              </View>

              {status === 'error' && (
                <Text color="$red10" textAlign="center">
                  {errorMessage}
                </Text>
              )}
            </View>
          </Animated.View>

          <Button
            disabled={status === 'submitting'}
            onPress={validateAndSubmit}
            icon={status === 'submitting' ? () => <Spinner color="$accentColor" /> : undefined}
          >
            {status === 'submitting' ? 'Creating...' : 'Create'}
          </Button>
        </View>
      </LinearGradient>
      <Sheet
        modal
        native={Platform.OS === 'ios' ? true : false}
        open={open}
        onOpenChange={setOpen}
        snapPoints={[40, 40, 20]}
        position={position}
        onPositionChange={setPosition}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Frame style={styles.container}>
          <Sheet.Handle />

          <XStack padding="$4" space="$4">
            <H3>Enable Notificaions</H3>
          </XStack>

          {/* Your sheet content goes here */}
          <XStack padding="$4" space="$4" flexDirection="row" alignItems="center">
            <Button backgroundColor="$green10Light" onPressOut={() => ask()}>
              Enable
            </Button>
            <Text>or</Text>
            <Button
              size="$4"
              onPress={() => justGo()}
            >
              Skip
            </Button>
          </XStack>
        </Sheet.Frame>
      </Sheet>
    </>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  },
  rounded: {
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'white'
  },
  background: {
    height: '100%',
  },
  up: {
    //paddingTop: ""
  }
});