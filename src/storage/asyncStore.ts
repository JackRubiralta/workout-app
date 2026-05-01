import AsyncStorage from '@react-native-async-storage/async-storage';

export async function readJson<T>(key: string, fallback: T | null = null): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function writeJson(key: string, value: unknown): Promise<boolean> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    /* swallow */
  }
}

export async function multiGet(keys: readonly string[]): Promise<Record<string, unknown>> {
  try {
    const pairs = await AsyncStorage.multiGet(keys as string[]);
    const out: Record<string, unknown> = {};
    for (const [k, v] of pairs) {
      out[k] = v != null ? JSON.parse(v) : null;
    }
    return out;
  } catch {
    return {};
  }
}
