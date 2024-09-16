import { config } from '@tamagui/config/v3'
import { createTamagui } from 'tamagui'
import * as theme from './theme'

export const tamaguiConfig = createTamagui({
  ...config,
  theme
})

export default tamaguiConfig

export type Conf = typeof tamaguiConfig

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf { }
}
