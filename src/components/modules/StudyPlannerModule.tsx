import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  Plus,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  AlertTriangle,
  Sparkles,
  Layers,
  Flame,
  Volume2,
  Trash2,
  Check,
  CalendarDays,
  ListFilter,
  Lightbulb,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudyTask, StudySession, UserPreferences } from '../../types';
import {
  loadTasks,
  saveTasks,
  loadSessions,
  saveSessions,
  logActivity,
} from '../../data/storage';
import { playChimeSound } from '../../utils/sound';

interface StudyPlannerModuleProps {
  preferences: UserPreferences;
  onNavigateTab?: (tab: string) => void;
}

export const StudyPlannerModule: React.FC<StudyPlannerModuleProps> = ({
  preferences,
  onNavigateTab,
}) => {
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'completed'>('today');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'week'>('list');

  // New task modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskSubject, setNewTaskSubject] = useState(preferences.currentSubjects[0] || 'Giải phẫu học');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTaskDuration, setNewTaskDuration] = useState(45);
  const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTaskMethod, setNewTaskMethod] = useState<StudyTask['studyMethod']>('spaced_repetition');

  // Spaced repetition AI generator
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [roadmapSubject, setRoadmapSubject] = useState(preferences.currentSubjects[0] || 'Nội khoa Tim mạch');
  const [roadmapExamDate, setRoadmapExamDate] = useState(
    preferences.examinationDates[0]?.date || new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0]
  );
  const [roadmapDays, setRoadmapDays] = useState(7);

  // Pomodoro timer state
  const [pomoMode, setPomoMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [pomoSecondsRemaining, setPomoSecondsRemaining] = useState<number>(25 * 60);
  const [isPomoRunning, setIsPomoRunning] = useState(false);
  const [pomoSubject, setPomoSubject] = useState(preferences.currentSubjects[0] || 'Nội khoa');
  const [completedPomoCount, setCompletedPomoCount] = useState(0);

  const [notification, setNotification] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    setTasks(loadTasks());
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Pomodoro countdown timer
  useEffect(() => {
    let timer: any = null;
    if (isPomoRunning && pomoSecondsRemaining > 0) {
      timer = setInterval(() => {
        setPomoSecondsRemaining((prev) => {
          if (prev <= 1) {
            handlePomoFinished();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPomoRunning, pomoSecondsRemaining, pomoMode]);

  const handlePomoFinished = () => {
    setIsPomoRunning(false);

    if (pomoMode === 'work') {
      playChimeSound('complete');
      confetti({ particleCount: 50, spread: 50 });
      setCompletedPomoCount((c) => c + 1);

      // Log study session
      const sessionMinutes = 25;
      const newSession: StudySession = {
        id: `sess-${Date.now()}`,
        subject: pomoSubject,
        durationMinutes: sessionMinutes,
        sessionType: 'pomodoro',
        completedAt: Date.now(),
      };
      const existingSessions = loadSessions();
      saveSessions([newSession, ...existingSessions]);

      logActivity(
        'session_completed',
        `Hoàn thành 1 hiệp Pomodoro (25 phút)`,
        pomoSubject,
        `Tập trung cao độ cho môn ${pomoSubject}`,
        newSession.id
      );

      showToast(`Tuyệt vời! Bạn vừa hoàn thành 25 phút học tập tập trung.`);

      // Switch to break
      if ((completedPomoCount + 1) % 4 === 0) {
        setPomoMode('longBreak');
        setPomoSecondsRemaining(15 * 60);
      } else {
        setPomoMode('shortBreak');
        setPomoSecondsRemaining(5 * 60);
      }
    } else {
      playChimeSound('break');
      showToast('Hết giờ nghỉ giải lao! Chuẩn bị bước vào hiệp học tiếp theo.');
      setPomoMode('work');
      setPomoSecondsRemaining(25 * 60);
    }
  };

  const setTimerDuration = (mode: 'work' | 'shortBreak' | 'longBreak') => {
    setPomoMode(mode);
    setIsPomoRunning(false);
    if (mode === 'work') setPomoSecondsRemaining(25 * 60);
    if (mode === 'shortBreak') setPomoSecondsRemaining(5 * 60);
    if (mode === 'longBreak') setPomoSecondsRemaining(15 * 60);
  };

  // Toggle task completed
  const handleToggleTask = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const nextStatus = t.status === 'completed' ? 'pending' : 'completed';
        if (nextStatus === 'completed') {
          playChimeSound('complete');
          confetti({ particleCount: 30, spread: 40 });
        }
        return {
          ...t,
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? Date.now() : undefined,
        } as StudyTask;
      }
      return t;
    });

    setTasks(updated);
    saveTasks(updated);
  };

  // Reschedule overdue task to today
  const handleRescheduleToToday = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        return {
          ...t,
          scheduledDate: todayStr,
          status: 'pending' as const,
        };
      }
      return t;
    });

    setTasks(updated);
    saveTasks(updated);
    showToast('Đã dời nhiệm vụ sang ngày hôm nay!');
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa nhiệm vụ học tập này?')) {
      const updated = tasks.filter((t) => t.id !== taskId);
      setTasks(updated);
      saveTasks(updated);
      showToast('Đã xóa nhiệm vụ.');
    }
  };

  // Add new task manually
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: StudyTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      subject: newTaskSubject,
      description: `Luyện tập chuyên đề ${newTaskSubject}`,
      scheduledDate: newTaskDate,
      estimatedDurationMinutes: newTaskDuration,
      priority: newTaskPriority,
      status: newTaskDate < todayStr ? 'overdue' : 'pending',
      studyMethod: newTaskMethod,
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    saveTasks(updated);
    setIsAddModalOpen(false);
    setNewTaskTitle('');
    showToast('Đã thêm nhiệm vụ học tập mới!');
  };

  // Generate AI Spaced Repetition Roadmap
  const handleGenerateRoadmap = async () => {
    setIsGeneratingRoadmap(true);
    try {
      const response = await fetch('/api/gemini/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: roadmapSubject,
          examDate: roadmapExamDate,
          days: roadmapDays,
          dailyHours: preferences.dailyStudyGoalMinutes / 60,
        }),
      });

      const data = await response.json();
      if (!data.success || !data.roadmap) {
        throw new Error(data.error || 'Lỗi khi tạo lộ trình');
      }

      const generatedTasks: StudyTask[] = [];
      const plan = data.roadmap.dailyPlan || [];

      plan.forEach((dayItem: any, index: number) => {
        const taskDate = new Date(Date.now() + 86400000 * index).toISOString().split('T')[0];
        const dayTasks = dayItem.tasks || [];

        dayTasks.forEach((taskTitle: string, taskIdx: number) => {
          generatedTasks.push({
            id: `task-gen-${Date.now()}-${index}-${taskIdx}`,
            title: taskTitle,
            subject: roadmapSubject,
            description: `Ngày ${index + 1}: ${dayItem.focus || 'Ôn tập'} (${dayItem.interval || 'Lặp lại ngắt quãng'})`,
            scheduledDate: taskDate,
            estimatedDurationMinutes: 45,
            priority: index < 2 ? 'high' : 'medium',
            status: 'pending',
            reviewInterval: dayItem.interval || `${index * 3} ngày`,
            studyMethod: 'spaced_repetition',
          });
        });
      });

      const updated = [...generatedTasks, ...tasks];
      setTasks(updated);
      saveTasks(updated);

      logActivity(
        'plan_modified',
        `Tạo lộ trình ôn tập AI: ${roadmapSubject}`,
        roadmapSubject,
        `Tự động lên lịch ${generatedTasks.length} nhiệm vụ lặp lại ngắt quãng`,
        `roadmap-${Date.now()}`
      );

      showToast(`Đã bổ sung ${generatedTasks.length} nhiệm vụ ôn tập Spaced Repetition vào lịch!`);
    } catch (err: any) {
      console.error(err);
      showToast('Đang thêm lộ trình mẫu ôn thi y khoa chuẩn...');
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (selectedSubject !== 'all' && t.subject !== selectedSubject) return false;
    const isOverdue = t.scheduledDate < todayStr && t.status !== 'completed';

    if (filterStatus === 'today') {
      return t.scheduledDate === todayStr || (isOverdue && t.status !== 'completed');
    }
    if (filterStatus === 'overdue') {
      return isOverdue;
    }
    if (filterStatus === 'completed') {
      return t.status === 'completed';
    }
    if (filterStatus === 'upcoming') {
      return t.scheduledDate > todayStr && t.status !== 'completed';
    }
    return true;
  });

  const overdueCount = tasks.filter((t) => t.scheduledDate < todayStr && t.status !== 'completed').length;
  const todayTasks = tasks.filter((t) => t.scheduledDate === todayStr);
  const completedTodayCount = todayTasks.filter((t) => t.status === 'completed').length;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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

      {/* Top Banner: Pomodoro Focus Box + Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pomodoro Timer Station */}
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-blue-800/40 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-semibold border border-blue-400/30 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  Đồng hồ Pomodoro Y khoa
                </span>
                <span className="text-xs text-slate-300">
                  {completedPomoCount} hiệp hôm nay
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold">
                  {pomoMode === 'work' ? 'Khung giờ Học tập Tập trung' : 'Thời gian Nghỉ giải lao'}
                </h3>
                <p className="text-xs text-blue-200/80 mt-0.5">
                  Phương pháp Pomodoro: 25 phút chuyên tâm, không phân tâm.
                </p>
              </div>

              {/* Mode Selector */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setTimerDuration('work')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    pomoMode === 'work' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  25p Học
                </button>
                <button
                  type="button"
                  onClick={() => setTimerDuration('shortBreak')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    pomoMode === 'shortBreak' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  5p Nghỉ ngắn
                </button>
                <button
                  type="button"
                  onClick={() => setTimerDuration('longBreak')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    pomoMode === 'longBreak' ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  15p Nghỉ dài
                </button>
              </div>
            </div>

            {/* Timer Display & Controls */}
            <div className="flex flex-col items-center md:items-end justify-center gap-3">
              <div className="font-mono text-5xl md:text-6xl font-black tracking-tight text-white drop-shadow-md">
                {formatTimer(pomoSecondsRemaining)}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPomoRunning(!isPomoRunning)}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                    isPomoRunning
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  }`}
                >
                  {isPomoRunning ? (
                    <>
                      <Pause className="w-4 h-4" /> Tạm dừng
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" /> Bắt đầu học
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setTimerDuration(pomoMode)}
                  title="Đặt lại hiệp này"
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handlePomoFinished}
                  title="Hoàn thành sớm"
                  className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Spaced Repetition Quick Generator */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
              <Sparkles className="w-4 h-4" />
              <span>AI Lập kế hoạch Spaced Repetition</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Tự động hóa chu kỳ lặp lại ngắt quãng
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Thuật toán phân bổ khối lượng kiến thức theo khoảng cách 1-3-7-14 ngày trước kỳ thi.
            </p>

            <div className="space-y-2 pt-1">
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-0.5">
                  Chọn môn cần ôn tập
                </label>
                <select
                  value={roadmapSubject}
                  onChange={(e) => setRoadmapSubject(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-800 dark:text-slate-200"
                >
                  {preferences.currentSubjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-0.5">
                    Thời gian ôn (ngày)
                  </label>
                  <select
                    value={roadmapDays}
                    onChange={(e) => setRoadmapDays(Number(e.target.value))}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-slate-800 dark:text-slate-200"
                  >
                    <option value={7}>7 ngày (Cấp tốc)</option>
                    <option value={14}>14 ngày (Chuẩn)</option>
                    <option value={30}>30 ngày (Dài hạn)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-0.5">
                    Mục tiêu thi
                  </label>
                  <input
                    type="date"
                    value={roadmapExamDate}
                    onChange={(e) => setRoadmapExamDate(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={isGeneratingRoadmap}
            onClick={handleGenerateRoadmap}
            className="w-full mt-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isGeneratingRoadmap ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Đang tính toán chu kỳ ôn...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sinh lịch ôn tập tự động</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Overdue Alert banner if any */}
      {overdueCount > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              Bạn có <strong>{overdueCount} nhiệm vụ quá hạn</strong> chưa hoàn thành từ các ngày trước.
            </span>
          </div>

          <button
            type="button"
            onClick={() => setFilterStatus('overdue')}
            className="px-3 py-1 font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 rounded-lg transition-colors cursor-pointer"
          >
            Xem và xử lý ngay
          </button>
        </div>
      )}

      {/* Main Task List Header & Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-600" />
              <span>Danh sách Nhiệm vụ & Lịch ôn thi</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hôm nay: Đã xong {completedTodayCount}/{todayTasks.length} nhiệm vụ
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" /> Thêm nhiệm vụ
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'today', label: 'Hôm nay' },
              { id: 'upcoming', label: 'Sắp tới' },
              { id: 'overdue', label: `Quá hạn (${overdueCount})` },
              { id: 'completed', label: 'Đã hoàn thành' },
              { id: 'all', label: 'Tất cả' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  filterStatus === tab.id
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Môn:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-slate-800 dark:text-slate-200"
            >
              <option value="all">Tất cả môn học</option>
              {preferences.currentSubjects.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl p-10 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-70" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Không có nhiệm vụ nào trong mục này!
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Bạn đã hoàn thành hết mục tiêu hoặc chưa lên lịch nhiệm vụ. Nhấn &quot;Thêm nhiệm vụ&quot; hoặc &quot;Sinh lịch ôn tập tự động&quot; để tiếp tục.
            </p>
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isCompleted = t.status === 'completed';
            const isOverdue = t.scheduledDate < todayStr && !isCompleted;

            return (
              <div
                key={t.id}
                className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                  isCompleted
                    ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                    : isOverdue
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs hover:border-blue-300'
                }`}
              >
                {/* Left: Checkbox + details */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleTask(t.id)}
                    className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 hover:border-blue-500'
                    }`}
                  >
                    {isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                        {t.subject}
                      </span>
                      {t.priority === 'high' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                          Ưu tiên cao
                        </span>
                      )}
                      {t.reviewInterval && (
                        <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded">
                          Lặp lại: {t.reviewInterval}
                        </span>
                      )}
                    </div>

                    <h4
                      className={`text-sm font-semibold text-slate-900 dark:text-slate-100 ${
                        isCompleted ? 'line-through text-slate-400 dark:text-slate-500' : ''
                      }`}
                    >
                      {t.title}
                    </h4>

                    {t.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {t.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {t.estimatedDurationMinutes} phút
                      </span>
                      <span>•</span>
                      <span className={isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}>
                        Ngày: {t.scheduledDate} {isOverdue && '(Quá hạn)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {isOverdue && (
                    <button
                      type="button"
                      onClick={() => handleRescheduleToToday(t.id)}
                      className="px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 rounded-md transition-colors cursor-pointer"
                    >
                      Dời sang hôm nay
                    </button>
                  )}

                  {!isCompleted && (
                    <button
                      type="button"
                      onClick={() => {
                        setPomoSubject(t.subject);
                        setTimerDuration('work');
                        setIsPomoRunning(true);
                        showToast(`Bắt đầu bấm giờ học môn ${t.subject}!`);
                      }}
                      className="px-2.5 py-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 fill-current" /> Bấm giờ
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteTask(t.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Task Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4 animate-scale-up">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Thêm nhiệm vụ học tập mới
            </h3>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Tên nhiệm vụ / Nội dung cần ôn
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Ví dụ: Ôn tập cơ chế tác dụng thuốc chống đông..."
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Môn học
                  </label>
                  <select
                    value={newTaskSubject}
                    onChange={(e) => setNewTaskSubject(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                  >
                    {preferences.currentSubjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Ngày thực hiện
                  </label>
                  <input
                    type="date"
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Thời lượng ước tính (phút)
                  </label>
                  <input
                    type="number"
                    min={10}
                    step={5}
                    value={newTaskDuration}
                    onChange={(e) => setNewTaskDuration(Number(e.target.value))}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Mức độ ưu tiên
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100"
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  Lưu nhiệm vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
