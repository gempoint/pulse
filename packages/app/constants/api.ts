import Constants from 'expo-constants';
import * as Device from 'expo-device';
import _a from "axios"
import { apiEndpoint } from './idk';
import * as SecureStore from 'expo-secure-store';
import { PlaylistViewerProps } from 'etc';

interface APIResponse<B, T> {
  ok: B,
  msg: T
}


interface RadarError {
  type: "NO_PREMIUM" | "NO_PLAYER"
}

interface RadarFinal {
  good: number,
  bad: number
}

const a = _a.create({
  baseURL: apiEndpoint(),
  httpAgent: `${Constants.expoConfig?.name}-client ${Constants.expoConfig?.version} ${Device.osName}`
})

export const verifyToken = async (x: string) => {
  let y = await a.get<APIResponse<boolean, unknown>>('/valid', {
    headers: { 'Authorization': `Bearer ${x}` }
  })
  console.log('daty', y.data)
  if (y.data.ok === true) {
    return true
  } else return false
}

export const radar = async (lat: number, long: number) => {
  let token = await SecureStore.getItemAsync('TOKEN') as string
  let y = await a.post<APIResponse<true, PlaylistViewerProps> | APIResponse<false, RadarError>>('/radar', {
    lat, long
  }, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return y.data
}

export const radarFinal = async (songs: string[]) => {
  let token = await SecureStore.getItemAsync('TOKEN') as string
  let y = await a.post<APIResponse<true, RadarFinal>>('/radarFinal', {
    songs
  }, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return y.data
}

export const ping = async () => {
  try {
    let x = await a.get('/')
    return true
  } catch (err) {
    return false
  }
}