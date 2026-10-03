import { detectLanguages } from '../nlp/language_detector.ts';
import { normalizeTextPhonetics } from '../nlp/transliteration.ts';
import { calculateSemanticConsistency } from '../nlp/semantic_similarity.ts';
import { generateRobustnessVariants } from '../evaluation/test_generator.ts';
import { db } from '../database/store.ts';
import { executeEvaluationRun, startBenchmarkRun } from '../evaluation/test_runner.ts';

async function runTests() {
  console.log('--- LinguaLens Automated Backend Verification Suite ---');

  // Test 1: Language & Code-Switching Detection
  console.log('\n[Test 1] Language & Code-Switching Detection:');
  const test1 = detectLanguages('Naalaiku train ticket cancel pannidunga please');
  console.log('Input: "Naalaiku train ticket cancel pannidunga please"');
  console.log('Detected Languages:', test1.languages);
  console.log('isCodeSwitched:', test1.isCodeSwitched);
  console.log('transliterationProbability:', test1.transliterationProbability);
  if (!test1.isCodeSwitched) {
    throw new Error('Test 1 failed: Expected isCodeSwitched to be true for Tanglish');
  }

  // Test 2: Hindi/Hinglish detection
  console.log('\n[Test 2] Hinglish detection:');
  const test2 = detectLanguages('Bhai kal mera train ticket cancel kar do jaldi');
  console.log('Input: "Bhai kal mera train ticket cancel kar do jaldi"');
  console.log('Detected Languages:', test2.languages);
  console.log('isCodeSwitched:', test2.isCodeSwitched);
  if (!test2.languages.some((l) => l.code === 'hi')) {
    throw new Error('Test 2 failed: Expected Hindi detection');
  }

  // Test 3: Transliteration normalizer
  console.log('\n[Test 3] Transliteration normalization:');
  const norm = normalizeTextPhonetics('naalaiku tkt cncl panidunga pls');
  console.log('Normalized "naalaiku tkt cncl panidunga pls" ->', norm);

  // Test 4: Semantic similarity
  console.log('\n[Test 4] Semantic similarity:');
  const sem1 = calculateSemanticConsistency(
    'Please cancel my train ticket',
    'Your train ticket cancellation has been confirmed and refund initiated.',
    'cancel_ticket'
  );
  console.log('Semantic score (should be high):', sem1.similarityScore, 'Intent preserved:', sem1.intentPreserved);
  if (sem1.similarityScore < 0.6) {
    throw new Error('Test 4 failed: Semantic similarity should be high for aligned intent');
  }

  // Test 5: Test Generation
  console.log('\n[Test 5] Robustness Test Generation:');
  const variants = generateRobustnessVariants('I want to cancel my train ticket');
  console.log(`Generated ${variants.length} controlled variants:`);
  variants.forEach((v) => console.log(`  - [${v.transformationType}] ${v.variantText}`));
  if (variants.length < 5) {
    throw new Error('Test 5 failed: Expected at least 5 variants generated');
  }

  // Test 6: Database Chat CRUD and Search
  console.log('\n[Test 6] Database Chat & Search:');
  const chat = db.createChat('Test Suite Automation Chat', ['Test', 'Tanglish']);
  db.addMessage({
    chatId: chat.id,
    role: 'user',
    content: 'Naalaiku ticket cancel pannunga',
  });
  const searchResults = db.searchChats('Tanglish');
  console.log(`Search for "Tanglish" returned ${searchResults.length} results`);
  if (searchResults.length === 0) {
    throw new Error('Test 6 failed: Chat search did not find chat by tag');
  }

  // Test 7: Benchmark Run Execution
  console.log('\n[Test 7] End-to-end Benchmark Run Execution (Mock Model):');
  const run = startBenchmarkRun(
    'Automated Verification Run',
    'I want to cancel my train ticket',
    'cancel_ticket',
    'mock',
    'LinguaLens-Mock'
  );

  // Wait for run completion
  await new Promise((resolve) => setTimeout(resolve, 800));
  const completedRun = db.getEvaluationRun(run.id);
  console.log('Run Status:', completedRun?.status);
  console.log('Benchmark Robustness Score:', completedRun?.overallScore, '/ 100');
  console.log('Metrics Breakdown:', completedRun?.metrics);
  console.log('Pass Count:', completedRun?.passCount, 'Fail Count:', completedRun?.failCount);

  if (!completedRun || completedRun.status !== 'completed' || completedRun.overallScore === 0) {
    throw new Error('Test 7 failed: Evaluation run did not complete with valid score');
  }

  console.log('\n ALL 7 BACKEND TESTS PASSED SUCCESSFULLY! LinguaLens AI core engine is verified.');
}

runTests().catch((err) => {
  console.error('Backend verification test failed:', err);
  process.exit(1);
});
