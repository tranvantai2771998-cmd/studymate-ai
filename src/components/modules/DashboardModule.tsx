import React from 'react';
import {
  Flame,
  Clock,
  CheckCircle2,
  FileText,
  Brain,
  Timer,
  Calendar,
  ArrowRight,
  Plus,
  BookOpen,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Check,
  FolderArchive,
  BarChart2,
  Bookmark,
} from 'lucide-react';
import {
  NavigationTab,
  UserPreferences,
  StudyTask,
  StudySession,
  StudySummary,
  QuizAttempt,
} from '../../types';

interface DashboardModuleProps {
  stats: {
    totalHours: string;
    totalMinutes: number;
    completedTasks: number;
    totalTasks: number;
    planCompletionRate: number;
    totalQuestionsAnswered: number;
    totalSavedMaterials: number;
    streakDays: number;
  };
  tasks: StudyTask[];
  sessions: StudySession[];
  summaries: StudySummary[];
  recentAttempts: QuizAttempt[];
  preferences: UserPreferences;
  onToggleTask: (id: string) => void;
  onRescheduleTask: (id: string, newDate: string) => void;
  onNavigate: (tab: NavigationTab) => void;
  onStartPomodoro: () => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  stats,
  tasks,
  sessions,
  summaries,
  recentAttempts,
  preferences,
  onToggleTask,
  onRescheduleTask,
  onNavigate,
  onStartPomodoro,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const todayTasks = tasks.filter((t) => t.scheduledDate === todayStr);
  const overdueTasks = tasks.filter((t) => t.scheduledDate < todayStr && t.status !== 'completed');

  // Days of week for chart
  const weekDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const mockDayMinutes = [85, 110, 95, 120, 140, 150, 90];

  return (
    <div className="space-y-8 pb-20">
      {/* Welcome Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>StudyMate AI · Bảng Điều Khiển Học Tập Cá Nhân Hóa</span>
            </div>
            <h1 className="font-serif-display text-2xl sm:text-3xl font-medium tracking-tight">
              Xin chào, <span className="text-white font-bold">{preferences.userName}</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Bạn đang duy trì chuỗi học tập <strong className="text-amber-400 font-mono">{stats.streakDays} ngày liên tiếp</strong>.
              Mục tiêu hôm nay: <span className="font-mono text-teal-300">{preferences.dailyStudyGoalMinutes} phút</span> học tập tập trung sâu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={onStartPomodoro}
              className="px-5 py-2.5 rounded-xl bg-teal-500 text-slate-950 hover:bg-teal-400 font-semibold text-xs flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all active:scale-[0.98]"
            >
              <Timer className="w-4 h-4" />
              <span>Bật Pomodoro 25p</span>
            </button>
            <button
              onClick={() => onNavigate('summarizer')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/20 text-xs font-medium flex items-center gap-2 transition-colors"
            >
              <FileText className="w-4 h-4 text-blue-300" />
              <span>Tóm tắt bài giảng</span>
            </button>
          </div>
        </div>
      </section>

      {/* Summary KPI Cards (Calculated from real app data) */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-5">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Tổng giờ học</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {stats.totalHours} <span className="text-xs font-normal text-slate-400 font-sans">giờ</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono truncate">{stats.totalMinutes} phút ghi nhận</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Chuỗi liên tiếp</span>
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
          </div>
          <div className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {stats.streakDays} <span className="text-xs font-normal text-slate-400 font-sans">ngày 🔥</span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate">Đều đặn mỗi ngày</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Tài liệu đã lưu</span>
            <FolderArchive className="w-4 h-4 text-teal-500" />
          </div>
          <div className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {stats.totalSavedMaterials} <span className="text-xs font-normal text-slate-400 font-sans">mục</span>
          </div>
          <p className="text-[11px] text-slate-400 truncate">Trong thư viện cá nhân</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Câu hỏi đã làm</span>
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {stats.totalQuestionsAnswered} <span className="text-xs font-normal text-slate-400 font-sans">câu</span>
          </div>
          <p className="text-[11px] text-slate-400 truncate">Kiểm tra Active Recall</p>
        </div>

        <div className="col-span-2 lg:col-span-1 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Tiến độ kế hoạch</span>
            <BarChart2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="font-mono tabular-nums text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            {stats.planCompletionRate}%
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            {stats.completedTasks} / {stats.totalTasks} nhiệm vụ xong
          </p>
        </div>
      </section>

      {/* Quick Action Shortcuts */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="font-serif-display text-lg font-semibold text-slate-900 dark:text-white">
            Phím tắt hành động nhanh
          </h2>
          <span className="text-xs text-slate-500">Khởi tạo nhanh quy trình học với AI</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigate('summarizer')}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer group space-y-2 shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-serif-display text-sm font-semibold text-slate-900 dark:text-white">
              Tóm tắt bài giảng mới
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Trích xuất giải phẫu, cơ chế sinh bệnh, triệu chứng và nguyên tắc điều trị từ slide hoặc ghi chú.
            </p>
            <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-1 pt-1">
              <span>Bắt đầu tóm tắt</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div
            onClick={() => onNavigate('explainer')}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-600 transition-all cursor-pointer group space-y-2 shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="font-serif-display text-sm font-semibold text-slate-900 dark:text-white">
              Giải thích kiến thức khó
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              5 lăng kính sư phạm: ELI5, Ví dụ thực tế, Chuyên sâu, Ứng dụng lâm sàng và Gia sư Socrates.
            </p>
            <div className="text-xs font-semibold text-teal-600 dark:text-teal-400 group-hover:underline flex items-center gap-1 pt-1">
              <span>Hỏi gia sư AI</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div
            onClick={() => onNavigate('quiz')}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer group space-y-2 shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-serif-display text-sm font-semibold text-slate-900 dark:text-white">
              Tạo bài trắc nghiệm
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tạo câu hỏi trắc nghiệm khách quan hoặc Ca lâm sàng (Vignette) kèm giải thích chi tiết từng lựa chọn.
            </p>
            <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline flex items-center gap-1 pt-1">
              <span>Làm bài kiểm tra</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div
            onClick={() => onNavigate('planner')}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 transition-all cursor-pointer group space-y-2 shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-serif-display text-sm font-semibold text-slate-900 dark:text-white">
              Lập kế hoạch ôn tập
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tự động lên lịch theo phương pháp Spaced Repetition phân bổ trước ngày thi chứng chỉ / hết môn.
            </p>
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 group-hover:underline flex items-center gap-1 pt-1">
              <span>Xem lịch trình</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* Main 2-Column: Today's Tasks & Weekly Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Schedule & Overdue Tasks */}
        <section className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="font-serif-display text-base font-semibold text-slate-900 dark:text-white">
                Nhiệm vụ & Phiên ôn tập hôm nay
              </h2>
              <p className="text-xs text-slate-500">
                Lịch trình ngày {new Date().toLocaleDateString('vi-VN')}
              </p>
            </div>
            <button
              onClick={() => onNavigate('planner')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Xem toàn bộ lịch</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Overdue Alert banner if any */}
          {overdueTasks.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs space-y-2">
              <div className="flex items-center justify-between text-rose-800 dark:text-rose-200 font-semibold">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Có {overdueTasks.length} nhiệm vụ quá hạn cần điều chỉnh!
                </span>
              </div>
              <div className="divide-y divide-rose-200/60 dark:divide-rose-900/40">
                {overdueTasks.map((ot) => (
                  <div key={ot.id} className="pt-2 pb-1 flex items-center justify-between text-[11px]">
                    <span className="text-rose-900 dark:text-rose-300 font-medium truncate max-w-[280px]">
                      {ot.title} ({ot.subject})
                    </span>
                    <button
                      onClick={() => onRescheduleTask(ot.id, todayStr)}
                      className="px-2 py-0.5 rounded bg-rose-200/60 dark:bg-rose-800 text-rose-900 dark:text-rose-100 hover:bg-rose-300 font-semibold text-[10px] flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Dời sang hôm nay</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Today Tasks Checklist */}
          <div className="space-y-2.5">
            {todayTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Bạn không có nhiệm vụ tồn đọng nào hôm nay. Hãy thư giãn hoặc lập kế hoạch mới!
              </div>
            ) : (
              todayTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 transition-colors ${
                    task.status === 'completed'
                      ? 'bg-slate-50 dark:bg-slate-850/50 border-slate-200 dark:border-slate-800 text-slate-400'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <button
                    onClick={() => onToggleTask(task.id)}
                    className="mt-0.5 text-slate-400 hover:text-teal-600 transition-colors"
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className={task.status === 'completed' ? 'line-through text-slate-400' : 'font-medium'}>
                      {task.title}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                      <span className="font-sans font-semibold text-blue-600 dark:text-blue-400">
                        {task.subject}
                      </span>
                      <span>·</span>
                      <span>{task.estimatedDurationMinutes} phút</span>
                      {task.reviewInterval && (
                        <>
                          <span>·</span>
                          <span className="text-amber-600 dark:text-amber-400">{task.reviewInterval}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Right Column: Weekly Study Activity & Exam Target Card */}
        <div className="lg:col-span-5 space-y-6">
          {/* Weekly Activity Bar Chart */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif-display text-sm font-semibold text-slate-900 dark:text-white">
                Biểu đồ thời gian học trong tuần
              </h3>
              <span className="text-xs font-mono text-teal-600 dark:text-teal-400 font-semibold">
                Trung bình 112p/ngày
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2 pt-3 items-end h-36">
              {weekDays.map((day, idx) => {
                const mins = mockDayMinutes[idx];
                const heightPercent = Math.min(100, Math.max(18, (mins / 160) * 100));
                return (
                  <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[10px] font-mono text-slate-400">{mins}p</span>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-t-lg h-full flex items-end overflow-hidden">
                      <div
                        className="w-full bg-blue-600 dark:bg-blue-500 rounded-t-lg transition-all duration-500"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-300 font-mono">
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Target Examination Countdowns */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="font-serif-display text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Kỳ thi mục tiêu sắp tới</span>
              </h3>
              <button
                onClick={() => onNavigate('settings')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Cài đặt
              </button>
            </div>

            <div className="space-y-2.5">
              {preferences.examinationDates.map((exam) => {
                const days = Math.max(0, Math.ceil((new Date(exam.date).getTime() - new Date().getTime()) / 86400000));
                return (
                  <div
                    key={exam.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="font-semibold text-slate-900 dark:text-white truncate">
                        {exam.title}
                      </div>
                      <div className="text-[11px] text-slate-500">{exam.subject} · {exam.date}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono font-bold shrink-0">
                      còn {days} ngày
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
