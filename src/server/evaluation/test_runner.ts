/**
 * LinguaLens Evaluation Runner & Benchmark Engine
 * Orchestrates test runs across model providers, evaluates semantic consistency,
 * detects failures, and computes the transparent Benchmark Robustness Score.
 */

import { db, EvaluationRun, EvaluationResult } from '../database/store.ts';
import { getModelProvider } from '../models/model_provider.ts';
import { calculateSemanticConsistency } from '../nlp/semantic_similarity.ts';
import { detectLanguages } from '../nlp/language_detector.ts';
import { generateRobustnessVariants } from './test_generator.ts';

export async function executeEvaluationRun(runId: string): Promise<void> {
  const run = db.getEvaluationRun(runId);
  if (!run) return;

  try {
    // 1. Mark as running
    db.updateEvaluationRun(runId, {
      status: 'running',
      progress: 10,
      currentStep: 'Preparing dataset & generating linguistic variants',
    });

    const testCases = db.getEvaluationTestCases(runId);
    const provider = getModelProvider(run.modelProvider, { modelName: run.modelName });

    const results: Array<Omit<EvaluationResult, 'id'>> = [];
    let passCount = 0;
    let failCount = 0;
    let partialCount = 0;

    let totalIntentScore = 0;
    let totalSemanticScore = 0;
    let totalCodeSwitchScore = 0;
    let totalTransliterationScore = 0;
    let totalScriptScore = 0;

    const failureBreakdown: Record<string, number> = {
      'Intent Polarity Inversion': 0,
      'Code-Switching Boundary Confusion': 0,
      'Transliteration Misinterpretation': 0,
      'Mixed-Script Tokenization Breakdown': 0,
      'Semantic Drift': 0,
      'Language Mismatch': 0,
    };

    const total = testCases.length;

    for (let i = 0; i < total; i++) {
      const tc = testCases[i];
      const progress = Math.round(15 + ((i + 1) / total) * 70);

      db.updateEvaluationRun(runId, {
        progress,
        currentStep: `Evaluating variant ${i + 1}/${total}: ${tc.transformationType}`,
      });

      // Analyze variant linguistic features
      const langAnalysis = detectLanguages(tc.variantText);

      // Call target model
      const evalResp = await provider.evaluateIntent(
        tc.variantText,
        tc.intent,
        `Expected intent: ${tc.intent}. Meaning: ${tc.intendedMeaning}`
      );

      // Evaluate semantic similarity
      const semAnalysis = calculateSemanticConsistency(tc.intendedMeaning, evalResp.response, tc.intent);

      // Intent correctness check
      const intentPass =
        evalResp.predictedIntent.toLowerCase() === tc.intent.toLowerCase() ||
        (tc.intent === 'cancel_ticket' && evalResp.predictedIntent.includes('cancel')) ||
        (tc.intent === 'retain_ticket' && !evalResp.predictedIntent.includes('cancel'));

      // Determine contributing failure factors
      const failureFactors: string[] = [];

      if (!intentPass) {
        if (tc.transformationType === 'morphological_negation_twist') {
          failureFactors.push('Intent Polarity Inversion (missed negative suffix)');
          failureBreakdown['Intent Polarity Inversion']++;
        } else {
          failureFactors.push('Intent Misclassification');
        }
      }

      if (tc.isCodeSwitched && semAnalysis.similarityScore < 0.65) {
        failureFactors.push('Code-Switching Boundary Confusion');
        failureBreakdown['Code-Switching Boundary Confusion']++;
      }

      if (langAnalysis.transliterationProbability > 0.6 && semAnalysis.similarityScore < 0.6) {
        failureFactors.push('Transliteration Misinterpretation');
        failureBreakdown['Transliteration Misinterpretation']++;
      }

      if (tc.script === 'mixed' && (!intentPass || semAnalysis.similarityScore < 0.7)) {
        failureFactors.push('Mixed-Script Tokenization Breakdown');
        failureBreakdown['Mixed-Script Tokenization Breakdown']++;
      }

      if (semAnalysis.semanticDriftDetected) {
        failureFactors.push('Semantic Drift');
        failureBreakdown['Semantic Drift']++;
      }

      // Status classification: PASS, FAIL, PARTIAL
      let status: 'PASS' | 'FAIL' | 'PARTIAL' = 'FAIL';
      if (intentPass && semAnalysis.similarityScore >= 0.7) {
        status = 'PASS';
        passCount++;
      } else if (intentPass || semAnalysis.similarityScore >= 0.5) {
        status = 'PARTIAL';
        partialCount++;
      } else {
        status = 'FAIL';
        failCount++;
      }

      // Metric calculations per case
      const caseIntentScore = intentPass ? 100 : 0;
      const caseSemanticScore = Math.round(semAnalysis.similarityScore * 100);
      const caseCodeSwitchScore = tc.isCodeSwitched ? (intentPass && semAnalysis.similarityScore >= 0.6 ? 100 : 40) : 100;
      const caseTransliterationScore =
        langAnalysis.transliterationProbability > 0.4
          ? intentPass && semAnalysis.similarityScore >= 0.65
            ? 100
            : 30
          : 100;
      const caseScriptScore = tc.script === 'mixed' ? (intentPass ? 100 : 35) : 100;

      totalIntentScore += caseIntentScore;
      totalSemanticScore += caseSemanticScore;
      totalCodeSwitchScore += caseCodeSwitchScore;
      totalTransliterationScore += caseTransliterationScore;
      totalScriptScore += caseScriptScore;

      let detailedRationale = '';
      if (status === 'PASS') {
        detailedRationale = `Successfully handled ${tc.transformationType}. Intent '${evalResp.predictedIntent}' matched with ${(semAnalysis.similarityScore * 100).toFixed(0)}% semantic consistency.`;
      } else if (status === 'PARTIAL') {
        detailedRationale = `Partial comprehension: Captured general context but exhibited ${semAnalysis.similarityScore < 0.6 ? 'minor semantic drift' : 'borderline confidence'}.`;
      } else {
        detailedRationale = `Understanding degraded under ${tc.transformationType}. Factors: ${failureFactors.join(', ') || 'Low semantic alignment'}.`;
      }

      results.push({
        runId,
        testCaseId: tc.id,
        transformationType: tc.transformationType,
        variantText: tc.variantText,
        modelResponse: evalResp.response,
        predictedIntent: evalResp.predictedIntent,
        intentPass,
        semanticSimilarity: semAnalysis.similarityScore,
        codeSwitchHandled: tc.isCodeSwitched ? caseCodeSwitchScore > 50 : true,
        transliterationHandled: caseTransliterationScore > 50,
        scriptHandled: caseScriptScore > 50,
        latencyMs: evalResp.latencyMs,
        status,
        failureFactors,
        detailedRationale,
      });

      // Small async yield to prevent blocking event loop
      await new Promise((r) => setTimeout(r, 60));
    }

    // Persist all results
    db.addEvaluationResults(results);

    // Compute Overall Benchmark Robustness Score
    // Transparent weights:
    // Intent Accuracy: 40%
    // Semantic Consistency: 25%
    // Code-Switch Robustness: 15%
    // Transliteration Robustness: 10%
    // Script Robustness: 10%
    const avgIntent = Math.round(totalIntentScore / total);
    const avgSemantic = Math.round(totalSemanticScore / total);
    const avgCodeSwitch = Math.round(totalCodeSwitchScore / total);
    const avgTransliteration = Math.round(totalTransliterationScore / total);
    const avgScript = Math.round(totalScriptScore / total);

    const overallScore = Math.round(
      avgIntent * 0.4 +
        avgSemantic * 0.25 +
        avgCodeSwitch * 0.15 +
        avgTransliteration * 0.1 +
        avgScript * 0.1
    );

    db.updateEvaluationRun(runId, {
      status: 'completed',
      progress: 100,
      currentStep: 'Benchmark evaluation completed successfully',
      completedAt: new Date().toISOString(),
      passCount,
      failCount,
      partialCount,
      overallScore,
      metrics: {
        intentAccuracy: avgIntent,
        semanticConsistency: avgSemantic,
        codeSwitchRobustness: avgCodeSwitch,
        transliterationRobustness: avgTransliteration,
        scriptRobustness: avgScript,
      },
      failureBreakdown,
    });
  } catch (err: any) {
    console.error('Evaluation run error:', err);
    db.updateEvaluationRun(runId, {
      status: 'failed',
      currentStep: `Evaluation failed: ${err?.message || 'Internal processing error'}`,
    });
  }
}

export function startBenchmarkRun(
  name: string,
  sourceText: string,
  sourceIntent = 'cancel_ticket',
  modelProvider = 'gemini',
  modelName = 'gemini-3.8-flash'
): EvaluationRun {
  const variants = generateRobustnessVariants(sourceText, sourceIntent);

  const run = db.createEvaluationRun({
    name: name || `Robustness Test: ${sourceText.slice(0, 30)}...`,
    modelProvider,
    modelName,
    status: 'queued',
    progress: 0,
    currentStep: 'Evaluation queued',
    totalCases: variants.length,
    passCount: 0,
    failCount: 0,
    partialCount: 0,
    overallScore: 0,
    metrics: {
      intentAccuracy: 0,
      semanticConsistency: 0,
      codeSwitchRobustness: 0,
      transliterationRobustness: 0,
      scriptRobustness: 0,
    },
    failureBreakdown: {},
    config: {
      sourceIntent,
      sourceText,
      variants: variants.map((v) => v.transformationType),
    },
  });

  // Add test cases to DB
  db.addEvaluationTestCases(
    variants.map((v) => ({
      runId: run.id,
      sourceText,
      variantText: v.variantText,
      intendedMeaning: v.intendedMeaning,
      intent: v.expectedIntent,
      languages: v.languages,
      script: v.script,
      isCodeSwitched: v.isCodeSwitched,
      transformationType: v.transformationType,
      verified: v.verified,
    }))
  );

  // Trigger background job (non-blocking)
  setImmediate(() => {
    executeEvaluationRun(run.id);
  });

  return run;
}
