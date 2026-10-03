/**
 * LinguaLens Language & Code-Switching Detection Engine
 * High-accuracy multi-script and transliterated Indic language detector
 */

export interface DetectedLanguage {
  language: string;
  code: string;
  percentage: number;
}

export interface LanguageAnalysisResult {
  languages: DetectedLanguage[];
  primaryLanguage: string;
  script: 'latin' | 'devanagari' | 'tamil' | 'telugu' | 'kannada' | 'malayalam' | 'bengali' | 'mixed';
  isCodeSwitched: boolean;
  codeSwitchPoints: number;
  transliterationProbability: number;
  confidence: number;
  matrixLanguage: string;
  embeddedLanguage?: string;
  tokenAnalysis: Array<{
    token: string;
    lang: string;
    isCodeSwitchPoint: boolean;
  }>;
}

// Lexicons for transliterated tokens commonly used in code-switching
const HINDI_TRANSLITERATED = new Set([
  'kya', 'hai', 'nahi', 'nahin', 'karna', 'karo', 'kare', 'kar', 'krna', 'raha', 'rahi', 'rahe',
  'chahiye', 'accha', 'achha', 'theek', 'mera', 'meri', 'mere', 'tera', 'teri', 'tere',
  'hum', 'tum', 'aap', 'kaise', 'kyun', 'kyu', 'kab', 'kahan', 'bhai', 'yaar', 'dost',
  'samajh', 'dekh', 'dekho', 'bolo', 'baat', 'kuch', 'sab', 'bahut', 'thoda', 'jaldi',
  'kal', 'aaj', 'parson', 'hoga', 'hogi', 'liye', 'saath', 'wala', 'wali', 'wale',
  'matlab', 'pata', 'lagta', 'ruk', 'chalo', 'arre', 'ab', 'lekin', 'aur', 'phir',
  'mujhe', 'mujhko', 'tujhe', 'apna', 'apni', 'apne', 'jaana', 'jana', 'karunga', 'karega',
  'rahenge', 'dena', 'lena', 'batao', 'bol'
]);

const TAMIL_TRANSLITERATED = new Set([
  'enna', 'panra', 'panreenga', 'panidunga', 'pannunga', 'pannu', 'naalaiku', 'nalaiku',
  'romba', 'theriyum', 'therila', 'mudiyum', 'mudiyala', 'venum', 'vendaam', 'vendam',
  'poitu', 'vaanga', 'vaa', 'ponga', 'enga', 'eppadi', 'eppo', 'yaar', 'enakku', 'unakku',
  'ungalukku', 'avanga', 'ithu', 'athu', 'inga', 'anga', 'seri', 'paravalla', 'paaru',
  'pesu', 'sollunga', 'sollu', 'nalla', 'aachu', 'aagala', 'irukku', 'illa', 'illai',
  'kudunga', 'edunga', 'paathutu', 'aamaa', 'aama', 'machan', 'thambi', 'akko', 'anna',
  'da', 'pa', 'dosthu', 'thala', 'nanba', 'kavala', 'vaada', 'poda'
]);

const TELUGU_TRANSLITERATED = new Set([
  'enti', 'cheppandi', 'cheppu', 'cheyandi', 'cheyi', 'chey', 'cheyyi', 'repu', 'ivvala', 'bagundi',
  'ledu', 'undi', 'kavali', 'voddu', 'vaddhu', 'ekkada', 'ela', 'eppudu', 'enduku',
  'naaku', 'naku', 'meeku', 'manaki', 'vallu', 'idi', 'adi', 'chudu', 'matladu', 'koddiga',
  'chala', 'tvaraga', 'ayipoyindi', 'avvaledu', 'anna', 'garu', 'andi', 'chudandi'
]);

const ENGLISH_COMMON = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i', 'it', 'for', 'not', 'on',
  'with', 'he', 'as', 'you', 'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 'we',
  'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
  'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me', 'when',
  'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take', 'people', 'into',
  'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other', 'than', 'then', 'now',
  'look', 'only', 'come', 'its', 'over', 'think', 'also', 'back', 'after', 'use', 'two',
  'how', 'our', 'work', 'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any',
  'these', 'give', 'day', 'most', 'us', 'cancel', 'ticket', 'flight', 'train', 'book',
  'refund', 'status', 'confirm', 'urgent', 'please', 'help', 'account', 'card', 'payment'
]);

export function detectLanguages(text: string): LanguageAnalysisResult {
  const clean = text.trim();
  if (!clean) {
    return {
      languages: [{ language: 'English', code: 'en', percentage: 100 }],
      primaryLanguage: 'English',
      script: 'latin',
      isCodeSwitched: false,
      codeSwitchPoints: 0,
      transliterationProbability: 0,
      confidence: 1.0,
      matrixLanguage: 'en',
      tokenAnalysis: [],
    };
  }

  // 1. Script distribution check via Unicode character codes
  let latinChars = 0;
  let devanagariChars = 0;
  let tamilChars = 0;
  let teluguChars = 0;
  let kannadaChars = 0;
  let malayalamChars = 0;
  let bengaliChars = 0;
  let totalScriptChars = 0;

  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    // Latin: A-Z, a-z
    if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
      latinChars++;
      totalScriptChars++;
    } else if (code >= 0x0900 && code <= 0x097F) {
      devanagariChars++;
      totalScriptChars++;
    } else if (code >= 0x0B80 && code <= 0x0BFF) {
      tamilChars++;
      totalScriptChars++;
    } else if (code >= 0x0C00 && code <= 0x0C7F) {
      teluguChars++;
      totalScriptChars++;
    } else if (code >= 0x0C80 && code <= 0x0CFF) {
      kannadaChars++;
      totalScriptChars++;
    } else if (code >= 0x0D00 && code <= 0x0D7F) {
      malayalamChars++;
      totalScriptChars++;
    } else if (code >= 0x0980 && code <= 0x09FF) {
      bengaliChars++;
      totalScriptChars++;
    }
  }

  // Determine overall script
  const nonLatinChars = totalScriptChars - latinChars;
  let detectedScript: LanguageAnalysisResult['script'] = 'latin';
  if (nonLatinChars > 0 && latinChars > 0) {
    detectedScript = 'mixed';
  } else if (devanagariChars > nonLatinChars * 0.7) {
    detectedScript = 'devanagari';
  } else if (tamilChars > nonLatinChars * 0.7) {
    detectedScript = 'tamil';
  } else if (teluguChars > nonLatinChars * 0.7) {
    detectedScript = 'telugu';
  }

  // 2. Tokenize and identify transliterated words & code switching
  const rawTokens = clean.split(/[\s,?.!;:()\[\]{}"'\/\\]+/).filter(Boolean);
  const tokenAnalysis: LanguageAnalysisResult['tokenAnalysis'] = [];

  let enCount = 0;
  let hiCount = 0;
  let taCount = 0;
  let teCount = 0;
  let nativeIndicCount = 0;

  let previousLang = '';
  let codeSwitchPoints = 0;

  for (const rawToken of rawTokens) {
    const token = rawToken.toLowerCase();
    let lang = 'en'; // default guess

    // Check Indic native scripts
    if (/[\u0900-\u097F]/.test(rawToken)) {
      lang = 'hi_native';
      hiCount++;
      nativeIndicCount++;
    } else if (/[\u0B80-\u0BFF]/.test(rawToken)) {
      lang = 'ta_native';
      taCount++;
      nativeIndicCount++;
    } else if (/[\u0C00-\u0C7F]/.test(rawToken)) {
      lang = 'te_native';
      teCount++;
      nativeIndicCount++;
    } else {
      // Latin script token: check against transliterated dictionaries & morphology
      if (HINDI_TRANSLITERATED.has(token) || /(kar|raha|chahiye|wala)$/.test(token)) {
        lang = 'hi';
        hiCount++;
      } else if (TAMIL_TRANSLITERATED.has(token) || /(dunga|unga|panra|laiku|laam|avalla)$/.test(token)) {
        lang = 'ta';
        taCount++;
      } else if (TELUGU_TRANSLITERATED.has(token) || /(andi|gari|kavale|chandi)$/.test(token)) {
        lang = 'te';
        teCount++;
      } else if (ENGLISH_COMMON.has(token) || /^[a-z]+(ing|ed|ly|ment|tion|able)$/.test(token)) {
        lang = 'en';
        enCount++;
      } else {
        // Unknown Latin token: heuristic based on phonotactics
        if (/[aeiou]{2,}|(th|dh|kh|bh|ch|zh)/.test(token) && token.length > 3) {
          // Indic transliteration phonotactic cue
          if (taCount >= hiCount && taCount >= teCount && taCount > 0) {
            lang = 'ta';
            taCount += 0.5;
          } else if (hiCount > 0) {
            lang = 'hi';
            hiCount += 0.5;
          } else {
            lang = 'en';
            enCount += 0.5;
          }
        } else {
          lang = 'en';
          enCount++;
        }
      }
    }

    const isCodeSwitchPoint = previousLang !== '' && previousLang !== lang;
    if (isCodeSwitchPoint) {
      codeSwitchPoints++;
    }
    previousLang = lang;

    tokenAnalysis.push({
      token: rawToken,
      lang: lang.replace('_native', ''),
      isCodeSwitchPoint,
    });
  }

  // Calculate Language Proportions
  const totalWeight = Math.max(1, enCount + hiCount + taCount + teCount);
  const languages: DetectedLanguage[] = [];

  const enPct = Math.round((enCount / totalWeight) * 100);
  const hiPct = Math.round((hiCount / totalWeight) * 100);
  const taPct = Math.round((taCount / totalWeight) * 100);
  const tePct = Math.round((teCount / totalWeight) * 100);

  if (enPct > 0) {
    languages.push({ language: 'English', code: 'en', percentage: enPct });
  }
  if (hiPct > 0) {
    languages.push({
      language: devanagariChars > 0 ? 'Hindi (Devanagari)' : 'Hindi (Hinglish)',
      code: 'hi',
      percentage: hiPct,
    });
  }
  if (taPct > 0) {
    languages.push({
      language: tamilChars > 0 ? 'Tamil (Tamil Script)' : 'Tamil (Tanglish)',
      code: 'ta',
      percentage: taPct,
    });
  }
  if (tePct > 0) {
    languages.push({
      language: teluguChars > 0 ? 'Telugu (Telugu Script)' : 'Telugu (Teluglish)',
      code: 'te',
      percentage: tePct,
    });
  }

  // Sort descending by percentage
  languages.sort((a, b) => b.percentage - a.percentage);

  // If nothing matched, default to English
  if (languages.length === 0) {
    languages.push({ language: 'English', code: 'en', percentage: 100 });
  }

  const primaryLanguage = languages[0].language;
  const isCodeSwitched = languages.length > 1 && languages[1].percentage >= 15;
  const transliterationProbability =
    latinChars > 0 && (hiCount > 0 || taCount > 0 || teCount > 0)
      ? Math.min(0.98, ((hiCount + taCount + teCount) / (rawTokens.length || 1)) * 1.1)
      : 0;

  const matrixLanguage = languages[0].code;
  const embeddedLanguage = languages.length > 1 ? languages[1].code : undefined;

  const confidence = Math.min(0.99, Math.max(0.75, (totalWeight / (rawTokens.length || 1)) * 0.95));

  return {
    languages,
    primaryLanguage,
    script: detectedScript,
    isCodeSwitched,
    codeSwitchPoints,
    transliterationProbability: Number(transliterationProbability.toFixed(2)),
    confidence: Number(confidence.toFixed(2)),
    matrixLanguage,
    embeddedLanguage,
    tokenAnalysis,
  };
}
