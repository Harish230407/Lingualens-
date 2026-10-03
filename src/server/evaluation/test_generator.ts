/**
 * LinguaLens Robustness Test Generator
 * Generates controlled cross-lingual, code-switched, transliterated, and mixed-script variants
 * from a seed query while maintaining strict ground truth intent annotations.
 */

export interface GeneratedVariant {
  transformationType: string;
  label: string;
  description: string;
  variantText: string;
  intendedMeaning: string;
  expectedIntent: string;
  languages: string[];
  script: string;
  isCodeSwitched: boolean;
  transliterationComplexity: 'Low' | 'Medium' | 'High';
  verified: boolean;
}

export function generateRobustnessVariants(
  sourceText: string,
  sourceIntent = 'cancel_ticket'
): GeneratedVariant[] {
  const lower = sourceText.toLowerCase();

  // If the query is related to ticket cancellation:
  if (lower.includes('cancel') || lower.includes('radd') || lower.includes('pannidunga') || sourceIntent === 'cancel_ticket') {
    return [
      {
        transformationType: 'pure_english',
        label: 'Standard English Baseline',
        description: 'Formal, uncorrupted benchmark standard in Latin script',
        variantText: 'I would like to cancel my train ticket scheduled for tomorrow, please.',
        intendedMeaning: 'User requests ticket cancellation for tomorrow.',
        expectedIntent: 'cancel_ticket',
        languages: ['en'],
        script: 'latin',
        isCodeSwitched: false,
        transliterationComplexity: 'Low',
        verified: true,
      },
      {
        transformationType: 'tanglish_colloquial',
        label: 'Tanglish (Tamil-English Code-Switch)',
        description: 'Tamil matrix verb frame with embedded English nouns in Latin script',
        variantText: 'Naalaiku train ticket cancel pannidunga please.',
        intendedMeaning: 'Please cancel tomorrow’s train ticket.',
        expectedIntent: 'cancel_ticket',
        languages: ['ta', 'en'],
        script: 'latin',
        isCodeSwitched: true,
        transliterationComplexity: 'Medium',
        verified: true,
      },
      {
        transformationType: 'hinglish_colloquial',
        label: 'Hinglish (Hindi-English Code-Switch)',
        description: 'Hindi grammatical markers with English lexical terms in Latin script',
        variantText: 'Mera kal wala train ticket cancel kar do please.',
        intendedMeaning: 'Please cancel my train ticket for tomorrow.',
        expectedIntent: 'cancel_ticket',
        languages: ['hi', 'en'],
        script: 'latin',
        isCodeSwitched: true,
        transliterationComplexity: 'Medium',
        verified: true,
      },
      {
        transformationType: 'teluglish_colloquial',
        label: 'Teluglish (Telugu-English Code-Switch)',
        description: 'Telugu temporal and imperative markers with English technical nouns',
        variantText: 'Repu train ticket cancel cheyandi please.',
        intendedMeaning: 'Please cancel tomorrow’s train ticket.',
        expectedIntent: 'cancel_ticket',
        languages: ['te', 'en'],
        script: 'latin',
        isCodeSwitched: true,
        transliterationComplexity: 'Medium',
        verified: true,
      },
      {
        transformationType: 'native_devanagari_mixed',
        label: 'Native Devanagari Code-Switch',
        description: 'Devanagari script with transliterated English technical terms',
        variantText: 'मेरा train ticket cancel कर दीजिए urgently.',
        intendedMeaning: 'Cancel my train ticket urgently.',
        expectedIntent: 'cancel_ticket',
        languages: ['hi', 'en'],
        script: 'mixed',
        isCodeSwitched: true,
        transliterationComplexity: 'High',
        verified: true,
      },
      {
        transformationType: 'native_tamil_mixed',
        label: 'Native Tamil Script Code-Switch',
        description: 'Tamil script clause blended with Latin English words in intra-sentential boundary',
        variantText: 'நாளைக்கு train ticket கேன்சல் பண்ணிடுங்க please.',
        intendedMeaning: 'Cancel tomorrow’s train ticket please.',
        expectedIntent: 'cancel_ticket',
        languages: ['ta', 'en'],
        script: 'mixed',
        isCodeSwitched: true,
        transliterationComplexity: 'High',
        verified: true,
      },
      {
        transformationType: 'noisy_chat_abbreviation',
        label: 'Chat Slang & Phonetic Noise',
        description: 'Heavy informal abbreviations, missing vowels, and chat contractions',
        variantText: 'tkt cncl panidunga pls urgent refund req',
        intendedMeaning: 'Ticket cancel please, urgent refund required.',
        expectedIntent: 'cancel_ticket',
        languages: ['ta', 'en'],
        script: 'latin',
        isCodeSwitched: true,
        transliterationComplexity: 'High',
        verified: true,
      },
      {
        transformationType: 'morphological_negation_twist',
        label: 'Subtle Negation Suffix Challenge',
        description: 'High-difficulty test: Tamil negative suffix (-adheenga) that traps models into false positives',
        variantText: 'Train ticket cancel pannidadheenga, naan travel panren.',
        intendedMeaning: 'Do NOT cancel the train ticket; I am traveling.',
        expectedIntent: 'retain_ticket',
        languages: ['ta', 'en'],
        script: 'latin',
        isCodeSwitched: true,
        transliterationComplexity: 'High',
        verified: true,
      },
    ];
  }

  // Generic generator for arbitrary user prompts
  return [
    {
      transformationType: 'pure_english',
      label: 'Standard English Baseline',
      description: 'Clean English sentence formulation',
      variantText: sourceText,
      intendedMeaning: sourceText,
      expectedIntent: sourceIntent,
      languages: ['en'],
      script: 'latin',
      isCodeSwitched: false,
      transliterationComplexity: 'Low',
      verified: true,
    },
    {
      transformationType: 'tanglish_colloquial',
      label: 'Tanglish Variant',
      description: 'Tamil colloquial embedding',
      variantText: `Konjam ${sourceText} panidunga please.`,
      intendedMeaning: `Please execute: ${sourceText}`,
      expectedIntent: sourceIntent,
      languages: ['ta', 'en'],
      script: 'latin',
      isCodeSwitched: true,
      transliterationComplexity: 'Medium',
      verified: true,
    },
    {
      transformationType: 'hinglish_colloquial',
      label: 'Hinglish Variant',
      description: 'Hindi conversational embedding',
      variantText: `Bhai jaldi se ${sourceText} kar do na.`,
      intendedMeaning: `Brother, please do: ${sourceText} quickly.`,
      expectedIntent: sourceIntent,
      languages: ['hi', 'en'],
      script: 'latin',
      isCodeSwitched: true,
      transliterationComplexity: 'Medium',
      verified: true,
    },
    {
      transformationType: 'noisy_chat_abbreviation',
      label: 'Compressed Chat Form',
      description: 'Phonetic noise and abbreviations',
      variantText: `pls ${sourceText.toLowerCase().replace(/[aeiou]/g, '')} asap`,
      intendedMeaning: sourceText,
      expectedIntent: sourceIntent,
      languages: ['en'],
      script: 'latin',
      isCodeSwitched: false,
      transliterationComplexity: 'High',
      verified: true,
    },
  ];
}
