import { Router, Request, Response } from 'express';
import { db } from '../database/store.ts';
import {
  getSupportedLanguages,
  getCoursesByLanguage,
  getCourse,
  getLesson,
  submitLessonAttempt,
  evaluateWriting,
  evaluateSpeechRecognition,
} from '../services/learning_service.ts';

const router = Router();

// 1. GET /api/learning/languages - Only display languages the backend actually supports
router.get('/languages', (_req: Request, res: Response) => {
  const languages = getSupportedLanguages();
  res.json(languages);
});

// 2. GET /api/learning/courses - Courses/Levels for given language (or all)
router.get('/courses', (req: Request, res: Response) => {
  const languageId = req.query.languageId as string | undefined;
  const courses = getCoursesByLanguage(languageId);
  res.json(courses);
});

// 3. GET /api/learning/courses/:id - Course by ID
router.get('/courses/:id', (req: Request, res: Response) => {
  const course = getCourse(req.params.id);
  if (!course) {
    return res.status(404).json({ error: { code: 'COURSE_NOT_FOUND', message: 'Course not found' } });
  }
  res.json(course);
});

// 4. GET /api/learning/lessons/:id - Lesson with exercises
router.get('/lessons/:id', (req: Request, res: Response) => {
  const lesson = getLesson(req.params.id);
  if (!lesson) {
    return res.status(404).json({ error: { code: 'LESSON_NOT_FOUND', message: 'Lesson not found' } });
  }
  res.json(lesson);
});

// 5. POST /api/learning/lessons/:id/submit & POST /api/learning/submit - Submit lesson attempt
const handleSubmission = (req: Request, res: Response) => {
  const lessonId = req.params.id || req.body.lessonId;
  const answers = req.body.answers;

  if (!lessonId || !Array.isArray(answers)) {
    return res.status(400).json({
      error: { code: 'INVALID_SUBMISSION', message: 'lessonId and answers array required' },
    });
  }

  try {
    const outcome = submitLessonAttempt(lessonId, answers);
    res.json(outcome);
  } catch (err: any) {
    res.status(400).json({
      error: { code: 'SUBMISSION_FAILED', message: err?.message || 'Failed to submit lesson' },
    });
  }
};

router.post('/lessons/:id/submit', handleSubmission);
router.post('/submit', handleSubmission);

// 6. GET /api/learning/progress - Persistent user progress (XP, streak, daily goal)
router.get('/progress', (_req: Request, res: Response) => {
  const progress = db.getLearningProgress();
  res.json(progress);
});

// 7. PUT /api/learning/progress/language - Switch active learning language & level
router.put('/progress/language', (req: Request, res: Response) => {
  const { languageId, levelId } = req.body;
  if (!languageId) {
    return res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'languageId is required' } });
  }
  const targetLevelId = levelId || `${languageId}_a1`;
  const updated = db.setActiveLanguage(languageId, targetLevelId);
  res.json(updated);
});

// 8. PUT /api/learning/daily-goal - Update daily XP goal
router.put('/daily-goal', (req: Request, res: Response) => {
  const { category, xp } = req.body;
  const validCategories = ['casual', 'regular', 'serious', 'intense'];
  const cat = validCategories.includes(category) ? category : 'regular';
  const goalXp = Number(xp) || (cat === 'casual' ? 10 : cat === 'serious' ? 30 : cat === 'intense' ? 50 : 20);

  const updated = db.updateDailyGoal(cat as any, goalXp);
  res.json(updated);
});

// 9. GET /api/learning/review - Mistakes for personalized review
router.get('/review', (req: Request, res: Response) => {
  const languageId = req.query.languageId as string | undefined;
  const mistakes = db.getMistakes(languageId);
  res.json(mistakes);
});

// 10. POST /api/learning/review/submit - Resolve a mistake through practice (+5 XP)
router.post('/review/submit', (req: Request, res: Response) => {
  const { mistakeId } = req.body;
  if (!mistakeId) {
    return res.status(400).json({ error: { code: 'INVALID_REQUEST', message: 'mistakeId is required' } });
  }
  const result = db.resolveMistake(mistakeId);
  res.json(result);
});

// 11. POST /api/learning/evaluate-writing - LinguaLens intelligent AI grammar check
router.post('/evaluate-writing', async (req: Request, res: Response) => {
  const { targetLanguage, prompt, studentText, expectedSentence } = req.body;
  if (!studentText) {
    return res.status(400).json({ error: { code: 'INVALID_INPUT', message: 'studentText is required' } });
  }
  try {
    const analysis = await evaluateWriting(
      targetLanguage || 'English',
      prompt || '',
      studentText,
      expectedSentence || ''
    );
    res.json(analysis);
  } catch (err: any) {
    res.status(500).json({ error: { code: 'ANALYSIS_FAILED', message: err?.message || 'Writing analysis failed' } });
  }
});

// 12. POST /api/learning/evaluate-speech - Speech recognition transcript evaluation
router.post('/evaluate-speech', (req: Request, res: Response) => {
  const { targetLanguage, recognizedText, targetText } = req.body;
  if (!recognizedText || !targetText) {
    return res.status(400).json({
      error: { code: 'INVALID_INPUT', message: 'recognizedText and targetText are required' },
    });
  }
  const result = evaluateSpeechRecognition(targetLanguage || 'English', recognizedText, targetText);
  res.json(result);
});

// 13. POST /api/learning/hearts/decrement - Functional hearts/lives support
router.post('/hearts/decrement', (_req: Request, res: Response) => {
  const remaining = db.decrementHeart();
  res.json({ hearts: remaining });
});

router.post('/hearts/replenish', (_req: Request, res: Response) => {
  const remaining = db.replenishHearts();
  res.json({ hearts: remaining });
});

export default router;
