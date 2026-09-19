import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SESSION_TOKEN_KEY = 'gestao-beneficio.jwt';

function getWebStorage(): Storage | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return null;
  }

  return window.localStorage;
}

export const session = {
  async getToken(): Promise<string | null> {
    const webStorage = getWebStorage();

    if (webStorage) {
      return webStorage.getItem(SESSION_TOKEN_KEY);
    }

    return SecureStore.getItemAsync(SESSION_TOKEN_KEY);
  },

  async setToken(token: string): Promise<void> {
    const webStorage = getWebStorage();

    if (webStorage) {
      webStorage.setItem(SESSION_TOKEN_KEY, token);
      return;
    }

    await SecureStore.setItemAsync(SESSION_TOKEN_KEY, token);
  },

  async clear(): Promise<void> {
    const webStorage = getWebStorage();

    if (webStorage) {
      webStorage.removeItem(SESSION_TOKEN_KEY);
      return;
    }

    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
  },
};
