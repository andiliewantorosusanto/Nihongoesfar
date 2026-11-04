import kana from '../../../public/kana.json' with { type: 'json' };
import kanji from '../../../public/kanji.json' with { type: 'json' };
import grammar from '../../../public/grammar.json' with { type: 'json' };
import vocabulary from '../../../public/vocabulary.json' with { type: 'json' };
import numbers from '../../../public/numbers.json' with { type: 'json' };
import adjectives from '../../../public/adjectives.json' with { type: 'json' };
import type { Entry } from './types.ts';

export type { Entry } from './types.ts';

// Tests and content tools read exactly the same subject files as the published site.
export const entries = [kana, kanji, grammar, vocabulary, numbers, adjectives].flat() as Entry[];
