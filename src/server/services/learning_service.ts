/**
 * LinguaLens Standard Language Learning Curriculum & Pedagogy Service
 *
 * Teaches proper standard languages (English, Tamil, Hindi, Spanish, Telugu, French)
 * with a Duolingo-style progression: Language -> Level (CEFR) -> Unit -> Lesson -> Exercises.
 * Code-switching analysis remains separate in the AI Analysis & Robustness sections.
 */

import {
  SupportedLanguage,
  LearningCourse,
  LearningLesson,
  LessonExercise,
  ExerciseType,
  SpeechEvaluationResult,
  WritingAnalysisResult,
} from '../../types/index.ts';
import { db } from '../database/store.ts';

// 1. Supported Standard Languages
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  {
    id: 'english',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    scriptName: 'Latin Script',
    description: 'Master standard global English for international communication, professional clarity, and daily dialogue.',
    levelsCount: 3,
    totalLessons: 12,
    supportedExerciseTypes: ['translation', 'multiple_choice', 'word_order', 'listening', 'speaking', 'reading', 'writing'],
  },
  {
    id: 'tamil',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    flag: '🇮🇳',
    scriptName: 'Tamil Script (தமிழ் அரிச்சுவடி)',
    description: 'Learn pure standard classical and contemporary Tamil with authentic script, polite forms, and grammar.',
    levelsCount: 2,
    totalLessons: 10,
    supportedExerciseTypes: ['translation', 'multiple_choice', 'word_order', 'listening', 'speaking', 'reading', 'writing'],
  },
  {
    id: 'hindi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    scriptName: 'Devanagari Script (देवनागरी)',
    description: 'Master standard formal and conversational Hindi in authentic Devanagari script with gender agreement and postpositions.',
    levelsCount: 2,
    totalLessons: 10,
    supportedExerciseTypes: ['translation', 'multiple_choice', 'word_order', 'listening', 'speaking', 'reading', 'writing'],
  },
  {
    id: 'spanish',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    scriptName: 'Latin Script',
    description: 'Explore standard Iberian and Latin American Spanish with verb conjugations, gendered articles, and conversation.',
    levelsCount: 2,
    totalLessons: 10,
    supportedExerciseTypes: ['translation', 'multiple_choice', 'word_order', 'listening', 'speaking', 'reading', 'writing'],
  },
  {
    id: 'telugu',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    flag: '🇮🇳',
    scriptName: 'Telugu Script (తెలుగు లిపి)',
    description: 'Learn standard literary and conversational Telugu with formal honorifics, sentence endings, and vocabulary.',
    levelsCount: 2,
    totalLessons: 8,
    supportedExerciseTypes: ['translation', 'multiple_choice', 'word_order', 'listening', 'speaking', 'reading', 'writing'],
  },
  {
    id: 'french',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    scriptName: 'Latin Script',
    description: 'Acquire standard French pronunciation, liaisons, essential everyday vocabulary, and core grammar.',
    levelsCount: 2,
    totalLessons: 8,
    supportedExerciseTypes: ['translation', 'multiple_choice', 'word_order', 'listening', 'speaking', 'reading', 'writing'],
  },
];

// 2. Courses & Units Progression
export const COURSES: LearningCourse[] = [
  // --- ENGLISH A1 ---
  {
    id: 'english_a1',
    languageId: 'english',
    title: 'English A1 — Foundations',
    cefr: 'A1',
    level: 'Beginner',
    description: 'Build core foundational fluency: greetings, self-introductions, everyday objects, and essential present-tense grammar.',
    icon: 'BookOpen',
    totalLessons: 12,
    units: [
      {
        id: 'eng_u1',
        levelId: 'english_a1',
        unitNumber: 1,
        title: 'Unit 1 — Basics & Greetings',
        description: 'Learn to say hello, introduce yourself, exchange names, and count in standard English.',
        lessonCount: 4,
        lessons: [
          {
            id: 'eng_l1',
            lessonNumber: 1,
            title: 'Greetings & Salutations',
            description: 'Master formal and informal greetings: "Hello", "Good morning", and polite responses.',
            xpReward: 25,
            grammarFocus: 'Polite Salutations & Formulaic Greetings',
            completed: false,
          },
          {
            id: 'eng_l2',
            lessonNumber: 2,
            title: 'Introducing Yourself',
            description: 'State your name, origin, and greeting pleasantries: "My name is...", "Nice to meet you".',
            xpReward: 25,
            grammarFocus: 'Verb "to be" (am / is / are) & Possessive "My"',
            completed: false,
          },
          {
            id: 'eng_l3',
            lessonNumber: 3,
            title: 'Common Objects & Names',
            description: 'Identify everyday physical objects around you: book, pen, water, and table.',
            xpReward: 25,
            grammarFocus: 'Singular Nouns & Indefinite Articles (a / an)',
            completed: false,
          },
          {
            id: 'eng_l4',
            lessonNumber: 4,
            title: 'Numbers & Counting (1–10)',
            description: 'Count items, state your age, and give quantities accurately.',
            xpReward: 25,
            grammarFocus: 'Cardinal Numbers & Plural -s endings',
            completed: false,
          },
        ],
      },
      {
        id: 'eng_u2',
        levelId: 'english_a1',
        unitNumber: 2,
        title: 'Unit 2 — Everyday Life',
        description: 'Express family relationships, ordering food, describing your home, and daily schedules.',
        lessonCount: 4,
        lessons: [
          {
            id: 'eng_l5',
            lessonNumber: 1,
            title: 'Family & Relationships',
            description: 'Describe mother, father, brother, sister, and friends.',
            xpReward: 30,
            grammarFocus: 'Possessive Adjectives (his, her, our)',
            completed: false,
          },
          {
            id: 'eng_l6',
            lessonNumber: 2,
            title: 'Food & Meals',
            description: 'Discuss basic food, dining, coffee, tea, and ordering in a restaurant.',
            xpReward: 30,
            grammarFocus: 'Countable vs Uncountable Nouns & "would like"',
            completed: false,
          },
          {
            id: 'eng_l7',
            lessonNumber: 3,
            title: 'Home & Living Space',
            description: 'Talk about rooms, furniture, house, and comfortable living.',
            xpReward: 30,
            grammarFocus: 'Prepositions of Place (in, on, under, near)',
            completed: false,
          },
          {
            id: 'eng_l8',
            lessonNumber: 4,
            title: 'Daily Routine',
            description: 'Explain what you do every day: wake up, study, work, and sleep.',
            xpReward: 30,
            grammarFocus: 'Present Simple for Habits & Third-person -s',
            completed: false,
          },
        ],
      },
      {
        id: 'eng_u3',
        levelId: 'english_a1',
        unitNumber: 3,
        title: 'Unit 3 — Grammar Foundations',
        description: 'Solidify pronouns, present continuous actions, past simple, and questions.',
        lessonCount: 4,
        lessons: [
          {
            id: 'eng_l9',
            lessonNumber: 1,
            title: 'Personal Pronouns in Action',
            description: 'Distinguish subject vs object pronouns (I vs me, they vs them).',
            xpReward: 35,
            grammarFocus: 'Subject & Object Pronoun Concord',
            completed: false,
          },
          {
            id: 'eng_l10',
            lessonNumber: 2,
            title: 'Present Continuous Actions',
            description: 'Describe actions happening right now using "am/is/are + verb-ing".',
            xpReward: 35,
            grammarFocus: 'Present Continuous Tense Formation',
            completed: false,
          },
          {
            id: 'eng_l11',
            lessonNumber: 3,
            title: 'Past Time & Events',
            description: 'Narrate what happened yesterday using essential irregular verbs (went, saw, had).',
            xpReward: 35,
            grammarFocus: 'Past Simple & Time Adverbials (yesterday, last week)',
            completed: false,
          },
          {
            id: 'eng_l12',
            lessonNumber: 4,
            title: 'Forming Questions',
            description: 'Ask who, what, where, when, why, and how with auxiliary "do/does".',
            xpReward: 35,
            grammarFocus: 'Wh- Questions & Inversion',
            completed: false,
          },
        ],
      },
    ],
  },

  // --- TAMIL A1 (Standard Script) ---
  {
    id: 'tamil_a1',
    languageId: 'tamil',
    title: 'Tamil A1 — எழுத்துக்களும் அடிப்படைகளும் (Tamil Foundations)',
    cefr: 'A1',
    level: 'Beginner',
    description: 'Learn pure standard Tamil script, formal salutations (வணக்கம்), sentence structure, and vocabulary.',
    icon: 'Languages',
    totalLessons: 10,
    units: [
      {
        id: 'tam_u1',
        levelId: 'tamil_a1',
        unitNumber: 1,
        title: 'Unit 1 — எழுத்துக்களும் வணக்கங்களும் (Script & Greetings)',
        description: 'Discover Tamil vowels (உயிரெழுத்துக்கள்), consonants (மெய்யெழுத்துக்கள்), and formal greetings.',
        lessonCount: 4,
        lessons: [
          {
            id: 'tam_l1',
            lessonNumber: 1,
            title: 'வணக்கம் & வாழ்த்துகள் (Greetings & Politeness)',
            description: 'Learn standard polite greetings: வணக்கம் (Hello), நன்றி (Thank you), and காலை வணக்கம்.',
            xpReward: 25,
            grammarFocus: 'Honorific Greetings & Polite Address',
            completed: false,
          },
          {
            id: 'tam_l2',
            lessonNumber: 2,
            title: 'சுய அறிமுகம் (Introducing Yourself)',
            description: 'State your name and inquire after health: என் பெயர்..., நீங்கள் எப்படி இருக்கிறீர்கள்?',
            xpReward: 25,
            grammarFocus: 'First Person Possessive (என்) & Copular Sentences',
            completed: false,
          },
          {
            id: 'tam_l3',
            lessonNumber: 3,
            title: 'அன்றாடப் பொருட்கள் (Common Objects)',
            description: 'Learn essential nouns in standard script: புத்தகம் (book), நீர் (water), பேனா (pen).',
            xpReward: 25,
            grammarFocus: 'Singular Nouns & Demonstratives (இது / அது)',
            completed: false,
          },
          {
            id: 'tam_l4',
            lessonNumber: 4,
            title: 'தமிழ் எண்கள் (Numbers 1–10)',
            description: 'Master standard Tamil numbers: ஒன்று, இரண்டு, மூன்று, நான்கு, ஐந்து.',
            xpReward: 25,
            grammarFocus: 'Tamil Numerals & Counting Syntax',
            completed: false,
          },
        ],
      },
      {
        id: 'tam_u2',
        levelId: 'tamil_a1',
        unitNumber: 2,
        title: 'Unit 2 — அன்றாட வாழ்க்கை (Everyday Life)',
        description: 'Explore family relationships, meals, and home vocabulary in standard Tamil.',
        lessonCount: 3,
        lessons: [
          {
            id: 'tam_l5',
            lessonNumber: 1,
            title: 'குடும்பம் & உறவுகள் (Family & Relations)',
            description: 'Standard terms for அம்மா (mother), அப்பா (father), அண்ணன் (elder brother), and தங்கை.',
            xpReward: 30,
            grammarFocus: 'Kinship Terms & Genitive Postpositions',
            completed: false,
          },
          {
            id: 'tam_l6',
            lessonNumber: 2,
            title: 'உணவு & விருந்து (Food & Dining)',
            description: 'Talk about சோறு (rice), தண்ணீர் (water), தேநீர் (tea), and பழம் (fruit).',
            xpReward: 30,
            grammarFocus: 'Direct Objects & Accusative Marker (-ஐ)',
            completed: false,
          },
          {
            id: 'tam_l7',
            lessonNumber: 3,
            title: 'அன்றாட வழக்கம் (Daily Routine)',
            description: 'Everyday activities: எழுந்திருத்தல் (waking up), சாப்பிடுதல் (eating), படித்தல் (reading).',
            xpReward: 30,
            grammarFocus: 'Verbal Nouns & Habitual Aspect',
            completed: false,
          },
        ],
      },
      {
        id: 'tam_u3',
        levelId: 'tamil_a1',
        unitNumber: 3,
        title: 'Unit 3 — இலக்கண அடிப்படைகள் (Grammar Foundations)',
        description: 'Master Tamil pronouns, present-tense conjugations, and respectful imperatives.',
        lessonCount: 3,
        lessons: [
          {
            id: 'tam_l8',
            lessonNumber: 1,
            title: 'பிரதிப்பெயர்ச்சொற்கள் (Personal Pronouns)',
            description: 'Differentiate நான் (I), நீங்கள் (you - polite), அவன் (he), அவள் (she), and அவர்கள் (they).',
            xpReward: 35,
            grammarFocus: 'Pronominal Agreement & Politeness Levels',
            completed: false,
          },
          {
            id: 'tam_l9',
            lessonNumber: 2,
            title: 'நிகழ்காலம் (Present Tense Verbs)',
            description: 'Conjugate standard present tense: நான் போகிறேன் (I am going), நான் படிக்கிறேன்.',
            xpReward: 35,
            grammarFocus: 'Present Tense Markers (-கிறு-/-கின்று-) & Subject Suffixes',
            completed: false,
          },
          {
            id: 'tam_l10',
            lessonNumber: 3,
            title: 'மரியாதைக் கட்டளைகள் (Polite Imperatives)',
            description: 'Form polite requests: வாருங்கள் (please come), உட்காருங்கள் (please sit).',
            xpReward: 35,
            grammarFocus: 'Imperative Polite Suffix (-உங்கள்)',
            completed: false,
          },
        ],
      },
    ],
  },

  // --- HINDI A1 (Standard Devanagari) ---
  {
    id: 'hindi_a1',
    languageId: 'hindi',
    title: 'Hindi A1 — देवनागरी और मूल बातें (Hindi Foundations)',
    cefr: 'A1',
    level: 'Beginner',
    description: 'Learn standard Hindi in Devanagari script: formal greetings, basic sentence structure, and gender agreement.',
    icon: 'Sparkles',
    totalLessons: 10,
    units: [
      {
        id: 'hin_u1',
        levelId: 'hindi_a1',
        unitNumber: 1,
        title: 'Unit 1 — देवनागरी और शिष्टाचार (Script & Politeness)',
        description: 'Master standard Devanagari consonants, vowels, and formal greetings.',
        lessonCount: 4,
        lessons: [
          {
            id: 'hin_l1',
            lessonNumber: 1,
            title: 'नमस्ते और अभिवादन (Greetings & Politeness)',
            description: 'Learn standard formal greetings: नमस्ते (Hello), धन्यवाद (Thank you), and आप कैसे हैं?',
            xpReward: 25,
            grammarFocus: 'Honorific Greetings & Polite Adverbs',
            completed: false,
          },
          {
            id: 'hin_l2',
            lessonNumber: 2,
            title: 'अपना परिचय (Self-Introduction)',
            description: 'State your name and well-being: मेरा नाम... है, मैं ठीक हूँ।',
            xpReward: 25,
            grammarFocus: 'Possessive Pronoun (मेरा/मेरी) & Auxiliary "हूँ/है"',
            completed: false,
          },
          {
            id: 'hin_l3',
            lessonNumber: 3,
            title: 'सामान्य वस्तुएँ (Common Words)',
            description: 'Learn core nouns: किताब (book), पानी (water), कलम (pen), and घर (house).',
            xpReward: 25,
            grammarFocus: 'Noun Gender (Masculine / Feminine)',
            completed: false,
          },
          {
            id: 'hin_l4',
            lessonNumber: 4,
            title: 'संख्याएँ १–१० (Numbers 1–10)',
            description: 'Master Hindi numbers: एक, दो, तीन, चार, पाँच, छह, सात, आठ, नौ, दस।',
            xpReward: 25,
            grammarFocus: 'Devanagari Numerals & Quantifiers',
            completed: false,
          },
        ],
      },
      {
        id: 'hin_u2',
        levelId: 'hindi_a1',
        unitNumber: 2,
        title: 'Unit 2 — दैनिक जीवन (Daily Life)',
        description: 'Talk about family members, food, and daily routines in standard Hindi.',
        lessonCount: 3,
        lessons: [
          {
            id: 'hin_l5',
            lessonNumber: 1,
            title: 'परिवार और रिश्ते (Family & Relations)',
            description: 'Standard vocabulary for माँ (mother), पिता (father), भाई (brother), and बहन (sister).',
            xpReward: 30,
            grammarFocus: 'Possessive Agreement (का / के / की)',
            completed: false,
          },
          {
            id: 'hin_l6',
            lessonNumber: 2,
            title: 'भोजन और पेय (Food & Drinks)',
            description: 'Express preferences: खाना (food), पानी (water), चाय (tea), and फल (fruit).',
            xpReward: 30,
            grammarFocus: 'Dative Construction (मुझे... पसंद है)',
            completed: false,
          },
          {
            id: 'hin_l7',
            lessonNumber: 3,
            title: 'दैनिक दिनचर्या (Daily Routine)',
            description: 'Everyday verbs: जागना (wake up), पढ़ना (study), जाना (go), and सोना (sleep).',
            xpReward: 30,
            grammarFocus: 'Infinitives as Verbal Nouns',
            completed: false,
          },
        ],
      },
      {
        id: 'hin_u3',
        levelId: 'hindi_a1',
        unitNumber: 3,
        title: 'Unit 3 — व्याकरण की नींव (Grammar Foundations)',
        description: 'Understand pronouns, simple present tense, and question formation.',
        lessonCount: 3,
        lessons: [
          {
            id: 'hin_l8',
            lessonNumber: 1,
            title: 'सर्वनाम (Personal Pronouns)',
            description: 'Master मैं (I), आप (you - respectful), वह (he/she), and हम (we).',
            xpReward: 35,
            grammarFocus: 'Pronoun Tiers (तू, तुम, आप)',
            completed: false,
          },
          {
            id: 'hin_l9',
            lessonNumber: 2,
            title: 'वर्तमान काल (Simple Present Tense)',
            description: 'Form habitual present: मैं जाता हूँ (M) / मैं जाती हूँ (F).',
            xpReward: 35,
            grammarFocus: 'Habitual Aspect (-ता/-ती/-ते) & Gender Agreement',
            completed: false,
          },
          {
            id: 'hin_l10',
            lessonNumber: 3,
            title: 'प्रश्न निर्माण (Forming Questions)',
            description: 'Ask क्या (what), कहाँ (where), कब (when), and कैसे (how).',
            xpReward: 35,
            grammarFocus: 'Interrogatives & Sentence Intonation',
            completed: false,
          },
        ],
      },
    ],
  },

  // --- SPANISH A1 ---
  {
    id: 'spanish_a1',
    languageId: 'spanish',
    title: 'Spanish A1 — Fundamentos',
    cefr: 'A1',
    level: 'Beginner',
    description: 'Learn standard Spanish: greetings (¡Hola!), verb conjugations (ser/estar), gendered articles, and conversation.',
    icon: 'Compass',
    totalLessons: 10,
    units: [
      {
        id: 'es_u1',
        levelId: 'spanish_a1',
        unitNumber: 1,
        title: 'Unit 1 — Saludos y Cortesía',
        description: 'Master foundational salutations, introductions, and everyday politeness.',
        lessonCount: 4,
        lessons: [
          {
            id: 'es_l1',
            lessonNumber: 1,
            title: 'Saludos y Cortesía',
            description: 'Say hello, good morning, please, and thank you: ¡Hola!, Buenos días, Por favor, Gracias.',
            xpReward: 25,
            grammarFocus: 'Punctuation (¡ / ¿) & Formulaic Salutations',
            completed: false,
          },
          {
            id: 'es_l2',
            lessonNumber: 2,
            title: 'Presentarse',
            description: 'Introduce yourself: Me llamo..., Mucho gusto, ¿Cómo te llamas?',
            xpReward: 25,
            grammarFocus: 'Reflexive Verb "llamarse" & Subject Inversion',
            completed: false,
          },
          {
            id: 'es_l3',
            lessonNumber: 3,
            title: 'Objetos Cotidianos',
            description: 'Learn standard objects: el libro, la mesa, el agua, la casa.',
            xpReward: 25,
            grammarFocus: 'Definite Articles (el / la) & Gender of Nouns',
            completed: false,
          },
          {
            id: 'es_l4',
            lessonNumber: 4,
            title: 'Los Números 1–10',
            description: 'Count accurately: uno, dos, tres, cuatro, cinco, seis, siete, ocho, nueve, diez.',
            xpReward: 25,
            grammarFocus: 'Cardinal Numerals & Plural Agreement',
            completed: false,
          },
        ],
      },
      {
        id: 'es_u2',
        levelId: 'spanish_a1',
        unitNumber: 2,
        title: 'Unit 2 — La Vida Diaria',
        description: 'Talk about family members, food, and daily routines.',
        lessonCount: 3,
        lessons: [
          {
            id: 'es_l5',
            lessonNumber: 1,
            title: 'La Familia',
            description: 'Family members: la madre, el padre, el hermano, and la hermana.',
            xpReward: 30,
            grammarFocus: 'Possessive Adjectives (mi / mis, tu / tus)',
            completed: false,
          },
          {
            id: 'es_l6',
            lessonNumber: 2,
            title: 'Comida y Bebida',
            description: 'Ordering food: la manzana, el pan, el agua, and el café.',
            xpReward: 30,
            grammarFocus: 'Verbs of Preference (me gusta / quiero)',
            completed: false,
          },
          {
            id: 'es_l7',
            lessonNumber: 3,
            title: 'Rutina Cotidiana',
            description: 'Daily verbs: despertar, comer, trabajar, and dormir.',
            xpReward: 30,
            grammarFocus: 'Regular Present Tense (-ar / -er / -ir)',
            completed: false,
          },
        ],
      },
      {
        id: 'es_u3',
        levelId: 'spanish_a1',
        unitNumber: 3,
        title: 'Unit 3 — Gramática Esencial',
        description: 'Master personal pronouns, ser vs. estar, and asking questions.',
        lessonCount: 3,
        lessons: [
          {
            id: 'es_l8',
            lessonNumber: 1,
            title: 'Pronombres y Ser / Estar',
            description: 'Differentiate yo, tú, él, ella, nosotros, and when to use ser vs. estar.',
            xpReward: 35,
            grammarFocus: 'Ser (Permanent) vs Estar (Temporary State)',
            completed: false,
          },
          {
            id: 'es_l9',
            lessonNumber: 2,
            title: 'Verbos en Presente',
            description: 'Conjugate common verbs in present indicative (hablo, como, vivo).',
            xpReward: 35,
            grammarFocus: 'Present Indicative Conjugation Paradigms',
            completed: false,
          },
          {
            id: 'es_l10',
            lessonNumber: 3,
            title: 'Hacer Preguntas',
            description: 'Form questions: ¿Qué?, ¿Dónde?, ¿Cuándo?, and ¿Cómo?',
            xpReward: 35,
            grammarFocus: 'Interrogative Words with Accents (¿Dónde?, ¿Cómo?)',
            completed: false,
          },
        ],
      },
    ],
  },

  // --- TELUGU A1 ---
  {
    id: 'telugu_a1',
    languageId: 'telugu',
    title: 'Telugu A1 — తెలుగు అక్షరాలు & పరిచయం (Telugu Foundations)',
    cefr: 'A1',
    level: 'Beginner',
    description: 'Learn standard literary and conversational Telugu in Telugu script with honorifics and grammar.',
    icon: 'BookOpen',
    totalLessons: 8,
    units: [
      {
        id: 'te_u1',
        levelId: 'telugu_a1',
        unitNumber: 1,
        title: 'Unit 1 — నమస్కారం & పరిచయం (Greetings & Basics)',
        description: 'Learn polite Telugu greetings, self-introduction, and everyday words.',
        lessonCount: 4,
        lessons: [
          {
            id: 'te_l1',
            lessonNumber: 1,
            title: 'నమస్కారం & మర్యాదలు (Greetings & Politeness)',
            description: 'Standard polite greetings: నమస్కారం (Hello), ధన్యవాదాలు (Thank you), and బాగున్నారా?',
            xpReward: 25,
            grammarFocus: 'Polite Inquiries & Honorific Endings',
            completed: false,
          },
          {
            id: 'te_l2',
            lessonNumber: 2,
            title: 'పరిచయం (Introducing Yourself)',
            description: 'Introduce yourself: నా పేరు..., నేను బాగున్నాను.',
            xpReward: 25,
            grammarFocus: 'Possessive (నా) & Copular Sentences',
            completed: false,
          },
          {
            id: 'te_l3',
            lessonNumber: 3,
            title: 'వస్తువులు (Common Objects)',
            description: 'Nouns: పుస్తకం (book), నీరు (water), కలం (pen), and ఇల్లు (house).',
            xpReward: 25,
            grammarFocus: 'Inanimate Nouns & Demonstratives (ఇది / అది)',
            completed: false,
          },
          {
            id: 'te_l4',
            lessonNumber: 4,
            title: 'సంఖ్యలు (Numbers 1–10)',
            description: 'Count in Telugu: ఒకటి, రెండు, మూడు, నాలుగు, ఐదు.',
            xpReward: 25,
            grammarFocus: 'Telugu Numerals & Counting',
            completed: false,
          },
        ],
      },
      {
        id: 'te_u2',
        levelId: 'telugu_a1',
        unitNumber: 2,
        title: 'Unit 2 — కుటుంబం & ఆహారం (Family & Daily Life)',
        description: 'Talk about family members, meals, and daily routines in standard Telugu.',
        lessonCount: 4,
        lessons: [
          {
            id: 'te_l5',
            lessonNumber: 1,
            title: 'కుటుంబ సభ్యులు (Family Members)',
            description: 'Kinship: అమ్మ (mother), నాన్న (father), అన్నయ్య (elder brother), and చెల్లెలు.',
            xpReward: 30,
            grammarFocus: 'Kinship Suffixes & Honorific Forms',
            completed: false,
          },
          {
            id: 'te_l6',
            lessonNumber: 2,
            title: 'ఆహారం (Food & Drinks)',
            description: 'Dining: అన్నం (rice), నీరు (water), పాలు (milk), and పండు (fruit).',
            xpReward: 30,
            grammarFocus: 'Dative Desiderative (నాకు... కావాలి)',
            completed: false,
          },
          {
            id: 'te_l7',
            lessonNumber: 3,
            title: 'సర్వనామాలు (Pronouns)',
            description: 'Master నేను (I), మీరు (you - polite), అతడు (he), and ఆమె (she).',
            xpReward: 35,
            grammarFocus: 'Pronoun Concord & Verbal Endings',
            completed: false,
          },
          {
            id: 'te_l8',
            lessonNumber: 4,
            title: 'వర్తమాన కాలం (Present Tense)',
            description: 'Present actions: నేను వెళ్తున్నాను (I am going), నేను చదువుతున్నాను.',
            xpReward: 35,
            grammarFocus: 'Present Continuous Aspect & Gender-Number Suffixes',
            completed: false,
          },
        ],
      },
    ],
  },

  // --- FRENCH A1 ---
  {
    id: 'french_a1',
    languageId: 'french',
    title: 'French A1 — Les Bases',
    cefr: 'A1',
    level: 'Beginner',
    description: 'Learn standard French: greetings (Bonjour!), introductions, articles, and essential present-tense verbs.',
    icon: 'Compass',
    totalLessons: 8,
    units: [
      {
        id: 'fr_u1',
        levelId: 'french_a1',
        unitNumber: 1,
        title: 'Unit 1 — Les Salutations & La Politesse',
        description: 'Learn standard French greetings, introductions, and everyday courtesy.',
        lessonCount: 4,
        lessons: [
          {
            id: 'fr_l1',
            lessonNumber: 1,
            title: 'Salutations et Politesse',
            description: 'Say hello, good morning, please, and thank you: Bonjour, S\'il vous plaît, Merci.',
            xpReward: 25,
            grammarFocus: 'Formulaic Courtesy & Formal "Vous" vs Informal "Tu"',
            completed: false,
          },
          {
            id: 'fr_l2',
            lessonNumber: 2,
            title: 'Se Présenter',
            description: 'Introduce yourself: Je m\'appelle..., Enchanté, Comment vous appelez-vous?',
            xpReward: 25,
            grammarFocus: 'Pronominal Verb "S\'appeler" & Subject Pronouns',
            completed: false,
          },
          {
            id: 'fr_l3',
            lessonNumber: 3,
            title: 'Objets du Quotidien',
            description: 'Nouns: le livre, la table, l\'eau, and la maison.',
            xpReward: 25,
            grammarFocus: 'Definite Articles (le / la / l\') & Gender',
            completed: false,
          },
          {
            id: 'fr_l4',
            lessonNumber: 4,
            title: 'Les Nombres 1–10',
            description: 'Count in French: un, deux, trois, quatre, cinq, six, sept, huit, neuf, dix.',
            xpReward: 25,
            grammarFocus: 'Liaison & Pronunciation of Numerals',
            completed: false,
          },
        ],
      },
      {
        id: 'fr_u2',
        levelId: 'french_a1',
        unitNumber: 2,
        title: 'Unit 2 — La Vie Quotidienne & Grammaire',
        description: 'Talk about family, food, and foundational verbs être and avoir.',
        lessonCount: 4,
        lessons: [
          {
            id: 'fr_l5',
            lessonNumber: 1,
            title: 'La Famille',
            description: 'Family: la mère, le père, le frère, and la sœur.',
            xpReward: 30,
            grammarFocus: 'Possessive Adjectives (mon / ma / mes)',
            completed: false,
          },
          {
            id: 'fr_l6',
            lessonNumber: 2,
            title: 'La Nourriture',
            description: 'Dining: le pain, le fromage, l\'eau, and le café.',
            xpReward: 30,
            grammarFocus: 'Partitive Articles (du / de la / des)',
            completed: false,
          },
          {
            id: 'fr_l7',
            lessonNumber: 3,
            title: 'Être et Avoir',
            description: 'Conjugate irregular auxiliaries: je suis, tu es, j\'ai, tu as.',
            xpReward: 35,
            grammarFocus: 'Irregular Present Indicative (Être & Avoir)',
            completed: false,
          },
          {
            id: 'fr_l8',
            lessonNumber: 4,
            title: 'Poser des Questions',
            description: 'Ask questions with "Est-ce que", "Où", "Quand", and "Comment".',
            xpReward: 35,
            grammarFocus: 'Question Structures (Est-ce que & Inversion)',
            completed: false,
          },
        ],
      },
    ],
  },
];

// 3. Complete Lessons Database with Varied Exercise Types
export const LESSON_REPOSITORY: Record<string, LearningLesson> = {
  // === ENGLISH LESSONS ===
  eng_l1: {
    id: 'eng_l1',
    languageId: 'english',
    levelId: 'english_a1',
    unitId: 'eng_u1',
    unitNumber: 1,
    lessonNumber: 1,
    title: 'Greetings & Salutations',
    description: 'Master formal and informal greetings: "Hello", "Good morning", and polite responses.',
    difficulty: 'Beginner',
    xpReward: 25,
    grammarFocus: 'Polite Salutations & Formulaic Greetings',
    vocabularyWords: ['Hello', 'Good morning', 'How are you?', 'Thank you', 'Goodbye', 'Fine'],
    exercises: [
      {
        id: 'eng_l1_ex1',
        type: 'multiple_choice',
        prompt: 'What is the polite morning greeting when greeting someone before noon?',
        targetText: 'Good morning.',
        translation: 'காலை வணக்கம் / सुप्रभात',
        options: ['Good morning.', 'Good night.', 'Goodbye.', 'See you later.'],
        correctAnswer: 0,
        explanation: '"Good morning" is the standard greeting used from sunrise until midday (12:00 PM).',
        grammarPoint: 'Formulaic Time-Based Salutations',
      },
      {
        id: 'eng_l1_ex2',
        type: 'translation',
        prompt: 'Translate the following greeting into standard English:',
        targetText: 'Thank you.',
        subText: 'Expressing gratitude politely (நன்றி / धन्यवाद)',
        correctAnswer: 'Thank you',
        hints: ['Two words: starts with T, ends with you', 'Standard expression of appreciation'],
        explanation: '"Thank you" (or less formal "Thanks") is the universal English expression of gratitude.',
        grammarPoint: 'Direct Expression of Politeness',
      },
      {
        id: 'eng_l1_ex3',
        type: 'word_order',
        prompt: 'Arrange the word chips into the standard polite response to "How are you?":',
        targetText: 'I am doing well thank you',
        options: ['well', 'thank', 'am', 'I', 'doing', 'you'],
        correctAnswer: ['I', 'am', 'doing', 'well', 'thank', 'you'],
        explanation: 'Subject ("I") + auxiliary ("am") + participle ("doing") + adverb ("well") followed by gratitude ("thank you").',
        grammarPoint: 'Word Order in Declarative Responses',
      },
      {
        id: 'eng_l1_ex4',
        type: 'listening',
        prompt: 'Listen to the audio clip and select what you heard:',
        targetText: 'How are you today?',
        audioText: 'How are you today?',
        options: [
          'How are you today?',
          'Who are you today?',
          'Where are you today?',
          'How old are you today?',
        ],
        correctAnswer: 0,
        explanation: 'The speaker asked: "How are you today?" to inquire about your current well-being.',
        grammarPoint: 'Listening: Distinguishing Interrogative Particles (How vs Who vs Where)',
      },
      {
        id: 'eng_l1_ex5',
        type: 'speaking',
        prompt: 'Speak the following standard greeting clearly into your microphone:',
        targetText: 'Good morning, nice to see you.',
        correctAnswer: 'Good morning, nice to see you.',
        explanation: 'Pronounce the vowels in "morning" and the soft "c" in "nice" clearly.',
        grammarPoint: 'Spoken Greeting Cadence & Intonation',
      },
      {
        id: 'eng_l1_ex6',
        type: 'writing',
        prompt: 'Write a full sentence welcoming someone to class or an office:',
        targetText: 'Welcome, please come in.',
        correctAnswer: 'Welcome, please come in.',
        explanation: '"Welcome, please come in" combines the greeting "Welcome" with the polite imperative "please come in".',
        grammarPoint: 'Polite Imperatives with "Please"',
      },
    ],
  },

  eng_l2: {
    id: 'eng_l2',
    languageId: 'english',
    levelId: 'english_a1',
    unitId: 'eng_u1',
    unitNumber: 1,
    lessonNumber: 2,
    title: 'Introducing Yourself',
    description: 'State your name, origin, and greeting pleasantries: "My name is...", "Nice to meet you".',
    difficulty: 'Beginner',
    xpReward: 25,
    grammarFocus: 'Verb "to be" (am / is / are) & Possessive "My"',
    vocabularyWords: ['Name', 'My', 'Meet', 'Nice', 'From', 'Student'],
    exercises: [
      {
        id: 'eng_l2_ex1',
        type: 'word_order',
        prompt: 'Arrange the word chips to form the correct self-introduction:',
        targetText: 'My name is Harish',
        options: ['Harish', 'My', 'is', 'name'],
        correctAnswer: ['My', 'name', 'is', 'Harish'],
        explanation: 'Standard English word order for introductions is Possessive ("My") + Noun ("name") + Copula ("is") + Proper Noun.',
        grammarPoint: 'Possessive Determiner + Subject Copula Agreement',
      },
      {
        id: 'eng_l2_ex2',
        type: 'multiple_choice',
        prompt: 'Choose the correct form of the verb "to be" to complete the sentence: "I _____ a student."',
        targetText: 'am',
        options: ['am', 'is', 'are', 'be'],
        correctAnswer: 0,
        explanation: 'The first-person singular subject pronoun "I" always takes "am" in the present indicative.',
        grammarPoint: 'Subject-Verb Concord: First Person Singular (I am)',
      },
      {
        id: 'eng_l2_ex3',
        type: 'translation',
        prompt: 'Translate into English: "உங்களைச் சந்தித்ததில் மகிழ்ச்சி" / "आपसे मिलकर खुशी हुई":',
        targetText: 'Nice to meet you.',
        correctAnswer: 'Nice to meet you',
        hints: ['Four words', 'Begins with Nice'],
        explanation: '"Nice to meet you" is the standard idiomatic expression upon being introduced to someone new.',
        grammarPoint: 'Formulaic Polite Expressions',
      },
      {
        id: 'eng_l2_ex4',
        type: 'reading',
        prompt: 'Read the short passage and answer the comprehension question:',
        readingPassage: 'Hello! My name is Maya. I am from Chennai, and I am studying linguistics in college. I enjoy learning new languages and reading books.',
        readingQuestion: 'What is Maya studying in college?',
        targetText: 'linguistics',
        options: ['Linguistics', 'Mathematics', 'Medicine', 'History'],
        correctAnswer: 0,
        explanation: 'The passage explicitly states: "I am studying linguistics in college."',
        grammarPoint: 'Reading Comprehension: Identifying Specific Details',
      },
      {
        id: 'eng_l2_ex5',
        type: 'speaking',
        prompt: 'Speak this sentence into your microphone:',
        targetText: 'Hello, my name is Alex and I am a software engineer.',
        correctAnswer: 'Hello, my name is Alex and I am a software engineer.',
        explanation: 'Ensure the link between "am" and "a" flows naturally: /aɪ æm ə/.',
        grammarPoint: 'Phonetic Linking in Copular Phrases',
      },
    ],
  },

  eng_l10: {
    id: 'eng_l10',
    languageId: 'english',
    levelId: 'english_a1',
    unitId: 'eng_u3',
    unitNumber: 3,
    lessonNumber: 2,
    title: 'Present Continuous Actions',
    description: 'Describe actions happening right now using "am/is/are + verb-ing".',
    difficulty: 'Elementary',
    xpReward: 35,
    grammarFocus: 'Present Continuous Tense Formation',
    vocabularyWords: ['going', 'eating', 'reading', 'studying', 'now', 'currently'],
    exercises: [
      {
        id: 'eng_l10_ex1',
        type: 'multiple_choice',
        prompt: 'Which sentence correctly describes an action happening right now?',
        targetText: 'I am going to school.',
        options: ['I am going to school.', 'I going to school.', 'I am go to school.', 'I goes to school.'],
        correctAnswer: 0,
        explanation: 'Standard present continuous requires the auxiliary verb ("am") + present participle ("going").',
        grammarPoint: 'Present Continuous: Auxiliary + verb-ing',
      },
      {
        id: 'eng_l10_ex2',
        type: 'word_order',
        prompt: 'Arrange the words to form the continuous sentence:',
        targetText: 'She is reading a book now',
        options: ['a', 'now', 'reading', 'is', 'She', 'book'],
        correctAnswer: ['She', 'is', 'reading', 'a', 'book', 'now'],
        explanation: 'Subject ("She") + auxiliary ("is") + verb-ing ("reading") + object ("a book") + adverb ("now").',
        grammarPoint: 'Constituent Word Order in Progressive Aspect',
      },
      {
        id: 'eng_l10_ex3',
        type: 'writing',
        prompt: 'Write what you are doing right now using the present continuous tense:',
        targetText: 'I am studying English.',
        correctAnswer: 'I am studying English.',
        explanation: 'Use "am + studying" to indicate an ongoing action.',
        grammarPoint: 'Productive Grammar: Present Continuous',
      },
    ],
  },

  eng_l11: {
    id: 'eng_l11',
    languageId: 'english',
    levelId: 'english_a1',
    unitId: 'eng_u3',
    unitNumber: 3,
    lessonNumber: 3,
    title: 'Past Time & Events',
    description: 'Narrate what happened yesterday using essential irregular verbs (went, saw, had).',
    difficulty: 'Elementary',
    xpReward: 35,
    grammarFocus: 'Past Simple & Time Adverbials (yesterday, last week)',
    vocabularyWords: ['went', 'saw', 'yesterday', 'market', 'bought', 'walked'],
    exercises: [
      {
        id: 'eng_l11_ex1',
        type: 'multiple_choice',
        prompt: 'Identify the grammatically correct sentence describing an action completed yesterday:',
        targetText: 'I went to the market yesterday.',
        options: [
          'I went to the market yesterday.',
          'I going market yesterday.',
          'I am go to the market yesterday.',
          'I will went to market yesterday.',
        ],
        correctAnswer: 0,
        explanation: '"Yesterday" denotes a completed past timeframe; standard English requires the past simple form "went", not "going".',
        grammarPoint: 'Past Simple with Definite Past Adverbials',
      },
      {
        id: 'eng_l11_ex2',
        type: 'translation',
        prompt: 'Translate into standard English: "நான் நேற்று ஒரு புத்தகம் வாங்கினேன்" / "मैंने कल एक किताब खरीदी":',
        targetText: 'I bought a book yesterday.',
        correctAnswer: 'I bought a book yesterday',
        explanation: 'The past tense of the irregular verb "buy" is "bought".',
        grammarPoint: 'Irregular Past Tense Forms',
      },
    ],
  },

  // === TAMIL LESSONS (Standard Script & Vocabulary) ===
  tam_l1: {
    id: 'tam_l1',
    languageId: 'tamil',
    levelId: 'tamil_a1',
    unitId: 'tam_u1',
    unitNumber: 1,
    lessonNumber: 1,
    title: 'வணக்கம் & வாழ்த்துகள் (Greetings & Politeness)',
    description: 'Learn standard polite greetings: வணக்கம் (Hello), நன்றி (Thank you), and காலை வணக்கம்.',
    difficulty: 'Beginner',
    xpReward: 25,
    grammarFocus: 'Honorific Greetings & Polite Address',
    vocabularyWords: ['வணக்கம்', 'நன்றி', 'காலை வணக்கம்', 'மன்னிக்கவும்', 'தயவு செய்து'],
    exercises: [
      {
        id: 'tam_l1_ex1',
        type: 'multiple_choice',
        prompt: 'What is the standard, universal polite greeting in Tamil corresponding to "Hello" or "Greetings"?',
        targetText: 'வணக்கம்',
        phonetic: 'Vanakkam',
        options: ['வணக்கம்', 'நன்றி', 'மன்னிக்கவும்', 'தயவு செய்து'],
        correctAnswer: 0,
        explanation: '"வணக்கம்" (Vanakkam) is the revered, traditional Tamil salutation conveying respect and greeting.',
        grammarPoint: 'Traditional Honorific Salutations',
      },
      {
        id: 'tam_l1_ex2',
        type: 'multiple_choice',
        prompt: 'What does "Thank you" mean in standard Tamil?',
        targetText: 'நன்றி',
        phonetic: 'Nandri',
        options: ['நன்றி', 'வணக்கம்', 'மன்னிக்கவும்', 'தயவு செய்து'],
        correctAnswer: 0,
        explanation: '"நன்றி" (Nandri) means "Thank you" in standard Tamil, expressing sincere gratitude.',
        grammarPoint: 'Expressions of Gratitude',
      },
      {
        id: 'tam_l1_ex3',
        type: 'word_order',
        prompt: 'Arrange the words to form the standard polite question "How are you?":',
        targetText: 'நீங்கள் எப்படி இருக்கிறீர்கள்',
        phonetic: 'Neengal eppadi irukkireergal?',
        options: ['இருக்கிறீர்கள்', 'எப்படி', 'நீங்கள்'],
        correctAnswer: ['நீங்கள்', 'எப்படி', 'இருக்கிறீர்கள்'],
        explanation: 'Polite Pronoun ("நீங்கள்") + Interrogative ("எப்படி") + Finite Verb with polite plural suffix ("இருக்கிறீர்கள்").',
        grammarPoint: 'Tamil SOV (Subject-Object-Verb) & Honorific Verb Conjugation',
      },
      {
        id: 'tam_l1_ex4',
        type: 'listening',
        prompt: 'Listen to the audio clip and select the phrase spoken in standard Tamil:',
        targetText: 'காலை வணக்கம்',
        phonetic: 'Kaalai Vanakkam',
        audioText: 'காலை வணக்கம்',
        options: ['காலை வணக்கம்', 'மாலை வணக்கம்', 'இரவு வணக்கம்', 'வணக்கம்'],
        correctAnswer: 0,
        explanation: 'The audio said: "காலை வணக்கம்" (Good morning).',
        grammarPoint: 'Listening: Tamil Compound Salutations (காலை + வணக்கம்)',
      },
      {
        id: 'tam_l1_ex5',
        type: 'speaking',
        prompt: 'Pronounce the greeting in standard Tamil into your microphone:',
        targetText: 'வணக்கம், நீங்கள் நலமா?',
        phonetic: 'Vanakkam, neengal nalamaa?',
        correctAnswer: 'வணக்கம் நீங்கள் நலமா',
        explanation: 'Pronounce the retroflex "ண" and "ள" clearly.',
        grammarPoint: 'Tamil Retroflex Consonant Articulation (ண, ள)',
      },
    ],
  },

  tam_l2: {
    id: 'tam_l2',
    languageId: 'tamil',
    levelId: 'tamil_a1',
    unitId: 'tam_u1',
    unitNumber: 1,
    lessonNumber: 2,
    title: 'சுய அறிமுகம் (Introducing Yourself)',
    description: 'State your name and inquire after health: என் பெயர்..., நான் நலமாக இருக்கிறேன்.',
    difficulty: 'Beginner',
    xpReward: 25,
    grammarFocus: 'First Person Possessive (என்) & Copular Sentences',
    vocabularyWords: ['என்', 'பெயர்', 'நான்', 'நலமாக', 'இருக்கிறேன்'],
    exercises: [
      {
        id: 'tam_l2_ex1',
        type: 'word_order',
        prompt: 'Arrange the words in standard Tamil to say "My name is Harish":',
        targetText: 'என் பெயர் ஹரிஷ்',
        phonetic: 'En peyar Harish',
        options: ['ஹரிஷ்', 'என்', 'பெயர்'],
        correctAnswer: ['என்', 'பெயர்', 'ஹரிஷ்'],
        explanation: 'In Tamil, "என் பெயர் ஹரிஷ்" means "My name is Harish" (Tamil does not require an overt copular verb in simple identificational clauses).',
        grammarPoint: 'Zero Copula in Tamil Nominal Predicates',
      },
      {
        id: 'tam_l2_ex2',
        type: 'translation',
        prompt: 'Translate the English sentence "I am well" into standard Tamil:',
        targetText: 'நான் நலமாக இருக்கிறேன்.',
        phonetic: 'Naan nalamaaga irukkiren.',
        correctAnswer: 'நான் நலமாக இருக்கிறேன்',
        hints: ['Starts with நான்', 'Ends with இருக்கிறேன்'],
        explanation: '"நான் நலமாக இருக்கிறேன்" is the standard formal reply to an inquiry about one’s well-being.',
        grammarPoint: 'Adverbial Suffix -ஆக (-aaga) on Nouns',
      },
    ],
  },

  // === HINDI LESSONS (Standard Devanagari) ===
  hin_l1: {
    id: 'hin_l1',
    languageId: 'hindi',
    levelId: 'hindi_a1',
    unitId: 'hin_u1',
    unitNumber: 1,
    lessonNumber: 1,
    title: 'नमस्ते और अभिवादन (Greetings & Politeness)',
    description: 'Learn standard formal greetings: नमस्ते (Hello), धन्यवाद (Thank you), and आप कैसे हैं?',
    difficulty: 'Beginner',
    xpReward: 25,
    grammarFocus: 'Honorific Greetings & Polite Adverbs',
    vocabularyWords: ['नमस्ते', 'धन्यवाद', 'सुप्रभात', 'कृपया', 'माफ़ कीजिए'],
    exercises: [
      {
        id: 'hin_l1_ex1',
        type: 'multiple_choice',
        prompt: 'What does the standard Devanagari greeting "नमस्ते" mean?',
        targetText: 'Hello / Greetings',
        phonetic: 'Namaste',
        options: ['Hello / Greetings', 'Thank you', 'Goodbye', 'Please'],
        correctAnswer: 0,
        explanation: '"नमस्ते" (Namaste) is the standard respectful greeting across Hindi-speaking regions.',
        grammarPoint: 'Etymological & Sociolinguistic Salutations',
      },
      {
        id: 'hin_l1_ex2',
        type: 'multiple_choice',
        prompt: 'What is the formal expression for "Thank you" in standard Hindi?',
        targetText: 'धन्यवाद',
        phonetic: 'Dhanyavaad',
        options: ['धन्यवाद', 'नमस्ते', 'माफ़ कीजिए', 'अलविदा'],
        correctAnswer: 0,
        explanation: '"धन्यवाद" (Dhanyavaad) expresses polite gratitude in standard formal Hindi.',
        grammarPoint: 'Formal Courtesy Lexicon',
      },
      {
        id: 'hin_l1_ex3',
        type: 'word_order',
        prompt: 'Arrange the Devanagari words to ask a respectful "How are you?":',
        targetText: 'आप कैसे हैं',
        phonetic: 'Aap kaise hain?',
        options: ['हैं', 'आप', 'कैसे'],
        correctAnswer: ['आप', 'कैसे', 'हैं'],
        explanation: 'Polite Pronoun ("आप") + Interrogative ("कैसे") + Plural Honorific Auxiliary ("हैं").',
        grammarPoint: 'Honorific Pronoun & Auxiliary Concord in Hindi',
      },
      {
        id: 'hin_l1_ex4',
        type: 'listening',
        prompt: 'Listen to the audio clip and identify the Hindi phrase:',
        targetText: 'सुप्रभात, आपका दिन शुभ हो।',
        phonetic: 'Suprabhat, aapka din shubh ho.',
        audioText: 'सुप्रभात, आपका दिन शुभ हो।',
        options: [
          'सुप्रभात, आपका दिन शुभ हो।',
          'शुभ रात्रि, कल मिलेंगे।',
          'नमस्ते, आप कैसे हैं?',
          'धन्यवाद, बहुत अच्छा।',
        ],
        correctAnswer: 0,
        explanation: 'The speaker said: "सुप्रभात, आपका दिन शुभ हो।" (Good morning, have a good day).',
        grammarPoint: 'Listening: Standard Sanskrit-derived Wishes (शुभ)',
      },
      {
        id: 'hin_l1_ex5',
        type: 'speaking',
        prompt: 'Speak this sentence in standard Hindi into your microphone:',
        targetText: 'नमस्ते, मैं ठीक हूँ।',
        phonetic: 'Namaste, main theek hoon.',
        correctAnswer: 'नमस्ते मैं ठीक हूँ',
        explanation: 'Pronounce the nasalized "हूँ" (hoon) at the end of the sentence.',
        grammarPoint: 'Devanagari Anunasik (ँ) Nasalization',
      },
    ],
  },

  hin_l2: {
    id: 'hin_l2',
    languageId: 'hindi',
    levelId: 'hindi_a1',
    unitId: 'hin_u1',
    unitNumber: 1,
    lessonNumber: 2,
    title: 'अपना परिचय (Self-Introduction)',
    description: 'State your name and well-being: मेरा नाम... है, मैं ठीक हूँ।',
    difficulty: 'Beginner',
    xpReward: 25,
    grammarFocus: 'Possessive Pronoun (मेरा/मेरी) & Auxiliary "हूँ/है"',
    vocabularyWords: ['मेरा', 'नाम', 'है', 'मैं', 'ठीक'],
    exercises: [
      {
        id: 'hin_l2_ex1',
        type: 'word_order',
        prompt: 'Arrange the words to say "My name is Harish" in standard Hindi:',
        targetText: 'मेरा नाम हरीश है',
        phonetic: 'Mera naam Harish hai',
        options: ['हरीश', 'मेरा', 'है', 'नाम'],
        correctAnswer: ['मेरा', 'नाम', 'हरीश', 'है'],
        explanation: 'Standard Hindi word order: Possessive ("मेरा") + Noun ("नाम") + Name ("हरीश") + Verb ("है").',
        grammarPoint: 'Hindi SOV Copular Clause Structure',
      },
      {
        id: 'hin_l2_ex2',
        type: 'translation',
        prompt: 'Translate into Hindi: "I am a student" (Male speaker):',
        targetText: 'मैं एक छात्र हूँ।',
        phonetic: 'Main ek chhatra hoon.',
        correctAnswer: 'मैं एक छात्र हूँ',
        hints: ['Starts with मैं', 'Ends with हूँ'],
        explanation: '"मैं एक छात्र हूँ" uses the masculine noun "छात्र" and first-person auxiliary "हूँ".',
        grammarPoint: 'First-Person Auxiliary Agreement (मैं ... हूँ)',
      },
    ],
  },

  // === SPANISH LESSONS ===
  es_l1: {
    id: 'es_l1',
    languageId: 'spanish',
    levelId: 'spanish_a1',
    unitId: 'es_u1',
    unitNumber: 1,
    lessonNumber: 1,
    title: 'Saludos y Cortesía',
    description: 'Say hello, good morning, please, and thank you: ¡Hola!, Buenos días, Por favor, Gracias.',
    difficulty: 'Beginner',
    xpReward: 25,
    grammarFocus: 'Punctuation (¡ / ¿) & Formulaic Salutations',
    vocabularyWords: ['Hola', 'Buenos días', 'Gracias', 'Por favor', 'Adiós'],
    exercises: [
      {
        id: 'es_l1_ex1',
        type: 'multiple_choice',
        prompt: 'What is the universal friendly greeting in Spanish for "Hello"?',
        targetText: '¡Hola!',
        options: ['¡Hola!', '¡Adiós!', 'Por favor', 'Gracias'],
        correctAnswer: 0,
        explanation: '"¡Hola!" is the standard Spanish greeting used throughout the Spanish-speaking world.',
        grammarPoint: 'Spanish Silent "H" & Inverted Punctuation',
      },
      {
        id: 'es_l1_ex2',
        type: 'translation',
        prompt: 'Translate "Thank you very much" into standard Spanish:',
        targetText: 'Muchas gracias.',
        correctAnswer: 'Muchas gracias',
        hints: ['Two words', 'Begins with Muchas'],
        explanation: '"Muchas gracias" translates to "Thank you very much" or "Many thanks".',
        grammarPoint: 'Adjective-Noun Gender/Number Concord (Muchas gracias - feminine plural)',
      },
      {
        id: 'es_l1_ex3',
        type: 'word_order',
        prompt: 'Arrange the words to ask "How are you?" in polite/formal Spanish:',
        targetText: '¿Cómo está usted?',
        options: ['usted', '¿Cómo', 'está?'],
        correctAnswer: ['¿Cómo', 'está', 'usted?'],
        explanation: 'Interrogative ("¿Cómo") + Verb ("está") + Formal Pronoun ("usted").',
        grammarPoint: 'Formal Register with "Usted"',
      },
      {
        id: 'es_l1_ex4',
        type: 'listening',
        prompt: 'Listen to the audio clip and select what you heard:',
        targetText: 'Buenos días, mucho gusto.',
        audioText: 'Buenos días, mucho gusto.',
        options: [
          'Buenos días, mucho gusto.',
          'Buenas noches, hasta luego.',
          'Buenas tardes, ¿cómo estás?',
          'Hola, ¿qué tal?',
        ],
        correctAnswer: 0,
        explanation: 'The speaker said: "Buenos días, mucho gusto." (Good morning, nice to meet you).',
        grammarPoint: 'Listening: Morning Greetings vs Afternoon/Evening',
      },
      {
        id: 'es_l1_ex5',
        type: 'speaking',
        prompt: 'Speak this sentence in Spanish into your microphone:',
        targetText: 'Hola, me llamo Carlos.',
        correctAnswer: 'Hola me llamo Carlos',
        explanation: 'Pronounce the double "ll" in "llamo" as /j/ or /dʒ/.',
        grammarPoint: 'Spanish Palatal Lateral Approximant (ll)',
      },
    ],
  },
};

// 4. Curriculum Helper Functions
export function getSupportedLanguages(): SupportedLanguage[] {
  return SUPPORTED_LANGUAGES;
}

export function getCoursesByLanguage(languageId?: string): LearningCourse[] {
  if (!languageId) return COURSES;
  return COURSES.filter((c) => c.languageId === languageId);
}

export function getCourse(courseId: string): LearningCourse | undefined {
  return COURSES.find((c) => c.id === courseId);
}

export function getLesson(lessonId: string): LearningLesson | undefined {
  return LESSON_REPOSITORY[lessonId];
}

// 5. Intelligent Linguistic Writing Evaluator (LinguaLens NLP)
export async function evaluateWriting(
  targetLanguage: string,
  promptText: string,
  studentText: string,
  expectedSentence: string
): Promise<WritingAnalysisResult> {
  const cleanStudent = studentText.trim().toLowerCase();
  const cleanExpected = expectedSentence.trim().toLowerCase();

  // If exact or very close match
  if (cleanStudent === cleanExpected || cleanStudent === cleanExpected.replace(/[.,!?;:]/g, '')) {
    const explanation = 'Exemplary sentence formation! Your syntax, spelling, and tense concord are accurate.';
    return {
      isCorrect: true,
      score: 100,
      overallScore: 100,
      explanation,
      feedback: explanation,
    };
  }

  // Domain-specific rule checks (e.g. past tense "I going market yesterday" trap requested by user)
  if (cleanStudent.includes('yesterday') && (cleanStudent.includes('going') || cleanStudent.includes('go'))) {
    const explanation = '"Yesterday" indicates past time, so use the past tense "went", not "going" or "go".';
    return {
      isCorrect: false,
      score: 45,
      overallScore: 45,
      issue: 'Past tense grammar',
      suggestedCorrection: expectedSentence || 'I went to the market yesterday.',
      explanation,
      feedback: explanation,
    };
  }

  if (cleanStudent.includes('he go') || cleanStudent.includes('she go')) {
    const explanation = 'In present simple, third-person singular subjects (he/she/it) require the verb ending "-es" (goes).';
    return {
      isCorrect: false,
      score: 55,
      overallScore: 55,
      issue: 'Third-person singular present tense (-s)',
      suggestedCorrection: cleanStudent.replace(/\bgo\b/, 'goes'),
      explanation,
      feedback: explanation,
    };
  }

  // Calculate Levenshtein similarity
  const similarity = calculateStringSimilarity(cleanStudent, cleanExpected);
  const isMatch = similarity >= 0.75;
  const score = Math.round(similarity * 100);
  const explanation = isMatch
    ? 'Understood with minor typographical or punctuation differences.'
    : `Compare with the standard form: "${expectedSentence}". Pay close attention to word choice and grammatical markers.`;

  return {
    isCorrect: isMatch,
    score,
    overallScore: score,
    issue: isMatch ? undefined : 'Vocabulary or structural variance',
    suggestedCorrection: expectedSentence,
    explanation,
    feedback: explanation,
  };
}

// 6. Speech Recognition Evaluator (Microphone Input)
export function evaluateSpeechRecognition(
  targetLanguage: string,
  recognizedText: string,
  targetText: string
): SpeechEvaluationResult {
  const normRec = recognizedText.toLowerCase().replace(/[.,!?;:]/g, '').trim();
  const normTarget = targetText.toLowerCase().replace(/[.,!?;:]/g, '').trim();

  const recTokens = normRec.split(/\s+/).filter(Boolean);
  const targetTokens = normTarget.split(/\s+/).filter(Boolean);

  const matched = targetTokens.filter((token) => recTokens.includes(token));
  const missingWords = targetTokens.filter((token) => !recTokens.includes(token));
  const extraWords = recTokens.filter((token) => !targetTokens.includes(token));

  const accuracyScore = Math.min(
    100,
    Math.round((matched.length / Math.max(1, targetTokens.length)) * 100)
  );

  const isMatch = accuracyScore >= 65;

  let feedback = '';
  if (accuracyScore >= 90) {
    feedback = 'Excellent pronunciation! Your acoustic cadence and word recognition were recognized with high fidelity.';
  } else if (accuracyScore >= 65) {
    feedback = 'Good attempt. The core words were understood, with slight phonological variations.';
  } else {
    feedback = `Keep practicing. Missing key words: ${missingWords.slice(0, 3).join(', ')}. Speak at a steady pace closer to the microphone.`;
  }

  return {
    recognizedText,
    targetText,
    accuracyScore,
    isMatch,
    missingWords,
    extraWords,
    feedback,
  };
}

// 7. Full Lesson Attempt Submission & Validation
export function submitLessonAttempt(
  lessonId: string,
  answers: any[]
): {
  score: number;
  accuracy: number;
  xpEarned: number;
  passed: boolean;
  isPerfect: boolean;
  wordsLearned: number;
  grammarPracticed: string;
  results: Array<{
    questionIndex: number;
    isCorrect: boolean;
    explanation: string;
    correctAnswerText: string;
    userAnswerText: string;
  }>;
  progress: any;
} {
  const lesson = getLesson(lessonId);
  if (!lesson) {
    throw new Error(`Lesson ${lessonId} not found`);
  }

  let correctCount = 0;
  const mistakesToRecord: any[] = [];

  const results = lesson.exercises.map((ex, idx) => {
    const rawUserAnswer = answers[idx];
    let isCorrect = false;
    let userAnswerText = '';
    let correctAnswerText = '';

    if (ex.type === 'multiple_choice' || ex.type === 'listening') {
      const chosenIdx = typeof rawUserAnswer === 'number' ? rawUserAnswer : Number(rawUserAnswer);
      isCorrect = chosenIdx === (ex.correctAnswer as number);
      userAnswerText = ex.options ? ex.options[chosenIdx] || 'No selection' : String(chosenIdx);
      correctAnswerText = ex.options ? ex.options[ex.correctAnswer as number] || '' : String(ex.correctAnswer);
    } else if (ex.type === 'word_order') {
      const userTokens: string[] = Array.isArray(rawUserAnswer) ? rawUserAnswer : [];
      const expectedTokens: string[] = Array.isArray(ex.correctAnswer) ? ex.correctAnswer : [];
      userAnswerText = userTokens.join(' ');
      correctAnswerText = expectedTokens.join(' ');
      isCorrect =
        userTokens.join(' ').trim().toLowerCase() === expectedTokens.join(' ').trim().toLowerCase();
    } else if (ex.type === 'translation' || ex.type === 'writing') {
      const userStr = String(rawUserAnswer || '').trim().toLowerCase().replace(/[.,!?;:]/g, '');
      const expectedStr = String(ex.correctAnswer || ex.targetText).trim().toLowerCase().replace(/[.,!?;:]/g, '');
      userAnswerText = String(rawUserAnswer || '');
      correctAnswerText = String(ex.correctAnswer || ex.targetText);
      isCorrect = userStr === expectedStr || calculateStringSimilarity(userStr, expectedStr) >= 0.8;
    } else if (ex.type === 'reading') {
      const chosenIdx = typeof rawUserAnswer === 'number' ? rawUserAnswer : Number(rawUserAnswer);
      isCorrect = chosenIdx === (ex.correctAnswer as number);
      userAnswerText = ex.options ? ex.options[chosenIdx] || '' : String(chosenIdx);
      correctAnswerText = ex.options ? ex.options[ex.correctAnswer as number] || '' : String(ex.correctAnswer);
    } else if (ex.type === 'speaking') {
      const evalResult = evaluateSpeechRecognition(lesson.languageId, String(rawUserAnswer || ''), ex.targetText);
      isCorrect = evalResult.isMatch;
      userAnswerText = evalResult.recognizedText;
      correctAnswerText = ex.targetText;
    }

    if (isCorrect) {
      correctCount++;
    } else {
      mistakesToRecord.push({
        userId: 'user_default',
        languageId: lesson.languageId,
        lessonId: lesson.id,
        exerciseId: ex.id,
        exercisePrompt: ex.prompt,
        targetText: ex.targetText,
        userAnswer: userAnswerText,
        correctAnswer: correctAnswerText,
        explanation: ex.explanation,
        grammarPoint: ex.grammarPoint,
      });
    }

    return {
      questionIndex: idx,
      isCorrect,
      explanation: ex.explanation,
      correctAnswerText,
      userAnswerText,
    };
  });

  const accuracy = Math.round((correctCount / lesson.exercises.length) * 100);
  const passed = accuracy >= 60;
  const isPerfect = accuracy === 100;

  // Real XP formula:
  // Correct answer = +5 XP each
  // Lesson completed = +20 XP
  // Perfect lesson bonus = +10 XP
  let xpEarned = correctCount * 5;
  if (passed) xpEarned += 20;
  if (isPerfect) xpEarned += 10;

  // Record mistakes in database for personalized review
  if (mistakesToRecord.length > 0) {
    db.recordMistakes(mistakesToRecord);
  }

  // Update persistent progress
  const progress = db.recordLessonAttempt({
    lessonId: lesson.id,
    score: accuracy,
    xpEarned,
    accuracy,
    passed,
  });

  return {
    score: accuracy,
    accuracy,
    xpEarned,
    passed,
    isPerfect,
    wordsLearned: lesson.vocabularyWords?.length || 5,
    grammarPracticed: lesson.grammarFocus || 'Core Sentence Patterns',
    results,
    progress,
  };
}

// Utility: Levenshtein distance similarity
function calculateStringSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  const longerLength = longer.length;

  let editDistance = 0;
  const matrix: number[][] = [];

  for (let i = 0; i <= shorter.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= longer.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= shorter.length; i++) {
    for (let j = 1; j <= longer.length; j++) {
      if (shorter.charAt(i - 1) === longer.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  editDistance = matrix[shorter.length][longer.length];
  return (longerLength - editDistance) / longerLength;
}
