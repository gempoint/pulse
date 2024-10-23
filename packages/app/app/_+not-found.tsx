import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'tamagui';


export default function NotFound() {
  return (
    <View style={styles.container}>
      <Text color="$white05" paddingBottom="$3">¯\_(ツ)_/¯</Text>
      <Text color="$white05" paddingBottom="$3">¯nothing here</Text>
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
