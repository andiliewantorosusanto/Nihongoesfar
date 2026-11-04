import type { Entry } from './content.ts';
import type { TranslationToken } from './sentence-support.ts';
type Token = NonNullable<Entry['examples'][number]['tokens']>[number];
const roles: Record<string, string> = {
  t: 'topic',
  s: 'subject',
  o: 'object',
  p: 'particle',
  m: 'modifier',
  v: 'predicate',
};
// Roles belong to these authored sentences, rather than a guessed Japanese parser.
const layouts: Record<string, string | string[]> = {
  desu: 'tpvv',
  question: 'tpvvp',
  no: 'tpmpvv',
  mo: 'tpvv',
  demonstratives: ['tpvv', 'mtpvpv', 'mtpvpv', 'mtpvpv'],
  masu: 'mvv',
  object: 'opv',
  de: ['mpv', 'mpopv', 'mpopv', 'mpopv'],
  destination: 'mpv',
  'time-ni': 'mpv',
  arimasu: 'spv',
  imasu: 'spv',
  location: 'mpspv',
  'noun-negative': 'tpvv',
  'noun-past': 'tpvv',
  masen: ['opv', 'opv', 'opv', 'tpv'],
  'verb-past': 'mopv',
  'existence-negative': 'spv',
  'i-adjective': 'mtpvv',
  'na-adjective': 'mtpvv',
  suki: 'tpspv',
  hoshii: 'tpspv',
  tai: ['opv', 'opv', 'opv', 'mpv'],
  'adjective-kute': 'mtpvvv',
  'description-de': ['mtpvpvv', 'mtpvpvv', 'tpvpvv', 'tpvpvv'],
  'te-sequence': ['opvmpv', 'opvv', 'mpvv', 'opvv'],
  'pass-by': ['mpmpv', 'mpmpv', 'mpvv', 'mmpv'],
  'drop-by': ['mpv', 'mpvv', 'mpmpv', 'mpv'],
  'te-request': 'opvv',
  'te-imasu': 'mopv',
};
const wrongLayouts: Record<string, string> = {
  'description-de': 'mtpvvv',
  question: 'tpvpv',
  mo: 'tppvv',
  demonstratives: 'mpvv',
  object: 'spv',
  'i-adjective': 'mtpvpv',
  'na-adjective': 'mtpvpv',
};
const english = `
@desu
I~topic| am a student.~predicate
Tanaka~topic| is a teacher.~predicate
This~topic| is a book.~predicate
That~topic| is a clock.~predicate
@question
Is ~predicate|this~topic| a book~predicate|?~particle
Is ~predicate|Tanaka~topic| a teacher~predicate|?~particle
Is ~predicate|that~topic| a clock~predicate|?~particle
Is ~predicate|that~topic| a school over there~predicate|?~particle
@no
This~topic| is ~predicate|my~modifier| book.~predicate
That~topic| is ~predicate|the teacher's~modifier| clock.~predicate
That~topic| is ~predicate|Tanaka's~modifier| car over there.~predicate
This~topic| is ~predicate|my mother's~modifier| bag.~predicate
@mo
I~topic| am ~predicate|also~particle| a student.~predicate
Tanaka~topic| is ~predicate|also~particle| a teacher.~predicate
This~topic| is ~predicate|also~particle| a book.~predicate
That~topic| is ~predicate|also~particle| a clock.~predicate
@demonstratives
This~topic| is a book.~predicate
This ~modifier|book~topic| is mine.~predicate
That ~modifier|clock~topic| is the teacher's.~predicate
That ~modifier|car~topic| over there~modifier| is Tanaka's.~predicate
@masu
I ~implicit|study~predicate| every day.~modifier
I ~implicit|work~predicate| in the morning.~modifier
I ~implicit|walk~predicate| every day.~modifier
I ~implicit|study~predicate| at night.~modifier
@object
I ~implicit|drink ~predicate|water.~object
I ~implicit|read ~predicate|a book.~object
I ~implicit|eat ~predicate|bread.~object
I ~implicit|drink ~predicate|tea.~object
@de
I ~implicit|study~predicate| at the library.~modifier
I ~implicit|read ~predicate|a book~object| at home.~modifier
I ~implicit|eat ~predicate|bread~object| at school.~modifier
I ~implicit|drink ~predicate|tea~object| at home.~modifier
@destination
I ~implicit|go~predicate| to school.~modifier
I ~implicit|go~predicate| to the library.~modifier
I ~implicit|return~predicate| home.~modifier
I ~implicit|go~predicate| to Japan.~modifier
@time-ni
I ~implicit|get up~predicate| at seven.~modifier
I ~implicit|go~predicate| at eight.~modifier
I ~implicit|study~predicate| at nine.~modifier
I ~implicit|return~predicate| at six.~modifier
@arimasu
There is ~predicate|a book.~subject
There is ~predicate|a desk.~subject
There is ~predicate|a clock.~subject
There is ~predicate|a car.~subject
@imasu
There is ~predicate|a cat.~subject
There is ~predicate|a teacher.~subject
There is ~predicate|a dog.~subject
Tanaka~subject| is here.~predicate
@location
There is ~predicate|a cat~subject| in the room.~modifier
There is ~predicate|a teacher~subject| at school.~modifier
There is ~predicate|a book~subject| at home.~modifier
There is ~predicate|a desk~subject| in the room.~modifier
@noun-negative
I~topic| am not a teacher.~predicate
This~topic| is not a book.~predicate
Tanaka~topic| is not a student.~predicate
That~topic| is not a clock.~predicate
@noun-past
Yesterday~topic| was a day off.~predicate
Tanaka~topic| was a student.~predicate
This place~topic| was a school.~predicate
Yesterday~topic| was rainy.~predicate
@masen
I ~implicit|do not drink ~predicate|water.~object
I ~implicit|do not read ~predicate|books.~object
I ~implicit|do not eat ~predicate|bread.~object
I ~implicit|do not work~predicate| today.~topic
@verb-past
I ~implicit|read ~predicate|a book~object| yesterday.~modifier
I ~implicit|drank ~predicate|water~object| yesterday.~modifier
I ~implicit|ate ~predicate|bread~object| yesterday.~modifier
I ~implicit|went~predicate| to school~modifier| yesterday.~modifier
@existence-negative
There is no ~predicate|book.~subject
There is no ~predicate|desk.~subject
There is no ~predicate|cat.~subject
There is no ~predicate|teacher.~subject
@i-adjective
This ~modifier|book~topic| is interesting.~predicate
This ~modifier|car~topic| is expensive.~predicate
This ~modifier|room~topic| is big.~predicate
This ~modifier|book~topic| is new.~predicate
@na-adjective
This ~modifier|room~topic| is quiet.~predicate
This ~modifier|school~topic| is convenient.~predicate
This ~modifier|room~topic| is clean.~predicate
This ~modifier|town~topic| is quiet.~predicate
@suki
I~topic| like ~predicate|cats.~subject
I~topic| like ~predicate|books.~subject
Tanaka~topic| likes ~predicate|tea.~subject
I~topic| like ~predicate|dogs.~subject
@hoshii
I~topic| want ~predicate|a book.~subject
I~topic| want ~predicate|a car.~subject
I~topic| want ~predicate|a clock.~subject
I~topic| want ~predicate|some water.~subject
@tai
I ~implicit|want to drink ~predicate|water.~object
I ~implicit|want to read ~predicate|a book.~object
I ~implicit|want to eat ~predicate|bread.~object
I ~implicit|want to go~predicate| to Japan.~modifier
@te-request
Please read ~predicate|the book.~object
Please drink ~predicate|the water.~object
Please write ~predicate|your name.~object
Please eat ~predicate|the bread.~object
@te-imasu
I ~implicit|am reading ~predicate|a book~object| now.~modifier
I ~implicit|am drinking ~predicate|water~object| now.~modifier
I ~implicit|am writing ~predicate|my name~object| now.~modifier
I ~implicit|am eating ~predicate|bread~object| now.~modifier
@adjective-kute
This ~modifier|book~topic| is interesting and inexpensive.~predicate
This ~modifier|car~topic| is big and new.~predicate
This ~modifier|room~topic| is bright and spacious.~predicate
This ~modifier|bag~topic| is light and convenient.~predicate
@description-de
This ~modifier|town~topic| is quiet and convenient.~predicate
This ~modifier|room~topic| is clean and quiet.~predicate
Tanaka~topic| is a teacher and kind.~predicate
My mother~topic| is a doctor and healthy.~predicate
@te-sequence
I ~implicit|eat ~predicate|bread~object| and then go~predicate| to school.~modifier
I ~implicit|read ~predicate|a book~object| and then go to bed.~predicate
I ~implicit|return ~predicate|home~modifier| and then study.~predicate
I ~implicit|drink ~predicate|water~object| and then rest.~predicate
@pass-by
I ~implicit|pass~predicate| in front of the station.~modifier
I ~implicit|pass~predicate| in front of the school.~modifier
I ~implicit|go home~predicate| through the park.~modifier
I ~implicit|take~predicate| this road.~modifier
@drop-by
I ~implicit|stop by~predicate| the shop.~modifier
I ~implicit|stop by~predicate| the bank~modifier| and then go home.~predicate
I ~implicit|drop by~predicate| my friend's house.~modifier
I ~implicit|stop by~predicate| the convenience store.~modifier
`;
const translations = Object.fromEntries(
  english
    .trim()
    .split('\n@')
    .map((block) => {
      const [id, ...rows] = block.replace(/^@/, '').split('\n');
      return [
        id,
        rows.map((row) =>
          row.split('|').map((part) => {
            const [text, role] = part.split('~');
            return {
              text,
              role,
              ...(role === 'implicit' ? { implicit: true } : {}),
            } as TranslationToken;
          }),
        ),
      ];
    }),
);
export function annotateGrammarSentence(
  tiles: { text: string; reading: string }[],
  id: string,
  index: number,
  meaning?: string,
  wrong = false,
) {
  const layout = layouts[id];
  const letters = (wrong && wrongLayouts[id]) || (Array.isArray(layout) ? layout[index] : layout);
  if (!letters || letters.length !== tiles.length)
    throw new Error(`Missing role alignment: ${id}/${index} (${tiles.length})`);
  const annotated = tiles.map((tile, i) => ({
    ...tile,
    role: roles[letters[i]],
    wordClass:
      letters[i] === 'p'
        ? 'particle'
        : letters[i] === 'v'
          ? 'predicate'
          : letters[i] === 'm'
            ? 'modifier'
            : 'noun phrase',
  }));
  const tokens: Token[] = [];
  for (const tile of annotated) {
    const previous = tokens.at(-1);
    if (previous && previous.role === tile.role) {
      previous.text += tile.text;
      previous.reading = (previous.reading || '') + tile.reading;
    } else tokens.push({ ...tile });
  }
  const translationTokens = wrong ? undefined : translations[id]?.[index];
  if (translationTokens && translationTokens.map((t) => t.text).join('') !== meaning)
    throw new Error(`Translation changed: ${id}/${index}`);
  return { tiles: annotated, tokens, translationTokens };
}

// Add only absent annotations to unchanged authored text. Owner edits stay intact.
