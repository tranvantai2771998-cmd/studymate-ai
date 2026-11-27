/**
 * Module Semantic Cache & Local Storage
 * Muc tieu: Luu tru cac cau tra loi da qua tinh toan de tai su dung,
 * giup he thong tra loi ngay lap tuc ma khong tieu ton bat ky token nao (0 Token cost).
 */

export interface CacheEntry {
  key: string;
  query: string;
  response: string;
  provider: string;
  timestamp: number;
  hitCount: number;
}

const CACHE_STORAGE_KEY = 'STUDYMATE_AGENT_SEMANTIC_CACHE';
const MAX_CACHE_ITEMS = 150;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngay

/**
 * Chuan hoa cau hoi de tang ty le match cache (bo dau cau, viet thuong, bo khoang trang thua)
 */
export const normalizeQuery = (query: string): string => {
  return query
    .toLowerCase()
    .trim()
    .replace(/[?!.,;:"'(){}[\]<>]/g, '')
    .replace(/\s+/g, ' ');
};

/**
 * Doc toan bo cache tu bo nho cuc bo
 */
export const getLocalCache = (): CacheEntry[] => {
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (!raw) return [];
    const entries: CacheEntry[] = JSON.parse(raw);
    const now = Date.now();
    // Loc bo nhung cache qua han (TTL)
    return entries.filter((e) => now - e.timestamp < CACHE_TTL_MS);
  } catch (err) {
    console.warn('Loi doc cache cuc bo:', err);
    return [];
  }
};

/**
 * Luu danh sach cache vao localStorage
 */
const persistCache = (entries: CacheEntry[]): void => {
  try {
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn('Khong the luu cache:', err);
  }
};

/**
 * Tra cuu trong Cache: Tra ve cau tra loi neu khop, nguoc lai tra ve null
 */
export const lookupCache = (query: string): { response: string; provider: string } | null => {
  const normalized = normalizeQuery(query);
  if (!normalized || normalized.length < 3) return null;

  const cache = getLocalCache();
  const entry = cache.find((e) => e.key === normalized);

  if (entry) {
    // Tang hit count va cap nhat vi tri uu tien
    entry.hitCount = (entry.hitCount || 0) + 1;
    persistCache(cache);
    return {
      response: entry.response,
      provider: `Bộ nhớ đệm Agent (${entry.provider}) [0 Token]`,
    };
  }

  return null;
};

/**
 * Ghi cau tra loi moi vao Cache
 */
export const setCache = (query: string, response: string, provider: string): void => {
  const normalized = normalizeQuery(query);
  if (!normalized || normalized.length < 3 || !response) return;

  let cache = getLocalCache();

  // Neu da ton tai thi cap nhat
  const existingIndex = cache.findIndex((e) => e.key === normalized);
  if (existingIndex >= 0) {
    cache[existingIndex].response = response;
    cache[existingIndex].provider = provider;
    cache[existingIndex].timestamp = Date.now();
  } else {
    // Neu day bo nho cache thi xoa bot item it dung nhat
    if (cache.length >= MAX_CACHE_ITEMS) {
      cache.sort((a, b) => a.hitCount - b.hitCount);
      cache.shift();
    }

    cache.push({
      key: normalized,
      query,
      response,
      provider,
      timestamp: Date.now(),
      hitCount: 1,
    });
  }

  persistCache(cache);
};
