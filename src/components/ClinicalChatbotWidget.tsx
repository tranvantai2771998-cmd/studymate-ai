import React, { useState, useRef, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  User,
  RefreshCw,
  Minimize2,
  BookOpen,
  Send,
  Lightbulb,
  FileQuestion,
  Key,
  Cpu,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import {
  AIProvider,
  AIProviderConfig,
  getSavedAIConfig,
  saveAIConfig,
  routeAndCallAI,
} from '../utils/aiTokenRouter';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  providerBadge?: string;
}

// BỘ DỮ LIỆU ĐÀO TẠO KIẾN THỨC CHUYÊN SÂU CỦA NGƯỜI THẦY Y KHOA & RĂNG HÀM MẶT
const MEDICAL_KNOWLEDGE_BASE: { keywords: string[]; topic: string; lesson: string }[] = [
  {
    keywords: ['implant', 'tarnow', 'all-on', 'mào xương', 'khoảng sinh học'],
    topic: 'Cấy Ghép Implant Nha Khoa & Sinh Học Mào Xương',
    lesson: `📚 **Thầy hướng dẫn chuyên đề: Cấy ghép Nha khoa & Quy tắc Sinh học:**

1. **Quy tắc Khoảng cách Sinh học Tarnow (Bắt buộc thuộc khi thi):**
   - Khoảng cách giữa 2 implant kề nhau: **Tối thiểu $\\ge 3.0\\text{ mm}$**. Nếu đặt $< 3.0\\text{ mm}$, tiêu xương mào kề cận sẽ chồng lấn khiến mất nhú nướu (black triangle).
   - Khoảng cách giữa implant và răng thật: **Tối thiểu $\\ge 1.5\\text{ mm}$** để không làm tổn thương dây chằng nha chu và mạch máu nuôi mào xương răng tự nhiên.
2. **Nguyên tắc Tuyệt đối về Cơ sinh học (Golden Rule):**
   - **CẤM NỐI CỨNG** giữa răng tự nhiên và implant trên cùng một cầu răng. Răng thật có dây chằng nha chu di động sinh lý ($25-100\\mu\\text{m}$), implant chỉ di động vi thể ($3-5\\mu\\text{m}$). Nối cứng sẽ gây hiện tượng lún răng thật, gãy ốc abutment hoặc tiêu xương quanh cổ implant.
3. **Mốc Giải phẫu & Thần kinh:**
   - Ống thần kinh răng dưới (IAN): Luôn giữ khoảng lùi an toàn mút chóp **$\\ge 2.0\\text{ mm}$** trên CBCT cắt lớp cross-sectional.
   - Thần kinh cằm (Mental foramen) & Quai thần kinh phía trước (Anterior Loop): Giữ khoảng an toàn **$\\ge 4.0\\text{ mm}$**.

💡 *Câu hỏi ôn tập cho các em:* Khi cấy implant tức thì vùng răng trước, nếu khoảng nhảy (*jumping distance*) $\\ge 2\\text{ mm}$, vì sao bắt buộc phải ghép xương GBR kết hợp màng collagen?`
  },
  {
    keywords: ['nha chu', 'aap', 'efp', 'túi nha chu', 'cal', 'ppd', 'srp'],
    topic: 'Phân loại Bệnh Nha chu Chuẩn Quốc tế (AAP/EFP 2017)',
    lesson: `🩺 **Thầy hướng dẫn ôn tập: Phân loại Bệnh Nha chu (AAP/EFP 2017):**

Khi thi và làm bệnh án lâm sàng, các em chia rõ 2 trục:

1. **Phân chia Giai đoạn (Stage I - IV) — Đánh giá mức độ trầm trọng:**
   - Dựa vào mất bám dính lâm sàng (CAL) tại vị trí nặng nhất:
     - Stage I: CAL 1-2 mm | Stage II: CAL 3-4 mm | Stage III & IV: CAL $\\ge 5\\text{ mm}$.
   - Khác biệt giữa Stage III và IV: Stage IV mất chức năng ăn nhai nặng nề, khớp cắn sang chấn, xô lệch răng và còn lại $<20$ răng (hoặc $<10$ cặp răng đối).
2. **Phân chia Mức độ Tiến triển (Grade A, B, C) — Đánh giá tốc độ:**
   - Grade A (Chậm): Tỷ lệ % tiêu xương / tuổi $< 0.25$, không hút thuốc, không tiểu đường.
   - Grade B (Trung bình): Tỷ lệ tiêu xương / tuổi từ $0.25 - 1.0$, hút $<10$ điếu/ngày, HbA1c $<7.0\\%$.
   - Grade C (Nhanh): Tỷ lệ tiêu xương / tuổi $> 1.0$, hút $\\ge 10$ điếu/ngày, HbA1c $\\ge 7.0\\%$.
3. **Chỉ số PPD và BOP:**
   - PPD $\\le 3\\text{ mm}$ không chảy máu = Nha chu khỏe mạnh.
   - PPD $\\ge 4\\text{ mm}$ có BOP (+) = Viêm túi nha chu hoạt động, chỉ định lấy cao răng và xử lý mặt gốc răng (SRP).`
  },
  {
    keywords: ['răng 8', 'răng khôn', 'nhổ răng', 'spix', 'gây tê', 'tai biến'],
    topic: 'Phẫu thuật Nhổ Răng Khôn & Kỹ thuật Gây tê Vùng',
    lesson: `📖 **Thầy hướng dẫn ôn tập: Nhổ Răng Khôn (R8) & Kỹ thuật Gây tê Spix:**

1. **Phân loại Pell & Gregory & Winter (Câu hỏi thi lý thuyết thường gặp):**
   - **Tương quan cành cao (Pell & Gregory):** Class I (đủ chỗ), Class II (thiếu 1 phần), Class III (nằm hoàn toàn trong cành lên).
   - **Độ sâu so với mặt phẳng nhai:** Vị trí A (ngang mặt nhai răng 7), Vị trí B (ở giữa thân răng 7), Vị trí C (dưới đường cổ răng 7).
   - **Trục nghiêng (Winter):** Nghiêng gần (mesioangular - dễ gặp nhất), thẳng, nghiêng xa, nằm ngang, nằm ngược.
2. **Kỹ thuật Gây tê Gai Spix (Thần kinh huyệt răng dưới):**
   - **Mốc định vị:** Mặt phẳng nhai răng hàm lớn dưới đưa lên 1 cm, giao điểm giữa bờ trước cơ cắn và nếp chân bướm hàm.
   - **Quy tắc an toàn sống còn:** Đầu kim bắt buộc phải chạm bản xương trước khi bơm thuốc. Luôn kéo hút kiểm tra (Aspiration) để tránh tiêm nhầm vào động mạch/tĩnh mạch huyệt răng dưới gây ngộ độc thuốc tê toàn thân (LAST).
3. **Ngừa biến chứng:** Không dùng bẩy với lực hướng vào bản xương trong vì mỏng, dễ làm đẩy chân răng tụt vào khoang dưới hàm hoặc thủng bản xương trong (*lingual plate perforation*).`
  },
  {
    keywords: ['tủy', 'nội nha', 'viêm quanh chóp', 'naocl', 'gutta'],
    topic: 'Bệnh học Tủy - Cuống & Kỹ thuật Nội Nha',
    lesson: `🔬 **Thầy hướng dẫn ôn tập: Chẩn đoán & Điều trị Nội nha (Endodontics):**

1. **Phân biệt Viêm tủy hồi phục vs Không hồi phục:**
   - **Hồi phục:** Đau buốt khi có kích thích lạnh/ngọt, hết ngay sau vài giây khi ngừng kích thích. Thử điện (+) ở ngưỡng bình thường.
   - **Không hồi phục:** Đau tự phát kéo dài thành cơn, đau giật theo mạch đập, đau dữ dội về đêm khi nằm xuống (do tăng áp lực nội tủy), kích thích nhiệt gây đau buốt kéo dài nhiều phút sau khi lấy tác nhân ra.
2. **Viêm quanh chóp cấp:**
   - Răng có cảm giác trồi cao, bệnh nhân cắn chạm răng đối diện đau chói, gõ dọc (+) rất mạnh.
3. **Nguyên tắc tạo hình & Bơm rửa:**
   - Dung dịch bơm rửa tiêu chuẩn vàng: **NaOCl $2.5\\% - 5.25\\%$** (hòa tan mô hữu cơ, diệt khuẩn sâu trong ống ngà), kết hợp hoạt hóa sóng âm/siêu âm.
   - Dùng **EDTA $17\\%$** trong 1 phút cuối để loại bỏ lớp mùn ngà (*smear layer*) mở thông các ống ngà trước khi trám bít 3D bằng Gutta-percha.`
  },
  {
    keywords: ['kháng sinh', 'beta-lactam', 'dược lý', 'amoxicillin', 'augmentin'],
    topic: 'Dược lý Kháng sinh Nha khoa & Kiểm soát Nhiễm trùng',
    lesson: `💊 **Thầy hướng dẫn Dược lý: Sử dụng Kháng sinh Hợp lý trong Răng Hàm Mặt:**

1. **Cơ chế Kháng sinh nhóm Beta-lactam (Amoxicillin, Penicillin):**
   - Diệt khuẩn phụ thuộc thời gian ($T > MIC$).
   - Gắn kết với các enzym PBPs (Penicillin-Binding Proteins), ức chế tổng hợp cầu nối peptidoglycan làm yếu thành tế bào vi khuẩn khiến vi khuẩn tự vỡ do áp suất thẩm thấu.
2. **Kháng thuốc & Phối hợp Kháng sinh:**
   - Vi khuẩn kỵ khí tiết enzym Beta-lactamase phá hủy vòng beta-lactam $\\rightarrow$ Phối hợp Acid Clavulanic (**Augmentin**) để ức chế enzym này.
   - Với nhiễm trùng răng miệng hỗn hợp ái khí + kỵ khí nặng: Phối hợp **Amoxicillin + Metronidazole** (Phác đồ kinh điển có hiệu quả diệt vi khuẩn kỵ khí gram âm rất mạnh).
3. **Dị ứng Penicillin:**
   - Thay thế bằng: Clindamycin hoặc Spiramycin + Metronidazole (Rodogyl), Azithromycin.`
  }
];

export const ClinicalChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'quiz' | 'tips'>('chat');
  
  // Multi-Provider AI Token State
  const [aiConfig, setAiConfig] = useState<AIProviderConfig>(getSavedAIConfig);
  const [showKeyModal, setShowKeyModal] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Chào các em! Thầy là Giảng viên AI hướng dẫn Y khoa & Răng Hàm Mặt. 

Thầy ở đây để đồng hành cùng các em:
- Giải thích cơ chế bệnh học & sinh lý bệnh logic.
- Hướng dẫn phương pháp nhớ sâu, mẹo ôn thi lý thuyết và lâm sàng.
- Đố vui củng cố kiến thức trắc nghiệm Y khoa.
- Tự động tối ưu và dự phòng Token qua đa nền tảng AI (Gemini • Groq • OpenRouter).

Các em đang ôn tập đến bài học nào, cứ hỏi thầy nhé!`,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // HÀM TƯ DUY & GIẢNG DẠY SƯ PHẠM Y KHOA DÙNG ĐA AI TOKEN ROUTER
  const getTeacherResponse = async (questionText: string, history: ChatMessage[]): Promise<{ text: string; badge?: string }> => {
    const lower = questionText.toLowerCase();

    // 1. Kiểm tra nhanh trong kho tri thức y khoa offline được huấn luyện chuẩn
    for (const kb of MEDICAL_KNOWLEDGE_BASE) {
      const match = kb.keywords.some((kw) => lower.includes(kw));
      if (match) {
        return { 
          text: `${kb.lesson}\n\n> ⚠️ Nội dung mang tính giáo dục/học tập, không thay thế chẩn đoán hoặc tư vấn điều trị cá nhân.`, 
          badge: 'Bộ tri thức Offline' 
        };
      }
    }

    // 2. Thử gọi qua Client-side Multi-AI Router nếu người dùng đã cấu hình Token riêng
    const hasAnyKey = Boolean(aiConfig.geminiKey || aiConfig.groqKey || aiConfig.openRouterKey);
    if (hasAnyKey) {
      try {
        const historyForRouter = history.slice(-6).map((m) => ({
          role: m.sender === 'ai' ? ('assistant' as const) : ('user' as const),
          text: m.text,
        }));
        const result = await routeAndCallAI(questionText, historyForRouter, aiConfig);
        return { 
          text: `${result.text}\n\n> ⚠️ Nội dung mang tính giáo dục/học tập, không thay thế chẩn đoán hoặc tư vấn điều trị cá nhân.`, 
          badge: result.providerUsed 
        };
      } catch (err: any) {
        console.warn('Lỗi gọi Multi-AI Router:', err.message);
      }
    }

    // 3. Fallback: Thử gọi qua API backend server (nếu đang chạy chế độ full-stack cục bộ)
    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          history: history.slice(-8).map((m) => ({
            role: m.sender === 'ai' ? 'assistant' : 'user',
            text: m.text,
          })),
        }),
      });
      const data = await response.json();
      const reply = typeof data?.reply === 'string' ? data.reply.trim() : '';
      if (response.ok && reply) {
        const fallbackNote = data?._fallback ? `\n\n> ⚠️ ${data._fallbackMessage || 'Đang hiển thị nội dung dự phòng.'}` : '';
        return {
          text: `${reply}${fallbackNote}\n\n> ⚠️ Nội dung mang tính giáo dục/học tập, không thay thế chẩn đoán hoặc tư vấn điều trị cá nhân.`,
          badge: data?._fallback ? 'Bộ tri thức dự phòng' : 'StudyMate Server AI',
        };
      }
    } catch (e) {
      console.warn('Backend server không khả dụng trên môi trường static:', e);
    }

    // 4. Khung phân tích sư phạm tổng quát nếu chưa nhập key và chạy trên static hosting
    return {
      text: `👨‍🏫 **Thầy hướng dẫn phương pháp tư duy Y khoa:**

Câu hỏi của em về: **"${questionText}"** là một chủ đề rất hay và thường xuất hiện trong các bài thi lâm sàng.

Để nắm chắc và trả lời trọn vẹn điểm phần này, thầy khuyên em phân tích theo 4 bước logic của Bác sĩ:
1. **Bản chất giải phẫu & sinh lý bình thường:** Cấu trúc này bình thường có đặc điểm sinh học gì?
2. **Cơ chế bệnh sinh (Pathogenesis):** Tác nhân gây tổn thương phá hủy tế bào/mô ra sao?
3. **Triệu chứng & Cận lâm sàng tương ứng:** Vì sao trên lâm sàng bệnh nhân có dấu hiệu này, và trên X-quang/Xét nghiệm thấy hình ảnh gì?
4. **Hướng xử trí dựa trên y học chứng cứ:** Phác đồ điều trị được khuyến cáo trong sách giáo khoa là gì?

💡 *Mẹo tối ưu Token:* Em có thể bấm vào biểu tượng ⚙️ (hoặc 🔑) ở góc trên để cấu hình thêm API Token miễn phí từ **Google Gemini (AI Studio), Groq Cloud (Llama 3 siêu tốc) hoặc OpenRouter** giúp thầy suy luận sâu hơn nhé!

> ⚠️ Nội dung mang tính giáo dục/học tập, không thay thế chẩn đoán hoặc tư vấn điều trị cá nhân.`,
      badge: 'Cố vấn sư phạm',
    };
  };

  const handleSend = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setIsLoading(true);

    try {
      const response = await getTeacherResponse(textToSend, messages);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: response.text,
        providerBadge: response.badge,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'Thầy đang rà soát lại tài liệu giảng dạy, em chờ thầy một chút nhé!',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateConfig = (updates: Partial<AIProviderConfig>) => {
    const newConfig = { ...aiConfig, ...updates };
    setAiConfig(newConfig);
    saveAIConfig(updates);
  };

  return (
    <>
      {/* Nút bấm nổi phía trên - góc trên bên phải (cạnh thanh công cụ Header) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-20 right-4 sm:right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-blue-700 via-indigo-600 to-teal-600 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 group border border-white/30 cursor-pointer"
          aria-label="Mở Giảng viên AI Y khoa"
        >
          <div className="relative">
            <GraduationCap className="w-4 h-4 transition-transform group-hover:rotate-12" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full" />
          </div>
          <span className="font-bold text-xs tracking-wide">Thầy Giáo AI Y Khoa</span>
        </button>
      )}

      {/* Cửa sổ Chat Widget nổi - mở từ phía trên xuống */}
      {isOpen && (
        <div className="fixed top-16 right-4 sm:right-6 z-50 w-[94vw] sm:w-[460px] h-[620px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-6 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-700 via-indigo-600 to-teal-600 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm leading-tight truncate flex items-center gap-1.5">
                  Thầy Giáo AI — Cố Vấn Y Khoa
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </h3>
                <p className="text-[11px] text-blue-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Tối ưu Token đa AI (Gemini • Groq • OpenRouter)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-white/80">
              <button
                onClick={() => setShowKeyModal(!showKeyModal)}
                title="Quản lý Token & AI Providers"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <Cpu className="w-4 h-4 text-amber-300" />
              </button>
              <button
                onClick={() => setMessages([messages[0]])}
                title="Làm mới cuộc trò chuyện"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Thu nhỏ"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal / Bảng điều khiển Quản lý Token & AI Providers */}
          {showKeyModal && (
            <div className="p-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs space-y-2.5 shrink-0 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-indigo-500" />
                  Nguồn AI Token & Tự động Fallback:
                </span>
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Lựa chọn Provider ưu tiên */}
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  onClick={() => handleUpdateConfig({ provider: 'gemini' })}
                  className={`p-1.5 rounded-lg border text-center transition-all ${
                    aiConfig.provider === 'gemini'
                      ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  Google Gemini
                </button>
                <button
                  onClick={() => handleUpdateConfig({ provider: 'groq' })}
                  className={`p-1.5 rounded-lg border text-center transition-all ${
                    aiConfig.provider === 'groq'
                      ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  ⚡ Groq Cloud
                </button>
                <button
                  onClick={() => handleUpdateConfig({ provider: 'openrouter' })}
                  className={`p-1.5 rounded-lg border text-center transition-all ${
                    aiConfig.provider === 'openrouter'
                      ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                      : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  🌐 OpenRouter
                </button>
              </div>

              {/* Nhập Key từng Provider */}
              <div className="space-y-1.5 pt-1">
                {aiConfig.provider === 'gemini' && (
                  <div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                      <span>Google AI Studio Key (Miễn phí 1M RPD):</span>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-500 hover:underline flex items-center gap-0.5"
                      >
                        Lấy Key <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <input
                      type="password"
                      placeholder="Dán Gemini API Key (AIzaSy...)"
                      value={aiConfig.geminiKey || ''}
                      onChange={(e) => handleUpdateConfig({ geminiKey: e.target.value })}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 outline-none"
                    />
                  </div>
                )}

                {aiConfig.provider === 'groq' && (
                  <div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                      <span>Groq API Key (Miễn phí ~500 token/s):</span>
                      <a
                        href="https://console.groq.com/keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-500 hover:underline flex items-center gap-0.5"
                      >
                        Lấy Key <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <input
                      type="password"
                      placeholder="Dán Groq API Key (gsk_...)"
                      value={aiConfig.groqKey || ''}
                      onChange={(e) => handleUpdateConfig({ groqKey: e.target.value })}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 outline-none"
                    />
                  </div>
                )}

                {aiConfig.provider === 'openrouter' && (
                  <div>
                    <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                      <span>OpenRouter API Key (Hàng trăm model free):</span>
                      <a
                        href="https://openrouter.ai/keys"
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-500 hover:underline flex items-center gap-0.5"
                      >
                        Lấy Key <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <input
                      type="password"
                      placeholder="Dán OpenRouter Key (sk-or-v1-...)"
                      value={aiConfig.openRouterKey || ''}
                      onChange={(e) => handleUpdateConfig({ openRouterKey: e.target.value })}
                      className="w-full px-2 py-1 bg-white dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Banner định hướng học tập */}
          <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200/60 dark:border-amber-900/40 flex items-center gap-1.5 shrink-0 text-[10px] text-amber-800 dark:text-amber-200">
            <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Mục đích học tập, giải thích bài giảng & ôn thi. Không dùng khám chữa bệnh nhân.</span>
          </div>

          {/* Tab chuyển đổi tính năng */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs shrink-0 font-medium">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                activeTab === 'chat'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-850'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              💬 Hỏi Đáp Bài Giảng
            </button>
            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                activeTab === 'quiz'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-850'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              🎯 Thầy Đố Nhanh
            </button>
            <button
              onClick={() => setActiveTab('tips')}
              className={`flex-1 py-2 text-center border-b-2 transition-colors ${
                activeTab === 'tips'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-850'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              💡 Mẹo Ôn Thi
            </button>
          </div>

          {/* Nội dung theo Tab */}
          {activeTab === 'quiz' && (
            <div className="p-3 bg-blue-50/50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-xs space-y-2 shrink-0">
              <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileQuestion className="w-3.5 h-3.5 text-blue-600" />
                Chọn chủ đề để Thầy ra câu hỏi trắc nghiệm đố em:
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleSend('Thầy ơi, thầy đố em 1 câu trắc nghiệm chuyên sâu về Implant nha khoa đi ạ!')}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-500 text-[11px] text-slate-700 dark:text-slate-300"
                >
                  🎯 Đố về Implant
                </button>
                <button
                  onClick={() => handleSend('Thầy đố em 1 câu hỏi phân độ Nha chu theo AAP/EFP 2017 nhé thầy!')}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-500 text-[11px] text-slate-700 dark:text-slate-300"
                >
                  🎯 Đố về Nha chu
                </button>
                <button
                  onClick={() => handleSend('Thầy đố em 1 câu về giải phẫu gây tê Spix và răng khôn ạ!')}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-500 text-[11px] text-slate-700 dark:text-slate-300"
                >
                  🎯 Đố về Gây tê Spix
                </button>
              </div>
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="p-3 bg-amber-50/50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-xs space-y-2 shrink-0">
              <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Mẹo học nhanh Y khoa từ Thầy:
              </p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleSend('Thầy hướng dẫn mẹo nhớ quy tắc Tarnow và khoảng sinh học trong đầu?')}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-amber-500 text-[11px] text-slate-700 dark:text-slate-300"
                >
                  💡 Mẹo nhớ Tarnow 3mm/1.5mm
                </button>
                <button
                  onClick={() => handleSend('Thầy chia sẻ mẹo phân biệt nhanh Stage và Grade nha chu khi làm bài thi?')}
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-amber-500 text-[11px] text-slate-700 dark:text-slate-300"
                >
                  💡 Mẹo Stage vs Grade
                </button>
              </div>
            </div>
          )}

          {/* Vùng hội thoại */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-950/40 text-xs sm:text-[13px]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 max-w-[90%] ${
                  m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white font-medium text-[11px] ${
                    m.sender === 'user' ? 'bg-blue-600' : 'bg-gradient-to-tr from-indigo-600 to-teal-500'
                  }`}
                >
                  {m.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
                </div>
                <div
                  className={`p-3 rounded-2xl leading-relaxed whitespace-pre-wrap break-words ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs shadow-sm'
                      : 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs shadow-xs'
                  }`}
                >
                  {m.text}
                  <div
                    className={`text-[9px] mt-1 flex items-center justify-between gap-2 ${
                      m.sender === 'user' ? 'text-blue-100' : 'text-slate-400 dark:text-slate-400'
                    }`}
                  >
                    {m.providerBadge && (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-medium text-slate-600 dark:text-slate-300">
                        {m.providerBadge}
                      </span>
                    )}
                    <span className="ml-auto">{m.time}</span>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2.5 max-w-[80%] items-center text-slate-500 italic text-xs">
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <div className="px-3 py-2 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]" />
                  <span>Thầy đang kết nối AI và suy ngẫm lời giải thích...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Ô nhập câu hỏi */}
          <div className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Hỏi thầy về cơ chế, giải phẫu, mẹo ôn thi..."
              className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 dark:focus:border-blue-500 rounded-xl outline-none text-xs sm:text-sm text-slate-800 dark:text-slate-100 transition-colors"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition-all duration-150 active:scale-95 shrink-0 cursor-pointer"
              aria-label="Gửi câu hỏi"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
