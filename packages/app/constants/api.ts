import Constants from 'expo-constants';
import * as Device from 'expo-device';
import _a from "axios"
import { apiEndpoint } from './idk';

interface APIResponse<T> {
  ok: boolean,
  msg: T
}

const a = _a.create({
  baseURL: apiEndpoint(),
  httpAgent: `${Constants.expoConfig?.name}-client ${Constants.expoConfig?.version} ${Device.osName}`
})

export const verifyToken = async (x: string) => {
  let y = await a.get<APIResponse<unknown>>('/valid', {
    headers: { 'Authorization': `Bearer ${x}` }
  })
  console.log('daty', y.data)
  if (y.data.ok === true) {
    return true
  } else return false
}

export const ping = async () => {
  try {
    let x = await a.get('/')
    return true
  } catch (err) {
    return false
  }
}