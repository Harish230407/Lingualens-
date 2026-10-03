/**
 * LinguaLens Transliteration & Phonetic Normalizer
 * Handles phonetic mapping, variant spelling normalization (e.g. naalaiku -> nalaikku),
 * and script transliteration assistance.
 */

// Common variant map for noisy informal chat spellings
const TRANSLITERATION_VARIANTS: Record<string, string> = {
  // Tamil variants
  'naalaiku': 'naalaiki',
  'nalaiku': 'naalaiki',
  'nalaikku': 'naalaiki',
  'panidunga': 'pannunga',
  'pannidunga': 'pannunga',
  'panunga': 'pannunga',
  'romba': 'romba',
  'rombaa': 'romba',
  'theriyala': 'therila',
  'theriyalaam': 'therilam',
  'mudila': 'mudiyala',
  'venum': 'vendum',
  'vendam': 'vendaam',
  'da': 'da',
  'panra': 'panra',
  'enna': 'enna',
  // Hindi variants
  'karlo': 'karo',
  'karunga': 'karega',
  'karinga': 'karega',
  'krna': 'karna',
  'karna': 'karna',
  'chahiye': 'chahiye',
  'chahie': 'chahiye',
  'accha': 'achha',
  'bahut': 'bahuth',
  'jaldi': 'jaldi',
  'jaldii': 'jaldi',
  'mujhe': 'mujhe',
  'jaana': 'jaana',
  // Telugu variants
  'naku': 'naaku',
  'kavali': 'kavali',
  // Common chat shortcuts & informal normalization
  'tkt': 'ticket',
  'tkts': 'tickets',
  'cncl': 'cancel',
  'pls': 'please',
  'plz': 'please',
  'plzz': 'please',
  'bro': 'brother',
  'u': 'you',
  'ur': 'your',
  'r': 'are',
  'bcoz': 'because',
  'thx': 'thanks',
  'ty': 'thank you',
  'msg': 'message',
};

// Indic Unicode vowels & consonants for phonetic transliteration assistance
const DEVANAGARI_MAP: Record<string, string> = {
  a: 'अ', aa: 'आ', i: 'इ', ee: 'ई', u: 'उ', oo: 'ऊ', e: 'ए', ai: 'ऐ', o: 'ओ', au: 'औ',
  k: 'क', kh: 'ख', g: 'ग', gh: 'घ', ch: 'च', chh: 'छ', j: 'ज', jh: 'झ',
  t: 'ट', th: 'ठ', d: 'ड', dh: 'ढ', n: 'न', p: 'प', ph: 'फ', b: 'ब', bh: 'भ', m: 'म',
  y: 'य', r: 'र', l: 'ल', v: 'व', sh: 'श', s: 'स', h: 'ह',
};

const TAMIL_MAP: Record<string, string> = {
  a: 'அ', aa: 'ஆ', i: 'இ', ee: 'ஈ', u: 'உ', oo: 'ஊ', e: 'எ', ae: 'ஏ', ai: 'ஐ', o: 'ஒ', oa: 'ஓ',
  k: 'க', ng: 'ங', ch: 'ச', ny: 'ஞ', t: 'ட', n: 'ண', th: 'த', p: 'ப', m: 'ம',
  y: 'ய', r: 'ர', l: 'ல', v: 'வ', zh: 'ழ', s: 'ஸ', h: 'ஹ',
};

export function normalizeTransliteratedToken(token: string): string {
  const lower = token.toLowerCase();
  // Remove repeated duplicate ending characters (e.g. "pleaseeee" -> "please", "seriiii" -> "seri")
  const collapsed = lower.replace(/([a-z])\1{2,}/g, '$1$1');
  return TRANSLITERATION_VARIANTS[collapsed] || collapsed;
}

export function normalizeTextPhonetics(text: string): string {
  return text
    .split(/\s+/)
    .map(normalizeTransliteratedToken)
    .join(' ');
}

export function detectTransliterationNoiseScore(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  let noiseMatches = 0;
  for (const w of words) {
    if (TRANSLITERATION_VARIANTS[w] || /([a-z])\1{2,}/.test(w)) {
      noiseMatches++;
    }
  }
  return Number((noiseMatches / (words.length || 1)).toFixed(2));
}

export function approximateIndicScriptRepresentation(latinWord: string, lang: 'hi' | 'ta'): string {
  const map = lang === 'ta' ? TAMIL_MAP : DEVANAGARI_MAP;
  let out = '';
  let i = 0;
  const w = latinWord.toLowerCase();

  while (i < w.length) {
    const twoChar = w.slice(i, i + 2);
    if (map[twoChar]) {
      out += map[twoChar];
      i += 2;
    } else if (map[w[i]]) {
      out += map[w[i]];
      i++;
    } else {
      out += w[i];
      i++;
    }
  }
  return out;
}
