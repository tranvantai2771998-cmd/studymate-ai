/**
 * Module Benchmark & Token Metrics Tracker
 * Theo doi do tre (Latency), luong token tiet kiem duoc va do chinh xac cua Router
 */

export interface AgentMetrics {
  totalRequests: number;
  cacheHits: number;
  tokensSavedEstimate: number;
  providerUsageCount: {
    cache: number;
    gemini: number;
    groq: number;
    openrouter: number;
    offline: number;
  };
  averageResponseTimeMs: number;
}

const METRICS_STORAGE_KEY = 'STUDYMATE_AGENT_METRICS';

export const getAgentMetrics = (): AgentMetrics => {
  try {
    const raw = localStorage.getItem(METRICS_STORAGE_KEY);
    if (!raw) {
      return {
        totalRequests: 0,
        cacheHits: 0,
        tokensSavedEstimate: 0,
        providerUsageCount: { cache: 0, gemini: 0, groq: 0, openrouter: 0, offline: 0 },
        averageResponseTimeMs: 0,
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      totalRequests: 0,
      cacheHits: 0,
      tokensSavedEstimate: 0,
      providerUsageCount: { cache: 0, gemini: 0, groq: 0, openrouter: 0, offline: 0 },
      averageResponseTimeMs: 0,
    };
  }
};

export const recordAgentMetric = (
  provider: 'cache' | 'gemini' | 'groq' | 'openrouter' | 'offline',
  tokensSaved: number,
  durationMs: number
) => {
  const current = getAgentMetrics();
  current.totalRequests += 1;
  if (provider === 'cache') current.cacheHits += 1;
  current.tokensSavedEstimate += tokensSaved;
  current.providerUsageCount[provider] = (current.providerUsageCount[provider] || 0) + 1;
  
  // Tinh trung binh do tre
  current.averageResponseTimeMs = Math.round(
    (current.averageResponseTimeMs * (current.totalRequests - 1) + durationMs) / current.totalRequests
  );

  try {
    localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('Khong the ghi metrics:', err);
  }
};
