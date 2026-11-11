import { wordForms } from '../lib/japanese/word-forms';
import { useState } from 'react';
import { ArrowRight, ChevronDown, Search } from 'lucide-react';
import type { Entry } from '../lib/content/content';
import { skillsFor } from '../lib/practice/learning';
import { topicBookFor } from '../lib/guides/topic-books';
import { toRomaji } from '../lib/japanese/romaji';
import FamilyTree from './FamilyTree';
import Writing from './Writing';
import Scrollable from './Scrollable';
import { Sentence, ReferenceTables } from './Reading';
import { LessonIntro } from './GrammarLessons';

type EntryDetailProps = Readonly<{
  fullPage?: boolean;
  entry: Entry;
  data: {
    entries: Entry[];
    preferences: { furigana: boolean; romaji: boolean };
    strokeIds: string[];
  };
  busy: boolean;
  onOpen: (entry: Entry) => void;
  onPractice: (word?: string) => void;
}>;

function WordForms({
  entry,
  preferences,
}: Readonly<{
  entry: Entry;
  preferences: { furigana: boolean; romaji: boolean };
}>) {
  const forms = wordForms(entry);
  if (!forms) return null;
  return (
    <section className="word-forms">
      <h3>{forms.group}</h3>
      <p>{forms.note}</p>
      <ReferenceTables
        tables={[forms.table]}
        furigana={preferences.furigana}
        romaji={preferences.romaji}
      />
    </section>
  );
}

function KanaWriting({ entry }: Readonly<{ entry: Entry }>) {
  const characters = [...new Set([...entry.japanese].filter((c) => /[ぁ-ヿ]/.test(c)))];
  const [selected, setSelected] = useState(characters[0] || entry.japanese);
  return (
    <>
      {characters.length > 1 && (
        <div className="tabs" aria-label="Choose character to practice">
          {characters.map((c) => (
            <button
              key={c}
              className={selected === c ? 'selected' : ''}
              onClick={() => setSelected(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}
      <Writing character={selected} />
    </>
  );
}

function EntryReferences({
  entry,
  data,
  busy,
  onPractice,
}: Readonly<Pick<EntryDetailProps, 'entry' | 'data' | 'busy' | 'onPractice'>>) {
  const [compoundSearch, setCompoundSearch] = useState('');
  const calendar = topicBookFor(entry.id) === 'calendar';
  const [compoundLimit, setCompoundLimit] = useState(12);
  const compounds = (entry.compounds || []).filter((c) =>
    [c.japanese, c.reading, c.meaning]
      .join(' ')
      .toLowerCase()
      .includes(compoundSearch.toLowerCase()),
  );
  if (entry.lesson) {
    if (!entry.references?.length) return null;
    return (
      <ReferenceTables
        romaji={data.preferences.romaji}
        tables={entry.references}
        furigana={data.preferences.furigana}
      />
    );
  }
  return (
    <div
      className={'reference-details' + (entry.kind === 'kanji' ? ' kanji-reference-details' : '')}
    >
      {!calendar && entry.kind !== 'kanji' && entry.note && (
        <div className="lesson-note">
          {entry.note.split('\n').map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      )}
      {entry.on && (
        <div className="kanji-readings">
          <div>
            <small>ON READING</small>
            <span className="jp">{entry.on}</span>
          </div>
          <div>
            <small>KUN READING</small>
            <span className="jp">{entry.kun || '—'}</span>
          </div>
        </div>
      )}
      {entry.id === 'study-weekdays' || entry.id === 'study-months' ? (
        <Scrollable
          className="calendar-date-scroll"
          label={entry.id === 'study-weekdays' ? 'Days of the week' : 'Months of the year'}
        >
          <ol
            className={
              'calendar-date-grid ' + (entry.id === 'study-months' ? 'calendar-month-grid' : '')
            }
          >
            {entry.references?.[0]?.rows.map(([meaning, word]) => (
              <li key={word.text}>
                <span className="calendar-date-number">{meaning.text}</span>
                <span className="calendar-date-japanese jp" lang="ja">
                  {word.text}
                </span>
                <span className="calendar-date-reading" lang="ja">
                  {word.reading}
                </span>
                {data.preferences.romaji && <small>{toRomaji(word.reading)}</small>}
              </li>
            ))}
          </ol>
        </Scrollable>
      ) : entry.id === 'study-dates' ? (
        <section className="calendar-dates" aria-label="Days of the month">
          <p className="calendar-reading-key">Special reading</p>
          <Scrollable className="calendar-date-scroll" label="Date readings from 1 to 31">
            <ol className="calendar-date-grid">
              {entry.references?.[0]?.rows.map(([meaning, date], index) => (
                <li
                  key={date.text}
                  className={
                    index < 10 || [14, 20, 24].includes(index + 1) ? 'special-reading' : undefined
                  }
                  title={meaning.text}
                >
                  <span className="calendar-date-number">{index + 1}</span>
                  <span className="calendar-date-japanese jp" lang="ja">
                    {date.text}
                  </span>
                  <span className="calendar-date-reading" lang="ja">
                    {date.reading}
                  </span>
                  {data.preferences.romaji && <small>{toRomaji(date.reading)}</small>}
                </li>
              ))}
            </ol>
          </Scrollable>
        </section>
      ) : entry.id === 'study-relative-time' ? (
        <Scrollable
          className="relative-time-scroll"
          label="Before and after the current day, week, month, or year"
        >
          <div className="relative-time-grid">
            {entry.references?.[0]?.rows.map(([period, ...times]) => (
              <section className="relative-time-row" key={period.text} aria-label={period.text}>
                {times.map((time, index) => (
                  <div
                    className={index === 2 ? 'relative-time-current' : undefined}
                    key={time.text}
                  >
                    <small className="relative-time-label">
                      {
                        [
                          `2 ${period.text}s before`,
                          `1 ${period.text} before`,
                          period.text === 'day' ? 'Today' : `This ${period.text}`,
                          `1 ${period.text} after`,
                          `2 ${period.text}s after`,
                        ][index]
                      }
                    </small>
                    <span className="jp" lang="ja">
                      {time.text}
                    </span>
                    <small lang="ja">{time.reading}</small>
                    {data.preferences.romaji && <small>{toRomaji(time.reading)}</small>}
                  </div>
                ))}
              </section>
            ))}
          </div>
        </Scrollable>
      ) : entry.id === 'study-durations' ? (
        <section className="duration-guide" aria-label="Duration units">
          {[
            { unit: 'day', label: 'Days', counter: '日・日間' },
            { unit: 'week', label: 'Weeks', counter: '週間' },
            { unit: 'month', label: 'Months', counter: 'か月' },
            { unit: 'year', label: 'Years', counter: '年・年間' },
          ].map(({ unit, label, counter }) => (
            <section className="duration-unit" key={unit} aria-label={label}>
              <p className="duration-counter jp" lang="ja">
                {counter}
              </p>
              <p className="duration-key">Each mark = 1 {unit}</p>
              <ul>
                {entry.references?.[0]?.rows
                  .filter(([meaning]) => meaning.text.includes(unit))
                  .map(([meaning, duration]) => (
                    <li key={duration.text}>
                      <span className="duration-marks" aria-hidden="true">
                        {Array.from(
                          { length: { 一: 1, 二: 2, 三: 3, 六: 6 }[duration.text[0]] || 1 },
                          (_, i) => (
                            <span key={i} />
                          ),
                        )}
                      </span>
                      <span className="duration-meaning">{meaning.text}</span>
                      <span className="duration-japanese jp" lang="ja">
                        {duration.text}
                      </span>
                      <span className="duration-reading" lang="ja">
                        {duration.reading}
                      </span>
                      {data.preferences.romaji && <small>{toRomaji(duration.reading)}</small>}
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </section>
      ) : (
        !!entry.references?.length && (
          <ReferenceTables
            romaji={data.preferences.romaji}
            tables={entry.references}
            hideHeadings={calendar}
            furigana={data.preferences.furigana}
          />
        )
      )}
      {!calendar && entry.kind !== 'kanji' && (
        <>
          <h3>Examples</h3>
          {entry.examples.map((ex) => (
            <Sentence
              romaji={data.preferences.romaji}
              key={ex.japanese + ':' + ex.reading + ':' + ex.meaning}
              example={ex}
              furigana={data.preferences.furigana}
            />
          ))}
        </>
      )}
      {!!entry.compounds?.length && (
        <section className="compounds-section">
          <div className="compound-heading">
            <h3>
              Compounds <span>{entry.compounds.length}</span>
            </h3>
            <a href="/credits.html#dictionary" target="_blank" rel="noreferrer">
              JMdict ↗
            </a>
          </div>
          <label className="search-field compound-search">
            <Search size={16} />
            <input
              aria-label="Filter compounds"
              placeholder="Find a compound, reading, or meaning…"
              value={compoundSearch}
              onChange={(ev) => {
                setCompoundSearch(ev.target.value);
                setCompoundLimit(12);
              }}
            />
          </label>
          <div className="compound-labels">
            <span>Word</span>
            <span>Reading</span>
            <span>Meaning</span>
            <span />
          </div>
          {compounds.slice(0, compoundLimit).map((c) => (
            <div className="compound" key={c.japanese + ':' + c.reading}>
              <span className="jp" lang="ja">
                {c.japanese}
              </span>
              <span lang="ja">{c.reading}</span>
              <span>{c.meaning}</span>
              <button
                className="icon-button"
                aria-label={'Practice reading ' + c.japanese}
                title="Practice this word’s reading"
                disabled={busy}
                onClick={() => onPractice(c.japanese)}
              >
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
          {compounds.length > compoundLimit && (
            <button
              className="soft-button compound-show-more"
              onClick={() => setCompoundLimit(compoundLimit + 12)}
            >
              Show more ({compounds.length - compoundLimit} remaining)
              <ChevronDown size={14} aria-hidden="true" />
            </button>
          )}
          {!compounds.length && <p className="no-compounds">No compounds match your search.</p>}
        </section>
      )}
    </div>
  );
}

export default function EntryDetail({
  entry,
  data,
  busy,
  onPractice,
  onOpen,
  fullPage = false,
}: EntryDetailProps) {
  const [tab, setTab] = useState('learn');
  const calendar = topicBookFor(entry.id) === 'calendar';
  if (entry.kind === 'kana')
    return (
      <>
        <p className="eyebrow">{entry.topic}</p>
        <h2 className="detail-title">
          <span className="jp" lang="ja">
            {entry.japanese}
          </span>
        </h2>
        {data.preferences.romaji && <p className="detail-meaning">{entry.romaji}</p>}
        <KanaWriting entry={entry} />
      </>
    );
  if (entry.kind === 'vocabulary' && !fullPage)
    return (
      <>
        <h2 className="detail-title">
          <span className="jp" lang="ja">
            {entry.japanese}
          </span>
        </h2>
        {data.preferences.furigana && (
          <p className="reading" lang="ja">
            {entry.reading}
          </p>
        )}
        {data.preferences.romaji && (
          <p className="reading">{entry.romaji || toRomaji(entry.reading)}</p>
        )}
        <p className="detail-meaning">{entry.meaning}</p>
        <WordForms entry={entry} preferences={data.preferences} />
      </>
    );
  if (fullPage && entry.id === 'study-family')
    return (
      <FamilyTree
        romaji={data.preferences.romaji}
        entry={entry}
        busy={busy}
        onPractice={() => onPractice()}
      />
    );
  return (
    <>
      {!calendar && (
        <p className="eyebrow">
          {entry.level} <span className="slash">/</span> {entry.topic}
        </p>
      )}
      <div className={entry.kind === 'kanji' ? 'kanji-detail-header' : undefined}>
        {!calendar && (!fullPage || entry.id !== 'study-family') && (
          <h2 className="detail-title">
            {entry.kind === 'grammar' || entry.references?.length ? (
              entry.title
            ) : (
              <span className="jp" lang="ja">
                {entry.japanese}
              </span>
            )}
          </h2>
        )}
        {data.preferences.furigana && !entry.references?.length && (
          <p className="reading detail-reading">
            {entry.kind === 'kanji'
              ? `${entry.examples[0]?.japanese || ''} · ${entry.reading}`
              : entry.reading}
          </p>
        )}
        {data.preferences.romaji && entry.romaji && <p className="reading">{entry.romaji}</p>}
        {!entry.references?.length && <p className="detail-meaning">{entry.meaning}</p>}
      </div>
      {!calendar && entry.kind !== 'kanji' && (
        <div className="detail-actions">
          <button
            className="primary"
            disabled={busy || !skillsFor(entry, data.strokeIds.includes(entry.japanese)).length}
            onClick={() => onPractice()}
          >
            Practice <ArrowRight size={16} />
          </button>
        </div>
      )}
      <WordForms entry={entry} preferences={data.preferences} />
      {entry.forms && !wordForms(entry) && (
        <section>
          <h3>Polite and casual</h3>
          <p>
            Use polite forms with people you do not know well. Casual forms suit close friends and
            family.
          </p>
          <div className="kanji-readings">
            <div>
              <small>POLITE</small>
              <span lang="ja">{entry.forms.polite}</span>
            </div>
            <div>
              <small>CASUAL</small>
              <span lang="ja">{entry.forms.casual}</span>
            </div>
          </div>
        </section>
      )}
      {!fullPage && entry.kind === 'kanji' && (
        <div className="tabs kanji-tabs">
          <button className={tab === 'learn' ? 'selected' : ''} onClick={() => setTab('learn')}>
            Readings & compounds
          </button>
          {
            <button className={tab === 'write' ? 'selected' : ''} onClick={() => setTab('write')}>
              Stroke order & writing
            </button>
          }
        </div>
      )}
      {tab === 'learn' && entry.lesson && (
        <LessonIntro
          romaji={data.preferences.romaji}
          entry={entry}
          entries={data.entries}
          furigana={data.preferences.furigana}
          onOpen={onOpen}
        />
      )}
      {tab === 'learn' && entry.id === 'study-family' && (
        <FamilyTree romaji={data.preferences.romaji} entry={entry} />
      )}
      {tab === 'write' ? (
        <Writing character={entry.japanese} />
      ) : (
        <EntryReferences entry={entry} data={data} busy={busy} onPractice={onPractice} />
      )}
    </>
  );
}
