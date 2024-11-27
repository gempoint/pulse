import { Spinner, View } from "tamagui";

export default function LoadingScreen() {
  return (
    <View flex={1} justifyContent="center" alignItems="center">
      <Spinner size="large" color="$accentColor" />
    </View>
  )
}