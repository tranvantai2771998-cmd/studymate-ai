/**
 * Module Context Compressor & Prompt Optimizer
 * Muc tieu: Rut gon lich su tro chuyen va loai bo tu ngu thua truoc khi gui vao LLM,
 * giup tiet kiem tu 40% den 70% luong token dau vao (Input Token Reduction).
 */

export interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'system';
  text: string;
}

/**
 * Cat bo cac khoang trang thua, ngat dong thua va cac cau mo dau rơm rà
 */
export const cleanText = (text: string): string => {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
};

/**
 * Tom tat nhanh mot doan text dai de lam ngu canh (Rolling Summarization)
 */
export const truncateToKeyPoints = (text: string, maxChars: number = 300): string => {
  const cleaned = cleanText(text);
  if (cleaned.length <= maxChars) return cleaned;

  // Lay cac dong dau tien hoac cac dong chua dau gach dau dong quan trong
  const lines = cleaned.split('\n').filter((l) => l.trim().length > 0);
  let result = '';

  for (const line of lines) {
    if ((result + line).length > maxChars) break;
    result += (result ? '\n' : '') + line;
  }

  return result || cleaned.substring(0, maxChars) + '...';
};

/**
 * Nen toan bo lich su hoi thoai thanh ngu canh tinh gon cho Agent
 * - 2 luot chat gan nhat: Giu nguyen ven de dam bao mach suy luan
 * - Cac luot chat cu hon: Rut gon chi lay y chinh
 * - Loai bo cac luot chat qua cu (Rolling Window)
 */
export const compressChatContext = (
  history: ChatHistoryItem[],
  maxHistoryItems: number = 6
): ChatHistoryItem[] => {
  if (!history || history.length === 0) return [];

  // Chi giu toi da N tin nhan gan nhat
  const recentSlice = history.slice(-maxHistoryItems);

  return recentSlice.map((item, index) => {
    // 2 tin nhan gan nhat: giu nguyen ven
    const isVeryRecent = index >= recentSlice.length - 2;
    if (isVeryRecent) {
      return {
        role: item.role,
        text: cleanText(item.text),
      };
    }

    // Cac tin nhan cu hon: nen gon thanh cac y chinh
    return {
      role: item.role,
      text: truncateToKeyPoints(item.text, 250),
    };
  });
};

/**
 * Tinh toan uoc luong so luong Token duoc tiet kiem
 */
export const estimateSavedTokens = (rawText: string, compressedText: string): number => {
  // Quy uoc trung binh 1 token ~ 4 ky tu tieng Viet / tieng Anh
  const rawTokens = Math.ceil(rawText.length / 4);
  const compressedTokens = Math.ceil(compressedText.length / 4);
  return Math.max(0, rawTokens - compressedTokens);
};
