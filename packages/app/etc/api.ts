import Constants from 'expo-constants';
import * as Device from 'expo-device';
import _a from "axios"
import { apiEndpoint } from '../constants/idk';
import * as SecureStore from 'expo-secure-store';
import { PlaylistViewerProps } from 'etc';
import qs from 'query-string';
import { useToastController } from '@tamagui/toast';
import axios from 'axios';
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

export type State = {
  id: string;
  name: string;
  artist: string;
  img: string;
  color?: string;
  uri: string;
  url: string;
};

export interface User {
  id: string
  pfp: string
  name: string
  username: string
  verified: boolean
  staff: boolean
  artist: boolean
  color: string
  bio: string
  friends?: number
  state?: State
}

export interface Artist {
  name: string
  image: string
  uri: string
  url: string
}

axios.interceptors.response.use((res) => {
  const toastController = useToastController();
  if (res.data.msg.err) {
    toastController.show(res.data.msg.err, {
      customData: {
        error: true
      }
    });
  }
  return res;
})

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
  let url = id ? `/user/get/${id}` : `/user/me`
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
  console.log('t', token)
  let y = await a.post<APIResponse<true, undefined> | APIResponse<false, {
    type: string
  }>>(`/user/add/${id}`, {}, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  console.log(y.data)
  return y.data
}

export const fetchUserPN = async () => {
  console.log(1)
  let token = await SecureStore.getItemAsync('TOKEN') as string
  let y = await a.get<APIResponse<true, {
    png: string
  }>>('/user/png', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return y.data
}

export const searchUsers = async (x: string) => {
  let token = await SecureStore.getItemAsync('TOKEN') as string
  let y = await a.get<APIResponse<true, User[]>>(`/user/search/${x}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return y.data
}

export const fetchUserFriends = async (x: string) => {
  let token = await SecureStore.getItemAsync('TOKEN') as string
  let y = await a.get<APIResponse<true, User[]>>(`/user/get/${x}/friends`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  return y.data
}

export const fetchUserStats = async (x: string) => {
  let token = await SecureStore.getItemAsync('TOKEN') as string
  let y = await a.get<APIResponse<true, Artist[] | []> | APIResponse<false, { type: string }>>(`/user/get/${x}/stats`, {
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