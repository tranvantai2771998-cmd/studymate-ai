export type NavigationTab =
  | 'dashboard'
  | 'summarizer'
  | 'explainer'
  | 'quiz'
  | 'planner'
  | 'library'
  | 'history'
  | 'analytics'
  | 'settings';

export type UserRole = 'medical' | 'dental' | 'university' | 'general';

export interface ExaminationDate {
  id: string;
  subject: string;
  title: string;
  date: string; // YYYY-MM-DD
  daysRemaining?: number;
}

export interface UserPreferences {
  userName: string;
  userRole: UserRole;
  preferredLanguage: 'vi' | 'en';
  dailyStudyGoalMinutes: number;
  preferredStudyDays: string[];
  currentSubjects: string[];
  examinationDates: ExaminationDate[];
  notebookLmUrl?: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  content: string;
  materialType: 'lecture_note' | 'textbook_chapter' | 'clinical_guideline' | 'research_paper';
  tags: string[];
  isFavorite?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface StudySummary {
  id: string;
  materialId?: string;
  title: string;
  subject: string;
  tags: string[];
  detailLevel: 'concise' | 'standard' | 'detailed' | 'deepdive';
  language: string;
  overview: string;
  keyPoints: string[];
  glossary: { term: string; definition: string }[];
  clinicalAspects?: {
    anatomicalStructures?: string;
    clinicalManifestations?: string;
    diagnosticPrinciples?: string;
    treatmentPrinciples?: string;
    contraindications?: string;
  };
  reflectionQuestions: string[];
  pitfalls?: string[];
  takeawayAction?: string;
  isFavorite?: boolean;
  createdAt: number;
}

export type ExplanationMode = 'eli5' | 'practical' | 'deepdive' | 'clinical' | 'socratic';

export interface ConceptNote {
  id: string;
  topic: string;
  subject: string;
  mode: ExplanationMode;
  coreDefinition: string;
  explanation: string;
  mechanism?: string;
  clinicalOrRealWorld?: string;
  analogies?: string[];
  comparisonTable?: { feature: string; thisConcept: string; relatedConcept: string }[];
  keyTakeaways: string[];
  commonMistakes?: string[];
  checkQuestions: string[];
  isFavorite?: boolean;
  createdAt: number;
}

export interface QuizQuestion {
  id: number;
  type?: 'mcq' | 'vignette' | 'multi' | 'tf';
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  optionExplanations: string[];
}

export interface Quiz {
  id: string;
  title: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'exam';
  questionType: 'mcq' | 'vignette' | 'multi' | 'tf';
  timeLimitMinutes?: number;
  questions: QuizQuestion[];
  isFavorite?: boolean;
  createdAt: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  subject: string;
  answers: Record<number, number>;
  score: number;
  totalQuestions: number;
  accuracyPercent: number;
  timeSpentSeconds: number;
  incorrectQuestionIds: number[];
  weakTopics: string[];
  completedAt: number;
}

export interface StudyTask {
  id: string;
  title: string;
  subject: string;
  description: string;
  scheduledDate: string; // YYYY-MM-DD
  estimatedDurationMinutes: number;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'completed' | 'overdue';
  reviewInterval?: string;
  studyMethod?: 'spaced_repetition' | 'active_recall' | 'practice_testing' | 'pomodoro' | 'cumulative_review';
  completedAt?: number;
}

export interface StudySession {
  id: string;
  subject: string;
  durationMinutes: number;
  sessionType: 'pomodoro' | 'reading' | 'quiz_practice' | 'revision';
  completedAt: number;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject: string;
  tags: string[];
  nextReviewDate: string;
  intervalDays: number;
  repetitionCount: number;
}

export interface LearningHistoryItem {
  id: string;
  type: 'summary' | 'concept' | 'quiz_attempt' | 'session_completed' | 'plan_modified';
  title: string;
  subject: string;
  details: string;
  timestamp: number;
  referenceId?: string;
}
