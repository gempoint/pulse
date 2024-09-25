import { useState } from 'react';
import { View, StyleSheet, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { YStack, Text, Form, XStack, Input, TextArea, Button } from 'tamagui';
import * as Sentry from "@sentry/react-native";
import * as SecureStore from 'expo-secure-store';
import { Buffer } from "buffer";
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { useToastController } from '@tamagui/toast';

const {
  deviceName,
} = Constants

const {
  deviceName: type,
  manufacturer
} = Device

export default function Tab() {
  const [message, setMessage] = useState('')
  const toastController = useToastController()


  const handleSubmit = async () => {
    if (message !== '') {
      Keyboard.dismiss()
      console.log('Feedback submitted:', { message })
      const sentryId = Sentry.captureMessage("feedback_submit");
      let token = await SecureStore.getItemAsync('TOKEN')!
      //const [encodedHeader, encodedBody, signature] = token!.toString().split('.');
      let id
      const arr = token!.toString().split('.');
      if (arr.length === 0) {
        //um wtf?
        id = 'unable-to-determine'
      }
      id = Buffer.from(arr[1], 'base64') as unknown as string
      Sentry.captureUserFeedback({
        event_id: sentryId,
        name: id,
        email: `${deviceName}@${type}-${manufacturer}.com`,
        comments: message
      })
      toastController.show("😃👍")
      setMessage('')
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <YStack
        flex={1}
        alignItems="center"
        justifyContent="center"
        padding="$6"
        space="$6"
        width="100%"
      >
        <YStack maxWidth={600} width="100%">
          <Text fontSize="$8" fontWeight="bold" textAlign="center" paddingBottom="$5">
            Feedback
          </Text>
          <Form onSubmit={handleSubmit}>
            <YStack space="$6">
              <YStack space="$2">
                <TextArea
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Enter your feedback"
                  numberOfLines={6}
                  fontSize="$5"
                  padding="$3"
                  textAlign="center"
                  aria-label="Message"
                />
              </YStack>
              <Button
                onPress={handleSubmit}
                theme="active"
                size="$5"
                fontSize="$6"
                marginTop="$4"
                accessibilityLabel="Submit Feedback"
              >
                Submit Feedback
              </Button>
            </YStack>
          </Form>
        </YStack>
      </YStack>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
