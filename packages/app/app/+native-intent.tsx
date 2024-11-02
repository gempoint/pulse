import { verifyToken } from "@/etc/api";
import * as SecureStore from 'expo-secure-store';

export const redirectSystemPath = async ({ path, initial }) => {
  try {
    console.log('path', path);
    const url = new URL(path)
    const { hostname, searchParams } = url

    if (searchParams.size === 0) {
      return '/'
    }
    switch (hostname) {
      case 'auth':
        let x = await verifyToken(searchParams.get('code') as unknown as string)
        await SecureStore.setItemAsync('TOKEN', searchParams.get('code') as unknown as string)
        return '/'
      case 'onboard':
        return `/onboard?code=${searchParams.get('code')}`
    }
    console.log('initial', initial);
  } catch (e) {

    return '/'
  }
}