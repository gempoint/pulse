import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "tamagui";

export default (...props) => {
  const theme = useTheme()

  return (
    <SafeAreaView {...props} style={{
      backgroundColor: theme.background as unknown as string,
    }} />
  )
}

const style = StyleSheet.create({})