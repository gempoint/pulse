import * as SecureStore from 'expo-secure-store';

export default () => {
  console.log('token', SecureStore.getItem('TOKEN'))
  if ((SecureStore.getItem('TOKEN') === null) || (SecureStore.getItem('TOKEN') === undefined)) {
    return false
  } else {
    return true
  }
}