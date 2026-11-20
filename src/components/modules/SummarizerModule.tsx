import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  Upload,
  Copy,
  Check,
  Download,
  Printer,
  Bookmark,
  Zap,
  HelpCircle,
  AlertTriangle,
  Stethoscope,
  RefreshCw,
  Tag,
  BookOpen,
  X,
  FileCheck2,
} from 'lucide-react';
import { StudySummary, UserPreferences } from '../../types';
import { formatSummaryToMarkdown, downloadFile, triggerPrint } from '../../utils/exporter';

interface SummarizerModuleProps {
  currentSummary: StudySummary | null;
  preferences: UserPreferences;
  onSaveSummary: (summary: StudySummary) => void;
  onSendToQuiz: (content: string, subject: string) => void;
}

const PRESET_LECTURES = [
  {
    title: 'Hội chứng Vành Cấp & Điện tâm đồ STEMI',
    subject: 'Nội khoa Tim mạch',
    tags: ['Tim mạch', 'ECG', 'STEMI', 'Cấp cứu'],
    text: `Hội chứng vành cấp (ACS) là tình trạng thiếu máu cục bộ cơ tim đột ngột do huyết khối gây tắc nghẽn động mạch vành.
Phân loại:
1. Nhồi máu cơ tim ST chênh lên (STEMI): Tắc hoàn toàn động mạch vành, hoại tử xuyên thành.
2. Nhồi máu cơ tim không ST chênh lên (NSTEMI): Tắc không hoàn toàn, tăng men tim Troponin.
3. Đau thắt ngực không ổn định (UA): Men tim Troponin bình thường.
Triệu chứng kinh điển: Đau thắt ngực kiểu đè nghẹt sau xương ức > 20 phút, lan lên vai trái, cổ, hàm dưới hoặc bờ trong cánh tay trái, vã mồ hôi, khó thở, buồn nôn.
Điện tâm đồ (ECG): ST chênh lên dạng vòm >= 1mm ở ít nhất 2 chuyển đạo liên tiếp có hình ảnh soi gương.
Xử trí ban đầu khẩn cấp: Liệu pháp MONA (Morphine, Oxy khi SpO2 < 90%, Nitroglycerin ngậm dưới lưỡi, Aspirin liều nạp 162-325mg nhai), ức chế P2Y12 (Ticagrelor hoặc Clopidogrel), kháng đông Heparin và can thiệp mạch vành qua da (PCI) thì đầu trong vòng 90-120 phút. Chống chỉ định Nitroglycerin khi HA tâm thu < 90 mmHg hoặc nhồi máu thất phải.`,
  },
  {
    title: 'Giải phẫu Dây Thần kinh Sinh ba (Dây V) & Gây tê Gai Spix',
    subject: 'Răng Hàm Mặt & Nha chu',
    tags: ['Giải phẫu', 'Dây V', 'Gây tê Spix', 'Răng Hàm Mặt'],
    text: `Dây thần kinh sọ số V (dây sinh ba) chi phối cảm giác vùng mặt và vận động cơ nhai. Gồm 3 nhánh: V1 (Mắt), V2 (Hàm trên), V3 (Hàm dưới).
Nhánh V3 chui qua lỗ bầu dục, cho nhánh thần kinh huyệt răng dưới chui vào lỗ hàm dưới ở mặt trong cành lên xương hàm dưới (ngay sau gai Spix).
Kỹ thuật gây tê Spix: Mốc giải phẫu nằm cách mặt nhai răng hàm dưới 1cm, giữa bờ trước cơ cắn và nếp chân bướm hàm. Khi gây tê thành công, bệnh nhân tê bì môi dưới, cằm và nửa cung răng dưới cùng bên.
Biến chứng nguy hiểm: Tiêm vào mạch máu gây ngộ độc thuốc tê toàn thân (LAST), tiêm lệch ra sau vào tuyến mang tai phong bế nhánh dây thần kinh VII gây liệt mặt ngoại vi tạm thời.`,
  },
  {
    title: 'Cơ chế tác dụng Thuốc Kháng sinh nhóm Beta-lactam',
    subject: 'Dược lý học lâm sàng',
    tags: ['Dược lý', 'Kháng sinh', 'Beta-lactam', 'Penicillin'],
    text: `Kháng sinh Beta-lactam (Penicillin, Cephalosporin, Carbapenem, Monobactam) là nhóm kháng sinh diệt khuẩn phụ thuộc thời gian (Time-dependent).
Cơ chế tác dụng: Vòng beta-lactam gắn kết và bất hoạt enzyme Transpeptidase (thuộc nhóm Penicillin-Binding Proteins - PBPs), ức chế phản ứng liên kết chéo giữa các chuỗi peptidoglycan trong quá trình tổng hợp thành tế bào vi khuẩn. Thành tế bào suy yếu khiến vi khuẩn bị ly giải dưới áp lực thẩm thấu nội bào.
Cơ chế kháng thuốc: Vi khuẩn tiết enzym Beta-lactamase (hoặc ESBL, Carbapenemase) thủy phân vòng beta-lactam, hoặc đột biến làm biến đổi cấu trúc PBPs (như tụ cầu vàng MRSA kháng methicillin). Phối hợp chất ức chế beta-lactamase (Acid Clavulanic, Sulbactam, Tazobactam) giúp phục hồi phổ tác dụng.`,
  },
];

export const SummarizerModule: React.FC<SummarizerModuleProps> = ({
  currentSummary,
  preferences,
  onSaveSummary,
  onSendToQuiz,
}) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(preferences.currentSubjects[0] || 'Nội khoa Tim mạch');
  const [tags, setTags] = useState('Y khoa, Lâm sàng');
  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [detailLevel, setDetailLevel] = useState<'concise' | 'standard' | 'detailed' | 'deepdive'>('detailed');
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<StudySummary | null>(currentSummary);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{
    name: string;
    size: number;
    mimeType: string;
    data: string;
  } | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErrorMessage(null);

    if (!file.name.match(/\.(txt|md|json|docx|pdf)$/i)) {
      setErrorMessage('Vui lòng tải tệp hợp lệ (.txt, .md, .json, .docx, .pdf).');
      return;
    }

    const maxBytes = 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMessage('Tệp vượt quá giới hạn 15MB. Vui lòng chọn tệp nhỏ hơn.');
      return;
    }

    const cleanTitle = file.name.replace(/\.[^/.]+$/, '');
    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith('.txt') || lowerName.endsWith('.md') || lowerName.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content && content.trim()) {
          setInputText(content);
          setAttachedFile(null);
          if (!title.trim()) setTitle(cleanTitle);
        } else {
          setErrorMessage('Tệp văn bản đang trống.');
        }
      };
      reader.onerror = () => {
        setErrorMessage('Không thể đọc nội dung tệp. Vui lòng copy và dán trực tiếp.');
      };
      reader.readAsText(file, 'UTF-8');
      return;
    }

    if (lowerName.endsWith('.docx')) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        if (!dataUrl) {
          setErrorMessage('Không thể đọc tệp Word (.docx).');
          return;
        }
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        setIsExtractingFile(true);
        try {
          const res = await fetch('/api/documents/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              mimeType: file.type,
              data: base64,
            }),
          });
          const result = await res.json();
          if (!res.ok) {
            throw new Error(result.message || 'Không thể trích xuất văn bản từ tệp .docx.');
          }
          setInputText(result.text || '');
          setAttachedFile(null);
          if (!title.trim()) setTitle(cleanTitle);
        } catch (err: any) {
          setErrorMessage(err.message || 'Không thể đọc tệp .docx. Vui lòng thử lưu sang PDF hoặc dán nội dung.');
        } finally {
          setIsExtractingFile(false);
        }
      };
      reader.onerror = () => {
        setErrorMessage('Không thể đọc tệp .docx.');
      };
      reader.readAsDataURL(file);
      return;
    }

    // PDF file: attach as base64 for direct multimodal analysis by Gemini
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        setErrorMessage('Không thể đọc tệp PDF.');
        return;
      }
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      setAttachedFile({
        name: file.name,
        size: file.size,
        mimeType: 'application/pdf',
        data: base64,
      });
      if (!title.trim()) setTitle(cleanTitle);
    };
    reader.onerror = () => {
      setErrorMessage('Không thể đọc tệp PDF. Vui lòng thử lại.');
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedFile) {
      setErrorMessage('Vui lòng nhập nội dung hoặc tải lên tệp tài liệu để tóm tắt.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setIsSaved(false);

    try {
      const resolvedTitle =
        title.trim() ||
        (attachedFile ? attachedFile.name.replace(/\.[^/.]+$/, '') : 'Tóm tắt bài giảng ' + subject);

      const response = await fetch('/api/gemini/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText,
          file: attachedFile
            ? {
                name: attachedFile.name,
                mimeType: attachedFile.mimeType,
                data: attachedFile.data,
              }
            : undefined,
          title: resolvedTitle,
          subject,
          detailLevel,
          language,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Không thể tạo bản tóm tắt.');
      }

      const data = await response.json();
      const newSummary: StudySummary = {
        id: `sum-${Date.now()}`,
        title: data.title || title || 'Tóm tắt Chuyên sâu',
        subject,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        detailLevel,
        language,
        overview: data.overview || '',
        keyPoints: data.keyPoints || [],
        glossary: data.glossary || [],
        clinicalAspects: data.clinicalAspects,
        reflectionQuestions: data.reflectionQuestions || [],
        pitfalls: data.pitfalls,
        takeawayAction: data.takeawayAction,
        isFavorite: false,
        createdAt: Date.now(),
      };

      setSummaryData(newSummary);
      onSaveSummary(newSummary);
      setIsSaved(true);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Lỗi khi kết nối với AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summaryData) return;
    navigator.clipboard?.writeText(formatSummaryToMarkdown(summaryData));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!summaryData) return;
    downloadFile(
      `${summaryData.title.replace(/[^a-zA-Z0-9]/g, '_')}_TomTat.md`,
      formatSummaryToMarkdown(summaryData)
    );
  };

  return (
    <div className="space-y-8 pb-24">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="text-xs uppercase tracking-widest text-teal-600 dark:text-teal-400 font-semibold mb-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          Mô hình Trí tuệ Nhân tạo Gemini 3.8
        </div>
        <h1 className="font-serif-display text-2xl sm:text-3xl font-medium tracking-tight text-slate-900 dark:text-white">
          Tóm Tắt Bài Giảng & Hồ Sơ Y Khoa Chuyên Sâu
        </h1>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          Trích xuất có hệ thống cấu trúc giải phẫu, cơ chế sinh bệnh, triệu chứng lâm sàng, chẩn đoán, điều trị và
          những chống chỉ định dễ nhầm lẫn từ tài liệu học tập của bạn.
        </p>
      </div>

      {/* Input Form & Settings */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5 print:hidden">
        <form onSubmit={handleGenerateSummary} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tiêu đề tài liệu
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Hội chứng Vành Cấp & STEMI"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chuyên môn / Môn học
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
              >
                {preferences.currentSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
                <option value="Khác">Chuyên khoa khác...</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Thẻ phân loại (cách nhau dấu phẩy)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="vd: Cấp cứu, Tim mạch, Thuốc"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Text Area & File Drop */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>Nội dung bài giảng / Slide / Ghi chép</span>
              </label>

              {/* Preset buttons */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
                <span className="text-slate-400 text-[11px] whitespace-nowrap">Mẫu y khoa:</span>
                {PRESET_LECTURES.map((lec, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTitle(lec.title);
                      setSubject(lec.subject);
                      setTags(lec.tags.join(', '));
                      setInputText(lec.text);
                      setAttachedFile(null);
                      setErrorMessage(null);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 text-[11px] whitespace-nowrap transition-colors"
                  >
                    {lec.title.split('&')[0]}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={8}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                attachedFile
                  ? 'Bạn có thể ghi chú thêm yêu cầu trọng tâm (không bắt buộc) vì hệ thống sẽ đọc trực tiếp tệp PDF đính kèm...'
                  : 'Dán toàn bộ ghi chú bài giảng, tài liệu nghiên cứu, ca lâm sàng hoặc văn bản slide học tập...'
              }
              className="w-full p-4 text-xs bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500 leading-relaxed font-sans"
            />

            {/* Document File Upload */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 pt-1">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors">
                {isExtractingFile ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                <span>
                  {isExtractingFile
                    ? 'Đang trích xuất nội dung tệp...'
                    : 'Tải tệp tài liệu (.txt, .md, .json, .docx, .pdf)'}
                </span>
                <input
                  type="file"
                  accept=".txt,.md,.json,.docx,.pdf"
                  onChange={handleFileUpload}
                  disabled={isExtractingFile || isLoading}
                  className="hidden"
                />
              </label>
              <span>{inputText.length} ký tự</span>
            </div>

            {attachedFile && (
              <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/70 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileCheck2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-teal-950 dark:text-teal-200 truncate">
                      {attachedFile.name}
                    </p>
                    <p className="text-[11px] text-teal-700 dark:text-teal-400">
                      PDF · {formatFileSize(attachedFile.size)} · Sẵn sàng để AI đọc và tóm tắt trực tiếp
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="p-1 rounded-lg text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
                  title="Gỡ tệp đính kèm"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Level & Submit Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="space-y-1">
              <span className="text-[11px] font-medium text-slate-400 block">Mức độ chi tiết:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: 'concise', label: '1. Tóm tắt nhanh' },
                  { id: 'standard', label: '2. Tiêu chuẩn' },
                  { id: 'detailed', label: '3. Chi tiết' },
                  { id: 'deepdive', label: '4. Phân tích chuyên sâu' },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setDetailLevel(lvl.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      detailLevel === lvl.id
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {lvl.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isExtractingFile}
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-xs hover:bg-blue-500 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Gemini đang trích xuất cấu trúc...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-teal-300" />
                  <span>Tạo bản tóm tắt học tập</span>
                </>
              )}
            </button>
          </div>

          {errorMessage && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">{errorMessage}</p>
          )}
        </form>
      </div>

      {/* Generated Output Display */}
      {summaryData && (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 print:hidden">
            <span className="text-xs font-mono text-slate-400">
              Biên tập chuẩn y văn · {new Date(summaryData.createdAt).toLocaleTimeString('vi-VN')}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                title="Sao chép toàn bộ nội dung"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                title="Tải tệp Markdown (.md)"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất .MD</span>
              </button>
              <button
                onClick={triggerPrint}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                title="In hoặc lưu dạng PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In tài liệu</span>
              </button>
              <button
                onClick={() =>
                  onSendToQuiz(summaryData.overview + ' ' + summaryData.keyPoints.join(' '), summaryData.subject)
                }
                className="px-3.5 py-1.5 rounded-xl bg-teal-500 text-slate-950 hover:bg-teal-400 text-xs font-semibold flex items-center gap-1.5 transition-colors ml-2 shadow-sm"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Tạo câu hỏi từ bài này</span>
              </button>
            </div>
          </div>

          {/* Printable Structured Content Sheet */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-200 dark:border-slate-800 shadow-md space-y-8 print:border-none print:shadow-none print:p-0">
            {/* Title & Overview */}
            <div className="space-y-3 border-b border-slate-100 dark:border-slate-800 pb-6">
              <div className="flex items-center gap-2 text-[11px] font-mono text-teal-600 dark:text-teal-400 uppercase tracking-widest font-semibold">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>{summaryData.subject}</span>
                <span>·</span>
                <span className="text-slate-400">{summaryData.detailLevel.toUpperCase()}</span>
              </div>
              <h2 className="font-serif-display text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">
                {summaryData.title}
              </h2>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-700/80 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-sans">
                {summaryData.overview}
              </div>
            </div>

            {/* Core Pillars */}
            <div className="space-y-3">
              <h3 className="font-serif-display text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span>Kiến thức Trọng tâm & Luận điểm Then chốt</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {summaryData.keyPoints.map((pt, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 space-y-1"
                  >
                    <span className="font-mono text-xs text-slate-400 font-bold">0{i + 1}.</span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{pt}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Clinical Aspects Box (If medical) */}
            {summaryData.clinicalAspects && (
              <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 space-y-3 text-xs">
                <div className="font-semibold text-blue-950 dark:text-blue-200 text-sm flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Khía Cạnh Y Khoa & Lâm Sàng Chuyên Sâu</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {summaryData.clinicalAspects.anatomicalStructures && (
                    <div className="space-y-1">
                      <span className="font-semibold text-blue-900 dark:text-blue-300 block">
                        Cấu trúc giải phẫu:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300">
                        {summaryData.clinicalAspects.anatomicalStructures}
                      </p>
                    </div>
                  )}
                  {summaryData.clinicalAspects.clinicalManifestations && (
                    <div className="space-y-1">
                      <span className="font-semibold text-blue-900 dark:text-blue-300 block">
                        Biểu hiện lâm sàng:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300">
                        {summaryData.clinicalAspects.clinicalManifestations}
                      </p>
                    </div>
                  )}
                  {summaryData.clinicalAspects.diagnosticPrinciples && (
                    <div className="space-y-1">
                      <span className="font-semibold text-blue-900 dark:text-blue-300 block">
                        Nguyên tắc chẩn đoán:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300">
                        {summaryData.clinicalAspects.diagnosticPrinciples}
                      </p>
                    </div>
                  )}
                  {summaryData.clinicalAspects.treatmentPrinciples && (
                    <div className="space-y-1">
                      <span className="font-semibold text-blue-900 dark:text-blue-300 block">
                        Nguyên tắc điều trị:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300">
                        {summaryData.clinicalAspects.treatmentPrinciples}
                      </p>
                    </div>
                  )}
                  {summaryData.clinicalAspects.contraindications && (
                    <div className="sm:col-span-2 space-y-1 pt-1 text-rose-800 dark:text-rose-300">
                      <span className="font-semibold block flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        Chống chỉ định & Biến chứng quan trọng:
                      </span>
                      <p>{summaryData.clinicalAspects.contraindications}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Glossary */}
            {summaryData.glossary.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="font-serif-display text-base font-semibold text-slate-900 dark:text-white">
                  Thuật ngữ & Khái niệm Cốt lõi (Glossary)
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="py-2.5 px-4 w-1/3">Thuật ngữ</th>
                        <th className="py-2.5 px-4">Định nghĩa & Bản chất</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {summaryData.glossary.map((g, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/40">
                          <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                            {g.term}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                            {g.definition}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Reflection Questions */}
            {summaryData.reflectionQuestions.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <h3 className="font-serif-display text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-500" />
                  <span>Câu hỏi Tự Kiểm tra Mức độ Hiểu bài (Active Recall)</span>
                </h3>
                <div className="space-y-2">
                  {summaryData.reflectionQuestions.map((q, i) => (
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
          </div>
        </div>
      )}
    </div>
  );
};
