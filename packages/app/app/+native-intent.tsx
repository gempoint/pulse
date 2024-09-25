import { useStorageState } from "@/components/useStorageState";
import { verifyToken } from "@/constants/api";
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
export const redirectSystemPath = async ({ path, initial }) => {
  const [[isLoading, session], setSession] = useStorageState('session');

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
        //await SecureStore.setItemAsync('TOKEN', searchParams.get('code') as unknown as string)
        //setSession(searchParams.get('code') as unknown as string)
        router.replace('/');
        return '/'

    }
    console.log('initial', initial);
  } catch (e) {

    return '/'
  }
}