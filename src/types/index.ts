export interface DetectedLanguage {
  language: string;
  code: string;
  percentage: number;
}

export interface LanguageAnalysisResult {
  languages: DetectedLanguage[];
  primaryLanguage: string;
  script: 'latin' | 'devanagari' | 'tamil' | 'telugu' | 'kannada' | 'malayalam' | 'bengali' | 'mixed';
  isCodeSwitched: boolean;
  codeSwitchPoints: number;
  transliterationProbability: number;
  confidence: number;
  matrixLanguage: string;
  embeddedLanguage?: string;
  tokenAnalysis?: Array<{
    token: string;
    lang: string;
    isCodeSwitchPoint: boolean;
  }>;
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url?: string;
  analysisSummary?: string;
  duration?: number;
  createdAt: string;
}

export interface MessageMetadata {
  detectedLanguages?: DetectedLanguage[];
  script?: string;
  isCodeSwitched?: boolean;
  codeSwitchPoints?: number;
  transliterationProbability?: number;
  confidence?: number;
  modelUsed?: string;
  latencyMs?: number;
  tokens?: number;
  suggestedRobustnessRun?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  attachments?: Attachment[];
  metadata?: MessageMetadata;
  feedback?: 'positive' | 'negative' | null;
}

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isArchived: boolean;
  isPinned: boolean;
  tags: string[];
  messageCount: number;
  lastMessageSnippet?: string;
  messages?: Message[];
}

export interface EvaluationTestCase {
  id: string;
  runId: string;
  sourceText: string;
  variantText: string;
  intendedMeaning: string;
  intent: string;
  languages: string[];
  script: string;
  isCodeSwitched: boolean;
  transformationType: string;
  verified: boolean;
}

export interface EvaluationResult {
  id: string;
  runId: string;
  testCaseId: string;
  transformationType: string;
  variantText: string;
  modelResponse: string;
  predictedIntent: string;
  intentPass: boolean;
  semanticSimilarity: number;
  codeSwitchHandled: boolean;
  transliterationHandled: boolean;
  scriptHandled: boolean;
  latencyMs: number;
  status: 'PASS' | 'FAIL' | 'PARTIAL' | 'UNCERTAIN';
  failureFactors: string[];
  detailedRationale: string;
}

export interface EvaluationRun {
  id: string;
  name: string;
  modelProvider: string;
  modelName: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  createdAt: string;
  completedAt?: string;
  totalCases: number;
  passCount: number;
  failCount: number;
  partialCount: number;
  overallScore: number;
  metrics: {
    intentAccuracy: number;
    semanticConsistency: number;
    codeSwitchRobustness: number;
    transliterationRobustness: number;
    scriptRobustness: number;
  };
  failureBreakdown: Record<string, number>;
  config: {
    sourceIntent: string;
    sourceText: string;
    variants: string[];
  };
}

export type ExerciseType =
  | 'translation'
  | 'multiple_choice'
  | 'word_order'
  | 'listening'
  | 'speaking'
  | 'reading'
  | 'writing';

export interface LessonExercise {
  id: string;
  type: ExerciseType;
  prompt: string;
  targetText: string;
  phonetic?: string;
  translation?: string;
  options?: string[]; // for multiple_choice or word tokens for word_order
  correctAnswer: string | string[] | number;
  audioText?: string;
  readingPassage?: string;
  readingQuestion?: string;
  explanation: string;
  grammarPoint?: string;
  hints?: string[];
  subText?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  correctOptionIndex?: number;
  aiPitfallNote?: string;
}

export interface LearningLesson {
  id: string;
  languageId: string;
  levelId: string;
  unitId: string;
  unitNumber: number;
  lessonNumber: number;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Elementary' | 'Intermediate' | 'Upper Intermediate' | 'Advanced';
  xpReward: number;
  grammarFocus: string;
  vocabularyWords: string[];
  exercises: LessonExercise[];
  courseId?: string;
  unit?: number;
}

export interface LearningUnit {
  id: string;
  levelId: string;
  unitNumber: number;
  title: string;
  description: string;
  lessonCount: number;
  lessons: Array<{
    id: string;
    lessonNumber: number;
    title: string;
    description: string;
    xpReward: number;
    grammarFocus: string;
    completed: boolean;
  }>;
}

export interface LearningCourse {
  id: string;
  languageId: string;
  title: string;
  cefr: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  level: string;
  description: string;
  icon: string;
  totalLessons: number;
  units: LearningUnit[];
  languages?: string[];
}

export interface SupportedLanguage {
  id: string;
  name: string;
  nativeName: string;
  flag: string;
  scriptName: string;
  description: string;
  levelsCount: number;
  totalLessons: number;
  supportedExerciseTypes: ExerciseType[];
}

export interface LearnerMistake {
  id: string;
  userId: string;
  languageId: string;
  lessonId: string;
  exerciseId: string;
  exercisePrompt: string;
  targetText: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  grammarPoint?: string;
  timestamp: string;
  timesReviewed: number;
  resolved: boolean;
}

export interface LearningProgress {
  userId: string;
  selectedLanguageId: string;
  selectedLevelId: string;
  xp: number;
  todayXp: number;
  dailyGoalXp: number;
  dailyGoalCategory: 'casual' | 'regular' | 'serious' | 'intense';
  streakDays: number;
  longestStreak: number;
  lastLearningDate: string;
  completedLessonIds: string[];
  hearts: number;
  level: string;
  levelNumber: number;
  history: Array<{
    date: string;
    lessonId: string;
    score: number;
    xpEarned: number;
    accuracy?: number;
  }>;
}

export interface SpeechEvaluationResult {
  recognizedText: string;
  targetText: string;
  accuracyScore: number; // 0-100
  isMatch: boolean;
  missingWords: string[];
  extraWords: string[];
  feedback: string;
}

export interface WritingAnalysisResult {
  isCorrect: boolean;
  score: number; // 0-100
  overallScore?: number;
  issue?: string;
  suggestedCorrection?: string;
  explanation: string;
  feedback?: string;
}

export interface UserSettings {
  theme: 'dark' | 'light' | 'system';
  defaultLanguage: string;
  preferredLanguages: string[];
  defaultVoice: string;
  defaultModel: string;
  provider: 'gemini' | 'lmstudio' | 'openai' | 'mock';
  lmStudioEndpoint: string;
  openAiEndpoint: string;
  temperature: number;
  maxTokens: number;
  autoPlayVoice: boolean;
  saveChatHistory: boolean;
}

export interface SearchResult {
  chat_id: string;
  title: string;
  snippet: string;
  updated_at: string;
  matched_in: string;
}
