import Constants from 'expo-constants';
import * as Device from 'expo-device';
import _a from "axios"
import { apiEndpoint } from '../constants/idk';
import * as SecureStore from 'expo-secure-store';
import { PlaylistViewerProps } from 'etc';
import qs from 'query-string';
export interface APIResponse<B, T> {
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

export interface User {
  id: string
  verified: boolean
  staff: boolean
  artist: boolean
  pfp: string
  name: string
  username: string
  color: string
  bio: string
  friends: number
}


export const a = _a.create({
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
  let y = await a.post<APIResponse<true, RadarFinal> | APIResponse<false, RadarError>>('/radarFinal', {
    songs
  }, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return y.data
}

export const userFetch = async (id?: string) => {
  let token = await SecureStore.getItemAsync('TOKEN') as string
  let url = id ? `/user/${id}` : `/user/me`
  let y = await a.get<APIResponse<true, User>>(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return y.data
}

export const userUpdate = async (x: Partial<User>) => {
  let token = await SecureStore.getItemAsync('TOKEN') as string
  let y = await a.post<APIResponse<true, User>>('/user/me', x, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return y.data

}

export const checkUsernameValid = async (name: string) => {
  let y = await a.get<APIResponse<true, unknown>>(`/user/valid/${name}`)
  return y.data.ok

}

export const fetchFriends = async () => {
  let token = await SecureStore.getItemAsync('TOKEN') as string
  let y = await a.get<APIResponse<true, User[]>>('/user/friends', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return y.data
}


export const fetchNotifs = async () => {
  let token = await SecureStore.getItemAsync('TOKEN') as string
  let y = await a.get<APIResponse<true, User[]>>('/user/notifications', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return y.data
}

export const acceptFriReq = async (id: string) => {
  let token = await SecureStore.getItemAsync('TOKEN') as string
  let y = await a.get<APIResponse<true, undefined> | APIResponse<false, {
    type: string
  }>>(`/user/notifications/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return y.data
}

export const declineFriReq = async (id: string) => {
  let token = await SecureStore.getItemAsync('TOKEN') as string
  let y = await a.delete<APIResponse<true, undefined> | APIResponse<false, {
    type: string
  }>>(`/user/notifications/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return y.data
}

export const sendFriReq = async (id: string) => {
  let token = await SecureStore.getItemAsync('TOKEN') as string
  let y = await a.post<APIResponse<true, undefined> | APIResponse<false, {
    type: string
  }>>(`/user/add/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return y.data
}


export const ping = async () => {
  try {
    await a.get('/')
    return true
  } catch (err) {
    return false
  }
}