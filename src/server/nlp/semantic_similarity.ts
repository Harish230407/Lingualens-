/**
 * LinguaLens Semantic Consistency & Similarity Engine
 * Evaluates semantic equivalence between baseline inputs and perturbed multilingual variants.
 */

import { normalizeTextPhonetics } from './transliteration.ts';

// Extract character n-grams (3-grams and 4-grams) to catch root morphological preservation across transliterated tokens
function getCharNGrams(text: string, n = 3): Map<string, number> {
  const norm = normalizeTextPhonetics(text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ''));
  const ngrams = new Map<string, number>();

  for (let i = 0; i <= norm.length - n; i++) {
    const gram = norm.slice(i, i + n);
    ngrams.set(gram, (ngrams.get(gram) || 0) + 1);
  }
  return ngrams;
}

// Compute Cosine Similarity between two term frequency vectors
export function computeCosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const [key, valA] of vecA.entries()) {
    normA += valA * valA;
    if (vecB.has(key)) {
      dotProduct += valA * vecB.get(key)!;
    }
  }

  for (const valB of vecB.values()) {
    normB += valB * valB;
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Semantic Intent Keyword Matching Dictionary
const INTENT_KEYWORD_MAP: Record<string, { positive: string[]; negative: string[] }> = {
  cancel_ticket: {
    positive: ['cancel', 'cancellation', 'refund', 'abort', 'radd', 'vendaam', 'cancelling'],
    negative: ['book', 'reserve', 'confirm', 'keep', 'maintain', 'booked'],
  },
  book_ticket: {
    positive: ['book', 'reserve', 'purchase', 'buy', 'booking', 'seat', 'berth'],
    negative: ['cancel', 'refund', 'drop', 'reject'],
  },
  check_status: {
    positive: ['status', 'pnr', 'tracking', 'live', 'where', 'delay', 'enquiry'],
    negative: [],
  },
  refund_enquiry: {
    positive: ['refund', 'money', 'credited', 'amount', 'wallet', 'bank', 'paise'],
    negative: ['charge', 'fine', 'penalty'],
  },
};

export function calculateSemanticConsistency(
  sourceMeaning: string,
  modelResponse: string,
  expectedIntent?: string
): {
  similarityScore: number; // 0.0 - 1.0
  intentPreserved: boolean;
  semanticDriftDetected: boolean;
  notes: string;
} {
  const normA = normalizeTextPhonetics(sourceMeaning.toLowerCase());
  const normB = normalizeTextPhonetics(modelResponse.toLowerCase());

  // 1. Character n-gram overlap
  const gramsA = getCharNGrams(normA, 3);
  const gramsB = getCharNGrams(normB, 3);
  const nGramCosine = computeCosineSimilarity(gramsA, gramsB);

  // 2. Content word overlap (ignoring common stop words)
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'in', 'to', 'for', 'of', 'and', 'my', 'your', 'i', 'you']);
  const wordsA = normA.split(/\s+/).filter((w) => w.length > 2 && !stopWords.has(w));
  const wordsB = new Set(normB.split(/\s+/));
  let matchedWords = 0;
  for (const w of wordsA) {
    if (wordsB.has(w) || Array.from(wordsB).some((wb) => wb.includes(w) || w.includes(wb))) {
      matchedWords++;
    }
  }
  const wordOverlap = wordsA.length > 0 ? matchedWords / wordsA.length : 0.5;

  // 3. Intent keyword matching
  let intentPreserved = true;
  let driftReason = '';

  if (expectedIntent && INTENT_KEYWORD_MAP[expectedIntent]) {
    const config = INTENT_KEYWORD_MAP[expectedIntent];
    const lowerResp = modelResponse.toLowerCase();

    const hasPositive = config.positive.some((k) => lowerResp.includes(k));
    const hasNegative = config.negative.some((k) => lowerResp.includes(k));

    if (expectedIntent === 'cancel_ticket' && (lowerResp.includes('confirming your booking') || (hasNegative && !hasPositive))) {
      intentPreserved = false;
      driftReason = 'Model mistakenly confirmed or created a booking instead of cancelling.';
    } else if (!hasPositive && !lowerResp.includes('cancel')) {
      if (wordOverlap < 0.3) {
        intentPreserved = false;
        driftReason = 'Response failed to address core target intent.';
      }
    }
  }

  // Blended composite score: 40% n-gram similarity + 30% word overlap + 30% intent alignment
  const intentBonus = intentPreserved ? 0.35 : 0.05;
  const rawScore = nGramCosine * 0.35 + wordOverlap * 0.30 + intentBonus;
  const finalScore = Number(Math.min(1.0, Math.max(0.1, rawScore)).toFixed(2));

  return {
    similarityScore: finalScore,
    intentPreserved,
    semanticDriftDetected: !intentPreserved || finalScore < 0.45,
    notes: driftReason || (intentPreserved ? 'Semantics well preserved' : 'Semantic drift detected'),
  };
}
