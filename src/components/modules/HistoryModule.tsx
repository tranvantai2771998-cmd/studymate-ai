import React, { useState, useEffect } from 'react';
import {
  History as HistoryIcon,
  Download,
  Upload,
  Printer,
  Trash2,
  FileText,
  Sparkles,
  HelpCircle,
  Clock,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { LearningHistoryItem, UserPreferences } from '../../types';
import {
  loadHistory,
  saveHistory,
  exportFullApplicationBackup,
  importApplicationBackup,
  calculateDashboardStats,
} from '../../data/storage';
import { exportContentAsFile, printContent } from '../../utils/exporter';

interface HistoryModuleProps {
  preferences: UserPreferences;
  onNavigateTab?: (tab: string, itemData?: any) => void;
}

export const HistoryModule: React.FC<HistoryModuleProps> = ({
  preferences,
  onNavigateTab,
}) => {
  const [historyList, setHistoryList] = useState<LearningHistoryItem[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    setHistoryList(loadHistory());
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử hoạt động?')) {
      saveHistory([]);
      setHistoryList([]);
      showToast('Đã xóa sạch lịch sử hoạt động.');
    }
  };

  // Full JSON Backup Export
  const handleExportFullBackup = () => {
    const backupJson = exportFullApplicationBackup();
    const filename = `StudyMate_Backup_${new Date().toISOString().split('T')[0]}.json`;
    exportContentAsFile(filename, backupJson, 'application/json');
    showToast('Đã tải xuống tệp sao lưu dữ liệu JSON thành công!');
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const success = importApplicationBackup(text);
        if (success) {
          setHistoryList(loadHistory());
          showToast('Khôi phục dữ liệu sao lưu thành công! Đang tải lại dữ liệu...');
          setTimeout(() => window.location.reload(), 1000);
        } else {
          showToast('Tệp sao lưu không đúng định dạng StudyMate AI!');
        }
      } catch (err) {
        showToast('Lỗi khi đọc tệp sao lưu JSON!');
      }
    };
    reader.readAsText(file);
  };

  // Print Study Progress Report
  const handlePrintReport = () => {
    const stats = calculateDashboardStats();
    const content = `# BÁO CÁO TIẾN ĐỘ HỌC TẬP — STUDYMATE AI
Học viên: ${preferences.userName} (${preferences.userRole.toUpperCase()})
Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}

---

## 1. TỔNG QUAN CHỈ SỐ HỌC TẬP
- Tổng thời lượng học tập tích lũy: ${stats.totalHours} giờ (${stats.totalMinutes} phút)
- Chuỗi ngày học liên tục: ${stats.streakDays} ngày
- Tỷ lệ hoàn thành kế hoạch học tập: ${stats.planCompletionRate}% (${stats.completedTasks}/${stats.totalTasks} nhiệm vụ)
- Tổng số câu hỏi trắc nghiệm đã làm: ${stats.totalQuestionsAnswered} câu
- Tổng số tài liệu & bài tóm tắt đã lưu: ${stats.totalSavedMaterials} bài

## 2. NHẬT KÝ HOẠT ĐỘNG GẦN ĐÂY
${historyList.slice(0, 15).map((h, i) => `${i + 1}. [${new Date(h.timestamp).toLocaleDateString('vi-VN')}] ${h.title} (${h.subject}) - ${h.details}`).join('\n')}

---
StudyMate AI — Trợ lý học tập cá nhân hóa chuẩn Y khoa`;

    printContent(content, 'Báo cáo học tập StudyMate AI');
  };

  const filteredHistory = historyList.filter((item) => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase()) && !item.details.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const getIconForType = (type: string) => {
    switch (type) {
      case 'summary':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'concept':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      case 'quiz_attempt':
        return <HelpCircle className="w-4 h-4 text-emerald-500" />;
      case 'session_completed':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'plan_modified':
        return <Calendar className="w-4 h-4 text-indigo-500" />;
      default:
        return <HistoryIcon className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg border border-slate-700 animate-fade-in flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          {notification}
        </div>
      )}

      {/* Header & Export Actions */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
              <HistoryIcon className="w-4 h-4" />
              <span>Nhật ký học tập & Đồng bộ dữ liệu</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Lịch sử phiên làm việc & Xuất dữ liệu
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportFullBackup}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> Sao lưu JSON
            </button>

            <label className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Phục hồi JSON
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>

            <button
              type="button"
              onClick={handlePrintReport}
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> In báo cáo
            </button>

            <button
              type="button"
              onClick={handleClearHistory}
              className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Xóa lịch sử
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'all', label: 'Tất cả hoạt động' },
              { id: 'summary', label: 'Tóm tắt bài giảng' },
              { id: 'concept', label: 'Giải thích khái niệm' },
              { id: 'quiz_attempt', label: 'Kiểm tra Quiz' },
              { id: 'session_completed', label: 'Pomodoro' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Lọc nhật ký..."
            className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-slate-800 dark:text-slate-200 w-48"
          />
        </div>
      </div>

      {/* Chronological Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">
            Không có hoạt động nào được ghi nhận.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {filteredHistory.map((item) => (
              <div key={item.id} className="relative group">
                {/* Dot */}
                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-500 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 hover:border-blue-300 transition-colors space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      {getIconForType(item.type)}
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {item.title}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold">
                        {item.subject}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400">
                      {new Date(item.timestamp).toLocaleString('vi-VN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 pl-6">
                    {item.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
