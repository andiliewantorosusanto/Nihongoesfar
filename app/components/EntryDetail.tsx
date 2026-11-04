import { wordForms } from '../lib/word-forms';
import { useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import type { Entry } from '../lib/content';
import { skillsFor } from '../lib/learning';
import { toRomaji } from '../lib/romaji';
import FamilyTree from './FamilyTree';
import Writing from './Writing';
import { Sentence, ReferenceTables } from './Reading';
import { LessonIntro } from './GrammarLessons';

function WordForms({
  entry,
  preferences,
}: {
  entry: Entry;
  preferences: { furigana: boolean; romaji: boolean };
}) {
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

function KanaWriting({ entry }: { entry: Entry }) {
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
export default function EntryDetail({
  entry,
  data,
  busy,
  onPractice,
  onOpen,
  fullPage = false,
}: {
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
}) {
  const [tab, setTab] = useState('learn');
  const [compoundSearch, setCompoundSearch] = useState('');
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
  const compounds = (entry.compounds || []).filter((c) =>
    [c.japanese, c.reading, c.meaning]
      .join(' ')
      .toLowerCase()
      .includes(compoundSearch.toLowerCase()),
  );
  return (
    <>
      <p className="eyebrow">
        {entry.level} <span className="slash">/</span> {entry.topic}
      </p>
      {(!fullPage || entry.id !== 'study-family') && (
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
      <div className="detail-actions">
        {entry.kind !== 'kanji' && (
          <button
            className="primary"
            disabled={busy || !skillsFor(entry, data.strokeIds.includes(entry.japanese)).length}
            onClick={() => onPractice()}
          >
            Practice <ArrowRight size={16} />
          </button>
        )}
      </div>
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
        <div className="tabs">
          <button className={tab === 'learn' ? 'selected' : ''} onClick={() => setTab('learn')}>
            {entry.kind === 'kanji' ? 'Readings & compounds' : 'Learn & examples'}
          </button>
          {['kana', 'kanji'].includes(entry.kind) && (
            <button className={tab === 'write' ? 'selected' : ''} onClick={() => setTab('write')}>
              Stroke order & writing
            </button>
          )}
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
      ) : entry.lesson ? (
        entry.references?.length ? (
          <ReferenceTables
            romaji={data.preferences.romaji}
            tables={entry.references}
            furigana={data.preferences.furigana}
          />
        ) : null
      ) : (
        <div className="reference-details">
          {entry.kind !== 'kanji' && entry.note && (
            <div className="lesson-note">
              {entry.note.split('\n').map((p, i) => (
                <p key={i}>{p}</p>
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
          {!!entry.references?.length && (
            <ReferenceTables
              romaji={data.preferences.romaji}
              tables={entry.references}
              furigana={data.preferences.furigana}
            />
          )}
          {entry.kind !== 'kanji' && (
            <>
              <h3>Examples</h3>
              {entry.examples.map((ex, i) => (
                <Sentence
                  romaji={data.preferences.romaji}
                  key={i}
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
              <p>Common words using this kanji. Some go beyond N5.</p>
              <label className="search-field compound-search">
                <Search size={16} />
                <input
                  aria-label="Filter compounds"
                  placeholder="Find a compound, reading, or meaning…"
                  value={compoundSearch}
                  onChange={(ev) => setCompoundSearch(ev.target.value)}
                />
              </label>
              <div className="compound-labels">
                <span>Word</span>
                <span>Reading</span>
                <span>Meaning</span>
                <span />
              </div>
              {compounds.map((c) => (
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
              {!compounds.length && <p className="no-compounds">No compounds match your search.</p>}
            </section>
          )}
        </div>
      )}
    </>
  );
}
