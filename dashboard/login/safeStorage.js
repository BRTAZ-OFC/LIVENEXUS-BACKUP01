const isNode = typeof window === 'undefined';

let isStorageSupported = false;
try {
  if (!isNode && window.localStorage) {
    const testKey = '__livenexus_storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    isStorageSupported = true;
  }
} catch (e) {
  isStorageSupported = false;
}

const memoryStorage = {};

export const safeStorage = {
  getItem(key) {
    if (isStorageSupported) {
      try {
        return window.localStorage.getItem(key);
      } catch (e) {}
    }
    return memoryStorage.hasOwnProperty(key) ? memoryStorage[key] : null;
  },
  setItem(key, value) {
    if (isStorageSupported) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch (e) {}
    }
    memoryStorage[key] = String(value);
  },
  removeItem(key) {
    if (isStorageSupported) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch (e) {}
    }
    delete memoryStorage[key];
  },
  clear() {
    if (isStorageSupported) {
      try {
        window.localStorage.clear();
        return;
      } catch (e) {}
    }
    for (const key in memoryStorage) {
      delete memoryStorage[key];
    }
  }
};
