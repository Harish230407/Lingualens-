import { Router, Request, Response } from 'express';
import { db } from '../database/store.ts';

const router = Router();

// GET /api/settings
router.get('/', (_req: Request, res: Response) => {
  const settings = db.getSettings();
  res.json(settings);
});

// PUT /api/settings
router.put('/', (req: Request, res: Response) => {
  const updated = db.updateSettings(req.body);
  res.json(updated);
});

// DELETE /api/settings/history (Privacy: delete all history)
router.delete('/history', (_req: Request, res: Response) => {
  const chats = db.getChats();
  for (const c of chats) {
    db.deleteChat(c.id);
  }
  res.json({ success: true, message: 'All chat history securely removed' });
});

export default router;
