/**
 * Módulo de Cache Local Inteligente
 * Reduz drasticamente o consumo de requisições de leitura (reads) do Firebase Firestore.
 */

const PREFIX = 'pastelaria_app_cache_';

export const localCache = {
  get<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(PREFIX + key);
      if (!stored) return defaultValue;
      const parsed = JSON.parse(stored);
      return parsed.data !== undefined ? parsed.data : defaultValue;
    } catch (e) {
      console.warn(`[Cache] Erro ao carregar ${key} do cache:`, e);
      return defaultValue;
    }
  },

  set<T>(key: string, data: T): void {
    try {
      const payload = {
        data,
        cachedAt: Date.now(),
      };
      localStorage.setItem(PREFIX + key, JSON.stringify(payload));
    } catch (e) {
      console.warn(`[Cache] Erro ao salvar ${key} no cache:`, e);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch (e) {
      console.warn(`[Cache] Erro ao remover ${key} do cache:`, e);
    }
  }
};
