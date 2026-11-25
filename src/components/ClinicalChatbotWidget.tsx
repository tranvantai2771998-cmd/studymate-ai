import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, User, RefreshCw, Minimize2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

export const ClinicalChatbotWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Chào bạn! Mình là Trợ lý AI Chuyên gia Y khoa & Răng Hàm Mặt. Bạn có thể hỏi mình về bệnh học, ca lâm sàng, giải phẫu, phác đồ điều trị hoặc giải thích các thuật ngữ chuyên sâu nhé!',
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

  const generateAIResponse = (userText: string): string => {
    const lower = userText.toLowerCase();

    // Tư duy chuyên gia lâm sàng & Răng Hàm Mặt
    if (lower.includes('implant') || lower.includes('all-on') || lower.includes('tarnow') || lower.includes('xương')) {
      return `📌 **Về Kế hoạch Cấy ghép Implant & Sinh học Xương:**
- **Khoảng cách an toàn sinh học (Tarnow et al.):** Giữa 2 implant kề nhau tối thiểu $\\ge 3.0\\text{ mm}$ để duy trì mào xương ổ và nhú lợi; giữa implant và răng tự nhiên tối thiểu $\\ge 1.5\\text{ mm}$.
- **Bảo tồn thần kinh IAN:** Bắt buộc khoảng an toàn $\\ge 2.0\\text{ mm}$ trên phim CBCT cắt lớp cross-sectional.
- **Khoảng nhảy (Jumping distance):** Nếu khoảng cách mặt ngoài implant tới bản xương ngoài $\\ge 2.0\\text{ mm}$, chỉ định ghép xương GBR kết hợp màng collagen.
- **Quy tắc vàng:** Không nối cứng giữa răng tự nhiên và implant trong cùng một cầu răng để tránh hiện tượng lún răng thật hoặc gãy vít phục hình.`;
    }

    if (lower.includes('nha chu') || lower.includes('viêm nướu') || lower.includes('túi nha chu') || lower.includes('ppd')) {
      return `🩺 **Đánh giá Nha Chu (Phân loại AAP/EFP 2017):**
- **Độ sâu túi thăm dò (PPD):** Bình thường $\\le 3\\text{ mm}$, túi bệnh lý khi $\\ge 4\\text{ mm}$ kèm chảy máu khi thăm khám (BOP).
- **Mất bám dính lâm sàng (CAL):** Yếu tố xác định Stage (Giai đoạn I đến IV).
- **Tiêu xương theo độ tuổi/tốc độ tiến triển:** Xác định Grade (Mức độ A, B, C).
- **Xử trí nền tảng:** Cạo vôi, xử lý bề mặt gốc răng (SRP), kiểm soát mảng bám sinh học trước khi chỉ định phẫu thuật vạt hay tái tạo mô.`;
    }

    if (lower.includes('nhổ răng') || lower.includes('răng 8') || lower.includes('răng khôn') || lower.includes('tai biến')) {
      return `🦷 **Phẫu thuật Nhổ Răng Khôn (Răng 8) & Kiểm soát Tai biến:**
- **Phân loại Pell & Gregory / Winter:** Đánh giá độ nghiêng (gần, xa, ngang, thẳng), tương quan cành cao và mặt phẳng nhai.
- **Quan sát CBCT:** Đánh giá tương quan chóp chân răng với ống thần kinh răng dưới (dấu hiệu mất viền vỏ xương, đổi hướng ống thần kinh, hẹp ống).
- **Ngừa biến chứng:** Rạch vạt đủ rộng, mở xương dưới nước giải nhiệt, chia cắt thân/chân răng đúng trục để giảm thiểu sang chấn và tránh làm thủng bản xương trong (*lingual plate perforation*).`;
    }

    if (lower.includes('tủy') || lower.includes('nội nha') || lower.includes('đau răng') || lower.includes('viêm quanh chóp')) {
      return `🔬 **Chẩn đoán Nội Nha & Bệnh học Cuống:**
- **Viêm tủy hồi phục:** Đau buốt thoáng qua khi có kích thích nhiệt độ/ngọt, hết ngay sau khi loại bỏ kích thích.
- **Viêm tủy không hồi phục:** Đau tự nhiên kéo dài, cơn đau giật lan lên thái dương, đau tăng về đêm.
- **Viêm quanh chóp cấp:** Răng có cảm giác trồi cao, gõ dọc đau chói, có thể kèm phù nề ngách hành lang.
- **Nguyên tắc điều trị:** Làm sạch, tạo hình hệ thống ống tủy cơ học kết hợp bơm rửa NaOCl hoạt hóa sóng siêu âm, trám bít 3 chiều kín khít bằng Gutta-percha và sealer sinh học.`;
    }

    return `💡 **Góc nhìn Chuyên gia Y khoa & Lâm sàng:**
Câu hỏi của bạn về: "${userText}" là một vấn đề rất đáng chú ý trong thực hành học tập và lâm sàng.

1. **Phương pháp tiếp cận 10 bước:** Khai thác bệnh sử $\\rightarrow$ Triệu chứng chủ quan $\\rightarrow$ Thăm khám thực thể $\\rightarrow$ Đọc hình ảnh cận lâm sàng $\\rightarrow$ Chẩn đoán phân biệt.
2. **Y học chứng cứ:** Luôn đối chiếu với các khuyến cáo chuyên khoa cập nhật (ITI, AAP/EFP, AHA).
3. Bạn có muốn phân tích sâu hơn về ca bệnh cụ thể, chỉ định cận lâm sàng hay phác đồ xử trí của trường hợp này không?`;
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: trimmed,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    setTimeout(() => {
      const replyText = generateAIResponse(trimmed);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsLoading(false);
    }, 600);
  };

  return (
    <>
      {/* Nút bấm nổi phía trên - góc trên bên phải (cạnh thanh công cụ Header) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-20 right-4 sm:right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 text-white rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 group border border-white/30 cursor-pointer"
          aria-label="Mở Trợ lý AI Y khoa"
        >
          <div className="relative">
            <Bot className="w-4 h-4 transition-transform group-hover:rotate-12" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full" />
          </div>
          <span className="font-bold text-xs tracking-wide">Trợ lý Y Khoa</span>
        </button>
      )}

      {/* Cửa sổ Chat Widget nổi - mở từ phía trên xuống */}
      {isOpen && (
        <div className="fixed top-16 right-4 sm:right-6 z-50 w-[94vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-6 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm leading-tight truncate flex items-center gap-1.5">
                  Dental & Medical AI
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </h3>
                <p className="text-[11px] text-blue-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Chuyên gia lâm sàng 24/7
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-white/80">
              <button
                onClick={() => setMessages([messages[0]])}
                title="Làm mới cuộc trò chuyện"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Thu nhỏ"
                className="p-1.5 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Gợi ý nhanh */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-700/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-[11px]">
            <span className="text-slate-500 shrink-0 font-medium">Gợi ý:</span>
            <button
              onClick={() => {
                setInput('Quy tắc khoảng cách sinh học Tarnow trong cấy ghép implant?');
              }}
              className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700 hover:border-blue-500 shrink-0 transition-colors"
            >
              Implant & Khoảng sinh học
            </button>
            <button
              onClick={() => {
                setInput('Phân độ viêm nha chu theo AAP/EFP 2017?');
              }}
              className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700 hover:border-blue-500 shrink-0 transition-colors"
            >
              Nha chu AAP/EFP
            </button>
          </div>

          {/* Vùng tin nhắn */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-slate-50/50 dark:bg-slate-950/30 text-xs sm:text-[13px]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 max-w-[88%] ${
                  m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white font-medium text-[11px] ${
                    m.sender === 'user' ? 'bg-blue-600' : 'bg-gradient-to-tr from-teal-500 to-indigo-600'
                  }`}
                >
                  {m.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>
                <div
                  className={`p-3 rounded-2xl leading-relaxed whitespace-pre-wrap break-words ${
                    m.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs shadow-xs'
                  }`}
                >
                  {m.text}
                  <div
                    className={`text-[9px] mt-1 text-right ${
                      m.sender === 'user' ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {m.time}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-2.5 max-w-[80%] items-center text-slate-500 italic text-xs">
                <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]" />
                  <span>Chuyên gia đang suy luận...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Ô nhập tin nhắn */}
          <div className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 shrink-0">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Hỏi về ca bệnh, phác đồ, răng hàm mặt..."
              className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 dark:focus:border-blue-500 rounded-xl outline-none text-xs sm:text-sm text-slate-800 dark:text-slate-200 transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl transition-all duration-150 active:scale-95 shrink-0"
              aria-label="Gửi tin nhắn"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
