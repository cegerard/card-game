import { beforeEach } from 'vitest';

if (!window.localStorage) {
  const store: Record<string, string> = {};

  window.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    length: Object.keys(store).length,
  } as Storage;
}

beforeEach(() => {
  window.localStorage.clear();
});
