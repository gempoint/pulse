import { userFetch } from "@/etc/api";
import { Button, Form, Image, Input, Paragraph, Sheet, Text, TextArea, useSheet, View, XStack, YStack } from "tamagui";
import { LinearGradient } from "@tamagui/linear-gradient";
import LoadingScreen from "@/components/LoadingScreen";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { SkipBack } from "@tamagui/lucide-icons";
import { useState } from "react";
import { Platform, StyleSheet } from "react-native";
import tinycolor from "tinycolor2";
import { SPOTIFY_GREEN } from "@/constants/idk";
import Entypo from '@expo/vector-icons/Entypo';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfile() {
  const { data, isLoading } = userFetch("", {})
  const [name, setName] = useState(data?.msg.name || "")
  const [username, setUsername] = useState(data?.msg.username || "")
  const [bio, setBio] = useState(data?.msg.bio || "")
  const [shouldAdapt, setShouldAdapt] = useState(true)
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(0)
  const user = data?.msg

  const picker = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <View>
        <KeyboardAwareScrollView>
          <SafeAreaView>
            <View paddingTop="$10" paddingHorizontal="$5" space="$2">
              {/*<Form></Form>*/}
              <View alignItems="center">
                <Image
                  onTouchEnd={() => { setOpen(!open) }}
                  shadowColor="$accentBackground"
                  shadowRadius={"20"}
                  shadowOffset={{
                    width: 0,
                    height: 0
                  }}
                  borderRadius={"$4"}
                  source={{
                    uri: user?.pfp,
                    width: 175,
                    height: 175
                  }} />
              </View>
              <XStack flex={1} space="$2" width="100%">
                <YStack width="50%" space="$1.5">
                  <Paragraph>name</Paragraph>
                  {/*<Text>hh</Text>*/}
                  <Input value={name} onChangeText={setName} defaultValue={user?.name} placeholder="ur mom" />
                </YStack>
                <YStack width="50%" space="$1.5">
                  <Paragraph>username</Paragraph>
                  {/*<Text>hh</Text>*/}
                  <Input onChangeText={setUsername} value={username} defaultValue={user?.username} placeholder="jane.doeee" />
                </YStack>
              </XStack>
              <YStack space="$1.5">
                <Paragraph>bio</Paragraph>
                {/*<Text>hh</Text>*/}
                <TextArea value={bio} onChangeText={setBio} textAlign="left" defaultValue={user?.bio} placeholder="jane.doeee" height={"$10"} />
              </YStack>
            </View>
          </SafeAreaView>
        </KeyboardAwareScrollView>
      </View>
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
        <Sheet.Frame style={styles.container} backgroundColor={"$background075"}>
          <Sheet.Handle />
          <View space="$3">
            <Button icon={<Entypo name="spotify" size={24} color="white" />} backgroundColor={SPOTIFY_GREEN}>Refresh From Spotify</Button>
            <Button onTouchEnd={() => picker()}>Upload New Image</Button>
          </View>

        </Sheet.Frame>
      </Sheet>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
  }
})