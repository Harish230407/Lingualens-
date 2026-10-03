import { Router, Request, Response } from 'express';
import { mediaVoiceService } from '../services/media_voice_service.ts';

const router = Router();

// Permitted MIME types and extensions
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/webm',
  'application/json',
  'text/plain',
  'text/csv',
]);

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

// POST /api/media/upload
router.post('/upload', async (req: Request, res: Response) => {
  try {
    const { filename, mimeType, size, base64Data } = req.body;

    if (!filename || !base64Data) {
      return res.status(400).json({ error: { code: 'INVALID_PAYLOAD', message: 'filename and base64Data are required' } });
    }

    if (size && size > MAX_FILE_SIZE_BYTES) {
      return res.status(413).json({ error: { code: 'FILE_TOO_LARGE', message: 'File exceeds maximum 25MB limit' } });
    }

    // MIME verification
    const safeMime = ALLOWED_MIME_TYPES.has(mimeType) ? mimeType : 'application/octet-stream';

    const attachmentId = `att_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    res.status(201).json({
      attachmentId,
      filename,
      mimeType: safeMime,
      size: size || base64Data.length,
      createdAt: new Date().toISOString(),
      url: base64Data, // Data URI for preview
    });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'UPLOAD_FAILED', message: err?.message || 'Media upload error' } });
  }
});

// POST /api/media/analyze (Image & Video Understanding with Voice Narration)
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { base64Data, mimeType, filename, targetLanguage } = req.body;

    if (!base64Data && !filename) {
      return res.status(400).json({ error: { code: 'MISSING_DATA', message: 'Media data or filename is required' } });
    }

    if (mimeType && mimeType.startsWith('video/')) {
      const videoResult = await mediaVoiceService.analyzeVideo(
        filename || 'uploaded_video.mp4',
        mimeType,
        targetLanguage || 'English'
      );
      return res.json(videoResult);
    }

    // Default to image analysis
    const imageResult = await mediaVoiceService.analyzeImage(
      base64Data,
      mimeType || 'image/jpeg',
      targetLanguage || 'English'
    );
    res.json(imageResult);
  } catch (err: any) {
    res.status(500).json({ error: { code: 'ANALYSIS_FAILED', message: err?.message || 'Media analysis failed' } });
  }
});

// POST /api/media/transcribe (Audio Speech-to-Text with code-switching understanding)
router.post('/transcribe', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: { code: 'MISSING_AUDIO', message: 'audioBase64 is required for transcription' } });
    }

    const result = await mediaVoiceService.transcribeAudio(audioBase64, mimeType || 'audio/webm');
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: { code: 'TRANSCRIPTION_FAILED', message: err?.message || 'Speech transcription failed' } });
  }
});

// GET /api/voice/voices
router.get('/voices', (_req: Request, res: Response) => {
  // Return dynamically supported voices from Gemini TTS and standard presets
  res.json({
    defaultVoice: 'Kore',
    voices: [
      { id: 'Kore', name: 'Kore (Clear & Natural Multilingual)', gender: 'Female', language: 'Multilingual' },
      { id: 'Puck', name: 'Puck (Energetic & Dynamic)', gender: 'Male', language: 'Multilingual' },
      { id: 'Charon', name: 'Charon (Deep & Authoritative)', gender: 'Male', language: 'Multilingual' },
      { id: 'Fenrir', name: 'Fenrir (Warm & Expressive)', gender: 'Male', language: 'Multilingual' },
      { id: 'Zephyr', name: 'Zephyr (Smooth & Conversational)', gender: 'Female', language: 'Multilingual' },
    ],
  });
});

// POST /api/voice/tts & /api/voice/synthesize
const handleVoiceTTS = async (req: Request, res: Response) => {
  try {
    const { text, voiceName, speed, pitch, language } = req.body;
    if (!text) {
      return res.status(400).json({ error: { code: 'MISSING_TEXT', message: 'Text is required for TTS synthesis' } });
    }

    const outcome = await mediaVoiceService.synthesizeVoice({
      text,
      voiceName,
      speed,
      pitch,
      language,
    });

    res.json(outcome);
  } catch (err: any) {
    res.status(500).json({ error: { code: 'TTS_FAILED', message: err?.message || 'Text-to-speech error' } });
  }
};

router.post('/tts', handleVoiceTTS);
router.post('/synthesize', handleVoiceTTS);

export default router;
