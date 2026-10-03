import {
  Chat,
  Message,
  EvaluationRun,
  EvaluationTestCase,
  EvaluationResult,
  LearningCourse,
  LearningLesson,
  LearningProgress,
  SupportedLanguage,
  LearnerMistake,
  WritingAnalysisResult,
  SpeechEvaluationResult,
  UserSettings,
  SearchResult,
  LanguageAnalysisResult,
} from '../types/index.ts';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errMessage = `HTTP error ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error?.message) {
        errMessage = data.error.message;
      }
    } catch {
      // ignore
    }
    throw new Error(errMessage);
  }

  return res.json();
}

export const api = {
  // Chats
  getChats: () => fetchJson<Chat[]>('/chats'),
  getChat: (id: string) => fetchJson<Chat & { messages: Message[] }>(`/chats/${id}`),
  createChat: (title?: string, tags?: string[]) =>
    fetchJson<Chat>('/chats', {
      method: 'POST',
      body: JSON.stringify({ title, tags }),
    }),
  updateChat: (id: string, updates: Partial<Chat>) =>
    fetchJson<Chat>(`/chats/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
  deleteChat: (id: string) =>
    fetchJson<{ success: boolean; deletedId: string }>(`/chats/${id}`, {
      method: 'DELETE',
    }),
  clearChatMessages: (id: string) =>
    fetchJson<{ success: boolean }>(`/chats/${id}/messages`, {
      method: 'DELETE',
    }),
  sendMessage: (
    chatId: string,
    content: string,
    attachments?: any[]
  ) =>
    fetchJson<{
      userMessage: Message;
      assistantMessage: Message;
      languageAnalysis: LanguageAnalysisResult;
    }>(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content, attachments }),
    }),
  setMessageFeedback: (messageId: string, feedback: 'positive' | 'negative' | null) =>
    fetchJson<{ success: boolean; message: Message }>(`/chats/messages/${messageId}/feedback`, {
      method: 'POST',
      body: JSON.stringify({ feedback }),
    }),
  searchChats: (query: string) =>
    fetchJson<{ query: string; results: SearchResult[] }>(`/chats/search?q=${encodeURIComponent(query)}`),

  // Evaluation
  getEvaluationRuns: () => fetchJson<EvaluationRun[]>('/evaluation/runs'),
  getEvaluationRun: (id: string) => fetchJson<EvaluationRun>(`/evaluation/runs/${id}`),
  getEvaluationResults: (id: string) =>
    fetchJson<{
      run: EvaluationRun;
      testCases: EvaluationTestCase[];
      results: EvaluationResult[];
    }>(`/evaluation/runs/${id}/results`),
  startEvaluationRun: (payload: {
    name?: string;
    sourceText: string;
    sourceIntent?: string;
    modelProvider?: string;
    modelName?: string;
  }) =>
    fetchJson<{ runId: string; status: string; run: EvaluationRun }>('/evaluation/runs', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Standard Language Learning (Duolingo-style progression)
  getSupportedLanguages: () => fetchJson<SupportedLanguage[]>('/learning/languages'),
  getCourses: (languageId?: string) =>
    fetchJson<LearningCourse[]>(languageId ? `/learning/courses?languageId=${encodeURIComponent(languageId)}` : '/learning/courses'),
  getCourse: (id: string) => fetchJson<LearningCourse>(`/learning/courses/${id}`),
  getLesson: (id: string) => fetchJson<LearningLesson>(`/learning/lessons/${id}`),
  submitLesson: (lessonId: string, answers: any[]) =>
    fetchJson<{
      score: number;
      accuracy: number;
      xpEarned: number;
      passed: boolean;
      isPerfect: boolean;
      wordsLearned: number;
      grammarPracticed: string;
      results: Array<{
        questionIndex: number;
        isCorrect: boolean;
        explanation: string;
        correctAnswerText: string;
        userAnswerText: string;
      }>;
      progress: LearningProgress;
    }>(`/learning/lessons/${lessonId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ lessonId, answers }),
    }),
  getLearningProgress: () => fetchJson<LearningProgress>('/learning/progress'),
  setActiveLanguage: (languageId: string, levelId?: string) =>
    fetchJson<LearningProgress>('/learning/progress/language', {
      method: 'PUT',
      body: JSON.stringify({ languageId, levelId }),
    }),
  updateDailyGoal: (category: 'casual' | 'regular' | 'serious' | 'intense', xp?: number) =>
    fetchJson<LearningProgress>('/learning/daily-goal', {
      method: 'PUT',
      body: JSON.stringify({ category, xp }),
    }),
  getMistakes: (languageId?: string) =>
    fetchJson<LearnerMistake[]>(languageId ? `/learning/review?languageId=${encodeURIComponent(languageId)}` : '/learning/review'),
  resolveMistake: (mistakeId: string) =>
    fetchJson<{ resolved: boolean; xpEarned: number; progress: LearningProgress }>('/learning/review/submit', {
      method: 'POST',
      body: JSON.stringify({ mistakeId }),
    }),
  evaluateWriting: (payload: {
    targetLanguage: string;
    prompt?: string;
    studentText: string;
    expectedSentence?: string;
  }) =>
    fetchJson<WritingAnalysisResult>('/learning/evaluate-writing', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  evaluateSpeech: (payload: {
    targetLanguage: string;
    recognizedText: string;
    targetText: string;
  }) =>
    fetchJson<SpeechEvaluationResult>('/learning/evaluate-speech', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  decrementHeart: () => fetchJson<{ hearts: number }>('/learning/hearts/decrement', { method: 'POST' }),
  replenishHearts: () => fetchJson<{ hearts: number }>('/learning/hearts/replenish', { method: 'POST' }),

  // Media & Voice
  uploadMedia: (payload: { filename: string; mimeType: string; size: number; base64Data: string }) =>
    fetchJson<{
      attachmentId: string;
      filename: string;
      mimeType: string;
      size: number;
      createdAt: string;
      url: string;
    }>('/media/upload', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  analyzeMedia: (payload: {
    base64Data?: string;
    mimeType?: string;
    filename?: string;
    targetLanguage?: string;
  }) =>
    fetchJson<{
      title: string;
      description: string;
      detectedLanguages: string[];
      transcription?: string;
      codeSwitchObservations?: string;
      voiceNarrationText: string;
      audioBase64?: string;
    }>('/media/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getVoices: () =>
    fetchJson<{
      defaultVoice: string;
      voices: Array<{ id: string; name: string; gender: string; language: string }>;
    }>('/voice/voices'),
  synthesizeVoice: (payload: { text: string; voiceName?: string; speed?: number; pitch?: number }) =>
    fetchJson<{ audioBase64?: string; voiceName: string; fallbackText: string }>('/voice/tts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  transcribeAudio: (payload: { audioBase64: string; mimeType?: string }) =>
    fetchJson<{ text: string; detectedLanguage?: string }>('/media/transcribe', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Settings
  getSettings: () => fetchJson<UserSettings>('/settings'),
  updateSettings: (settings: Partial<UserSettings>) =>
    fetchJson<UserSettings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),
  deleteHistory: () => fetchJson<{ success: boolean; message: string }>('/settings/history', { method: 'DELETE' }),
};
