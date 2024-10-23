import React, { useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { Audio } from 'expo-av'
import {
  YStack,
  XStack,
  Image,
  Text,
  ScrollView,
  Separator,
  Button,
  H2,
  H3,
  H4,
} from 'tamagui'

export interface Track {
  name: string
  artist: string
  img: string | null
  preview_mp3: string | null
}

export interface Playlist {
  id: string
  name: string
  img: string | null
  tracks: Track[]
}

export interface PlaylistViewerProps {
  data: {
    info: Playlist[]
    count: number
  }
}

export default function PlaylistViewer() {
  const params = useLocalSearchParams()
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null)

  const playPausePreview = async (previewUrl: string, trackId: string) => {
    if (sound) {
      if (isPlaying && currentTrackId === trackId) {
        await sound.pauseAsync()
        setIsPlaying(false)
      } else if (currentTrackId === trackId) {
        await sound.playAsync()
        setIsPlaying(true)
      } else {
        await sound.unloadAsync()
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: previewUrl })
        setSound(newSound)
        await newSound.playAsync()
        setIsPlaying(true)
        setCurrentTrackId(trackId)
      }
    } else {
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: previewUrl })
      setSound(newSound)
      await newSound.playAsync()
      setIsPlaying(true)
      setCurrentTrackId(trackId)
    }
  }

  if (!params.data) {
    return <Text>No data available</Text>
  }

  const { info, count } = JSON.parse(params.data as unknown as string).data as PlaylistViewerProps['data']

  return (
    <ScrollView>
      <YStack padding="$4" space="$4">
        <H2>Playlists ({count})</H2>
        {info.map((playlist) => (
          <YStack key={playlist.id} space="$2">
            <XStack space="$2" alignItems="center">
              {playlist.img && (
                <Image
                  source={{ uri: playlist.img }}
                  width={50}
                  height={50}
                  borderRadius="$2"
                />
              )}
              <H3>{playlist.name}</H3>
            </XStack>
            <YStack paddingLeft="$4" space="$2">
              {playlist.tracks.map((track, index) => (
                <XStack key={`${playlist.id}-${index}`} space="$2" alignItems="center">
                  <Button
                    size="$2"
                    circular
                    onPress={() => track.preview_mp3 && playPausePreview(track.preview_mp3, `${playlist.id}-${index}`)}
                    disabled={!track.preview_mp3}
                  >
                    {track.img ? (
                      <Image
                        source={{ uri: track.img }}
                        width={40}
                        height={40}
                        borderRadius="$1"
                      />
                    ) : (
                      <Text>🎵</Text>
                    )}
                  </Button>
                  <YStack>
                    <H4>{track.name}</H4>
                    <Text>{track.artist}</Text>
                  </YStack>
                </XStack>
              ))}
            </YStack>
            <Separator />
          </YStack>
        ))}
      </YStack>
    </ScrollView>
  )
} import React, { useState } from 'react'
import { useLocalSearchParams } from 'expo-router'
import { Audio } from 'expo-av'
import {
  YStack,
  XStack,
  Image,
  Text,
  ScrollView,
  Separator,
  Button,
  H2,
  H3,
  H4,
} from 'tamagui'

export interface Track {
  name: string
  artist: string
  img: string | null
  preview_mp3: string | null
}

export interface Playlist {
  id: string
  name: string
  img: string | null
  tracks: Track[]
}

export interface PlaylistViewerProps {
  data: {
    info: Playlist[]
    count: number
  }
}

export default function PlaylistViewer() {
  const params = useLocalSearchParams()
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null)

  const playPausePreview = async (previewUrl: string, trackId: string) => {
    if (sound) {
      if (isPlaying && currentTrackId === trackId) {
        await sound.pauseAsync()
        setIsPlaying(false)
      } else if (currentTrackId === trackId) {
        await sound.playAsync()
        setIsPlaying(true)
      } else {
        await sound.unloadAsync()
        const { sound: newSound } = await Audio.Sound.createAsync({ uri: previewUrl })
        setSound(newSound)
        await newSound.playAsync()
        setIsPlaying(true)
        setCurrentTrackId(trackId)
      }
    } else {
      const { sound: newSound } = await Audio.Sound.createAsync({ uri: previewUrl })
      setSound(newSound)
      await newSound.playAsync()
      setIsPlaying(true)
      setCurrentTrackId(trackId)
    }
  }

  if (!params.data) {
    return <Text>No data available</Text>
  }

  const { info, count } = JSON.parse(params.data as unknown as string).data as PlaylistViewerProps['data']

  return (
    <ScrollView>
      <YStack padding="$4" space="$4">
        <H2>Playlists ({count})</H2>
        {info.map((playlist) => (
          <YStack key={playlist.id} space="$2">
            <XStack space="$2" alignItems="center">
              {playlist.img && (
                <Image
                  source={{ uri: playlist.img }}
                  width={50}
                  height={50}
                  borderRadius="$2"
                />
              )}
              <H3>{playlist.name}</H3>
            </XStack>
            <YStack paddingLeft="$4" space="$2">
              {playlist.tracks.map((track, index) => (
                <XStack key={`${playlist.id}-${index}`} space="$2" alignItems="center">
                  <Button
                    size="$2"
                    circular
                    onPress={() => track.preview_mp3 && playPausePreview(track.preview_mp3, `${playlist.id}-${index}`)}
                    disabled={!track.preview_mp3}
                  >
                    {track.img ? (
                      <Image
                        source={{ uri: track.img }}
                        width={40}
                        height={40}
                        borderRadius="$1"
                      />
                    ) : (
                      <Text>🎵</Text>
                    )}
                  </Button>
                  <YStack>
                    <H4>{track.name}</H4>
                    <Text>{track.artist}</Text>
                  </YStack>
                </XStack>
              ))}
            </YStack>
            <Separator />
          </YStack>
        ))}
      </YStack>
    </ScrollView>
  )
}