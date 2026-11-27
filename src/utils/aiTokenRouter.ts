// He thong Dinh tuyen Thong minh Da LLM (Dynamic Multi-LLM Token Router)
// Tich hop: Phan tang do kho, Semantic Cache (0 Token), Context Compressor va Tu dong Fallback

import { lookupCache, setCache } from './agentCache';
import { compressChatContext, cleanText, ChatHistoryItem } from './contextCompressor';

export type AIProvider = 'gemini' | 'groq' | 'openrouter';

export type TaskComplexity = 'simple' | 'medium' | 'complex';

export interface AIProviderConfig {
  provider: AIProvider;
  geminiKey?: string;
  groqKey?: string;
  openRouterKey?: string;
}

const STORAGE_KEYS = {
  PROVIDER: 'STUDYMATE_AI_PROVIDER',
  GEMINI_KEY: 'STUDYMATE_GEMINI_KEY',
  GROQ_KEY: 'STUDYMATE_GROQ_KEY',
  OPENROUTER_KEY: 'STUDYMATE_OPENROUTER_KEY',
};

export const getSavedAIConfig = (): AIProviderConfig => {
  return {
    provider: (localStorage.getItem(STORAGE_KEYS.PROVIDER) as AIProvider) || 'gemini',
    geminiKey: localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || '',
    groqKey: localStorage.getItem(STORAGE_KEYS.GROQ_KEY) || '',
    openRouterKey: localStorage.getItem(STORAGE_KEYS.OPENROUTER_KEY) || '',
  };
};

export const saveAIConfig = (config: Partial<AIProviderConfig>) => {
  if (config.provider) localStorage.setItem(STORAGE_KEYS.PROVIDER, config.provider);
  if (config.geminiKey !== undefined) localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, config.geminiKey);
  if (config.groqKey !== undefined) localStorage.setItem(STORAGE_KEYS.GROQ_KEY, config.groqKey);
  if (config.openRouterKey !== undefined) localStorage.setItem(STORAGE_KEYS.OPENROUTER_KEY, config.openRouterKey);
};

const SYSTEM_PROMPT = `Ban la mot NGUOI THAY GIANG VIEN Y KHOA & BAC SI RANG HAM MAT giau kinh nghiem, tan tuy, am ap va su pham.
MUC TIEU: Giang giai, huong dan sinh vien Y khoa hoc tap, on thi, hieu co che benh sinh, giai phau, duoc ly, nha khoa (Implant, Nha chu, Nho rang, Noi nha, Khang sinh).
QUY TAC BAT BUOC:
- Xung ho: "Thay" - "Cac em" hoac "Em".
- KHONG dung de tu van kham benh thuc te cho nguoi benh. Luon tap trung vao giai thich kien thuc, meo ghi nho cho sinh vien on thi.
- Dung Markdown ro rang, gach dau dong, giai thich ban chat co che khoa hoc.
- Cuoi cau luon dat 1 cau hoi goi mo tu duy de sinh vien tu suy ngam.`;

/**
 * 1. Danh gia do phuc tap cua cau hoi de chon Model thich hop nhat (Task Complexity Triage)
 * - Simple (Dinh nghia, tra cuu ngan): Uu tien Groq Llama 3 (sieu toc, it ton)
 * - Medium (Giai thich co che, meo on thi): Gemini 1.5 Flash hoac Groq
 * - Complex (Phan tich ca lam sang, phan bien sau): Gemini 1.5/2.0 Flash hoac OpenRouter DeepSeek
 */
export const evaluateComplexity = (prompt: string): TaskComplexity => {
  const p = prompt.toLowerCase();
  const wordCount = prompt.trim().split(/\s+/).length;

  if (wordCount < 10 && (p.includes('la gi') || p.includes('dinh nghia') || p.includes('chi so'))) {
    return 'simple';
  }

  if (
    p.includes('ca benh') ||
    p.includes('chan doan') ||
    p.includes('cbct') ||
    p.includes('bien chung') ||
    p.includes('phan bien') ||
    wordCount > 50
  ) {
    return 'complex';
  }

  return 'medium';
};

// 2. Goi Google Gemini API
export const callGeminiAPI = async (prompt: string, history: ChatHistoryItem[], apiKey: string): Promise<string> => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  // Chuyen doi lich su da nen sang format cua Gemini
  const contents: any[] = [];
  for (const h of history) {
    contents.push({
      role: h.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: h.text }],
    });
  }
  contents.push({
    role: 'user',
    parts: [{ text: `${SYSTEM_PROMPT}\n\nCau hoi cua sinh vien: "${cleanText(prompt)}"` }],
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Lỗi Gemini API: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Không nhận được văn bản từ Gemini.');
  return text;
};

// 3. Goi Groq API (Sieu toc do ~300-500 token/giay)
export const callGroqAPI = async (prompt: string, history: ChatHistoryItem[], apiKey: string): Promise<string> => {
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const messages: any[] = [{ role: 'system', content: SYSTEM_PROMPT }];
  for (const h of history) {
    messages.push({
      role: h.role === 'assistant' ? 'assistant' : 'user',
      content: h.text,
    });
  }
  messages.push({ role: 'user', content: cleanText(prompt) });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.6,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Lỗi Groq API: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Không nhận được văn bản từ Groq.');
  return text;
};

// 4. Goi OpenRouter API
export const callOpenRouterAPI = async (prompt: string, history: ChatHistoryItem[], apiKey: string): Promise<string> => {
  const url = 'https://openrouter.ai/api/v1/chat/completions';

  const messages: any[] = [{ role: 'system', content: SYSTEM_PROMPT }];
  for (const h of history) {
    messages.push({
      role: h.role === 'assistant' ? 'assistant' : 'user',
      content: h.text,
    });
  }
  messages.push({ role: 'user', content: cleanText(prompt) });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://tranvantai2771998-cmd.github.io/studymate-ai/',
      'X-Title': 'StudyMate AI Medical Teacher',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages,
      temperature: 0.6,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Lỗi OpenRouter API: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('Không nhận được văn bản từ OpenRouter.');
  return text;
};

// 5. Dynamic Token Router Tong Hop voi Cache & Nen Ngu Canh
export const routeAndCallAI = async (
  prompt: string,
  rawHistory: ChatHistoryItem[],
  config: AIProviderConfig
): Promise<{ text: string; providerUsed: string; fromCache?: boolean }> => {
  // BƯỚC 1: Kiem tra Semantic Cache cuc bo (Tiet kiem 100% Token)
  const cached = lookupCache(prompt);
  if (cached) {
    return {
      text: cached.response,
      providerUsed: cached.provider,
      fromCache: true,
    };
  }

  // BƯỚC 2: Nen ngu canh lich su (Tiet kiem 50% Token dau vao)
  const compressedHistory = compressChatContext(rawHistory, 6);

  // BƯỚC 3: Danh gia do phuc tap va lap trinh tu thu tu Provider uu tien
  const complexity = evaluateComplexity(prompt);
  const errors: string[] = [];

  const providerOrder: AIProvider[] = [config.provider];
  if (config.provider !== 'gemini' && config.geminiKey) providerOrder.push('gemini');
  if (config.provider !== 'groq' && config.groqKey) providerOrder.push('groq');
  if (config.provider !== 'openrouter' && config.openRouterKey) providerOrder.push('openrouter');

  // BƯỚC 4: Vong lap Fallback giua cac nha cung cap
  for (const prov of providerOrder) {
    try {
      if (prov === 'gemini' && config.geminiKey) {
        const text = await callGeminiAPI(prompt, compressedHistory, config.geminiKey);
        const providerName = `Google Gemini 1.5 Flash [${complexity}]`;
        setCache(prompt, text, providerName);
        return { text, providerUsed: providerName };
      }
      if (prov === 'groq' && config.groqKey) {
        const text = await callGroqAPI(prompt, compressedHistory, config.groqKey);
        const providerName = `Groq Cloud Llama 3.3 [${complexity}]`;
        setCache(prompt, text, providerName);
        return { text, providerUsed: providerName };
      }
      if (prov === 'openrouter' && config.openRouterKey) {
        const text = await callOpenRouterAPI(prompt, compressedHistory, config.openRouterKey);
        const providerName = `OpenRouter Free [${complexity}]`;
        setCache(prompt, text, providerName);
        return { text, providerUsed: providerName };
      }
    } catch (err: any) {
      console.warn(`Provider ${prov} gap loi, tiep tuc fallback:`, err.message);
      errors.push(`${prov}: ${err.message}`);
    }
  }

  throw new Error(
    errors.length > 0
      ? `Tat ca AI Providers deu gap su co: ${errors.join(' | ')}`
      : 'Chua co API Key nao duoc thiet lap hop le.'
  );
};
