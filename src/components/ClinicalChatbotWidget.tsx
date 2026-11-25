import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, GraduationCap, Sparkles, User, RefreshCw, Minimize2, BookOpen } from 'lucide-react';

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
      text: 'Chào các em! Thầy là Giảng viên AI hướng dẫn Y khoa & Răng Hàm Mặt. Thầy ở đây để đồng hành, giải thích cơ chế bệnh học, hệ thống hóa bài giảng, hướng dẫn phương pháp học và cùng các em ôn tập thi cử. Thầy không dùng để khám hay tư vấn điều trị thực tế trên người bệnh. Các em đang gặp khó khăn hay thắc mắc ở bài học nào, cứ hỏi thầy nhé!',
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

    // Hướng dẫn Implant & Giải phẫu xương hàm
    if (lower.includes('implant') || lower.includes('tarnow') || lower.includes('xương') || lower.includes('all-on')) {
      return `📚 **Thầy hướng dẫn ôn tập chuyên đề Cấy ghép Nha khoa (Implantology):**

Các em cần nắm vững 3 quy tắc cơ học và sinh học cơ bản sau để làm bài thi và hiểu bản chất:

1. **Quy tắc khoảng cách sinh học Tarnow (Bắt buộc thuộc):**
   - Khoảng cách giữa 2 implant kề nhau: Tối thiểu $\\ge 3.0\\text{ mm}$ (để nuôi dưỡng nhú nướu và giữ mào xương ổ giữa 2 trụ).
   - Khoảng cách giữa implant và chân răng thật tự nhiên: Tối thiểu $\\ge 1.5\\text{ mm}$.
2. **Cơ sở sinh học vùng mào xương:**
   - Khi cấy implant, khoảng nhảy (*Jumping distance*) nếu $\\ge 2\\text{ mm}$ thì phải ghép xương có hướng dẫn (GBR).
   - Tuyệt đối ghi nhớ nguyên lý: Không làm cầu răng nối cứng giữa răng tự nhiên (có dây chằng nha chu di động $25-100\\mu\\text{m}$) với implant (tích hợp xương cứng chắc, di động $<5\\mu\\text{m}$).
3. **Mốc giải phẫu an toàn:**
   - Ống thần kinh răng dưới (IAN): Luôn giữ khoảng cách an toàn mút chóp $\\ge 2.0\\text{ mm}$ trên phim CBCT.

👉 *Câu hỏi tư duy cho các em:* Vì sao khi đặt implant quá sát nhau ($<3\\text{ mm}$) thì nhú nướu lại bị teo biến mất? Các em thử suy nghĩ xem nào!`;
    }

    // Hướng dẫn Nha chu học
    if (lower.includes('nha chu') || lower.includes('viêm nướu') || lower.includes('túi nha chu') || lower.includes('aap')) {
      return `🩺 **Thầy hướng dẫn ôn tập Phân loại Bệnh Nha chu (Đồng thuận AAP/EFP 2017):**

Khi thi lâm sàng và lý thuyết, các em phải phân biệt rạch ròi giữa **Giai đoạn (Stage)** và **Mức độ tiến triển (Grade)**:

1. **Xác định Stage (I, II, III, IV) - Đánh giá độ trầm trọng:**
   - Dựa vào: Mất bám dính lâm sàng (CAL) tại vị trí nặng nhất, mức độ tiêu xương trên X-quang, và số lượng răng đã mất do nha chu.
2. **Xác định Grade (A, B, C) - Đánh giá tốc độ tiến triển:**
   - Dựa vào: Tỷ lệ % tiêu xương / tuổi của bệnh nhân, kết hợp yếu tố nguy cơ (Hút thuốc lá, Đái tháo đường HbA1c).
3. **Chỉ số lâm sàng cốt lõi:**
   - PPD (Độ sâu túi) $\\le 3\\text{ mm}$ là bình thường; $\\ge 4\\text{ mm}$ kèm BOP (+) là túi nha chu viêm hoạt động.

👉 *Mẹo ôn bài:* Nhớ nguyên tắc điều trị bước 1 luôn là kiểm soát mảng bám vi khuẩn và cạo vôi, xử lý mặt gốc răng (SRP) trước khi nghĩ đến phẫu thuật vạt!`;
    }

    // Hướng dẫn Nhổ răng & Phẫu thuật miệng
    if (lower.includes('nhổ răng') || lower.includes('răng 8') || lower.includes('răng khôn') || lower.includes('spix')) {
      return `📖 **Thầy hướng dẫn giải phẫu & kỹ năng Nhổ Răng Khôn (Răng 8):**

Các em học phần Phẫu thuật miệng cần ghi nhớ cấu trúc bài giảng sau:

1. **Phân loại Pell & Gregory & Winter:**
   - Đánh giá không gian giữa bờ trước cành lên và mặt xa răng 7 (Lớp I, II, III).
   - Đánh giá độ sâu của răng 8 so với mặt phẳng nhai răng 7 (Vị trí A, B, C).
   - Đánh giá trục nghiêng: Thẳng, gần, xa, ngang, nghịch.
2. **Kỹ thuật gây tê Gai Spix (Thần kinh huyệt răng dưới):**
   - Mốc: Mặt phẳng nhai răng cối lớn dưới đưa lên 1cm, giữa nếp chân bướm hàm và bờ trước cơ cắn.
   - Thao tác: Kim chạm xương mới bơm thuốc tê, luôn hút thử để tránh bơm vào mạch máu gây ngộ độc thuốc tê (LAST).
3. **Mục tiêu học tập:** Giảm thiểu sang chấn, bảo tồn vách xương ổ và tôn trọng mô mềm xung quanh.`;
    }

    // Mặc định câu trả lời mang phong cách Thầy giáo y khoa
    return `👨‍🏫 **Thầy hướng dẫn học tập:**

Câu hỏi của em về chủ đề: **"${userText}"** là một phần kiến thức rất quan trọng trong chương trình học.

Để học tốt và nhớ lâu nội dung này, thầy khuyên các em nên đi theo trình tự logic y khoa:
1. **Ôn lại giải phẫu & sinh lý học:** Nắm vững cấu trúc bình thường trước khi học bệnh học.
2. **Hiểu rõ cơ chế sinh bệnh (Pathogenesis):** Hiểu vì sao có triệu chứng đó thay vì học vẹt.
3. **Liên hệ cận lâm sàng & xét nghiệm:** Hình ảnh học (X-quang, CBCT) và xét nghiệm phản ánh điều gì?
4. **Hệ thống hóa vào Flashcard:** Tự ghi lại 3-5 ý cốt lõi để ôn tập Spaced Repetition trên StudyMate.

Các em muốn thầy giảng giải kỹ hơn về cơ chế, định nghĩa hay hướng dẫn cách giải quyết tình huống bài tập nào trong phần này?`;
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
    }, 500);
  };

  return (
    <>
      {/* Nút bấm nổi phía trên - góc trên bên phải (cạnh thanh Header) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-20 right-4 sm:right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 text-white rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 group border border-white/30 cursor-pointer"
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
        <div className="fixed top-16 right-4 sm:right-6 z-50 w-[94vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-6 duration-200">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-blue-700 via-indigo-600 to-teal-600 text-white flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-sm leading-tight truncate flex items-center gap-1.5">
                  Giảng Viên AI — Cố Vấn Học Tập
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </h3>
                <p className="text-[11px] text-blue-100 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Đồng hành học tập & ôn thi y khoa
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

          {/* Lời nhắc định hướng học tập */}
          <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200/60 dark:border-amber-900/40 flex items-center gap-1.5 shrink-0 text-[10px] text-amber-800 dark:text-amber-200">
            <BookOpen className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Mục đích học tập, giải thích bài giảng & ôn thi. Không dùng chẩn đoán/kê đơn bệnh nhân.</span>
          </div>

          {/* Gợi ý chủ đề ôn thi */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-700/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 text-[11px]">
            <span className="text-slate-500 shrink-0 font-medium">Ôn tập:</span>
            <button
              onClick={() => {
                setInput('Thầy giải thích giúp em quy tắc Tarnow và khoảng cách an toàn trong Implant?');
              }}
              className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700 hover:border-blue-500 shrink-0 transition-colors"
            >
              Implant & Tarnow
            </button>
            <button
              onClick={() => {
                setInput('Thầy hướng dẫn cách nhớ nhanh phân độ Nha chu theo AAP/EFP 2017?');
              }}
              className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700 hover:border-blue-500 shrink-0 transition-colors"
            >
              Nha chu AAP/EFP
            </button>
            <button
              onClick={() => {
                setInput('Mốc giải phẫu và biến chứng khi gây tê Spix là gì thưa thầy?');
              }}
              className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700 hover:border-blue-500 shrink-0 transition-colors"
            >
              Gây tê Spix
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
                    m.sender === 'user' ? 'bg-blue-600' : 'bg-gradient-to-tr from-indigo-600 to-teal-500'
                  }`}
                >
                  {m.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <GraduationCap className="w-3.5 h-3.5" />}
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
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <div className="px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]" />
                  <span>Thầy đang soạn lời giảng giải...</span>
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
              placeholder="Hỏi thầy về cơ chế, bài giảng, mẹo ôn thi..."
              className="flex-1 px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 dark:focus:border-blue-500 rounded-xl outline-none text-xs sm:text-sm text-slate-800 dark:text-slate-200 transition-colors"
            />
            <button
              onClick={handleSend}
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
