// Service quan ly da AI Provider de toi uu token va fallback tu dong
export type AIProvider = 'gemini' | 'groq' | 'openrouter';

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

// 1. Goi Google Gemini API (AI Studio - 15 RPM, 1.000.000 RPD mien phi)
export const callGeminiAPI = async (prompt: string, apiKey: string): Promise<string> => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${SYSTEM_PROMPT}\n\nCau hoi cua sinh vien: "${prompt}"` }],
        },
      ],
    }),
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

// 2. Goi Groq API (Sieu toc do ~300-500 token/giay, mien phi Llama 3.3 70B & DeepSeek R1)
export const callGroqAPI = async (prompt: string, apiKey: string): Promise<string> => {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
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

// 3. Goi OpenRouter API (Tap hop hang tram model mien phi nhu Llama 3, DeepSeek, Mistral)
export const callOpenRouterAPI = async (prompt: string, apiKey: string): Promise<string> => {
  const url = 'https://openrouter.ai/api/v1/chat/completions';
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
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
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

// 4. Token Router Thong Minh: Tu dong goi Provider da chon hoac Fallback sang cac Provider con lai
export const routeAndCallAI = async (
  prompt: string,
  config: AIProviderConfig
): Promise<{ text: string; providerUsed: string }> => {
  const errors: string[] = [];

  // Thu tu goi uu tien theo lua chon cua nguoi dung
  const providerOrder: AIProvider[] = [config.provider];
  if (config.provider !== 'gemini' && config.geminiKey) providerOrder.push('gemini');
  if (config.provider !== 'groq' && config.groqKey) providerOrder.push('groq');
  if (config.provider !== 'openrouter' && config.openRouterKey) providerOrder.push('openrouter');

  for (const prov of providerOrder) {
    try {
      if (prov === 'gemini' && config.geminiKey) {
        const text = await callGeminiAPI(prompt, config.geminiKey);
        return { text, providerUsed: 'Google Gemini (1.5 Flash)' };
      }
      if (prov === 'groq' && config.groqKey) {
        const text = await callGroqAPI(prompt, config.groqKey);
        return { text, providerUsed: 'Groq Cloud (Llama 3.3 70B)' };
      }
      if (prov === 'openrouter' && config.openRouterKey) {
        const text = await callOpenRouterAPI(prompt, config.openRouterKey);
        return { text, providerUsed: 'OpenRouter (Llama 3 Free)' };
      }
    } catch (err: any) {
      console.warn(`Provider ${prov} gap loi, tiep tuc fallback:`, err.message);
      errors.push(`${prov}: ${err.message}`);
    }
  }

  throw new Error(
    errors.length > 0
      ? `Tất cả AI Providers đều gặp sự cố: ${errors.join(' | ')}`
      : 'Chưa có API Key nào được thiết lập hợp lệ.'
  );
};
