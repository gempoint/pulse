import { View, Text, StyleSheet } from 'react-native';
import { Button } from 'tamagui';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { Restart } from 'fiction-expo-restart';
export default function Tab() {
  return (
    <View style={styles.container}>
      <Text>Tab [Home|Settings]</Text>
      <Button alignSelf="center" backgroundColor={"#1DB954"} onTouchEnd={() => signOut()}>Sign Out</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

const signOut = async () => {
  console.log('token', await SecureStore.getItemAsync('TOKEN'))
  await SecureStore.deleteItemAsync('TOKEN')
  //router.push('/')
  Restart()
}