import { router } from 'expo-router';
import { StyleSheet } from 'react-native';
import { View, Button, Text } from 'tamagui';


export default function NotFound() {
  return (
    <View style={styles.container} space="$2">
      <Text color="$white05" paddingBottom="$3">¯\_(ツ)_/¯</Text>
      <Text color="$white05" paddingBottom="$3">¯nothing here</Text>
      <Button onPress={() => router.back()}>Go Back?</Button>
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
