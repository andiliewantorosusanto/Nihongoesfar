import { useState } from 'react';
import {
  numberGuide,
  hourGuide,
  minuteGuide,
  compoundMinuteGuide,
} from '../lib/guides/number-guide';
import { convertNumber, maximumNumber } from '../lib/guides/number-converter';
import { toRomaji } from '../lib/japanese/romaji';
import GuideTable from './GuideTable';

export default function NumbersGuide({
  view,
  romaji,
}: Readonly<{
  view: 'numbers' | 'time';
  romaji: boolean;
}>) {
  const [place, setPlace] = useState(1);
  const numberRows = numberGuide.map(({ value }) => {
    const number = value * place;
    const result = convertNumber(number);
    return {
      value: number.toLocaleString('en'),
      japanese: result.kanji,
      kana: result.hiragana,
      romaji: toRomaji(result.hiragana),
      special: numberGuide.some((row) =>
        [row.hundred, row.thousand].some(
          (reading) => reading.special && reading.kana === result.hiragana,
        ),
      ),
    };
  });
  return (
    <section
      className="numbers-guide"
      aria-label={view === 'numbers' ? 'Numbers quick guide' : 'Time quick guide'}
    >
      {view === 'numbers' ? (
        <>
          <GuideTable title="Number patterns and sound changes" rows={numberRows} romaji={romaji}>
            <p>
              Build numbers from large to small. Japanese groups large numbers around 万 and 億.
              Highlighted readings have sound changes.
            </p>
            <label htmlFor="number-place">Place value</label>
            <select
              id="number-place"
              value={place}
              onChange={(event) => setPlace(Number(event.target.value))}
            >
              {Array.from(
                { length: String(maximumNumber).length },
                (_, exponent) => 10 ** exponent,
              ).map((value) => (
                <option key={value} value={value}>
                  {value.toLocaleString('en')}
                </option>
              ))}
            </select>
          </GuideTable>
        </>
      ) : (
        <>
          <p>
            Ask <span lang="ja">今、何時ですか。</span> Answer with the time +{' '}
            <span lang="ja">です</span>. Use 午前 for a.m., 午後 for p.m., and 半 for half past.
          </p>
          <GuideTable
            title="Hours and half past"
            romaji={romaji}
            rows={hourGuide.map((row) => ({
              value: `${row.value}:00`,
              japanese: convertNumber(row.value).kanji + '時',
              kana: row.reading.kana,
              romaji: row.reading.romaji,
              special: row.reading.special,
            }))}
          >
            <p>
              Add <span lang="ja">半（はん）</span> after the hour for half past. Highlighted
              readings are irregular.
            </p>
          </GuideTable>
          <GuideTable
            title="Minutes"
            romaji={romaji}
            rows={minuteGuide.map((row) => ({
              value: String(row.value),
              japanese: convertNumber(row.value).kanji + '分',
              kana: row.reading.kana,
              romaji: row.reading.romaji,
              special: row.reading.special,
            }))}
          >
            <p>
              Minutes use <span lang="ja">ふん</span> or <span lang="ja">ぷん</span>. Learn the
              sound changes in the table.
            </p>
          </GuideTable>
          <GuideTable
            title="Minutes beyond ten"
            romaji={romaji}
            rows={compoundMinuteGuide.map((row) => ({
              value: String(row.value),
              japanese: convertNumber(row.value).kanji + '分',
              kana: row.reading.kana,
              romaji: row.reading.romaji,
              special: row.reading.special,
            }))}
          >
            <p>
              For 11–59 minutes, say the tens, then use the same ending as the final digit: 2, 5, 7,
              and 9 use ふん; 1, 3, 4, 6, and 8 use ぷん. The small っ stays in いっぷん, ろっぷん,
              and はっぷん. For example, 13 follows 3 (さんぷん), and 28 follows 8 (はっぷん).
            </p>
            <p>
              Exact tens use じゅっぷん: 20 is にじゅっぷん and 30 is さんじゅっぷん. Before another
              digit, keep じゅう: 21 is にじゅういっぷん. For 30 minutes past the hour, you can also
              use 半（はん）.
            </p>
          </GuideTable>
        </>
      )}
    </section>
  );
}
