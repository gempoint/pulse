import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'tamagui';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import * as Application from 'expo-application';

export default function Tab() {
  return (
    <View style={styles.container}>
      <Text color="$white05" paddingBottom="$3">¯\_(ツ)_/¯</Text>
      <Text color="$white05" paddingBottom="$3">Build {Application.nativeApplicationVersion}</Text>
      <Button alignSelf="center" backgroundColor={"$accentColor"} marginBottom="$3" color={"black"} onTouchEnd={() => router.push('/feedback')}>Feedback</Button>
      <Button alignSelf="center" backgroundColor={"#1DB954"} marginBottom="$3" onTouchEnd={() => signOut()}>Sign Out</Button>
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
  //console.log('token', await SecureStore.getItemAsync('TOKEN')) --- oops security
  await SecureStore.deleteItemAsync('TOKEN')
  router.dismissAll()
  router.push('/')
}