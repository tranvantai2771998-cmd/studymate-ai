import React, { useState, useEffect } from 'react';
import {
  NavigationTab,
  UserPreferences,
  StudyTask,
  StudySession,
  StudySummary,
  ConceptNote,
  Quiz,
  QuizAttempt,
  Flashcard,
} from './types';
import {
  loadPreferences,
  savePreferences,
  loadTasks,
  saveTasks,
  loadSessions,
  saveSessions,
  loadSummaries,
  saveSummaries,
  loadConcepts,
  saveConcepts,
  loadQuizzes,
  saveQuizzes,
  loadQuizAttempts,
  saveQuizAttempts,
  loadFlashcards,
  saveFlashcards,
  calculateDashboardStats,
  logActivity,
} from './data/storage';
import { Sidebar } from './components/Sidebar';
import { TopNavbar } from './components/TopNavbar';
import { DashboardModule } from './components/modules/DashboardModule';
import { SummarizerModule } from './components/modules/SummarizerModule';
import { ConceptExplainerModule } from './components/modules/ConceptExplainerModule';
import { QuizGeneratorModule } from './components/modules/QuizGeneratorModule';
import { StudyPlannerModule } from './components/modules/StudyPlannerModule';
import { StudyLibraryModule } from './components/modules/StudyLibraryModule';
import { HistoryModule } from './components/modules/HistoryModule';
import { AnalyticsModule } from './components/modules/AnalyticsModule';
import { SettingsModule } from './components/modules/SettingsModule';
import { NotebookLMBubble } from './components/NotebookLMBubble';
import { playChimeSound } from './utils/sound';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [libraryInitialTab, setLibraryInitialTab] = useState<'summaries' | 'concepts' | 'quizzes' | 'flashcards' | 'notebook' | undefined>(undefined);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // State data
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences);
  const [tasks, setTasks] = useState<StudyTask[]>(loadTasks);
  const [sessions, setSessions] = useState<StudySession[]>(loadSessions);
  const [summaries, setSummaries] = useState<StudySummary[]>(loadSummaries);
  const [concepts, setConcepts] = useState<ConceptNote[]>(loadConcepts);
  const [quizzes, setQuizzes] = useState<Quiz[]>(loadQuizzes);
  const [attempts, setAttempts] = useState<QuizAttempt[]>(loadQuizAttempts);
  const [flashcards, setFlashcards] = useState<Flashcard[]>(loadFlashcards);

  // Cross-module parameter passing
  const [quizSeedTopic, setQuizSeedTopic] = useState<string>('');
  const [quizSeedContent, setQuizSeedContent] = useState<string>('');

  // Pomodoro quick status
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(25 * 60);

  // Sync dark class on documentElement
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Pomodoro ticking
  useEffect(() => {
    let timer: any = null;
    if (pomodoroActive && pomodoroTimeLeft > 0) {
      timer = setInterval(() => {
        setPomodoroTimeLeft((prev) => {
          if (prev <= 1) {
            setPomodoroActive(false);
            playChimeSound('complete');
            return 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [pomodoroActive, pomodoroTimeLeft]);

  // Stats calculation
  const dashboardStats = calculateDashboardStats();
  const pendingTasksCount = tasks.filter(
    (t) => t.status === 'pending' || (t.scheduledDate <= new Date().toISOString().split('T')[0] && t.status !== 'completed')
  ).length;

  // Handlers
  const handleToggleTask = (id: string) => {
    const updated = tasks.map((t) => {
      if (t.id === id) {
        const nextStatus = t.status === 'completed' ? 'pending' : 'completed';
        if (nextStatus === 'completed') {
          playChimeSound('complete');
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

  const handleRescheduleTask = (id: string, newDate: string) => {
    const updated = tasks.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          scheduledDate: newDate,
          status: 'pending' as const,
        };
      }
      return t;
    });
    setTasks(updated);
    saveTasks(updated);
  };

  const handleSaveSummary = (newSummary: StudySummary) => {
    const updated = [newSummary, ...summaries];
    setSummaries(updated);
    saveSummaries(updated);
  };

  const handleSaveConcept = (newConcept: ConceptNote) => {
    const updated = [newConcept, ...concepts];
    setConcepts(updated);
    saveConcepts(updated);
  };

  const handleCreateFlashcard = (front: string, back: string, subject: string) => {
    const newCard: Flashcard = {
      id: `fc-${Date.now()}`,
      front,
      back,
      subject,
      tags: ['Tự tạo'],
      nextReviewDate: new Date().toISOString().split('T')[0],
      intervalDays: 1,
      repetitionCount: 0,
    };
    const updated = [newCard, ...flashcards];
    setFlashcards(updated);
    saveFlashcards(updated);
  };

  const handleSendToQuiz = (content: string, subject: string) => {
    setQuizSeedTopic(subject);
    setQuizSeedContent(content);
    setCurrentTab('quiz');
  };

  const handleLibraryNavigation = (targetTab: string, itemData?: any) => {
    if (targetTab === 'quiz' && itemData) {
      setQuizSeedTopic(itemData.initialTopic || '');
      setQuizSeedContent(itemData.initialContent || '');
      setCurrentTab('quiz');
    } else if (targetTab === 'explainer') {
      setCurrentTab('explainer');
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased overflow-hidden">
      {/* Collapsible Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'library') setLibraryInitialTab(undefined);
          setCurrentTab(tab);
          setIsMobileSidebarOpen(false);
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        pendingTasksCount={pendingTasksCount}
        preferences={preferences}
      />

      {/* Mobile Drawer Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Navigation Bar */}
        <TopNavbar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          streakDays={dashboardStats.streakDays}
          pomodoroActive={pomodoroActive}
          pomodoroTimeLeft={pomodoroTimeLeft}
          onOpenPomodoro={() => {
            setCurrentTab('planner');
          }}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          preferences={preferences}
          onQuickSearch={(query) => {
            setCurrentTab('library');
          }}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardModule
                stats={dashboardStats}
                tasks={tasks}
                sessions={sessions}
                summaries={summaries}
                recentAttempts={attempts}
                preferences={preferences}
                onToggleTask={handleToggleTask}
                onRescheduleTask={handleRescheduleTask}
                onNavigate={(tab) => setCurrentTab(tab)}
                onStartPomodoro={() => {
                  setCurrentTab('planner');
                }}
              />
            )}

            {currentTab === 'summarizer' && (
              <SummarizerModule
                currentSummary={summaries[0] || null}
                preferences={preferences}
                onSaveSummary={handleSaveSummary}
                onSendToQuiz={handleSendToQuiz}
              />
            )}

            {currentTab === 'explainer' && (
              <ConceptExplainerModule
                currentConcept={concepts[0] || null}
                preferences={preferences}
                onSaveConcept={handleSaveConcept}
                onSendToQuiz={handleSendToQuiz}
                onCreateFlashcard={handleCreateFlashcard}
              />
            )}

            {currentTab === 'quiz' && (
              <QuizGeneratorModule
                preferences={preferences}
                initialTopic={quizSeedTopic}
                initialContent={quizSeedContent}
                onNavigateTab={(tab) => setCurrentTab(tab as NavigationTab)}
              />
            )}

            {currentTab === 'planner' && (
              <StudyPlannerModule
                preferences={preferences}
                onNavigateTab={(tab) => setCurrentTab(tab as NavigationTab)}
              />
            )}

            {currentTab === 'library' && (
              <StudyLibraryModule
                preferences={preferences}
                initialTab={libraryInitialTab}
                onNavigateTab={handleLibraryNavigation}
              />
            )}

            {currentTab === 'history' && (
              <HistoryModule
                preferences={preferences}
                onNavigateTab={(tab, data) => handleLibraryNavigation(tab, data)}
              />
            )}

            {currentTab === 'analytics' && (
              <AnalyticsModule
                preferences={preferences}
                onNavigateTab={(tab) => setCurrentTab(tab as NavigationTab)}
              />
            )}

            {currentTab === 'settings' && (
              <SettingsModule
                preferences={preferences}
                onUpdatePreferences={(newPrefs) => setPreferences(newPrefs)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Floating Embedded Kho Drive & Gemini Notebook Bubble (#nlm-bubble-btn) */}
      <NotebookLMBubble
        preferences={preferences}
        onOpenInAppNotebook={() => {
          setLibraryInitialTab('notebook');
          setCurrentTab('library');
        }}
      />
    </div>
  );
}
