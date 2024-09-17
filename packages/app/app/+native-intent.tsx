import { verifyToken } from "@/constants/api";
import * as SecureStore from 'expo-secure-store';

export const redirectSystemPath = async ({ path, initial }) => {
  try {
    console.log('path', path);
    const url = new URL(path)
    const { hostname, searchParams } = url

    switch (hostname) {
      case 'auth':
        if (searchParams.size === 0) {
          return '/'
        }
        let x = await verifyToken(searchParams.get('code') as unknown as string)
        console.log('verified: ', x)
        SecureStore.setItemAsync('TOKEN', searchParams.get('code') as unknown as string, {
          keychainService: 'p'
        })
        return '/'

    }
    console.log('initial', initial);
  } catch (e) {

    return '/'
  }
}