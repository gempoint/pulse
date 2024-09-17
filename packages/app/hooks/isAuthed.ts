import * as SecureStore from 'expo-secure-store';

export default () => {
  if (SecureStore.getItem('TOKEN') !== null) {
    return true
  } else return false
}