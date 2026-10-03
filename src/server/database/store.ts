import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  preferredLanguages: string[];
  defaultVoice: string;
  defaultModel: string;
}

export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  dataUrl?: string;
  analysisSummary?: string;
  duration?: number;
  createdAt: string;
}

export interface MessageMetadata {
  detectedLanguages?: Array<{ language: string; percentage: number }>;
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
  transformationType: string; // e.g. 'pure_english', 'hinglish', 'tanglish', 'mixed_script', 'romanized'
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
  modelProvider: string; // 'gemini' | 'lmstudio' | 'openai' | 'mock'
  modelName: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number; // 0 - 100
  currentStep: string;
  createdAt: string;
  completedAt?: string;
  totalCases: number;
  passCount: number;
  failCount: number;
  partialCount: number;
  overallScore: number; // 0 - 100 "Benchmark Robustness Score"
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
  options?: string[];
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

export interface XPTransaction {
  id: string;
  amount: number;
  reason: 'correct_answer' | 'lesson_completed' | 'perfect_lesson' | 'daily_goal_bonus' | 'review_completed';
  timestamp: string;
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

interface DatabaseSchema {
  users: User[];
  chats: Chat[];
  messages: Message[];
  evaluationRuns: EvaluationRun[];
  evaluationTestCases: EvaluationTestCase[];
  evaluationResults: EvaluationResult[];
  learningProgress: LearningProgress;
  learnerMistakes: LearnerMistake[];
  xpTransactions: XPTransaction[];
  settings: UserSettings;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'lingualens_db.json');

class DatabaseStore {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.loadInitialData();
  }

  private loadInitialData(): DatabaseSchema {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure migrations / backwards compatibility
        if (!parsed.learnerMistakes) parsed.learnerMistakes = [];
        if (!parsed.xpTransactions) parsed.xpTransactions = [];
        if (!parsed.learningProgress) {
          parsed.learningProgress = {
            userId: 'user_default',
            selectedLanguageId: 'english',
            selectedLevelId: 'english_a1',
            xp: 0,
            todayXp: 0,
            dailyGoalXp: 20,
            dailyGoalCategory: 'regular',
            streakDays: 1,
            longestStreak: 1,
            lastLearningDate: new Date().toISOString().split('T')[0],
            completedLessonIds: [],
            hearts: 5,
            level: 'A1 Beginner',
            levelNumber: 1,
            history: [],
          };
        } else {
          // Normalize existing progress
          if (!parsed.learningProgress.selectedLanguageId) parsed.learningProgress.selectedLanguageId = 'english';
          if (!parsed.learningProgress.selectedLevelId) parsed.learningProgress.selectedLevelId = 'english_a1';
          if (parsed.learningProgress.todayXp === undefined) parsed.learningProgress.todayXp = 0;
          if (parsed.learningProgress.dailyGoalXp === undefined) parsed.learningProgress.dailyGoalXp = 20;
          if (!parsed.learningProgress.dailyGoalCategory) parsed.learningProgress.dailyGoalCategory = 'regular';
          if (parsed.learningProgress.hearts === undefined) parsed.learningProgress.hearts = 5;
          if (parsed.learningProgress.longestStreak === undefined) {
            parsed.learningProgress.longestStreak = Math.max(parsed.learningProgress.streakDays || 1, 1);
          }
        }
        return parsed;
      } catch (err) {
        console.error('Failed to parse database file, resetting to defaults', err);
      }
    }

    const initial: DatabaseSchema = {
      users: [
        {
          id: 'user_default',
          name: 'AI Robustness Researcher',
          email: 'researcher@lingualens.ai',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80',
          preferredLanguages: ['English', 'Tamil', 'Hindi', 'Telugu'],
          defaultVoice: 'Kore',
          defaultModel: 'gemini-3.8-flash',
        },
      ],
      chats: [
        {
          id: 'chat_seed_1',
          title: 'Tamil-English Ticket Cancellation Robustness',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          isArchived: false,
          isPinned: true,
          tags: ['Tanglish', 'Intent', 'Code-Switch'],
          messageCount: 4,
          lastMessageSnippet: 'Tanglish input preserved intent cancel_ticket with 92% semantic alignment.',
        },
        {
          id: 'chat_seed_2',
          title: 'Hinglish Colloquial Ambiguity Test',
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          isArchived: false,
          isPinned: false,
          tags: ['Hinglish', 'Negation'],
          messageCount: 6,
          lastMessageSnippet: 'Model inverted intent due to colloquial negation in verb phrase.',
        },
      ],
      messages: [
        {
          id: 'msg_seed_1',
          chatId: 'chat_seed_1',
          role: 'user',
          content: 'I want to test how models handle: "Naalaiku train ticket cancel pannidunga please"',
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
          metadata: {
            detectedLanguages: [
              { language: 'Tamil (Tanglish)', percentage: 65 },
              { language: 'English', percentage: 35 },
            ],
            script: 'latin',
            isCodeSwitched: true,
            codeSwitchPoints: 2,
            transliterationProbability: 0.94,
            confidence: 0.96,
          },
        },
        {
          id: 'msg_seed_2',
          chatId: 'chat_seed_1',
          role: 'assistant',
          content: 'I analyzed your Tanglish input: **"Naalaiku train ticket cancel pannidunga please"**.\n\n- **Intended Intent**: `cancel_ticket` (Target date: Tomorrow / `naalaiku`)\n- **Code-Switching Structure**: Intra-sentential code-switching with English nouns (*train, ticket, please*) embedded inside a Tamil matrix verb frame (*naalaiku ... pannidunga*).\n- **Vulnerability Check**: Standard LLMs without code-switching fine-tuning often miss the temporal modifier *naalaiku* or drop the imperative polite suffix *-dunga*.\n\nWould you like me to generate a 8-variant cross-lingual robustness test suite for this input?',
          createdAt: new Date(Date.now() - 3600000 * 2 + 5000).toISOString(),
          feedback: 'positive',
          metadata: {
            modelUsed: 'gemini-3.8-flash',
            latencyMs: 420,
            tokens: 185,
            suggestedRobustnessRun: true,
          },
        },
      ],
      evaluationRuns: [],
      evaluationTestCases: [],
      evaluationResults: [],
      learningProgress: {
        userId: 'user_default',
        selectedLanguageId: 'english',
        selectedLevelId: 'english_a1',
        xp: 340,
        todayXp: 20,
        dailyGoalXp: 20,
        dailyGoalCategory: 'regular',
        streakDays: 4,
        longestStreak: 7,
        lastLearningDate: new Date().toISOString().split('T')[0],
        completedLessonIds: ['eng_l1'],
        hearts: 5,
        level: 'A1 Beginner',
        levelNumber: 1,
        history: [
          {
            date: new Date().toISOString().split('T')[0],
            lessonId: 'eng_l1',
            score: 100,
            xpEarned: 25,
            accuracy: 100,
          },
        ],
      },
      learnerMistakes: [],
      xpTransactions: [],
      settings: {
        theme: 'dark',
        defaultLanguage: 'English',
        preferredLanguages: ['English', 'Tamil', 'Hindi', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Bengali'],
        defaultVoice: 'Kore',
        defaultModel: 'gemini-3.8-flash',
        provider: 'gemini',
        lmStudioEndpoint: 'http://localhost:1234/v1',
        openAiEndpoint: 'https://api.openai.com/v1',
        temperature: 0.3,
        maxTokens: 1024,
        autoPlayVoice: false,
        saveChatHistory: true,
      },
    };

    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }

  private persist() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2));
      } catch (err) {
        console.error('Failed to persist database file', err);
      }
    }, 100);
  }

  // Chats
  getChats(): Chat[] {
    return [...this.data.chats].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getChat(id: string): Chat | undefined {
    return this.data.chats.find((c) => c.id === id);
  }

  createChat(title: string, tags: string[] = []): Chat {
    const chat: Chat = {
      id: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isArchived: false,
      isPinned: false,
      tags,
      messageCount: 0,
    };
    this.data.chats.unshift(chat);
    this.persist();
    return chat;
  }

  updateChat(id: string, updates: Partial<Chat>): Chat | undefined {
    const chat = this.getChat(id);
    if (!chat) return undefined;
    Object.assign(chat, updates, { updatedAt: new Date().toISOString() });
    this.persist();
    return chat;
  }

  deleteChat(id: string): boolean {
    const index = this.data.chats.findIndex((c) => c.id === id);
    if (index === -1) return false;
    this.data.chats.splice(index, 1);
    this.data.messages = this.data.messages.filter((m) => m.chatId !== id);
    this.persist();
    return true;
  }

  clearChatMessages(chatId: string): boolean {
    this.data.messages = this.data.messages.filter((m) => m.chatId !== chatId);
    const chat = this.getChat(chatId);
    if (chat) {
      chat.messageCount = 0;
      chat.lastMessageSnippet = undefined;
      chat.updatedAt = new Date().toISOString();
    }
    this.persist();
    return true;
  }

  // Messages
  getMessages(chatId: string): Message[] {
    return this.data.messages
      .filter((m) => m.chatId === chatId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  getMessage(id: string): Message | undefined {
    return this.data.messages.find((m) => m.id === id);
  }

  addMessage(msg: Omit<Message, 'id' | 'createdAt'>): Message {
    const message: Message = {
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.messages.push(message);

    const chat = this.getChat(msg.chatId);
    if (chat) {
      chat.messageCount = (chat.messageCount || 0) + 1;
      chat.lastMessageSnippet = msg.content.slice(0, 100);
      chat.updatedAt = message.createdAt;
    }

    this.persist();
    return message;
  }

  setMessageFeedback(messageId: string, feedback: 'positive' | 'negative' | null): Message | undefined {
    const msg = this.getMessage(messageId);
    if (!msg) return undefined;
    msg.feedback = feedback;
    this.persist();
    return msg;
  }

  // Search
  searchChats(query: string) {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const results: Array<{
      chat_id: string;
      title: string;
      snippet: string;
      updated_at: string;
      matched_in: string;
      language?: string;
    }> = [];

    for (const chat of this.data.chats) {
      let matched = false;
      let snippet = chat.lastMessageSnippet || '';

      if (chat.title.toLowerCase().includes(q)) {
        matched = true;
        snippet = `Match in title: ${chat.title}`;
      } else if (Array.isArray(chat.tags) && chat.tags.some((t) => t && t.toLowerCase().includes(q))) {
        matched = true;
        snippet = `Tag match: ${chat.tags.join(', ')}`;
      }

      if (!matched) {
        const msgs = this.getMessages(chat.id);
        for (const m of msgs) {
          if (m.content.toLowerCase().includes(q)) {
            matched = true;
            const idx = m.content.toLowerCase().indexOf(q);
            const start = Math.max(0, idx - 40);
            const end = Math.min(m.content.length, idx + q.length + 50);
            snippet = (start > 0 ? '...' : '') + m.content.slice(start, end) + (end < m.content.length ? '...' : '');
            break;
          } else if (m.metadata?.detectedLanguages?.some((l: any) => l.language && l.language.toLowerCase().includes(q))) {
            matched = true;
            const foundLang = m.metadata.detectedLanguages.find((l: any) => l.language && l.language.toLowerCase().includes(q));
            snippet = `Detected ${foundLang?.language}: "${m.content.slice(0, 60)}"`;
            break;
          }
        }
      }

      if (matched) {
        const matchedIn = chat.title.toLowerCase().includes(q)
          ? 'title'
          : Array.isArray(chat.tags) && chat.tags.some((t) => t && t.toLowerCase().includes(q))
          ? 'tag'
          : 'message';

        results.push({
          chat_id: chat.id,
          title: chat.title,
          snippet,
          updated_at: chat.updatedAt,
          matched_in: matchedIn,
        });
      }
    }

    return results;
  }

  // Evaluation Runs
  getEvaluationRuns(): EvaluationRun[] {
    return [...this.data.evaluationRuns].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getEvaluationRun(id: string): EvaluationRun | undefined {
    return this.data.evaluationRuns.find((r) => r.id === id);
  }

  createEvaluationRun(run: Omit<EvaluationRun, 'id' | 'createdAt'>): EvaluationRun {
    const newRun: EvaluationRun = {
      ...run,
      id: `eval_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.evaluationRuns.unshift(newRun);
    this.persist();
    return newRun;
  }

  updateEvaluationRun(id: string, updates: Partial<EvaluationRun>): EvaluationRun | undefined {
    const run = this.getEvaluationRun(id);
    if (!run) return undefined;
    Object.assign(run, updates);
    this.persist();
    return run;
  }

  addEvaluationTestCases(cases: Omit<EvaluationTestCase, 'id'>[]): EvaluationTestCase[] {
    const created = cases.map((c) => ({
      ...c,
      id: `tc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    }));
    this.data.evaluationTestCases.push(...created);
    this.persist();
    return created;
  }

  getEvaluationTestCases(runId: string): EvaluationTestCase[] {
    return this.data.evaluationTestCases.filter((tc) => tc.runId === runId);
  }

  addEvaluationResults(results: Omit<EvaluationResult, 'id'>[]): EvaluationResult[] {
    const created = results.map((r) => ({
      ...r,
      id: `res_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    }));
    this.data.evaluationResults.push(...created);
    this.persist();
    return created;
  }

  getEvaluationResults(runId: string): EvaluationResult[] {
    return this.data.evaluationResults.filter((r) => r.runId === runId);
  }

  // Learning
  getLearningProgress(): LearningProgress {
    const p = this.data.learningProgress;
    const today = new Date().toISOString().split('T')[0];

    // Check if new calendar day to manage streak & todayXp
    if (p.lastLearningDate && p.lastLearningDate !== today) {
      const lastDate = new Date(p.lastLearningDate);
      const currentDate = new Date(today);
      const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // If gap is more than 1 day, streak is broken
      if (diffDays > 1) {
        p.streakDays = 0;
      }
      p.todayXp = 0;
      this.persist();
    }

    return p;
  }

  updateDailyGoal(dailyGoalCategory: 'casual' | 'regular' | 'serious' | 'intense', dailyGoalXp: number): LearningProgress {
    const p = this.data.learningProgress;
    p.dailyGoalCategory = dailyGoalCategory;
    p.dailyGoalXp = dailyGoalXp;
    this.persist();
    return p;
  }

  setActiveLanguage(languageId: string, levelId: string): LearningProgress {
    const p = this.data.learningProgress;
    p.selectedLanguageId = languageId;
    p.selectedLevelId = levelId;
    this.persist();
    return p;
  }

  decrementHeart(): number {
    const p = this.data.learningProgress;
    p.hearts = Math.max(0, (p.hearts || 5) - 1);
    this.persist();
    return p.hearts;
  }

  replenishHearts(): number {
    const p = this.data.learningProgress;
    p.hearts = 5;
    this.persist();
    return p.hearts;
  }

  recordLessonAttempt(params: {
    lessonId: string;
    score: number; // 0 - 100
    xpEarned: number;
    accuracy: number;
    passed: boolean;
  }): LearningProgress {
    const p = this.data.learningProgress;
    const today = new Date().toISOString().split('T')[0];

    // Streak calculation
    if (!p.lastLearningDate) {
      p.streakDays = 1;
    } else if (p.lastLearningDate === today) {
      // Already active today; streak maintained
      if (p.streakDays === 0) p.streakDays = 1;
    } else {
      const lastDate = new Date(p.lastLearningDate);
      const currentDate = new Date(today);
      const diffDays = Math.round((currentDate.getTime() - lastDate.getTime()) / (1000 * 3600 * 24));
      if (diffDays === 1) {
        p.streakDays = (p.streakDays || 0) + 1;
      } else {
        p.streakDays = 1;
      }
    }

    p.longestStreak = Math.max(p.longestStreak || 1, p.streakDays);
    p.lastLearningDate = today;

    // XP calculation
    p.xp += params.xpEarned;
    p.todayXp = (p.todayXp || 0) + params.xpEarned;

    // Check if daily goal achieved bonus
    if (p.todayXp >= p.dailyGoalXp && (p.todayXp - params.xpEarned) < p.dailyGoalXp) {
      p.xp += 10;
      this.data.xpTransactions.push({
        id: `tx_${Date.now()}_goal`,
        amount: 10,
        reason: 'daily_goal_bonus',
        timestamp: new Date().toISOString(),
      });
    }

    // Add transaction
    this.data.xpTransactions.push({
      id: `tx_${Date.now()}_lesson`,
      amount: params.xpEarned,
      reason: 'lesson_completed',
      timestamp: new Date().toISOString(),
    });

    // Mark completed lesson
    if (params.passed && !p.completedLessonIds.includes(params.lessonId)) {
      p.completedLessonIds.push(params.lessonId);
    }

    // CEFR Level naming
    p.levelNumber = Math.floor(p.xp / 120) + 1;
    if (p.levelNumber >= 6) p.level = 'C1 Advanced';
    else if (p.levelNumber >= 4) p.level = 'B2 Upper Intermediate';
    else if (p.levelNumber >= 3) p.level = 'B1 Intermediate';
    else if (p.levelNumber >= 2) p.level = 'A2 Elementary';
    else p.level = 'A1 Beginner';

    p.history.push({
      date: today,
      lessonId: params.lessonId,
      score: params.score,
      xpEarned: params.xpEarned,
      accuracy: params.accuracy,
    });

    this.persist();
    return p;
  }

  // Mistakes Tracking & Personalized Review
  recordMistakes(mistakes: Omit<LearnerMistake, 'id' | 'timestamp' | 'timesReviewed' | 'resolved'>[]) {
    for (const m of mistakes) {
      // Check if duplicate unresolved mistake exists
      const existing = this.data.learnerMistakes.find(
        (ex) => !ex.resolved && ex.lessonId === m.lessonId && ex.exerciseId === m.exerciseId
      );
      if (existing) {
        existing.userAnswer = m.userAnswer;
        existing.timestamp = new Date().toISOString();
      } else {
        this.data.learnerMistakes.push({
          ...m,
          id: `mst_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          timestamp: new Date().toISOString(),
          timesReviewed: 0,
          resolved: false,
        });
      }
    }
    this.persist();
  }

  getMistakes(languageId?: string): LearnerMistake[] {
    const list = this.data.learnerMistakes.filter((m) => !m.resolved);
    if (languageId) {
      return list.filter((m) => m.languageId === languageId);
    }
    return list;
  }

  resolveMistake(mistakeId: string): { resolved: boolean; xpEarned: number; progress: LearningProgress } {
    const mistake = this.data.learnerMistakes.find((m) => m.id === mistakeId);
    if (!mistake) {
      return { resolved: false, xpEarned: 0, progress: this.data.learningProgress };
    }

    mistake.timesReviewed += 1;
    mistake.resolved = true;

    // Award +5 XP for practicing & resolving mistake
    const p = this.data.learningProgress;
    p.xp += 5;
    p.todayXp = (p.todayXp || 0) + 5;

    this.data.xpTransactions.push({
      id: `tx_${Date.now()}_rev`,
      amount: 5,
      reason: 'review_completed',
      timestamp: new Date().toISOString(),
    });

    this.persist();
    return { resolved: true, xpEarned: 5, progress: p };
  }

  // Settings
  getSettings(): UserSettings {
    return this.data.settings;
  }

  updateSettings(updates: Partial<UserSettings>): UserSettings {
    Object.assign(this.data.settings, updates);
    this.persist();
    return this.data.settings;
  }
}

export const db = new DatabaseStore();
