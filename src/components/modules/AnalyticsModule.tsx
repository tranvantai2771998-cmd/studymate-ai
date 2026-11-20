import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Target,
  BookOpen,
  ArrowRight,
  Brain,
} from 'lucide-react';
import {
  UserPreferences,
  QuizAttempt,
  StudySession,
  StudyTask,
} from '../../types';
import {
  loadQuizAttempts,
  loadSessions,
  loadTasks,
  loadSummaries,
  calculateDashboardStats,
} from '../../data/storage';

interface AnalyticsModuleProps {
  preferences: UserPreferences;
  onNavigateTab?: (tab: string) => void;
}

export const AnalyticsModule: React.FC<AnalyticsModuleProps> = ({
  preferences,
  onNavigateTab,
}) => {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [stats, setStats] = useState(calculateDashboardStats());

  useEffect(() => {
    setAttempts(loadQuizAttempts());
    setSessions(loadSessions());
    setTasks(loadTasks());
    setStats(calculateDashboardStats());
  }, []);

  // Compute accuracy by subject
  const subjectAccuracyMap: Record<string, { total: number; correct: number; attempts: number }> = {};
  attempts.forEach((a) => {
    if (!subjectAccuracyMap[a.subject]) {
      subjectAccuracyMap[a.subject] = { total: 0, correct: 0, attempts: 0 };
    }
    subjectAccuracyMap[a.subject].total += a.totalQuestions;
    subjectAccuracyMap[a.subject].correct += a.score;
    subjectAccuracyMap[a.subject].attempts += 1;
  });

  // Compute study hours by subject
  const subjectTimeMap: Record<string, number> = {};
  sessions.forEach((s) => {
    subjectTimeMap[s.subject] = (subjectTimeMap[s.subject] || 0) + s.durationMinutes;
  });

  // Identify weak areas (< 70% accuracy or lowest score)
  const weakSubjects = Object.entries(subjectAccuracyMap)
    .map(([sub, data]) => ({
      subject: sub,
      accuracy: Math.round((data.correct / (data.total || 1)) * 100),
      totalQuestions: data.total,
    }))
    .filter((s) => s.accuracy < 75);

  return (
    <div className="space-y-6">
      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Thời lượng tích lũy</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {stats.totalHours} giờ
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Tổng {stats.totalMinutes} phút học tập thực tế
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Chuỗi ngày học liên tục</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">
            {stats.streakDays} ngày
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Duy trì đều đặn mỗi ngày
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Hoàn thành kế hoạch</span>
            <Target className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {stats.planCompletionRate}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Đã hoàn tất {stats.completedTasks} / {stats.totalTasks} nhiệm vụ
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Câu trắc nghiệm đã làm</span>
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {stats.totalQuestionsAnswered} câu
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Trên {attempts.length} lượt thi thử & luyện tập
          </div>
        </div>
      </div>

      {/* Weak Subjects / Needs Improvement Alert */}
      {weakSubjects.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Phát hiện lỗ hổng kiến thức cần ôn tập bổ sung</span>
          </div>
          <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            Hệ thống phát hiện các môn học có độ chính xác dưới 75% trong các bài kiểm tra gần nhất. Bạn nên tập trung tóm tắt lại và làm thêm trắc nghiệm tình huống lâm sàng cho các chủ đề này:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {weakSubjects.map((w) => (
              <div
                key={w.subject}
                className="p-3 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-amber-200 dark:border-amber-900/50 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{w.subject}</span>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Độ chính xác: <strong className="text-rose-600">{w.accuracy}%</strong> ({w.totalQuestions} câu đã làm)
                  </div>
                </div>
                {onNavigateTab && (
                  <button
                    type="button"
                    onClick={() => onNavigateTab('quiz')}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-md transition-colors"
                  >
                    Ôn ngay
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subject Mastery Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subject Accuracy Rates */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Brain className="w-4 h-4 text-blue-600" />
              <span>Độ vững vàng kiến thức theo môn</span>
            </h3>
            <span className="text-[11px] text-slate-400">Dựa trên kết quả Quiz</span>
          </div>

          <div className="space-y-4">
            {preferences.currentSubjects.map((sub) => {
              const data = subjectAccuracyMap[sub] || { total: 0, correct: 0 };
              const acc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 80;

              let badgeColor = 'bg-emerald-500';
              let statusText = 'Nắm rất vững';
              if (acc < 60) {
                badgeColor = 'bg-rose-500';
                statusText = 'Cần ôn gấp';
              } else if (acc < 75) {
                badgeColor = 'bg-amber-500';
                statusText = 'Đang cải thiện';
              }

              return (
                <div key={sub} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{sub}</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {acc}% <span className="text-[10px] font-normal text-slate-400">({statusText})</span>
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${badgeColor}`}
                      style={{ width: `${acc}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Study Time Distribution */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span>Phân bổ thời gian học tập</span>
            </h3>
            <span className="text-[11px] text-slate-400">Tổng các phiên Pomodoro</span>
          </div>

          <div className="space-y-4">
            {preferences.currentSubjects.map((sub) => {
              const timeMins = subjectTimeMap[sub] || 45;
              const maxMins = Math.max(...Object.values(subjectTimeMap), 120);
              const widthPct = Math.min(100, Math.round((timeMins / maxMins) * 100));

              return (
                <div key={sub} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{sub}</span>
                    <span className="font-mono font-medium text-slate-600 dark:text-slate-400">
                      {timeMins} phút
                    </span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-purple-600 dark:bg-purple-500 transition-all duration-700"
                      style={{ width: `${Math.max(15, widthPct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
