import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  Check,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Volume2,
  Mic,
  MicOff,
  Flame,
  Star,
  Target,
  RotateCcw,
  Heart,
  BookOpen,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Award,
  RefreshCw,
  Clock,
  Languages,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  SupportedLanguage,
  LearningCourse,
  LearningLesson,
  LearningProgress,
  LessonExercise,
  LearnerMistake,
  SpeechEvaluationResult,
} from '../types/index.ts';
import { api } from '../services/api.ts';
import { Interactive3DCard } from './Interactive3DCard';
import { playHapticTick, playSuccessChime } from '../utils/audioHaptics';
import { LinguaLensOrb } from './3d/LinguaLensOrb.tsx';
import { LinguaLensLogo } from './LinguaLensLogo.tsx';

interface LearningViewProps {
  onNavigateToChat: (prompt: string) => void;
}

export const LearningView: React.FC<LearningViewProps> = ({ onNavigateToChat }) => {
  // Global & Course State
  const [supportedLanguages, setSupportedLanguages] = useState<SupportedLanguage[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('english');
  const [courses, setCourses] = useState<LearningCourse[]>([]);
  const [activeCourse, setActiveCourse] = useState<LearningCourse | null>(null);
  const [progress, setProgress] = useState<LearningProgress | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active Lesson State
  const [activeLesson, setActiveLesson] = useState<LearningLesson | null>(null);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [isAnswerChecked, setIsAnswerChecked] = useState<boolean>(false);
  const [lessonCompleteSummary, setLessonCompleteSummary] = useState<any>(null);

  // Exercise Inputs
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [textInputAnswer, setTextInputAnswer] = useState<string>('');
  const [wordOrderTray, setWordOrderTray] = useState<string[]>([]);
  const [wordOrderPool, setWordOrderPool] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechTranscript, setSpeechTranscript] = useState<string>('');
  const [speechEvalResult, setSpeechEvalResult] = useState<SpeechEvaluationResult | null>(null);
  const [writingAiFeedback, setWritingAiFeedback] = useState<any>(null);
  const [isCheckingWriting, setIsCheckingWriting] = useState<boolean>(false);

  // Accumulated answers for submission: Array of answers matching question index
  const [lessonAnswers, setLessonAnswers] = useState<any[]>([]);

  // Modals & Panels
  const [isDailyGoalOpen, setIsDailyGoalOpen] = useState<boolean>(false);
  const [isReviewOpen, setIsReviewOpen] = useState<boolean>(false);
  const [mistakes, setMistakes] = useState<LearnerMistake[]>([]);
  const [activeReviewIdx, setActiveReviewIdx] = useState<number>(0);
  const [reviewAnswerInput, setReviewAnswerInput] = useState<string>('');
  const [reviewFeedback, setReviewFeedback] = useState<string | null>(null);

  // Speech Recognition reference
  const recognitionRef = useRef<any>(null);

  // 1. Initial Data Fetch
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [langs, progressData] = await Promise.all([
        api.getSupportedLanguages(),
        api.getLearningProgress(),
      ]);

      setSupportedLanguages(langs);
      setProgress(progressData);

      const currentLang = progressData.selectedLanguageId || 'english';
      setSelectedLanguage(currentLang);

      const coursesData = await api.getCourses(currentLang);
      setCourses(coursesData);
      if (coursesData.length > 0) {
        setActiveCourse(coursesData[0]);
      }

      // Load mistakes
      const mistList = await api.getMistakes(currentLang);
      setMistakes(mistList);
    } catch (err) {
      console.error('Failed to load language learning data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Language Change Handler
  const handleSelectLanguage = async (langId: string) => {
    playHapticTick();
    setSelectedLanguage(langId);
    try {
      const [updatedProgress, coursesData, mistList] = await Promise.all([
        api.setActiveLanguage(langId),
        api.getCourses(langId),
        api.getMistakes(langId),
      ]);
      setProgress(updatedProgress);
      setCourses(coursesData);
      setActiveCourse(coursesData.length > 0 ? coursesData[0] : null);
      setMistakes(mistList);
    } catch (err) {
      console.error('Failed to switch language:', err);
    }
  };

  // 3. Start Lesson
  const handleStartLesson = async (lessonId: string) => {
    playHapticTick();
    try {
      const lesson = await api.getLesson(lessonId);
      setActiveLesson(lesson);
      setActiveQuestionIdx(0);
      setIsAnswerChecked(false);
      setLessonCompleteSummary(null);
      setLessonAnswers([]);
      resetExerciseInputs(lesson.exercises[0]);
    } catch (err) {
      console.error('Failed to start lesson:', err);
    }
  };

  // Reset per question
  const resetExerciseInputs = (exercise?: LessonExercise) => {
    setSelectedOption(null);
    setTextInputAnswer('');
    setSpeechTranscript('');
    setSpeechEvalResult(null);
    setWritingAiFeedback(null);
    setIsRecording(false);
    if (exercise?.type === 'word_order' && exercise.options) {
      setWordOrderPool([...exercise.options].sort(() => Math.random() - 0.5));
      setWordOrderTray([]);
    } else {
      setWordOrderPool([]);
      setWordOrderTray([]);
    }
  };

  const currentExercise = activeLesson?.exercises[activeQuestionIdx];

  // Speech Recognition setup
  const startSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (currentExercise) {
        setSpeechEvalResult({
          recognizedText: '',
          targetText: currentExercise.targetText,
          accuracyScore: 0,
          isMatch: false,
          missingWords: [],
          extraWords: [],
          feedback: 'Speech Recognition is not supported in this browser. You can type your answer or continue.',
        });
      }
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      // Assign target language locale
      const langLocaleMap: Record<string, string> = {
        english: 'en-US',
        tamil: 'ta-IN',
        hindi: 'hi-IN',
        spanish: 'es-ES',
        telugu: 'te-IN',
        french: 'fr-FR',
      };
      recognition.lang = langLocaleMap[selectedLanguage] || 'en-US';

      recognition.onstart = () => {
        setIsRecording(true);
        playHapticTick();
      };

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSpeechTranscript(transcript);
        setIsRecording(false);

        if (currentExercise) {
          try {
            const evalResult = await api.evaluateSpeech({
              targetLanguage: selectedLanguage,
              recognizedText: transcript,
              targetText: currentExercise.targetText,
            });
            setSpeechEvalResult(evalResult);
            if (evalResult.isMatch) {
              playSuccessChime();
            }
          } catch (e) {
            console.error('Speech eval error', e);
          }
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech recognition error:', e.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsRecording(false);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // Audio Playback
  const handlePlayAudio = (textToPlay?: string) => {
    playHapticTick();
    const text = textToPlay || currentExercise?.audioText || currentExercise?.targetText;
    if (!text || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const langLocaleMap: Record<string, string> = {
      english: 'en-US',
      tamil: 'ta-IN',
      hindi: 'hi-IN',
      spanish: 'es-ES',
      telugu: 'te-IN',
      french: 'fr-FR',
    };
    utterance.lang = langLocaleMap[selectedLanguage] || 'en-US';
    utterance.rate = 0.88; // Slightly slower for language learners
    window.speechSynthesis.speak(utterance);
  };

  // Word Order Tray Handlers
  const handleAddWordToTray = (word: string, indexInPool: number) => {
    if (isAnswerChecked) return;
    playHapticTick();
    setWordOrderTray((prev) => [...prev, word]);
    setWordOrderPool((prev) => prev.filter((_, i) => i !== indexInPool));
  };

  const handleRemoveWordFromTray = (word: string, indexInTray: number) => {
    if (isAnswerChecked) return;
    playHapticTick();
    setWordOrderTray((prev) => prev.filter((_, i) => i !== indexInTray));
    setWordOrderPool((prev) => [...prev, word]);
  };

  // LinguaLens AI Writing check
  const handleCheckWritingFeedback = async () => {
    if (!textInputAnswer.trim() || !currentExercise) return;
    setIsCheckingWriting(true);
    try {
      const feedback = await api.evaluateWriting({
        targetLanguage: selectedLanguage,
        prompt: currentExercise.prompt,
        studentText: textInputAnswer,
        expectedSentence: currentExercise.targetText,
      });
      setWritingAiFeedback(feedback);
    } catch (e) {
      console.error('AI Writing check failed', e);
    } finally {
      setIsCheckingWriting(false);
    }
  };

  // Determine user answer for current exercise
  const getCurrentUserAnswer = () => {
    if (!currentExercise) return null;
    switch (currentExercise.type) {
      case 'multiple_choice':
      case 'reading':
      case 'listening':
        return selectedOption;
      case 'word_order':
        return wordOrderTray;
      case 'translation':
      case 'writing':
        return textInputAnswer.trim();
      case 'speaking':
        return speechTranscript || textInputAnswer.trim();
      default:
        return null;
    }
  };

  // Check Answer Handler
  const handleCheckAnswer = () => {
    if (!currentExercise) return;
    const answer = getCurrentUserAnswer();
    if (answer === null || answer === '' || (Array.isArray(answer) && answer.length === 0)) return;

    playHapticTick();
    setIsAnswerChecked(true);

    let isCorrect = false;
    if (currentExercise.type === 'multiple_choice' || currentExercise.type === 'listening' || currentExercise.type === 'reading') {
      isCorrect = answer === currentExercise.correctAnswer;
    } else if (currentExercise.type === 'word_order') {
      const targetStr = Array.isArray(currentExercise.correctAnswer)
        ? currentExercise.correctAnswer.join(' ')
        : String(currentExercise.correctAnswer);
      isCorrect = (answer as string[]).join(' ').trim().toLowerCase() === targetStr.trim().toLowerCase();
    } else if (currentExercise.type === 'translation' || currentExercise.type === 'writing') {
      const targetStr = String(currentExercise.correctAnswer || currentExercise.targetText).trim().toLowerCase().replace(/[.,!?;:]/g, '');
      const userStr = String(answer).trim().toLowerCase().replace(/[.,!?;:]/g, '');
      isCorrect = userStr === targetStr || userStr.includes(targetStr);
    } else if (currentExercise.type === 'speaking') {
      isCorrect = speechEvalResult ? speechEvalResult.isMatch : false;
    }

    if (isCorrect) {
      playSuccessChime();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#22c55e', '#38bdf8', '#fbbf24', '#a855f7'],
      });
    } else {
      // Decrement heart if mistake
      api.decrementHeart().then((res) => {
        if (progress) {
          setProgress({ ...progress, hearts: res.hearts });
        }
      });
    }
  };

  // Continue to Next Question or Submit
  const handleContinue = async () => {
    if (!activeLesson || !currentExercise) return;
    playHapticTick();

    const currAns = getCurrentUserAnswer();
    const updatedAnswers = [...lessonAnswers, currAns];
    setLessonAnswers(updatedAnswers);

    if (activeQuestionIdx < activeLesson.exercises.length - 1) {
      const nextIdx = activeQuestionIdx + 1;
      setActiveQuestionIdx(nextIdx);
      setIsAnswerChecked(false);
      resetExerciseInputs(activeLesson.exercises[nextIdx]);
    } else {
      // Completed all exercises in lesson! Submit full lesson attempt
      try {
        const summary = await api.submitLesson(activeLesson.id, updatedAnswers);
        setLessonCompleteSummary(summary);
        setProgress(summary.progress);

        playSuccessChime();
        confetti({
          particleCount: 110,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#22c55e', '#38bdf8', '#f59e0b', '#ec4899', '#6366f1'],
        });

        // Refresh mistakes
        const mist = await api.getMistakes(selectedLanguage);
        setMistakes(mist);
      } catch (err) {
        console.error('Failed to submit lesson:', err);
      }
    }
  };

  // Daily Goal Selection Handler
  const handleSetDailyGoal = async (category: 'casual' | 'regular' | 'serious' | 'intense', xp: number) => {
    playHapticTick();
    try {
      const updated = await api.updateDailyGoal(category, xp);
      setProgress(updated);
      setIsDailyGoalOpen(false);
    } catch (e) {
      console.error('Failed to update daily goal:', e);
    }
  };

  // Review Mistake Submit
  const handleReviewSubmit = async (mistake: LearnerMistake) => {
    if (!reviewAnswerInput.trim()) return;
    playHapticTick();

    const cleanInput = reviewAnswerInput.trim().toLowerCase().replace(/[.,!?;:]/g, '');
    const cleanTarget = mistake.correctAnswer.trim().toLowerCase().replace(/[.,!?;:]/g, '');
    const isCorrect = cleanInput === cleanTarget || cleanInput.includes(cleanTarget);

    if (isCorrect) {
      playSuccessChime();
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
      setReviewFeedback('Correct! +5 XP earned.');
      try {
        const res = await api.resolveMistake(mistake.id);
        setProgress(res.progress);
        setTimeout(() => {
          setReviewFeedback(null);
          setReviewAnswerInput('');
          setMistakes((prev) => prev.filter((m) => m.id !== mistake.id));
          if (activeReviewIdx >= mistakes.length - 1) {
            setActiveReviewIdx(0);
          }
        }, 1200);
      } catch (e) {
        console.error('Failed to resolve mistake:', e);
      }
    } else {
      setReviewFeedback(`Not quite. Correct answer: "${mistake.correctAnswer}". Practice again!`);
    }
  };

  // Calculate current course completion percentage
  const totalLessonsInCourse = activeCourse?.totalLessons || 12;
  const completedInCourse =
    activeCourse?.units.reduce((acc, u) => {
      return (
        acc +
        u.lessons.filter((l) => progress?.completedLessonIds.includes(l.id)).length
      );
    }, 0) || 0;

  const courseCompletionPct = Math.min(
    100,
    Math.round((completedInCourse / Math.max(1, totalLessonsInCourse)) * 100)
  );

  // Active language object
  const currentLangObj =
    supportedLanguages.find((l) => l.id === selectedLanguage) || supportedLanguages[0];

  // Current next incomplete lesson to continue
  const nextLessonInfo = (() => {
    if (!activeCourse) return null;
    for (const unit of activeCourse.units) {
      for (const lesson of unit.lessons) {
        if (!progress?.completedLessonIds.includes(lesson.id)) {
          return { unit, lesson };
        }
      }
    }
    if (activeCourse.units.length > 0 && activeCourse.units[0].lessons.length > 0) {
      return { unit: activeCourse.units[0], lesson: activeCourse.units[0].lessons[0] };
    }
    return null;
  })();

  // --------------------------------------------------------------------------
  // RENDER: LOADING STATE
  // --------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b0c10] text-stone-400">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-stone-300" />
          <span className="font-mono text-sm">Loading standard language curriculum...</span>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: LESSON COMPLETION SCREEN
  // --------------------------------------------------------------------------
  if (lessonCompleteSummary && activeLesson) {
    return (
      <div className="flex-1 overflow-y-auto bg-[#0b0c10] p-6 md:p-12 flex items-center justify-center">
        <div className="max-w-xl w-full bg-[#12141c] border border-white/[0.08] rounded-2xl p-8 text-center space-y-8 shadow-2xl">
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
              <Award className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-3xl text-stone-100 font-normal">Lesson Complete!</h2>
            <div className="flex items-center justify-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>
            <p className="text-sm text-stone-400">
              {lessonCompleteSummary.isPerfect
                ? 'Flawless work! Perfect accuracy bonus unlocked.'
                : 'Great effort! Your standard language skills are advancing.'}
            </p>
          </div>

          {/* Performance Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
            <div className="bg-white/[0.03] border border-white/[0.05] p-3 rounded-lg">
              <div className="text-[11px] font-mono text-stone-400">XP Earned</div>
              <div className="text-xl font-sans font-semibold text-amber-400 mt-1">
                +{lessonCompleteSummary.xpEarned} XP
              </div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.05] p-3 rounded-lg">
              <div className="text-[11px] font-mono text-stone-400">Accuracy</div>
              <div className="text-xl font-sans font-semibold text-emerald-400 mt-1">
                {lessonCompleteSummary.accuracy}%
              </div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.05] p-3 rounded-lg">
              <div className="text-[11px] font-mono text-stone-400">Words Practiced</div>
              <div className="text-xl font-sans font-semibold text-sky-400 mt-1">
                {lessonCompleteSummary.wordsLearned}
              </div>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.05] p-3 rounded-lg">
              <div className="text-[11px] font-mono text-stone-400">Streak</div>
              <div className="text-xl font-sans font-semibold text-orange-400 mt-1 flex items-center gap-1">
                <Flame className="w-4 h-4 fill-current" />
                {progress?.streakDays || 1}d
              </div>
            </div>
          </div>

          {/* Grammar Focus Learned */}
          <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl text-left space-y-1">
            <div className="text-xs font-mono text-stone-400 uppercase tracking-wider">
              Grammar Focus Practiced
            </div>
            <div className="text-sm font-medium text-stone-200">
              {lessonCompleteSummary.grammarPracticed}
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={() => {
              playHapticTick();
              setActiveLesson(null);
              setLessonCompleteSummary(null);
            }}
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-medium rounded-xl text-sm transition-colors shadow-lg shadow-emerald-500/10 cursor-pointer"
          >
            Continue Learning
          </button>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: ACTIVE LESSON SCREEN (Duolingo-Style Interactive Exercises)
  // --------------------------------------------------------------------------
  if (activeLesson && currentExercise) {
    const isCurrentCorrect = (() => {
      if (!isAnswerChecked) return false;
      const ans = getCurrentUserAnswer();
      if (currentExercise.type === 'multiple_choice' || currentExercise.type === 'listening' || currentExercise.type === 'reading') {
        return ans === currentExercise.correctAnswer;
      }
      if (currentExercise.type === 'word_order') {
        const targetStr = Array.isArray(currentExercise.correctAnswer)
          ? currentExercise.correctAnswer.join(' ')
          : String(currentExercise.correctAnswer);
        return (ans as string[]).join(' ').trim().toLowerCase() === targetStr.trim().toLowerCase();
      }
      if (currentExercise.type === 'translation' || currentExercise.type === 'writing') {
        const targetStr = String(currentExercise.correctAnswer || currentExercise.targetText).trim().toLowerCase().replace(/[.,!?;:]/g, '');
        const userStr = String(ans).trim().toLowerCase().replace(/[.,!?;:]/g, '');
        return userStr === targetStr || userStr.includes(targetStr);
      }
      if (currentExercise.type === 'speaking') {
        return speechEvalResult ? speechEvalResult.isMatch : false;
      }
      return false;
    })();

    const questionProgressPct = Math.round(
      ((activeQuestionIdx + 1) / activeLesson.exercises.length) * 100
    );

    return (
      <div className="flex-1 flex flex-col bg-[#0b0c10] text-stone-200 overflow-y-auto">
        {/* Top Lesson Header with Integrated Centered Progress Bar */}
        <div className="border-b border-white/[0.08] px-4 sm:px-6 py-3.5 bg-[#0e1017]">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <button
              onClick={() => {
                playHapticTick();
                setActiveLesson(null);
              }}
              className="flex items-center gap-1.5 text-xs font-mono text-stone-400 hover:text-stone-200 transition-colors shrink-0 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Exit</span>
            </button>

            {/* Seamless Centered Progress Bar */}
            <div className="flex-1 max-w-md mx-2">
              <div className="w-full bg-white/[0.08] h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${questionProgressPct}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="hidden md:inline text-xs font-mono text-stone-400">
                {currentLangObj?.name || 'Language'} · L{activeLesson.lessonNumber || 1}
              </span>
              <div className="flex items-center gap-1.5 text-rose-400 text-xs font-mono font-medium">
                <Heart className="w-4 h-4 fill-current" />
                <span>{progress?.hearts ?? 5}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Exercise Body */}
        <div className="flex-1 max-w-2xl mx-auto w-full p-6 md:p-8 flex flex-col justify-between space-y-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs font-mono text-stone-400">
              <span>
                Question {activeQuestionIdx + 1} of {activeLesson.exercises.length}
              </span>
              <span className="uppercase tracking-wider px-2 py-0.5 rounded bg-white/[0.05] text-[10px]">
                {currentExercise.type.replace('_', ' ')}
              </span>
            </div>

            {/* Exercise Prompt */}
            <div className="space-y-2">
              <h2 className="font-serif text-2xl md:text-3xl text-stone-100 font-normal leading-snug">
                {currentExercise.prompt}
              </h2>
              {currentExercise.subText && (
                <p className="text-sm text-stone-400">{currentExercise.subText}</p>
              )}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* 1. TRANSLATION EXERCISE */}
            {/* ------------------------------------------------------------- */}
            {currentExercise.type === 'translation' && (
              <div className="space-y-4 pt-2">
                <div className="bg-[#12141c] border border-white/[0.08] p-5 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono text-stone-400">Translate:</div>
                    <div className="text-xl text-stone-100 font-serif mt-1">
                      "{currentExercise.targetText}"
                    </div>
                    {currentExercise.phonetic && (
                      <div className="text-xs font-mono text-stone-400 mt-1">
                        [{currentExercise.phonetic}]
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handlePlayAudio(currentExercise.targetText)}
                    className="p-2.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-stone-300 transition-colors cursor-pointer"
                    title="Play Audio"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono text-stone-400">Your Translation:</label>
                  <input
                    type="text"
                    value={textInputAnswer}
                    onChange={(e) => setTextInputAnswer(e.target.value)}
                    disabled={isAnswerChecked}
                    placeholder="Type the translation..."
                    className="w-full bg-[#12141c] border border-white/[0.1] focus:border-emerald-500/50 rounded-xl px-4 py-3 text-base text-stone-100 outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 2. MULTIPLE CHOICE EXERCISE */}
            {/* ------------------------------------------------------------- */}
            {currentExercise.type === 'multiple_choice' && (
              <div className="space-y-3 pt-2">
                {currentExercise.targetText && (
                  <div className="bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-lg font-serif text-stone-100">
                        {currentExercise.targetText}
                      </div>
                      {currentExercise.phonetic && (
                        <div className="text-xs font-mono text-stone-400 mt-0.5">
                          {currentExercise.phonetic}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handlePlayAudio(currentExercise.targetText)}
                      className="p-2 rounded bg-white/[0.05] hover:bg-white/[0.1] text-stone-300 transition-colors cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {currentExercise.options?.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    let style = 'bg-[#12141c] border-white/[0.08] hover:border-white/[0.2] text-stone-200';
                    if (isSelected) {
                      style = 'bg-white/[0.08] border-emerald-500/60 text-white';
                    }
                    if (isAnswerChecked) {
                      if (idx === currentExercise.correctAnswer) {
                        style = 'bg-emerald-950/30 border-emerald-500 text-emerald-200';
                      } else if (isSelected && !isCurrentCorrect) {
                        style = 'bg-rose-950/30 border-rose-500 text-rose-200';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (isAnswerChecked) return;
                          playHapticTick();
                          setSelectedOption(idx);
                        }}
                        className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${style}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full border border-white/[0.2] flex items-center justify-center text-xs font-mono text-stone-400">
                            {idx + 1}
                          </span>
                          <span className="text-base font-sans">{option}</span>
                        </div>
                        {isSelected && !isAnswerChecked && (
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 3. WORD ORDERING EXERCISE */}
            {/* ------------------------------------------------------------- */}
            {currentExercise.type === 'word_order' && (
              <div className="space-y-6 pt-2">
                {/* Assembled Sentence Tray */}
                <div className="space-y-1.5">
                  <div className="text-xs font-mono text-stone-400">Constructed Sentence:</div>
                  <div className="min-h-[64px] bg-[#12141c] border-2 border-dashed border-white/[0.12] rounded-xl p-3 flex flex-wrap gap-2 items-center">
                    {wordOrderTray.length === 0 ? (
                      <span className="text-xs font-mono text-stone-500 italic">
                        Click words below in correct order...
                      </span>
                    ) : (
                      wordOrderTray.map((word, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleRemoveWordFromTray(word, idx)}
                          disabled={isAnswerChecked}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 font-sans text-sm font-medium hover:bg-emerald-500/30 transition-colors cursor-pointer"
                        >
                          {word}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Available Word Chips Pool */}
                <div className="space-y-1.5">
                  <div className="text-xs font-mono text-stone-400">Available Words:</div>
                  <div className="flex flex-wrap gap-2.5 pt-1">
                    {wordOrderPool.map((word, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAddWordToTray(word, idx)}
                        disabled={isAnswerChecked}
                        className="px-4 py-2 rounded-xl bg-white/[0.05] border border-white/[0.1] text-stone-200 hover:bg-white/[0.1] hover:border-white/[0.2] transition-colors font-sans text-sm font-medium cursor-pointer"
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 4. LISTENING EXERCISE */}
            {/* ------------------------------------------------------------- */}
            {currentExercise.type === 'listening' && (
              <div className="space-y-6 pt-2 text-center">
                <div className="inline-flex flex-col items-center justify-center p-6 bg-[#12141c] border border-white/[0.08] rounded-2xl mx-auto space-y-3">
                  <button
                    onClick={() => handlePlayAudio(currentExercise.audioText || currentExercise.targetText)}
                    className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 flex items-center justify-center transition-transform hover:scale-105 shadow-xl shadow-emerald-500/10 cursor-pointer"
                  >
                    <Volume2 className="w-8 h-8" />
                  </button>
                  <span className="text-xs font-mono text-stone-400">
                    Click to listen to the target audio clip
                  </span>
                </div>

                <div className="text-left space-y-2">
                  <div className="text-xs font-mono text-stone-400">What did you hear?</div>
                  <div className="space-y-2">
                    {currentExercise.options?.map((option, idx) => {
                      const isSelected = selectedOption === idx;
                      let style = 'bg-[#12141c] border-white/[0.08] hover:border-white/[0.2] text-stone-200';
                      if (isSelected) {
                        style = 'bg-white/[0.08] border-emerald-500/60 text-white';
                      }
                      if (isAnswerChecked) {
                        if (idx === currentExercise.correctAnswer) {
                          style = 'bg-emerald-950/30 border-emerald-500 text-emerald-200';
                        } else if (isSelected && !isCurrentCorrect) {
                          style = 'bg-rose-950/30 border-rose-500 text-rose-200';
                        }
                      }
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            if (isAnswerChecked) return;
                            playHapticTick();
                            setSelectedOption(idx);
                          }}
                          className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${style}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full border border-white/[0.2] flex items-center justify-center text-xs font-mono text-stone-400 shrink-0 font-medium">
                              {idx + 1}
                            </span>
                            <span className="text-base font-sans">{option}</span>
                          </div>
                          {isSelected && !isAnswerChecked && (
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 5. SPEAKING EXERCISE */}
            {/* ------------------------------------------------------------- */}
            {currentExercise.type === 'speaking' && (
              <div className="space-y-6 pt-2">
                <div className="bg-[#12141c] border border-white/[0.08] p-5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-stone-400">Say this sentence:</span>
                    <button
                      onClick={() => handlePlayAudio(currentExercise.targetText)}
                      className="p-1.5 rounded bg-white/[0.05] hover:bg-white/[0.1] text-stone-300"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-2xl font-serif text-stone-100">
                    "{currentExercise.targetText}"
                  </div>
                  {currentExercise.phonetic && (
                    <div className="text-xs font-mono text-stone-400">
                      [{currentExercise.phonetic}]
                    </div>
                  )}
                </div>

                {/* Microphone Record & Feedback */}
                <div className="text-center space-y-4">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={isRecording ? stopSpeechRecognition : startSpeechRecognition}
                      disabled={isAnswerChecked}
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform hover:scale-105 cursor-pointer ${
                        isRecording
                          ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/20'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-lg shadow-emerald-500/10'
                      }`}
                    >
                      {isRecording ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                    </button>
                  </div>
                  <div className="text-xs font-mono text-stone-400">
                    {isRecording ? 'Listening... Speak clearly now' : 'Click the microphone to speak'}
                  </div>

                  {speechTranscript && (
                    <div className="bg-white/[0.03] border border-white/[0.08] p-4 rounded-xl text-left space-y-2">
                      <div className="text-[11px] font-mono text-stone-400">You said:</div>
                      <div className="text-sm font-sans text-stone-200 font-medium">
                        "{speechTranscript}"
                      </div>
                      {speechEvalResult && (
                        <div className="text-xs font-mono pt-1 border-t border-white/[0.05] flex items-center justify-between">
                          <span
                            className={
                              speechEvalResult.isMatch ? 'text-emerald-400' : 'text-amber-400'
                            }
                          >
                            Pronunciation / Match: {speechEvalResult.accuracyScore}%
                          </span>
                          <span className="text-stone-400 text-[11px]">
                            {speechEvalResult.isMatch ? 'Recognized!' : 'Review words'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 6. READING EXERCISE */}
            {/* ------------------------------------------------------------- */}
            {currentExercise.type === 'reading' && (
              <div className="space-y-5 pt-2">
                <div className="bg-[#12141c] border border-white/[0.08] p-5 rounded-xl space-y-2">
                  <div className="text-xs font-mono text-stone-400">Reading Passage:</div>
                  <p className="text-base text-stone-200 font-sans leading-relaxed">
                    {currentExercise.readingPassage}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="text-sm font-medium text-stone-100">
                    {currentExercise.readingQuestion}
                  </div>
                  <div className="space-y-2">
                    {currentExercise.options?.map((option, idx) => {
                      const isSelected = selectedOption === idx;
                      let style = 'bg-[#12141c] border-white/[0.08] hover:border-white/[0.2] text-stone-200';
                      if (isSelected) style = 'bg-white/[0.08] border-emerald-500/60 text-white';
                      if (isAnswerChecked) {
                        if (idx === currentExercise.correctAnswer) {
                          style = 'bg-emerald-950/30 border-emerald-500 text-emerald-200';
                        } else if (isSelected && !isCurrentCorrect) {
                          style = 'bg-rose-950/30 border-rose-500 text-rose-200';
                        }
                      }
                      return (
                        <button
                          key={idx}
                          onClick={() => {
                            if (isAnswerChecked) return;
                            playHapticTick();
                            setSelectedOption(idx);
                          }}
                          className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${style}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full border border-white/[0.2] flex items-center justify-center text-xs font-mono text-stone-400 shrink-0 font-medium">
                              {idx + 1}
                            </span>
                            <span className="text-base font-sans">{option}</span>
                          </div>
                          {isSelected && !isAnswerChecked && (
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 7. WRITING EXERCISE (LinguaLens AI Grammar Diagnosis) */}
            {/* ------------------------------------------------------------- */}
            {currentExercise.type === 'writing' && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <label className="text-xs font-mono text-stone-400">
                    Produce the target sentence:
                  </label>
                  <textarea
                    rows={3}
                    value={textInputAnswer}
                    onChange={(e) => setTextInputAnswer(e.target.value)}
                    disabled={isAnswerChecked}
                    placeholder="Write the full sentence..."
                    className="w-full bg-[#12141c] border border-white/[0.1] focus:border-emerald-500/50 rounded-xl p-4 text-base text-stone-100 outline-none resize-none transition-colors"
                  />
                </div>

                {/* LinguaLens Intelligence button */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={handleCheckWritingFeedback}
                    disabled={!textInputAnswer.trim() || isCheckingWriting}
                    className="inline-flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-stone-300 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{isCheckingWriting ? 'Analyzing syntax...' : 'Run LinguaLens Grammar Check'}</span>
                  </button>
                </div>

                {writingAiFeedback && (
                  <div
                    className={`p-4 rounded-xl border text-left space-y-1.5 ${
                      writingAiFeedback.isCorrect
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                        : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                    }`}
                  >
                    {writingAiFeedback.issue && (
                      <div className="text-xs font-mono uppercase tracking-wider font-semibold">
                        Issue: {writingAiFeedback.issue}
                      </div>
                    )}
                    {writingAiFeedback.suggestedCorrection && (
                      <div className="text-xs font-mono">
                        Suggested Correction: "{writingAiFeedback.suggestedCorrection}"
                      </div>
                    )}
                    <div className="text-xs leading-relaxed">{writingAiFeedback.explanation}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Action Tray / Feedback */}
          <div className="pt-6 border-t border-white/[0.08] space-y-4">
            {isAnswerChecked && (
              <div
                className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                  isCurrentCorrect
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                }`}
              >
                {isCurrentCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 text-sm">
                  <div className="font-semibold font-sans">
                    {isCurrentCorrect ? '✓ Correct! +5 XP' : 'Not quite.'}
                  </div>
                  {!isCurrentCorrect && (
                    <div className="text-stone-300 text-xs">
                      Correct answer:{' '}
                      <span className="font-semibold text-stone-100">
                        {Array.isArray(currentExercise.correctAnswer)
                          ? currentExercise.correctAnswer.join(' ')
                          : currentExercise.options
                          ? currentExercise.options[currentExercise.correctAnswer as number]
                          : String(currentExercise.correctAnswer || currentExercise.targetText)}
                      </span>
                    </div>
                  )}
                  <p className="text-xs text-stone-400 leading-relaxed">
                    {currentExercise.explanation}
                  </p>
                </div>
              </div>
            )}

            {!isAnswerChecked ? (
              <button
                onClick={handleCheckAnswer}
                disabled={
                  getCurrentUserAnswer() === null ||
                  getCurrentUserAnswer() === '' ||
                  (Array.isArray(getCurrentUserAnswer()) && (getCurrentUserAnswer() as any[]).length === 0)
                }
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-stone-950 font-medium rounded-xl text-sm transition-colors shadow-lg shadow-emerald-500/10 cursor-pointer"
              >
                CHECK
              </button>
            ) : (
              <button
                onClick={handleContinue}
                className="w-full py-3.5 bg-white hover:bg-stone-200 text-stone-950 font-medium rounded-xl text-sm transition-colors cursor-pointer"
              >
                CONTINUE
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER: MAIN LEARNING DASHBOARD & DUOLINGO-STYLE CURRICULUM
  // --------------------------------------------------------------------------
  return (
    <div className="flex-1 overflow-y-auto bg-[#0b0c10] p-4 sm:p-6 md:p-8 space-y-8">
      {/* 1. Header & Language Selection */}
      <div className="max-w-6xl mx-auto space-y-5 border-b border-white/[0.08] pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                playSuccessChime();
                confetti({
                  particleCount: 25,
                  spread: 50,
                  origin: { y: 0.2 },
                  colors: ['#34d399', '#38bdf8', '#fbbf24'],
                });
              }}
              className="relative p-1.5 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-purple-500/20 border border-white/10 [html[data-theme='light']_&]:border-slate-200 shadow-lg hover:scale-105 transition-transform cursor-pointer shrink-0 group"
              title="LinguaLens Learning Companion"
              aria-label="LinguaLens Logo"
            >
              <LinguaLensLogo size={60} variant="icon" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0b0c10] [html[data-theme='light']_&]:border-white flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              </div>
            </button>
            <div className="space-y-1">
              <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                Language Learning · Focused Node: {selectedLanguage.toUpperCase()}
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl text-stone-100 font-normal">
                What do you want to learn?
              </h1>
            </div>
          </div>

          {/* Daily Goal & Hearts Quick Indicator */}
          <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setIsDailyGoalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-stone-300 transition-colors cursor-pointer"
              title="Configure Daily Goal"
            >
              <Target className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Goal: {progress?.todayXp || 0}/{progress?.dailyGoalXp || 20} XP
              </span>
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-rose-400">
              <Heart className="w-3.5 h-3.5 fill-current" />
              <span>{progress?.hearts ?? 5}</span>
            </div>
          </div>
        </div>

        {/* Supported Languages Filter Tabs (Only real backend supported languages) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {supportedLanguages.map((lang) => {
            const isActive = selectedLanguage === lang.id;
            return (
              <button
                key={lang.id}
                onClick={() => handleSelectLanguage(lang.id)}
                className={`flex items-center gap-2 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white/[0.1] border-emerald-500/60 text-white shadow-sm'
                    : 'bg-[#12141c] border-white/[0.06] text-stone-400 hover:text-stone-200 hover:border-white/[0.15]'
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <span className="font-sans">{lang.name}</span>
                {isActive && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 ml-1">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Real Progress Stats Overview - Pixel-Aligned 4-Card Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak */}
        <div className="bg-[#12141c] border border-white/[0.08] p-5 rounded-2xl flex items-center gap-4 h-full">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
            <Flame className="w-6 h-6 fill-current" />
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-serif text-stone-100 font-normal truncate">
              {progress?.streakDays || 1} day streak
            </div>
            <div className="text-xs font-mono text-stone-400">
              Longest: {progress?.longestStreak || 1} days
            </div>
          </div>
        </div>

        {/* Total XP */}
        <div className="bg-[#12141c] border border-white/[0.08] p-5 rounded-2xl flex items-center gap-4 h-full">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Star className="w-6 h-6 fill-current" />
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-serif text-stone-100 font-normal truncate">
              {progress?.xp || 0} XP
            </div>
            <div className="text-xs font-mono text-stone-400">
              Level: {progress?.level || 'A1 Beginner'}
            </div>
          </div>
        </div>

        {/* Overall Completion Progress */}
        <div className="bg-[#12141c] border border-white/[0.08] p-5 rounded-2xl flex items-center gap-4 h-full">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs font-mono text-stone-400 mb-1.5">
              <span>Your Progress</span>
              <span className="text-stone-200 font-semibold">{courseCompletionPct}%</span>
            </div>
            <div className="w-full bg-white/[0.06] h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${courseCompletionPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Review Mistakes Quick CTA - Symmetrical with other 3 cards */}
        <div className="bg-[#12141c] border border-white/[0.08] p-5 rounded-2xl flex items-center justify-between gap-3 h-full">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-serif text-stone-100 font-normal truncate">
                {mistakes.length} mistakes
              </div>
              <div className="text-xs font-mono text-stone-400">
                To practice
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              playHapticTick();
              setIsReviewOpen(true);
            }}
            disabled={mistakes.length === 0}
            className="px-3.5 py-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] disabled:opacity-40 text-stone-200 text-xs font-mono transition-colors shrink-0 cursor-pointer"
          >
            Review
          </button>
        </div>
      </div>

      {/* 3. Continue Learning & Recommended Practice Hero Row */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Continue Learning Card */}
        <div className="bg-[#12141c] border border-white/[0.08] hover:border-emerald-500/30 rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-4 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                Continue Learning
              </span>
              {nextLessonInfo && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Unit {nextLessonInfo.unit.unitNumber} · Lesson {nextLessonInfo.lesson.lessonNumber}
                </span>
              )}
            </div>

            <div>
              <h3 className="text-xl font-serif text-stone-100 font-normal">
                {nextLessonInfo ? nextLessonInfo.lesson.title : 'Course Completed!'}
              </h3>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                {nextLessonInfo
                  ? nextLessonInfo.lesson.description
                  : 'You have completed all current lessons in this course. You can review any lesson below.'}
              </p>
            </div>

            {nextLessonInfo && (
              <div className="flex items-center gap-2 text-xs font-mono text-stone-400">
                <span className="text-amber-400 font-medium">+{nextLessonInfo.lesson.xpReward} XP</span>
                <span>·</span>
                <span className="text-stone-300">{nextLessonInfo.lesson.grammarFocus}</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-xs font-mono text-stone-400 truncate max-w-[220px]">
              {nextLessonInfo?.unit.title}
            </span>
            <button
              onClick={() => {
                if (nextLessonInfo) handleStartLesson(nextLessonInfo.lesson.id);
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-semibold rounded-xl text-xs font-mono transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              <span>Continue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Recommended Practice Card */}
        <div className="bg-[#12141c] border border-white/[0.08] hover:border-purple-500/30 rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-4 transition-all">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-purple-400 uppercase tracking-wider font-semibold">
                Recommended Practice
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                {mistakes.length} Items Pending
              </span>
            </div>

            <div>
              <h3 className="text-xl font-serif text-stone-100 font-normal">
                Personalized Mistake Review
              </h3>
              <p className="text-xs text-stone-400 mt-1 leading-relaxed">
                {mistakes.length > 0
                  ? `Reinforce ${mistakes.length} vocabulary words and grammar points you previously struggled with during lessons.`
                  : 'Your mistake queue is clear! All practice drills are currently mastered. Review lessons anytime to test retention.'}
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-stone-400">
              <span className="text-purple-400 font-medium">+5 XP per review</span>
              <span>·</span>
              <span className="text-stone-300">Spaced repetition memory reinforcement</span>
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
            <span className="text-xs font-mono text-stone-400">
              {mistakes.length > 0 ? `${mistakes.length} to practice` : 'All caught up'}
            </span>
            <button
              onClick={() => {
                playHapticTick();
                setIsReviewOpen(true);
              }}
              disabled={mistakes.length === 0}
              className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.15] disabled:opacity-40 text-stone-200 font-medium rounded-xl text-xs font-mono transition-colors flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Review Mistakes</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Duolingo-Style Unit & Lesson Curriculum Roadmap */}
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div className="space-y-1">
            <h2 className="font-serif text-2xl md:text-3xl text-stone-100 font-normal">
              {activeCourse?.title || `${currentLangObj?.name} Foundations`}
            </h2>
            <p className="text-xs font-mono text-stone-400">
              CEFR Level: {activeCourse?.cefr || 'A1'} · {activeCourse?.units.length || 3} Units ·{' '}
              {totalLessonsInCourse} Lessons
            </p>
          </div>
        </div>

        {/* Units Roadmap */}
        <div className="space-y-6">
          {activeCourse?.units.map((unit) => {
            const completedCount = unit.lessons.filter((l) =>
              progress?.completedLessonIds.includes(l.id)
            ).length;
            const unitPct = Math.round((completedCount / Math.max(1, unit.lessons.length)) * 100);

            return (
              <div
                key={unit.id}
                className="bg-[#12141c] border border-white/[0.08] rounded-2xl p-5 sm:p-6 space-y-5"
              >
                {/* Unit Header */}
                <div className="border-b border-white/[0.06] pb-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                      Unit {unit.unitNumber}
                    </span>
                    <div className="text-xs font-mono text-stone-300 flex items-center gap-2">
                      <span className="text-stone-400">{completedCount}/{unit.lessons.length} Completed</span>
                      <span className="font-semibold text-emerald-400">{unitPct}%</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-serif text-stone-100 font-normal">{unit.title}</h3>
                    <p className="text-xs text-stone-400 mt-1 leading-relaxed">{unit.description}</p>
                  </div>
                  {/* Unit Progress Bar */}
                  <div className="w-full bg-white/[0.06] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${unitPct}%` }}
                    />
                  </div>
                </div>

                {/* Lessons Grid in Unit - Equal heights, rock-solid alignment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                  {unit.lessons.map((lesson) => {
                    const isCompleted = progress?.completedLessonIds.includes(lesson.id);

                    return (
                      <div
                        key={lesson.id}
                        onClick={() => handleStartLesson(lesson.id)}
                        className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] hover:border-emerald-500/40 p-5 rounded-xl transition-all flex flex-col justify-between h-full group cursor-pointer"
                      >
                        <div className="space-y-2.5 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-6 h-6 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-[11px] font-mono text-stone-300 shrink-0 font-medium">
                                {lesson.lessonNumber}
                              </span>
                              <h4 className="text-base font-serif text-stone-100 font-normal truncate group-hover:text-white transition-colors">
                                {lesson.title}
                              </h4>
                            </div>
                            {isCompleted && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            )}
                          </div>

                          <p className="text-xs text-stone-400 leading-relaxed min-h-[36px] line-clamp-2">
                            {lesson.description}
                          </p>

                          <div className="flex items-center gap-2 text-[11px] font-mono text-stone-400 flex-wrap">
                            <span className="text-amber-400 font-semibold shrink-0">
                              +{lesson.xpReward} XP
                            </span>
                            <span className="text-stone-600">·</span>
                            <span className="text-stone-300 truncate max-w-[200px] sm:max-w-[280px]">
                              {lesson.grammarFocus}
                            </span>
                          </div>
                        </div>

                        {/* Action Footer row neatly pinned to bottom across all cards */}
                        <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between gap-3 mt-4">
                          <span className="text-[11px] font-mono text-stone-400">
                            {isCompleted ? '✓ Completed' : 'Ready to start'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartLesson(lesson.id);
                            }}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 shadow-sm ${
                              isCompleted
                                ? 'bg-white/[0.08] hover:bg-white/[0.15] text-stone-200'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-semibold shadow-emerald-500/10'
                            }`}
                          >
                            <span>{isCompleted ? 'Review' : 'Continue'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. MODAL: PERSONALIZED REVIEW MISTAKES */}
      {isReviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#12141c] border border-white/[0.1] rounded-2xl max-w-xl w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <h3 className="font-serif text-xl text-stone-100">Review Mistakes</h3>
                <p className="text-xs font-mono text-stone-400">
                  Targeted practice on items you struggled with ({mistakes.length} remaining)
                </p>
              </div>
              <button
                onClick={() => setIsReviewOpen(false)}
                className="text-stone-400 hover:text-stone-200 text-xs font-mono"
              >
                Close ✕
              </button>
            </div>

            {mistakes.length === 0 ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-sm text-stone-300 font-serif">
                  No active mistakes to review! Keep practicing lessons to build your standard mastery.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const m = mistakes[activeReviewIdx] || mistakes[0];
                  return (
                    <div className="space-y-4">
                      <div className="bg-white/[0.03] border border-white/[0.06] p-4 rounded-xl space-y-2">
                        <div className="text-xs font-mono text-stone-400">Exercise:</div>
                        <div className="text-sm font-medium text-stone-100">{m.exercisePrompt}</div>
                        {m.grammarPoint && (
                          <div className="text-[11px] font-mono text-amber-400">
                            Grammar Point: {m.grammarPoint}
                          </div>
                        )}
                        <div className="text-xs text-stone-400 pt-1 border-t border-white/[0.04]">
                          {m.explanation}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-mono text-stone-400">
                          Try answering again:
                        </label>
                        <input
                          type="text"
                          value={reviewAnswerInput}
                          onChange={(e) => setReviewAnswerInput(e.target.value)}
                          placeholder="Type correct answer..."
                          className="w-full bg-[#0b0c10] border border-white/[0.1] rounded-xl px-4 py-3 text-sm text-stone-100 outline-none"
                        />
                      </div>

                      {reviewFeedback && (
                        <div
                          className={`text-xs p-3 rounded-lg ${
                            reviewFeedback.includes('Correct')
                              ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {reviewFeedback}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs font-mono text-stone-400">
                          Mistake {activeReviewIdx + 1} of {mistakes.length}
                        </span>
                        <button
                          onClick={() => handleReviewSubmit(m)}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-medium rounded-lg text-xs font-mono cursor-pointer"
                        >
                          Resolve & Submit
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. MODAL: DAILY GOAL CONFIGURATION */}
      {isDailyGoalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#12141c] border border-white/[0.1] rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <h3 className="font-serif text-xl text-stone-100">Set Daily Goal</h3>
                <p className="text-xs font-mono text-stone-400">
                  Consistency builds long-term fluency
                </p>
              </div>
              <button
                onClick={() => setIsDailyGoalOpen(false)}
                className="text-stone-400 hover:text-stone-200 text-xs font-mono"
              >
                Close ✕
              </button>
            </div>

            <div className="space-y-2.5">
              {[
                { cat: 'casual', xp: 10, label: 'Casual', desc: '10 XP / day' },
                { cat: 'regular', xp: 20, label: 'Regular', desc: '20 XP / day' },
                { cat: 'serious', xp: 30, label: 'Serious', desc: '30 XP / day' },
                { cat: 'intense', xp: 50, label: 'Intense', desc: '50 XP / day' },
              ].map((tier) => {
                const isSelected = progress?.dailyGoalCategory === tier.cat;
                return (
                  <button
                    key={tier.cat}
                    onClick={() => handleSetDailyGoal(tier.cat as any, tier.xp)}
                    className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white/[0.1] border-emerald-500/60 text-white'
                        : 'bg-white/[0.02] border-white/[0.06] text-stone-300 hover:border-white/[0.15]'
                    }`}
                  >
                    <div>
                      <div className="font-sans font-medium text-sm">{tier.label}</div>
                      <div className="text-xs font-mono text-stone-400">{tier.desc}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
