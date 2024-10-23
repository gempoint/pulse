export interface Track {
  id: string;
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
