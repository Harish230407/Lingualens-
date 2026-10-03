import { Router, Request, Response } from 'express';
import { db } from '../database/store.ts';
import { detectLanguages } from '../nlp/language_detector.ts';
import { getModelProvider } from '../models/model_provider.ts';

const router = Router();

// GET /api/chats/search?q=query
router.get('/search', (req: Request, res: Response) => {
  const query = (req.query.q as string) || '';
  const results = db.searchChats(query);
  res.json({ query, results });
});

// GET /api/chats
router.get('/', (_req: Request, res: Response) => {
  const chats = db.getChats();
  res.json(chats);
});

// POST /api/chats
router.post('/', (req: Request, res: Response) => {
  const { title, tags } = req.body;
  const chat = db.createChat(title || 'New Linguistic Evaluation', tags || []);
  res.status(201).json(chat);
});

// GET /api/chats/:id
router.get('/:id', (req: Request, res: Response) => {
  const chat = db.getChat(req.params.id);
  if (!chat) {
    return res.status(404).json({ error: { code: 'CHAT_NOT_FOUND', message: 'Chat conversation not found' } });
  }
  const messages = db.getMessages(chat.id);
  res.json({ ...chat, messages });
});

// PATCH /api/chats/:id
router.patch('/:id', (req: Request, res: Response) => {
  const updated = db.updateChat(req.params.id, req.body);
  if (!updated) {
    return res.status(404).json({ error: { code: 'CHAT_NOT_FOUND', message: 'Chat conversation not found' } });
  }
  res.json(updated);
});

// DELETE /api/chats/:id
router.delete('/:id', (req: Request, res: Response) => {
  const deleted = db.deleteChat(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: { code: 'CHAT_NOT_FOUND', message: 'Chat not found' } });
  }
  res.json({ success: true, deletedId: req.params.id });
});

// DELETE /api/chats/:id/messages (Clear conversation)
router.delete('/:id/messages', (req: Request, res: Response) => {
  const cleared = db.clearChatMessages(req.params.id);
  if (!cleared) {
    return res.status(404).json({ error: { code: 'CHAT_NOT_FOUND', message: 'Chat not found' } });
  }
  res.json({ success: true });
});

// POST /api/chats/:id/messages
router.post('/:id/messages', async (req: Request, res: Response) => {
  const chatId = req.params.id;
  const chat = db.getChat(chatId);
  if (!chat) {
    return res.status(404).json({ error: { code: 'CHAT_NOT_FOUND', message: 'Chat not found' } });
  }

  const { content, attachments } = req.body;
  if (!content && (!attachments || attachments.length === 0)) {
    return res.status(400).json({ error: { code: 'EMPTY_MESSAGE', message: 'Message content cannot be empty' } });
  }

  // 1. Run real-time NLP analysis on the user message
  const userLangAnalysis = detectLanguages(content || '');

  // 2. Persist user message
  const userMsg = db.addMessage({
    chatId,
    role: 'user',
    content: content || '',
    attachments: attachments || [],
    metadata: {
      detectedLanguages: userLangAnalysis.languages,
      script: userLangAnalysis.script,
      isCodeSwitched: userLangAnalysis.isCodeSwitched,
      codeSwitchPoints: userLangAnalysis.codeSwitchPoints,
      transliterationProbability: userLangAnalysis.transliterationProbability,
      confidence: userLangAnalysis.confidence,
    },
  });

  // 3. Select configured model provider
  const settings = db.getSettings();
  const provider = getModelProvider(settings.provider, {
    modelName: settings.defaultModel,
    endpoint: settings.lmStudioEndpoint,
  });

  // System prompt instructing assistant on LinguaLens identity and code-switching awareness
  const systemPrompt = `You are LinguaLens AI, an advanced multilingual AI assistant that understands cross-lingual code-switching (Hinglish, Tanglish, Teluglish, mixed scripts, transliterated colloquial text).
When users communicate using code-switching or regional phrasing:
1. Comprehend the real-world intended meaning without forcing them to switch to standard English.
2. Be helpful, direct, and culturally aware.
3. If appropriate, highlight the code-switching nuance or offers to run a robustness benchmark.`;

  const modelResp = await provider.generate(content || 'Analyze the attached media', systemPrompt);

  // 4. Check if message is a candidate for a robustness benchmark run
  const isCandidate = userLangAnalysis.isCodeSwitched || userLangAnalysis.transliterationProbability > 0.4;

  const assistantMsg = db.addMessage({
    chatId,
    role: 'assistant',
    content: modelResp.text,
    metadata: {
      modelUsed: modelResp.model,
      latencyMs: modelResp.latencyMs,
      tokens: modelResp.tokens,
      suggestedRobustnessRun: isCandidate,
    },
  });

  res.status(201).json({
    userMessage: userMsg,
    assistantMessage: assistantMsg,
    languageAnalysis: userLangAnalysis,
  });
});

// POST /api/messages/:id/feedback
router.post('/messages/:id/feedback', (req: Request, res: Response) => {
  const { feedback } = req.body;
  if (feedback !== 'positive' && feedback !== 'negative' && feedback !== null) {
    return res.status(400).json({ error: { code: 'INVALID_FEEDBACK', message: 'Feedback must be positive, negative, or null' } });
  }
  const updated = db.setMessageFeedback(req.params.id, feedback);
  if (!updated) {
    return res.status(404).json({ error: { code: 'MESSAGE_NOT_FOUND', message: 'Message not found' } });
  }
  res.json({ success: true, message: updated });
});

export default router;
