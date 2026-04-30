import AsyncStorage from '@react-native-async-storage/async-storage';

export async function readJson(key, fallback = null) {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export async function writeJson(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export async function removeKey(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}

export async function multiGet(keys) {
  try {
    const pairs = await AsyncStorage.multiGet(keys);
    const out = {};
    for (const [k, v] of pairs) {
      out[k] = v != null ? JSON.parse(v) : null;
    }
    return out;
  } catch {
    return {};
  }
}
