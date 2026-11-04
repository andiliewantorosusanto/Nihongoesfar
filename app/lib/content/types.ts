import type { TranslationToken } from '../japanese/sentence-support.ts';

export type ReadingText = {
  text: string;
  reading: string;
  role?: string;
  wordClass?: string;
  tokens?: Entry['examples'][number]['tokens'];
  tiles?: Entry['examples'][number]['tokens'];
  translationTokens?: Entry['examples'][number]['translationTokens'];
};
export type GuidedExercise = {
  id: string;
  type: 'meaning-choice' | 'pattern-choice' | 'gap' | 'tiles' | 'typing';
  prompt: string;
  context?: ReadingText;
  choices?: ReadingText[];
  tiles?: ReadingText[];
  answers: string[];
  hint: string;
  explanation: string;
  feedback: ReadingText & { meaning?: string };
  alternate?: boolean;
};
export type GrammarLesson = {
  order: number;
  group: string;
  goal: string;
  prerequisites: string[];
  recap: string;
  comparison: string;
  examples: Entry['examples'];
  vocabulary: (ReadingText & { meaning: string })[];
};

export type ReferenceTable = { heading: string; columns: string[]; rows: ReadingText[][] };

export type Entry = {
  id: string;
  kind: 'kana' | 'kanji' | 'grammar' | 'vocabulary' | 'numbers' | 'adjectives';
  title: string;
  japanese: string;
  reading: string;
  romaji?: string;
  meaning: string;
  level: string;
  topic: string;
  tags: string[];
  note: string;
  examples: {
    japanese: string;
    reading: string;
    meaning: string;
    tokens?: { text: string; role: string; wordClass: string; reading?: string }[];
    translationTokens?: TranslationToken[];
  }[];
  forms?: { polite: string; casual: string };
  on?: string;
  kun?: string;
  compounds?: { japanese: string; reading: string; meaning: string }[];
  references?: ReferenceTable[];
  lesson?: GrammarLesson;
  exercises?: GuidedExercise[];
  exercise?: { prompt: string; answers: string[]; explanation: string; tiles?: string[] };
};
