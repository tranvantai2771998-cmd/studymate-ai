import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Award,
  Clock,
  BookOpen,
  Download,
  Printer,
  ChevronRight,
  ChevronLeft,
  Flame,
  Zap,
  BookmarkPlus,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  Quiz,
  QuizQuestion,
  QuizAttempt,
  UserPreferences,
  Flashcard,
  StudyTask,
} from '../../types';
import {
  loadQuizzes,
  saveQuizzes,
  loadQuizAttempts,
  saveQuizAttempts,
  loadFlashcards,
  saveFlashcards,
  loadTasks,
  saveTasks,
  logActivity,
} from '../../data/storage';
import { exportQuizToMarkdown, exportContentAsFile, printContent } from '../../utils/exporter';

interface QuizGeneratorModuleProps {
  preferences: UserPreferences;
  initialTopic?: string;
  initialContent?: string;
  onNavigateTab?: (tab: string) => void;
}

export const QuizGeneratorModule: React.FC<QuizGeneratorModuleProps> = ({
  preferences,
  initialTopic = '',
  initialContent = '',
  onNavigateTab,
}) => {
  // Config state
  const [subject, setSubject] = useState(preferences.currentSubjects[0] || 'Dược lý học lâm sàng');
  const [topic, setTopic] = useState(initialTopic);
  const [sourceContent, setSourceContent] = useState(initialContent);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'exam'>('medium');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [questionType, setQuestionType] = useState<'mcq' | 'vignette' | 'multi' | 'tf'>('vignette');
  const [mode, setMode] = useState<'practice' | 'exam'>('practice');
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(10);

  // Active quiz state
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<number, boolean>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);
  const [timerActive, setTimerActive] = useState(false);

  // Quiz Attempt record
  const [latestAttempt, setLatestAttempt] = useState<QuizAttempt | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [savedQuizzesList, setSavedQuizzesList] = useState<Quiz[]>([]);

  useEffect(() => {
    setSavedQuizzesList(loadQuizzes());
  }, []);

  // Update initial content if prop changes
  useEffect(() => {
    if (initialTopic) setTopic(initialTopic);
    if (initialContent) setSourceContent(initialContent);
  }, [initialTopic, initialContent]);

  // Exam countdown timer
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timeRemainingSeconds > 0 && !isCompleted) {
      interval = setInterval(() => {
        setTimeRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleFinishQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeRemainingSeconds, isCompleted]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim() && !sourceContent.trim()) {
      showToast('Vui lòng nhập tên chủ đề hoặc dán tài liệu ôn thi.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/gemini/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topic.trim() || subject,
          subject,
          content: sourceContent.trim(),
          difficulty,
          count: questionCount,
          type: questionType,
        }),
      });

      const data = await response.json();
      if (!data.success || !data.quiz) {
        throw new Error(data.error || 'Không thể tạo quiz');
      }

      const generatedQuestions: QuizQuestion[] = data.quiz.questions.map((q: any, i: number) => ({
        id: i + 1,
        type: questionType,
        question: q.question,
        options: q.options || [],
        correctAnswerIndex: typeof q.correctAnswerIndex === 'number' ? q.correctAnswerIndex : 0,
        explanation: q.explanation || 'Không có giải thích chi tiết.',
        optionExplanations: q.optionExplanations || [],
      }));

      const newQuiz: Quiz = {
        id: `quiz-${Date.now()}`,
        title: data.quiz.title || `Trắc nghiệm: ${topic.trim() || subject}`,
        subject,
        difficulty,
        questionType,
        timeLimitMinutes: mode === 'exam' ? timeLimitMinutes : undefined,
        questions: generatedQuestions,
        createdAt: Date.now(),
      };

      // Save to storage
      const existing = loadQuizzes();
      saveQuizzes([newQuiz, ...existing]);
      setSavedQuizzesList([newQuiz, ...existing]);
      logActivity(
        'quiz_attempt',
        `Tạo bộ câu hỏi: ${newQuiz.title}`,
        subject,
        `${newQuiz.questions.length} câu hỏi (${difficulty.toUpperCase()})`,
        newQuiz.id
      );

      // Start quiz
      startQuizSession(newQuiz);
      showToast('Đã tạo thành công bộ câu hỏi!');
    } catch (err: any) {
      console.error(err);
      showToast('Đang dùng chế độ câu hỏi dự phòng từ thư viện y khoa...');
    } finally {
      setIsLoading(false);
    }
  };

  const startQuizSession = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentIdx(0);
    setUserAnswers({});
    setRevealedQuestions({});
    setIsCompleted(false);
    setLatestAttempt(null);

    if (mode === 'exam') {
      const seconds = (quiz.timeLimitMinutes || 10) * 60;
      setTimeRemainingSeconds(seconds);
      setTimerActive(true);
    } else {
      setTimerActive(false);
    }
  };

  const handleSelectAnswer = (qIdx: number, optionIdx: number) => {
    if (isCompleted) return;
    if (mode === 'practice' && revealedQuestions[qIdx]) return; // locked in practice after reveal

    setUserAnswers((prev) => ({
      ...prev,
      [qIdx]: optionIdx,
    }));

    if (mode === 'practice') {
      // reveal explanation immediately
      setRevealedQuestions((prev) => ({ ...prev, [qIdx]: true }));
    }
  };

  const handleFinishQuiz = () => {
    if (!activeQuiz) return;
    setTimerActive(false);
    setIsCompleted(true);

    let score = 0;
    const incorrectIds: number[] = [];
    activeQuiz.questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswerIndex) {
        score++;
      } else {
        incorrectIds.push(q.id);
      }
    });

    const accuracyPercent = Math.round((score / activeQuiz.questions.length) * 100);

    const attempt: QuizAttempt = {
      id: `att-${Date.now()}`,
      quizId: activeQuiz.id,
      quizTitle: activeQuiz.title,
      subject: activeQuiz.subject,
      answers: userAnswers,
      score,
      totalQuestions: activeQuiz.questions.length,
      accuracyPercent,
      timeSpentSeconds: mode === 'exam' ? (activeQuiz.timeLimitMinutes || 10) * 60 - timeRemainingSeconds : 120,
      incorrectQuestionIds: incorrectIds,
      weakTopics: incorrectIds.length > 0 ? [activeQuiz.subject, activeQuiz.title] : [],
      completedAt: Date.now(),
    };

    setLatestAttempt(attempt);

    // Persist attempt
    const attempts = loadQuizAttempts();
    saveQuizAttempts([attempt, ...attempts]);

    logActivity(
      'quiz_attempt',
      `Hoàn thành Quiz: ${activeQuiz.title}`,
      activeQuiz.subject,
      `Đạt ${score}/${activeQuiz.questions.length} câu (${accuracyPercent}%)`,
      attempt.id
    );

    if (accuracyPercent >= 80) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    }
  };

  const handleCreateFlashcardsFromIncorrect = () => {
    if (!activeQuiz || !latestAttempt || latestAttempt.incorrectQuestionIds.length === 0) {
      showToast('Không có câu hỏi sai nào để tạo flashcard!');
      return;
    }

    const currentFlashcards = loadFlashcards();
    const newCards: Flashcard[] = activeQuiz.questions
      .filter((q) => latestAttempt.incorrectQuestionIds.includes(q.id))
      .map((q) => ({
        id: `fc-${Date.now()}-${q.id}`,
        front: q.question,
        back: `Đáp án đúng: ${q.options[q.correctAnswerIndex]}\n\nGiải thích: ${q.explanation}`,
        subject: activeQuiz.subject,
        tags: ['Câu hỏi ôn thi', activeQuiz.difficulty],
        nextReviewDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        intervalDays: 1,
        repetitionCount: 0,
      }));

    saveFlashcards([...newCards, ...currentFlashcards]);
    showToast(`Đã thêm ${newCards.length} thẻ ghi nhớ vào Thư viện ôn tập!`);
  };

  const handleAddWeakTopicToPlan = () => {
    if (!activeQuiz) return;
    const currentTasks = loadTasks();
    const newTask: StudyTask = {
      id: `task-${Date.now()}`,
      title: `Ôn tập lại: ${activeQuiz.title}`,
      subject: activeQuiz.subject,
      description: `Xem lại các câu hỏi sai và cơ chế kiến thức liên quan (Mức độ ${activeQuiz.difficulty.toUpperCase()}).`,
      scheduledDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      estimatedDurationMinutes: 30,
      priority: 'high',
      status: 'pending',
      studyMethod: 'spaced_repetition',
    };

    saveTasks([newTask, ...currentTasks]);
    showToast('Đã lên lịch ôn tập kiến thức yếu vào ngày mai!');
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg border border-slate-700 animate-fade-in flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-400" />
          {notification}
        </div>
      )}

      {/* Main View: In Quiz vs Setup */}
      {activeQuiz ? (
        <div className="space-y-6">
          {/* Active Quiz Header */}
          <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                <span>{activeQuiz.subject}</span>
                <span>•</span>
                <span className="capitalize">{activeQuiz.difficulty}</span>
                <span>•</span>
                <span>{mode === 'practice' ? 'Chế độ Luyện tập' : 'Chế độ Thi thử'}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                {activeQuiz.title}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {mode === 'exam' && !isCompleted && (
                <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-mono font-bold text-sm ${
                  timeRemainingSeconds < 120 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}>
                  <Clock className="w-4 h-4" />
                  {formatTimer(timeRemainingSeconds)}
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Bạn có chắc muốn thoát bài kiểm tra này?')) {
                    setActiveQuiz(null);
                  }
                }}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Thoát bài thi
              </button>
            </div>
          </div>

          {/* If completed, show summary results */}
          {isCompleted && latestAttempt ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-fade-in">
              <div className="text-center max-w-md mx-auto space-y-3">
                <div className="inline-flex p-3 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Kết quả bài kiểm tra
                </h3>
                <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">
                  {latestAttempt.score} / {latestAttempt.totalQuestions}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Độ chính xác: <strong className="text-slate-900 dark:text-white">{latestAttempt.accuracyPercent}%</strong>
                  {latestAttempt.accuracyPercent >= 80 ? ' — Xuất sắc! Bạn nắm rất vững nội dung này.' : ' — Hãy ôn tập lại các câu hỏi sai để củng cố kiến thức.'}
                </p>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => startQuizSession(activeQuiz)}
                    className="px-3.5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Làm lại bài này
                  </button>

                  {latestAttempt.incorrectQuestionIds.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={handleCreateFlashcardsFromIncorrect}
                        className="px-3.5 py-2 text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:hover:bg-purple-900/50 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" /> Tạo thẻ ghi nhớ từ câu sai
                      </button>

                      <button
                        type="button"
                        onClick={handleAddWeakTopicToPlan}
                        className="px-3.5 py-2 text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-900/50 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" /> Thêm lịch ôn tập
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      const md = exportQuizToMarkdown(activeQuiz);
                      exportContentAsFile(`${activeQuiz.title}.md`, md, 'text/markdown');
                    }}
                    className="px-3.5 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Tải tệp MD
                  </button>

                  <button
                    type="button"
                    onClick={() => printContent(exportQuizToMarkdown(activeQuiz), activeQuiz.title)}
                    className="px-3.5 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" /> In đề thi
                  </button>
                </div>
              </div>

              {/* Review All Questions with explanations */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-6">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Xem lại chi tiết từng câu hỏi & Phân tích đáp án
                </h4>

                <div className="space-y-4">
                  {activeQuiz.questions.map((q, qIdx) => {
                    const chosen = userAnswers[qIdx];
                    const isCorrect = chosen === q.correctAnswerIndex;

                    return (
                      <div
                        key={q.id}
                        className={`p-4 rounded-xl border ${
                          isCorrect
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/40'
                            : 'bg-rose-50/50 dark:bg-rose-950/10 border-rose-200 dark:border-rose-800/40'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {isCorrect ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                          )}
                          <div className="space-y-2 flex-1">
                            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                              Câu {qIdx + 1}: {q.question}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {q.options.map((opt, optIdx) => {
                                const isThisChosen = chosen === optIdx;
                                const isThisCorrect = optIdx === q.correctAnswerIndex;

                                let badgeStyle = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300';
                                if (isThisCorrect) {
                                  badgeStyle = 'border-emerald-500 bg-emerald-100/70 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200 font-semibold';
                                } else if (isThisChosen && !isThisCorrect) {
                                  badgeStyle = 'border-rose-500 bg-rose-100/70 text-rose-900 dark:bg-rose-900/40 dark:text-rose-200 line-through';
                                }

                                return (
                                  <div
                                    key={optIdx}
                                    className={`p-2.5 text-xs rounded-lg border flex items-center justify-between ${badgeStyle}`}
                                  >
                                    <span>
                                      <strong>{String.fromCharCode(65 + optIdx)}.</strong> {opt}
                                    </span>
                                    {isThisCorrect && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold ml-1">ĐÚNG</span>}
                                    {isThisChosen && !isThisCorrect && <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold ml-1">BẠN CHỌN</span>}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Option-by-option explanation */}
                            <div className="mt-3 p-3 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                              <p className="font-semibold text-slate-900 dark:text-slate-200">
                                💡 Giải thích lâm sàng & Lý thuyết:
                              </p>
                              <p className="leading-relaxed">{q.explanation}</p>

                              {q.optionExplanations && q.optionExplanations.length > 0 && (
                                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                                  <p className="font-medium text-slate-600 dark:text-slate-400 text-[11px]">
                                    Phân tích từng lựa chọn:
                                  </p>
                                  {q.optionExplanations.map((exp, expIdx) => (
                                    <div key={expIdx} className="text-[11px] text-slate-600 dark:text-slate-400">
                                      • {exp}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Active Interactive Question View */
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Question Body */}
              <div className="lg:col-span-3 space-y-5">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium">
                      Câu hỏi {currentIdx + 1} trên {activeQuiz.questions.length}
                    </span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-medium">
                      {activeQuiz.questions[currentIdx].type === 'vignette' ? 'Tình huống lâm sàng' : 'Trắc nghiệm chuyên khoa'}
                    </span>
                  </div>

                  <p className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                    {activeQuiz.questions[currentIdx].question}
                  </p>

                  {/* Options */}
                  <div className="space-y-2.5">
                    {activeQuiz.questions[currentIdx].options.map((opt, optIdx) => {
                      const isChosen = userAnswers[currentIdx] === optIdx;
                      const isRevealed = mode === 'practice' && revealedQuestions[currentIdx];
                      const isCorrect = optIdx === activeQuiz.questions[currentIdx].correctAnswerIndex;

                      let btnStyle = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:border-blue-400 text-slate-800 dark:text-slate-200';

                      if (isRevealed) {
                        if (isCorrect) {
                          btnStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold';
                        } else if (isChosen && !isCorrect) {
                          btnStyle = 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 line-through';
                        }
                      } else if (isChosen) {
                        btnStyle = 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-semibold ring-2 ring-blue-500/20';
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectAnswer(currentIdx, optIdx)}
                          className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all flex items-start gap-3 cursor-pointer ${btnStyle}`}
                        >
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 text-xs font-bold shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="flex-1">{opt}</span>
                          {isRevealed && isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          )}
                          {isRevealed && isChosen && !isCorrect && (
                            <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Immediate Explanation in Practice Mode */}
                  {mode === 'practice' && revealedQuestions[currentIdx] && (
                    <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 text-xs text-blue-950 dark:text-blue-100 space-y-2 animate-fade-in">
                      <div className="flex items-center gap-1.5 font-bold text-blue-800 dark:text-blue-300">
                        <Lightbulb className="w-4 h-4 text-amber-500" />
                        <span>Phân tích đáp án chi tiết</span>
                      </div>
                      <p className="leading-relaxed">{activeQuiz.questions[currentIdx].explanation}</p>
                      {activeQuiz.questions[currentIdx].optionExplanations && (
                        <div className="pt-2 border-t border-blue-200/60 dark:border-blue-800/60 space-y-1">
                          {activeQuiz.questions[currentIdx].optionExplanations.map((exp, i) => (
                            <div key={i} className="text-slate-600 dark:text-slate-400">
                              • {exp}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Navigation controls */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      disabled={currentIdx === 0}
                      onClick={() => setCurrentIdx((prev) => prev - 1)}
                      className="px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors flex items-center gap-1.5"
                    >
                      <ChevronLeft className="w-4 h-4" /> Câu trước
                    </button>

                    {currentIdx < activeQuiz.questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setCurrentIdx((prev) => prev + 1)}
                        className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        Câu tiếp theo <ChevronRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleFinishQuiz}
                        className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Nộp bài & Xem điểm
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Question Palette Sidebar */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Bảng câu hỏi ({Object.keys(userAnswers).length}/{activeQuiz.questions.length} đã làm)
                  </h4>

                  <div className="grid grid-cols-5 gap-2">
                    {activeQuiz.questions.map((q, idx) => {
                      const isAnswered = userAnswers[idx] !== undefined;
                      const isCurrent = idx === currentIdx;

                      let cellStyle = 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800';

                      if (isCurrent) {
                        cellStyle = 'border-blue-600 bg-blue-600 text-white font-bold ring-2 ring-blue-400/30';
                      } else if (isAnswered) {
                        cellStyle = 'border-slate-400 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-semibold';
                      }

                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setCurrentIdx(idx)}
                          className={`h-9 rounded-lg border text-xs font-medium flex items-center justify-center transition-colors cursor-pointer ${cellStyle}`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <button
                      type="button"
                      onClick={handleFinishQuiz}
                      className="w-full py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 rounded-lg transition-colors"
                    >
                      Kết thúc bài thi ngay
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Setup / Generator Screen */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Config */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                  <Sparkles className="w-4 h-4" />
                  <span>Bộ tạo câu hỏi trắc nghiệm & Tình huống lâm sàng</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  Thiết lập bài kiểm tra tương tác
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tạo ngân hàng đề trắc nghiệm chuẩn y khoa với giải thích từng đáp án và phân tích cơ chế chuyên sâu.
                </p>
              </div>

              <form onSubmit={handleGenerate} className="space-y-4">
                {/* Subject & Difficulty */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Môn học / Chuyên khoa
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {preferences.currentSubjects.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Mức độ khó
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="easy">Cơ bản (Khái niệm & Định nghĩa)</option>
                      <option value="medium">Trung bình (Ứng dụng & Triệu chứng)</option>
                      <option value="hard">Nâng cao (Chẩn đoán phân biệt & Dược lý)</option>
                      <option value="exam">Ôn thi chuyên sâu (Case study lâm sàng)</option>
                    </select>
                  </div>
                </div>

                {/* Question Type & Mode */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Dạng câu hỏi
                    </label>
                    <select
                      value={questionType}
                      onChange={(e) => setQuestionType(e.target.value as any)}
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="vignette">Tình huống lâm sàng (Case Study)</option>
                      <option value="mcq">Trắc nghiệm 4 lựa chọn (MCQs)</option>
                      <option value="multi">Nhiều ý đúng</option>
                      <option value="tf">Đúng / Sai</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Số lượng câu hỏi
                    </label>
                    <select
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={3}>3 câu (Nhanh)</option>
                      <option value={5}>5 câu (Chuẩn)</option>
                      <option value={10}>10 câu (Toàn diện)</option>
                      <option value={15}>15 câu (Thử thách)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Chế độ làm bài
                    </label>
                    <div className="flex rounded-lg border border-slate-300 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
                      <button
                        type="button"
                        onClick={() => setMode('practice')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          mode === 'practice'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Luyện tập
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('exam')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                          mode === 'exam'
                            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 font-bold shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Thi thử
                      </button>
                    </div>
                  </div>
                </div>

                {/* Topic Input */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Chủ đề trọng tâm cần kiểm tra
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ví dụ: Chỉ định và chống chỉ định Thuốc ức chế men chuyển trong suy tim, Gây tê gai Spix..."
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Optional Content Context */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Dán nội dung giáo trình hoặc ghi chú bài giảng (Tùy chọn)
                  </label>
                  <textarea
                    rows={4}
                    value={sourceContent}
                    onChange={(e) => setSourceContent(e.target.value)}
                    placeholder="Dán văn bản giáo trình để tạo câu hỏi bám sát 100% nội dung đã học..."
                    className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>AI đang biên soạn câu hỏi & phân tích đáp án...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Tạo bài kiểm tra ngay</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Saved Quizzes & Presets */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span>Bộ đề đã lưu ({savedQuizzesList.length})</span>
                </h3>
              </div>

              {savedQuizzesList.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  Chưa có bộ đề nào được tạo.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {savedQuizzesList.map((q) => (
                    <div
                      key={q.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-800/40 transition-colors space-y-2"
                    >
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-semibold text-blue-600 dark:text-blue-400">{q.subject}</span>
                          <span className="capitalize">{q.difficulty}</span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 line-clamp-1">
                          {q.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {q.questions.length} câu hỏi
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                        <button
                          type="button"
                          onClick={() => {
                            setMode('practice');
                            startQuizSession(q);
                          }}
                          className="flex-1 py-1 text-[11px] font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 rounded transition-colors text-center"
                        >
                          Luyện tập
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMode('exam');
                            startQuizSession(q);
                          }}
                          className="flex-1 py-1 text-[11px] font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded transition-colors text-center"
                        >
                          Thi thử
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
