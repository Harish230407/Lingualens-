import { Router, Request, Response } from 'express';
import { db } from '../database/store.ts';
import { startBenchmarkRun } from '../evaluation/test_runner.ts';
import { calculateSemanticConsistency } from '../nlp/semantic_similarity.ts';
import { detectLanguages } from '../nlp/language_detector.ts';

const router = Router();

// GET /api/evaluation/runs
router.get('/runs', (_req: Request, res: Response) => {
  const runs = db.getEvaluationRuns();
  res.json(runs);
});

// POST /api/evaluation/runs
router.post('/runs', (req: Request, res: Response) => {
  const { name, sourceText, sourceIntent, modelProvider, modelName } = req.body;

  if (!sourceText) {
    return res.status(400).json({
      error: { code: 'MISSING_SOURCE_TEXT', message: 'Seed query or source text is required to generate test variants' },
    });
  }

  const settings = db.getSettings();
  const provider = modelProvider || settings.provider || 'gemini';
  const model = modelName || settings.defaultModel || 'gemini-3.8-flash';

  const run = startBenchmarkRun(name, sourceText, sourceIntent || 'cancel_ticket', provider, model);

  res.status(202).json({
    runId: run.id,
    status: run.status,
    message: 'Robustness benchmark job initiated',
    run,
  });
});

// GET /api/evaluation/runs/:id
router.get('/runs/:id', (req: Request, res: Response) => {
  const run = db.getEvaluationRun(req.params.id);
  if (!run) {
    return res.status(404).json({ error: { code: 'RUN_NOT_FOUND', message: 'Evaluation run not found' } });
  }
  res.json(run);
});

// GET /api/evaluation/runs/:id/results
router.get('/runs/:id/results', (req: Request, res: Response) => {
  const run = db.getEvaluationRun(req.params.id);
  if (!run) {
    return res.status(404).json({ error: { code: 'RUN_NOT_FOUND', message: 'Evaluation run not found' } });
  }

  const testCases = db.getEvaluationTestCases(run.id);
  const results = db.getEvaluationResults(run.id);

  res.json({
    run,
    testCases,
    results,
  });
});

// GET /api/evaluation/runs/:id/report
router.get('/runs/:id/report', (req: Request, res: Response) => {
  const run = db.getEvaluationRun(req.params.id);
  if (!run) {
    return res.status(404).json({ error: { code: 'RUN_NOT_FOUND', message: 'Evaluation run not found' } });
  }

  const results = db.getEvaluationResults(run.id);
  const testCases = db.getEvaluationTestCases(run.id);

  const report = {
    title: 'LinguaLens AI Robustness Evaluation Report',
    timestamp: new Date().toISOString(),
    benchmarkSummary: {
      runId: run.id,
      modelTested: `${run.modelProvider} / ${run.modelName}`,
      benchmarkRobustnessScore: run.overallScore,
      totalTestCases: run.totalCases,
      passCount: run.passCount,
      partialCount: run.partialCount,
      failCount: run.failCount,
      overallSuccessRate: `${Math.round((run.passCount / (run.totalCases || 1)) * 100)}%`,
    },
    metricBreakdown: {
      intentAccuracy: `${run.metrics.intentAccuracy}% (Weight 40%)`,
      semanticConsistency: `${run.metrics.semanticConsistency}% (Weight 25%)`,
      codeSwitchRobustness: `${run.metrics.codeSwitchRobustness}% (Weight 15%)`,
      transliterationRobustness: `${run.metrics.transliterationRobustness}% (Weight 10%)`,
      scriptRobustness: `${run.metrics.scriptRobustness}% (Weight 10%)`,
    },
    failureAnalysis: {
      possibleContributingFactors: run.failureBreakdown,
      highestRiskFactor: Object.entries(run.failureBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None',
    },
    detailedEvaluations: results.map((r) => {
      const tc = testCases.find((t) => t.id === r.testCaseId);
      return {
        transformationType: r.transformationType,
        variantText: r.variantText,
        intendedMeaning: tc?.intendedMeaning,
        expectedIntent: tc?.intent,
        predictedIntent: r.predictedIntent,
        status: r.status,
        semanticSimilarity: `${Math.round(r.semanticSimilarity * 100)}%`,
        failureFactors: r.failureFactors,
        rationale: r.detailedRationale,
      };
    }),
    recommendations: [
      'Incorporate phonetic subword normalization before feeding inputs to BPE tokenizers.',
      'Fine-tune matrix sentence boundary detection for Indian language verb suffixes (e.g. Tanglish -dunga/-adheenga).',
      'Deploy negative imperative intent assertions to prevent false-positive polarity inversions.',
    ],
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="LinguaLens_Report_${run.id}.json"`);
  res.json(report);
});

// POST /api/evaluation/test-cases/verify
router.post('/test-cases/verify', (req: Request, res: Response) => {
  const { testCaseId, verified } = req.body;
  // Support manual human verification of gold standard items
  res.json({ success: true, testCaseId, verified: verified !== false });
});

// POST /api/evaluation/semantic-consistency (Direct pairwise multilingual semantic evaluation)
router.post('/semantic-consistency', (req: Request, res: Response) => {
  const { textA, textB, expectedIntent } = req.body;
  if (!textA || !textB) {
    return res.status(400).json({
      error: { code: 'MISSING_INPUTS', message: 'Both textA and textB are required for semantic comparison' },
    });
  }

  const langA = detectLanguages(textA);
  const langB = detectLanguages(textB);
  const consistency = calculateSemanticConsistency(textA, textB, expectedIntent);

  res.json({
    textA,
    textB,
    languagesA: langA.languages,
    languagesB: langB.languages,
    similarityScore: consistency.similarityScore,
    intentPreserved: consistency.intentPreserved,
    semanticDriftDetected: consistency.semanticDriftDetected,
    explanation: consistency.notes,
  });
});

export default router;
