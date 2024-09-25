import { Toast, useToastState } from "@tamagui/toast"
import { Dimensions } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { YStack } from "tamagui"
export enum ErrorType {
  NetworkError = 'NetworkError',
  ValidationError = 'ValidationError',
  ServerError = 'ServerError',
}

// Define the shape of our custom toast data
export interface CustomToastData {
  type: 'success' | 'error' | 'info'
  message: string
  error?: ErrorType
}

const size = Dimensions.get('window')

export default () => {
  const currentToast = useToastState()
  const { left, top, right } = useSafeAreaInsets()


  if (!currentToast || currentToast.isHandledNatively) return null
  return (
    <Toast
      key={currentToast.id}
      duration={currentToast.duration}
      enterStyle={{ opacity: 0, scale: 0.5, y: size.height - top - 20 }}
      exitStyle={{ opacity: 0, scale: 1, y: size.height - top - 25 }}
      y={size.height - top - 90}
      opacity={1}
      scale={1}
      animation="100ms"
      viewportName={currentToast.viewportName}
      backgroundColor={
        (currentToast.customData as CustomToastData)?.error ? '$red10Dark' : '$color13'
      }
    >
      <YStack

      >
        <Toast.Title color={(currentToast.customData as CustomToastData)?.error ? 'white' : '$color'}>{currentToast.title}</Toast.Title>
        {!!currentToast.message && (
          <Toast.Description color={(currentToast.customData as CustomToastData)?.error ? 'white' : '$color'}>{currentToast.message}</Toast.Description>
        )}
      </YStack>
    </Toast>
  )
}
