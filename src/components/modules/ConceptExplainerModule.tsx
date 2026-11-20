import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  Stethoscope,
  HelpCircle,
  Lightbulb,
  AlertTriangle,
  Copy,
  Check,
  Download,
  Printer,
  Zap,
  Bookmark,
  Layers,
  Send,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { ConceptNote, ExplanationMode, UserPreferences } from '../../types';
import { formatConceptToMarkdown, downloadFile, triggerPrint } from '../../utils/exporter';

interface ConceptExplainerModuleProps {
  currentConcept: ConceptNote | null;
  preferences: UserPreferences;
  onSaveConcept: (concept: ConceptNote) => void;
  onSendToQuiz: (content: string, subject: string) => void;
  onCreateFlashcard: (front: string, back: string, subject: string) => void;
}

const PRESET_TOPICS = [
  { topic: 'Cơ chế Gây tê Vùng Gai Spix', subject: 'Răng Hàm Mặt & Nha chu' },
  { topic: 'Phân loại Sốc & Cơ chế Sốc Phản vệ', subject: 'Sinh lý bệnh & Miễn dịch' },
  { topic: 'Cơ chế ức chế men Transpeptidase của Beta-lactam', subject: 'Dược lý học lâm sàng' },
  { topic: 'Động học Điện tâm đồ trong STEMI', subject: 'Nội khoa Tim mạch' },
  { topic: 'Quy luật Phân ly Độc lập Men-đen & Đột biến Gen', subject: 'Giải phẫu học' },
];

export const ConceptExplainerModule: React.FC<ConceptExplainerModuleProps> = ({
  currentConcept,
  preferences,
  onSaveConcept,
  onSendToQuiz,
  onCreateFlashcard,
}) => {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState(preferences.currentSubjects[0] || 'Nội khoa Tim mạch');
  const [level, setLevel] = useState('Sinh viên Y - Đại học');
  const [mode, setMode] = useState<ExplanationMode>('clinical');
  const [isLoading, setIsLoading] = useState(false);
  const [conceptData, setConceptData] = useState<ConceptNote | null>(currentConcept);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Follow-up question state
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpHistory, setFollowUpHistory] = useState<{ role: string; text: string }[]>([]);
  const [isAnsweringFollowUp, setIsAnsweringFollowUp] = useState(false);

  const handleExplain = async (customMode?: ExplanationMode) => {
    const selectedMode = customMode || mode;
    if (!topic.trim()) {
      setErrorMessage('Vui lòng nhập tên khái niệm hoặc thuật ngữ bạn muốn giải thích.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setFollowUpHistory([]);

    try {
      const response = await fetch('/api/gemini/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          subject,
          level,
          mode: selectedMode,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Không thể giải thích khái niệm.');
      }

      const data = await response.json();
      const newConcept: ConceptNote = {
        id: `con-${Date.now()}`,
        topic: data.topic || topic,
        subject,
        mode: selectedMode,
        coreDefinition: data.coreDefinition || '',
        explanation: data.explanation || '',
        mechanism: data.mechanism,
        clinicalOrRealWorld: data.clinicalOrRealWorld,
        analogies: data.analogies || [],
        comparisonTable: data.comparisonTable || [],
        keyTakeaways: data.keyTakeaways || [],
        commonMistakes: data.commonMistakes || [],
        checkQuestions: data.checkQuestions || [],
        createdAt: Date.now(),
      };

      setConceptData(newConcept);
      onSaveConcept(newConcept);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Lỗi khi gọi AI giải thích.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpQuestion.trim() || !conceptData) return;

    const userQ = followUpQuestion.trim();
    setFollowUpQuestion('');
    const newHistory = [...followUpHistory, { role: 'user', text: userQ }];
    setFollowUpHistory(newHistory);
    setIsAnsweringFollowUp(true);

    try {
      const response = await fetch('/api/gemini/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: `${conceptData.topic} - Câu hỏi làm rõ: ${userQ}`,
          subject: conceptData.subject,
          level,
          mode: conceptData.mode,
          followUpHistory: newHistory,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFollowUpHistory([
          ...newHistory,
          { role: 'assistant', text: data.explanation || data.coreDefinition || 'Đã phân tích câu hỏi làm rõ.' },
        ]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnsweringFollowUp(false);
    }
  };

  const handleCopy = () => {
    if (!conceptData) return;
    navigator.clipboard?.writeText(formatConceptToMarkdown(conceptData));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!conceptData) return;
    downloadFile(
      `GiaiThich_${conceptData.topic.replace(/[^a-zA-Z0-9]/g, '_')}.md`,
      formatConceptToMarkdown(conceptData)
    );
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="text-xs uppercase tracking-widest text-indigo-600 dark:text-indigo-400 font-semibold mb-1 flex items-center gap-1.5">
          <Brain className="w-3.5 h-3.5" />
          Interactive AI Tutor
        </div>
        <h1 className="font-serif-display text-2xl sm:text-3xl font-medium tracking-tight text-slate-900 dark:text-white">
          Giải Thích Kiến Thức & Gia Sư Cá Nhân Hóa
        </h1>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          Thấu hiểu tận gốc cơ chế hoạt động qua 5 chế độ sư phạm: từ giải thích cho học sinh lớp 5 (ELI5), ứng
          dụng lâm sàng Y - Nha khoa, đến phương pháp đặt câu hỏi dẫn dắt Socrates.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 print:hidden">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleExplain();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Khái niệm, bệnh lý hoặc định lý bạn muốn làm sáng tỏ
              </label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ví dụ: Cơ chế gây tê Spix, Sốc phản vệ, Vòng Beta-lactam, Điện tâm đồ STEMI..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chuyên môn / Môn học
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
              >
                {preferences.currentSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preset Topics */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-slate-400 text-[11px] whitespace-nowrap">Chủ đề gợi ý:</span>
            {PRESET_TOPICS.map((pt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setTopic(pt.topic);
                  setSubject(pt.subject);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-[11px] whitespace-nowrap transition-colors"
              >
                {pt.topic.split('&')[0]}
              </button>
            ))}
          </div>

          {/* 5 Explanation Modes Tabs */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-medium text-slate-400 block">Phong cách giải thích mong muốn:</span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {[
                { id: 'eli5', label: '🧸 1. ELI5 (Lớp 5)', desc: 'Mộc mạc, ví von đời thường' },
                { id: 'practical', label: '🌍 2. Ví dụ Thực tế', desc: 'Tình huống & lập luận' },
                { id: 'deepdive', label: '🔬 3. Chuyên sâu', desc: 'Lý thuyết đại học chi tiết' },
                { id: 'clinical', label: '🩺 4. Lâm sàng Y khoa', desc: 'Case vignette & xử trí' },
                { id: 'socratic', label: '🏛️ 5. Gia sư Socrates', desc: 'Gợi mở tư duy phản biện' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    mode === m.id
                      ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-1 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-semibold">{m.label}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-500 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Gemini đang phân tích bản chất...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                  <span>Giải thích ngay</span>
                </>
              )}
            </button>
          </div>

          {errorMessage && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{errorMessage}</p>
          )}
        </form>
      </div>

      {/* Concept Output View */}
      {conceptData && (
        <div className="space-y-6">
          {/* Action Row */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 print:hidden">
            <span className="text-xs font-mono text-slate-400">
              Chế độ: {conceptData.mode.toUpperCase()} · Môn: {conceptData.subject}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất .MD</span>
              </button>
              <button
                onClick={triggerPrint}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In trang</span>
              </button>
              <button
                onClick={() =>
                  onCreateFlashcard(
                    conceptData.topic,
                    `${conceptData.coreDefinition}\n\n${conceptData.explanation}`,
                    conceptData.subject
                  )
                }
                className="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs ml-1"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Tạo Flashcard</span>
              </button>
              <button
                onClick={() =>
                  onSendToQuiz(conceptData.coreDefinition + ' ' + conceptData.explanation, conceptData.subject)
                }
                className="px-3 py-1.5 rounded-xl bg-teal-500 text-slate-950 hover:bg-teal-400 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Tạo Quiz</span>
              </button>
            </div>
          </div>

          {/* Sheet */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-md space-y-7 print:border-none print:shadow-none print:p-0">
            {/* Title & Core Definition */}
            <div className="space-y-3 border-b border-slate-100 dark:border-slate-800 pb-5">
              <span className="text-xs font-mono text-teal-600 dark:text-teal-400 font-semibold uppercase tracking-widest">
                Định nghĩa Cốt lõi
              </span>
              <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">
                {conceptData.topic}
              </h2>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-700/80 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-sans font-medium">
                {conceptData.coreDefinition}
              </div>
            </div>

            {/* Explanation Body */}
            <div className="space-y-2">
              <h3 className="font-serif-display text-base font-semibold text-slate-900 dark:text-white">
                Giải thích Bản chất
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                {conceptData.explanation}
              </p>
            </div>

            {/* Mechanism & Clinical application */}
            {(conceptData.mechanism || conceptData.clinicalOrRealWorld) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {conceptData.mechanism && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                    <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-blue-500" />
                      Cơ chế hoạt động / Sinh lý bệnh
                    </span>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {conceptData.mechanism}
                    </p>
                  </div>
                )}
                {conceptData.clinicalOrRealWorld && (
                  <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 space-y-1.5 text-xs text-blue-950 dark:text-blue-100">
                    <span className="font-semibold flex items-center gap-1.5 text-blue-900 dark:text-blue-200">
                      <Stethoscope className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Ứng dụng Lâm sàng / Thực tiễn
                    </span>
                    <p className="leading-relaxed">{conceptData.clinicalOrRealWorld}</p>
                  </div>
                )}
              </div>
            )}

            {/* Comparison Table */}
            {conceptData.comparisonTable && conceptData.comparisonTable.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <h3 className="font-serif-display text-base font-semibold text-slate-900 dark:text-white">
                  Bảng So sánh & Đối chiếu
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="py-2.5 px-4 w-1/4">Tiêu chí</th>
                        <th className="py-2.5 px-4">{conceptData.topic}</th>
                        <th className="py-2.5 px-4">Khái niệm đối ứng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {conceptData.comparisonTable.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40">
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                            {row.feature}
                          </td>
                          <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{row.thisConcept}</td>
                          <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{row.relatedConcept}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Key Takeaways */}
            <div className="space-y-2.5 pt-1">
              <h3 className="font-serif-display text-base font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Bookmark className="w-4 h-4 text-teal-500" />
                <span>Kiến thức Cốt lõi Cần Ghi nhớ</span>
              </h3>
              <div className="space-y-2">
                {conceptData.keyTakeaways.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5"
                  >
                    <span className="font-mono font-bold text-slate-400">0{idx + 1}.</span>
                    <p className="leading-relaxed">{t}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Check questions */}
            {conceptData.checkQuestions.length > 0 && (
              <div className="space-y-2 pt-1">
                <h3 className="font-serif-display text-base font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-500" />
                  <span>Câu hỏi Tự Vấn Mức độ Hiểu bài</span>
                </h3>
                <div className="space-y-2">
                  {conceptData.checkQuestions.map((q, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-2.5"
                    >
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-400">Q{i + 1}:</span>
                      <p className="leading-relaxed">{q}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Follow-up Chat thread */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4 print:hidden">
              <h3 className="font-serif-display text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" />
                <span>Hỏi tiếp Gia sư AI về khái niệm này</span>
              </h3>

              {followUpHistory.length > 0 && (
                <div className="space-y-3 max-h-80 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-700">
                  {followUpHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white ml-8 font-medium'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 mr-8'
                      }`}
                    >
                      <span className="text-[10px] font-mono opacity-70 block mb-1">
                        {msg.role === 'user' ? 'Bạn hỏi:' : 'StudyMate AI:'}
                      </span>
                      {msg.text}
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleSendFollowUp} className="flex gap-2">
                <input
                  type="text"
                  value={followUpQuestion}
                  onChange={(e) => setFollowUpQuestion(e.target.value)}
                  placeholder="Hỏi sâu hơn: 'Tại sao lại có ngoại lệ?', 'Cho tôi một ví dụ cụ thể hơn'..."
                  className="flex-1 px-4 py-2.5 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={isAnsweringFollowUp || !followUpQuestion.trim()}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors flex items-center gap-1.5 disabled:opacity-40 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Gửi</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
