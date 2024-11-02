import { styled, Button, GetProps, Text, View } from 'tamagui'
import { Instagram } from '@tamagui/lucide-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Image } from 'react-native'

// Create a styled LinearGradient component
const GradientView = styled(LinearGradient, {
  width: '100%',
  height: '100%',
  position: 'absolute',
  borderRadius: '$4',
})

// Create styled text component
const ButtonText = styled(Text, {
  color: 'white',
  textAlign: 'center',
  flex: 1,

  variants: {
    size: {
      large: {
        fontSize: 18,
        lineHeight: 24,
      },
      medium: {
        fontSize: 16,
        lineHeight: 20,
      },
      small: {
        fontSize: 14,
        lineHeight: 18,
      },
    },
    stretch: {
      true: {
        flex: 1,
      },
      false: {
        flex: 0,
      },
    },
  } as const,

  defaultVariants: {
    size: 'medium',
    stretch: false,
  },
})

// Create the styled button container
const InstagramButton = styled(Button, {
  overflow: 'hidden',
  position: 'relative',
  backgroundColor: 'transparent',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',

  variants: {
    size: {
      large: {
        height: 48,
        paddingHorizontal: 24,
        gap: 12,
      },
      medium: {
        height: 40,
        paddingHorizontal: 20,
        gap: 8,
      },
      small: {
        height: 32,
        paddingHorizontal: 16,
        gap: 6,
      },
    },
    stretch: {
      true: {
        flex: 1,
      },
      false: {
        flex: 0,
      },
    },
  } as const,

  defaultVariants: {
    size: 'medium',
    stretch: false,
  },
})

// Create a container for the content
const ContentContainer = styled(View, {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: '$2',
  zIndex: 1,

  variants: {
    stretch: {
      true: {
        flex: 1,
      },
      false: {
        flex: 0,
      },
    },
  },
})

// Define the props interface
interface InstagramGradientButtonProps extends GetProps<typeof Button> {
  children: React.ReactNode
  gradientColors?: string[]
  logoSize?: number
  stretch?: boolean
  textProps?: Partial<GetProps<typeof ButtonText>>
  adjustsFontSizeToFit?: boolean
  numberOfLines?: number
}

// Create the component
export default function InstagramGradientButton({
  children,
  gradientColors = ['#833AB4', '#FD1D1D', '#F77737'],
  logoSize = 20,
  stretch = false,
  size = 'medium',
  textProps,
  adjustsFontSizeToFit = true,
  numberOfLines = 1,
  ...props
}: InstagramGradientButtonProps) {
  return (
    <InstagramButton
      size={size}
      stretch={stretch}
      {...props}
    >
      <LinearGradient
        width='100%'
        height='100%'
        position='absolute'
        //borderRadius='$4'
        colors={gradientColors}
        start={[0, 0]}
        end={[1, 1]}
      />
      <ContentContainer stretch={stretch}>
        <Instagram />
        <ButtonText
          size={size}
          stretch={stretch}
          adjustsFontSizeToFit={adjustsFontSizeToFit}
          numberOfLines={numberOfLines}
          {...textProps}
        >
          {children}
        </ButtonText>
      </ContentContainer>
    </InstagramButton>
  )
}
