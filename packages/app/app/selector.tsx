import React, { useState, useCallback } from 'react'
import { Audio } from 'expo-av'
import { ScrollView, Image, Pressable, Platform, StyleSheet } from 'react-native'
import {
  YStack,
  XStack,
  Text,
  H3,
  Separator,
  Theme,
  Button,
  AnimatePresence,
  View
} from 'tamagui'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { BlurView } from 'expo-blur'
import { Check, Music } from '@tamagui/lucide-icons'
import type { Track, PlaylistViewerProps } from "etc"
import safeAwait from 'safe-await';
import { radarFinal } from '@/etc/api'
import { useToastController } from '@tamagui/toast'

export default function PlaylistViewer() {
  const router = useRouter()
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null)
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set())
  const toastController = useToastController()
  const params = useLocalSearchParams()
  const data: PlaylistViewerProps = JSON.parse(params.data as string)
  //console.log('d', data)
  //console.log('t', data.info)
  const playlistData = data.data
  //console.log('p', playlistData)

  async function playSound(previewUrl: string, trackId: string, event: any) {
    event.stopPropagation()

    if (sound) {
      await sound.unloadAsync()
      setSound(null)

      if (playingTrackId === trackId) {
        setPlayingTrackId(null)
        return
      }
    }

    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: previewUrl },
        { shouldPlay: true }
      )
      setSound(newSound)
      setPlayingTrackId(trackId)

      newSound.setOnPlaybackStatusUpdate(status => {
        if (status && status.didJustFinish) {
          newSound.unloadAsync()
          setSound(null)
          setPlayingTrackId(null)
        }
      })
    } catch (error) {
      console.error('Error playing sound:', error)
    }
  }

  const toggleTrackSelection = useCallback((trackId: string) => {
    setSelectedTracks(prev => {
      const newSelection = new Set(prev)
      if (newSelection.has(trackId)) {
        newSelection.delete(trackId)
      } else {
        newSelection.add(trackId)
      }
      return newSelection
    })
  }, [])

  const handleSubmit = async () => {
    const selectedTrackIds = Array.from(selectedTracks)
    console.log('sel', selectedTrackIds)
    let [err, data] = await safeAwait(radarFinal(selectedTrackIds))

    if (err) {
      toastController.show('something wrong happened', {
        customData: {
          error: true
        }
      });
      return;
    }

    console.log(data);
    if (!data?.ok) {
      switch (data?.msg.type) {
        case "NO_PLAYER":
          toastController.show(`no active player detected`, {
            customData: {
              error: true
            }
          });
          break;
        case "NO_PREMIUM":
          toastController.show(`you dont have spotify premium`, {
            customData: {
              error: true
            }
          });
          break;
      }
    } else {
      toastController.show(`added ${data?.msg.good} songs with ${data?.msg.bad} errors`)
    }
    //router.push({
    //  pathname: '/next-screen',
    //  params: { selectedTracks: JSON.stringify(selectedTrackIds) }
    //})
    router.back()

  }

  return (
    <>
      {playlistData.count !== 0 && (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 100 }}
          >
            <YStack padding="$4" space="$6">
              {playlistData.info.map((playlist) => (
                <YStack key={playlist.id} space="$4">
                  <XStack space="$4" alignItems="center">
                    <Image
                      source={{
                        uri: playlist.img || 'https://via.placeholder.com/60'
                      }}
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: '#f4f4f4'
                      }}
                    />
                    <YStack>
                      <H3
                        fontWeight="700"
                        fontSize={24}
                      >
                        {playlist.name}
                      </H3>
                    </YStack>
                  </XStack>

                  <YStack space="$0">
                    {playlist.tracks.map((track, index) => {
                      const trackId = `${track.id}`
                      const isSelected = selectedTracks.has(trackId)

                      return (
                        <React.Fragment key={trackId}>
                          {index > 0 && (
                            <Separator marginVertical="$2" />
                          )}
                          <XStack
                            padding="$2"
                            space="$3"
                            alignItems="center"
                            animation="quick"
                            pressStyle={{
                              opacity: 0.7,
                              backgroundColor: '$gray3',
                            }}
                            borderRadius="$4"
                            onPress={() => toggleTrackSelection(trackId)}
                            backgroundColor={isSelected ? '$gray3' : 'transparent'}
                          >
                            <XStack flex={1} space="$3" alignItems="center">
                              <XStack position="relative">
                                <Pressable
                                  onPress={(e) => {
                                    if (track.preview_mp3) {
                                      playSound(track.preview_mp3, trackId, e)
                                    }
                                  }}
                                  disabled={!track.preview_mp3}
                                >
                                  <Image
                                    source={{
                                      uri: track.img || 'https://via.placeholder.com/56'
                                    }}
                                    style={{
                                      width: 56,
                                      height: 56,
                                      borderRadius: 8,
                                      opacity: track.preview_mp3 ? 1 : 0.5
                                    }}
                                  />
                                  {playingTrackId === trackId && (
                                    Platform.OS !== 'web' ? (
                                      <BlurView
                                        intensity={20}
                                        style={{
                                          position: 'absolute',
                                          top: 0,
                                          left: 0,
                                          right: 0,
                                          bottom: 0,
                                          borderRadius: 8,
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                        }}
                                      >
                                        <Music size={24} color="#000" />
                                      </BlurView>
                                    ) : (
                                      <YStack
                                        position="absolute"
                                        top={0}
                                        left={0}
                                        right={0}
                                        bottom={0}
                                        backgroundColor="rgba(255,255,255,0.8)"
                                        alignItems="center"
                                        justifyContent="center"
                                        borderRadius={8}
                                      >
                                        <Music size={24} color="#000" />
                                      </YStack>
                                    )
                                  )}
                                </Pressable>
                              </XStack>
                              <YStack flex={1} space="$1">
                                <Text
                                  numberOfLines={1}
                                  fontWeight="600"
                                  fontSize={16}
                                >
                                  {track.name}
                                </Text>
                                <Text
                                  numberOfLines={1}
                                  color="$gray11"
                                  fontSize={14}
                                >
                                  {track.artist}
                                </Text>
                              </YStack>
                              {isSelected && (
                                <Check size={20} color="$blue10" />
                              )}
                            </XStack>
                          </XStack>
                        </React.Fragment>
                      )
                    })}
                  </YStack>
                </YStack>
              ))}
            </YStack>
          </ScrollView>
          <AnimatePresence>
            {selectedTracks.size > 0 && (
              <YStack
                animation="quick"
                enterStyle={{
                  opacity: 0,
                  y: 20,
                }}
                exitStyle={{
                  opacity: 0,
                  y: 20,
                }}
                position="absolute"
                bottom={0}
                left={0}
                right={0}
                padding="$4"
                backgroundColor="transparent"
                borderTopLeftRadius="$4"
                borderTopRightRadius="$4"
                shadowColor="black"
                shadowOffset={{ width: 0, height: -2 }}
                shadowOpacity={0.1}
                shadowRadius={8}
                elevation={5}

              >
                <Button
                  size="$5"
                  theme="active"
                  backgroundColor="#1DB954"
                  onPress={handleSubmit}
                >
                  <Text color="white">
                    Add {selectedTracks.size} Selected {selectedTracks.size === 1 ? 'Track' : 'Tracks'}
                  </Text>
                </Button>
              </YStack>
            )}
          </AnimatePresence>
        </>
      )}
      {playlistData.count === 0 && (
        <View style={styles.container}>
          <Text color="$white05" paddingBottom="$3" fontSize="$10">🤔</Text>
          <Text color="$white05" paddingBottom="$3" fontSize="$3">there's no one near u?</Text>
        </View>
      )}

    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});