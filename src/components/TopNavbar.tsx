import React from 'react';
import {
  Menu,
  Search,
  Flame,
  Timer,
  Sun,
  Moon,
  Clock,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { NavigationTab, UserPreferences } from '../types';

interface TopNavbarProps {
  onToggleMobileSidebar: () => void;
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  streakDays: number;
  pomodoroActive: boolean;
  pomodoroTimeLeft: number;
  onOpenPomodoro: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  preferences: UserPreferences;
  onQuickSearch: (query: string) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  onToggleMobileSidebar,
  currentTab,
  onSelectTab,
  streakDays,
  pomodoroActive,
  pomodoroTimeLeft,
  onOpenPomodoro,
  isDarkMode,
  onToggleDarkMode,
  preferences,
  onQuickSearch,
}) => {
  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Find the closest upcoming exam
  const nextExam = preferences.examinationDates && preferences.examinationDates.length > 0
    ? [...preferences.examinationDates].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
    : null;

  const calculateDaysLeft = (targetDate: string) => {
    const diff = new Date(targetDate).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const daysLeft = nextExam ? calculateDaysLeft(nextExam.date) : null;

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 transition-colors print:hidden">
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        {/* Mobile menu trigger */}
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Quick Search */}
        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            onChange={(e) => onQuickSearch(e.target.value)}
            placeholder="Tìm kiếm bài giảng, thuật ngữ y khoa, câu hỏi quiz..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-800/80 border border-transparent dark:border-slate-700/60 rounded-xl text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Exam Countdown Pill */}
        {nextExam && daysLeft !== null && (
          <button
            onClick={() => onSelectTab('settings')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900 text-blue-900 dark:text-blue-200 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors"
            title={`${nextExam.title} (${nextExam.date})`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="font-medium truncate max-w-[140px]">{nextExam.subject}:</span>
            <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
              còn {daysLeft} ngày
            </span>
          </button>
        )}

        {/* Streak Counter */}
        <div
          title={`Chuỗi ${streakDays} ngày học liên tiếp`}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-semibold"
        >
          <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
          <span className="font-mono tabular-nums">{streakDays}</span>
          <span className="hidden sm:inline text-[11px] font-normal text-amber-800 dark:text-amber-300">ngày</span>
        </div>

        {/* Pomodoro Timer Pill */}
        <button
          onClick={onOpenPomodoro}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
            pomodoroActive
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200/70'
          }`}
          title="Đồng hồ Pomodoro tập trung"
        >
          <Timer className={`w-3.5 h-3.5 ${pomodoroActive ? 'text-rose-600 animate-spin' : 'text-slate-500'}`} />
          <span className="font-mono tabular-nums font-semibold">{formatTimer(pomodoroTimeLeft)}</span>
        </button>

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title={isDarkMode ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          aria-label="Đổi giao diện sáng tối"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>
    </header>
  );
};
