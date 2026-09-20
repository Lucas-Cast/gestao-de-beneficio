import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SESSION_TOKEN_KEY = 'gestao-beneficio.jwt';
const SESSION_USER_KEY = 'gestao-beneficio.user';

export type StoredSessionUser = {
  name: string;
  email: string;
};

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

  async getUser(): Promise<StoredSessionUser | null> {
    const webStorage = getWebStorage();
    const value = webStorage
      ? webStorage.getItem(SESSION_USER_KEY)
      : await SecureStore.getItemAsync(SESSION_USER_KEY);

    if (!value) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(value);

      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'name' in parsed &&
        'email' in parsed &&
        typeof parsed.name === 'string' &&
        typeof parsed.email === 'string'
      ) {
        return { name: parsed.name, email: parsed.email };
      }
    } catch {
      return null;
    }

    return null;
  },

  async setUser(user: StoredSessionUser): Promise<void> {
    const value = JSON.stringify({ name: user.name, email: user.email });
    const webStorage = getWebStorage();

    if (webStorage) {
      webStorage.setItem(SESSION_USER_KEY, value);
      return;
    }

    await SecureStore.setItemAsync(SESSION_USER_KEY, value);
  },

  async clear(): Promise<void> {
    const webStorage = getWebStorage();

    if (webStorage) {
      webStorage.removeItem(SESSION_TOKEN_KEY);
      webStorage.removeItem(SESSION_USER_KEY);
      return;
    }

    await SecureStore.deleteItemAsync(SESSION_TOKEN_KEY);
    await SecureStore.deleteItemAsync(SESSION_USER_KEY);
  },
};
