import { toRomaji } from '../lib/japanese/romaji';
import { tenseTopicFor } from '../lib/guides/tense-topics';
import { useState, useEffect, useEffectEvent, useRef, type ReactNode } from 'react';
import {
  BookOpen,
  Languages,
  ArrowRight,
  Search,
  X,
  Clock,
  PenLine,
  Settings,
  Menu,
  Layers,
  ArrowUpRight,
  Flower2,
  Users,
  CalendarDays,
  MessageCircle,
} from 'lucide-react';
import type { Entry } from '../lib/content/content';
import { skillsFor, entryInBook, type Question } from '../lib/practice/learning';
import { api } from '../lib/api/api';
import Practice from './Practice';
import { GrammarLessons } from './GrammarLessons';
import EntryDetail from './EntryDetail';
import NumbersGuide from './NumbersGuide';
import NumberTools, { NumberRangePractice } from './NumberTools';
import { topicBooks, topicBookFor, topicBookEntries } from '../lib/guides/topic-books';
const books = [
  {
    id: 'kana',
    title: 'Kana',
    jp: 'あ',
    subtitle: 'Hiragana & katakana',
    description: 'The sounds and strokes of Japanese.',
    icon: Languages,
  },
  {
    id: 'grammar',
    title: 'Grammar',
    jp: '文',
    subtitle: 'Sentence building',
    description: 'Understand how the pieces fit together.',
    icon: Layers,
  },
  {
    id: 'kanji',
    title: 'Kanji',
    jp: '字',
    subtitle: 'Characters & compounds',
    description: 'Meaning, readings, and writing.',
    icon: PenLine,
  },
  {
    id: 'vocabulary',
    title: 'Vocabulary',
    jp: '言',
    subtitle: 'Words for everyday life',
    description: 'Places, food, and everything in between.',
    icon: BookOpen,
  },
  {
    id: 'family',
    title: 'Family',
    jp: '家',
    subtitle: 'Family & relationships',
    description: 'Family words for talking about relatives and addressing them.',
    icon: Users,
  },
  {
    id: 'calendar',
    title: 'Calendar',
    jp: '暦',
    subtitle: 'Days, dates & durations',
    description: 'Weekdays, months, dates, and yesterday to tomorrow.',
    icon: CalendarDays,
  },
  {
    id: 'introductions',
    title: 'Introductions',
    jp: '名',
    subtitle: 'Names, work, hobbies & age',
    description: 'Ask about someone and introduce yourself.',
    icon: MessageCircle,
  },
  {
    id: 'numbers',
    title: 'Numbers',
    jp: '数',
    subtitle: 'Counting & number patterns',
    description: 'Build numbers from tens, hundreds, and thousands.',
    icon: Layers,
  },
  {
    id: 'time',
    title: 'Time',
    jp: '時',
    subtitle: 'Hours & minutes',
    description: 'Read the clock, from hours to half past.',
    icon: Clock,
  },
  {
    id: 'adjectives',
    title: 'Adjectives',
    jp: '形',
    subtitle: 'い, な & special cases',
    description: 'Describe things with the right forms.',
    icon: Flower2,
  },
];
const topicLabels: Record<string, string> = {
  'study-daily-routine': 'Daily routine',
  'study-weekdays': 'Weekdays',
  'study-months': 'Months',
  'study-dates': 'Dates',
  'study-relative-time': 'Relative time',
  'study-durations': 'Durations',
  'study-every': 'Every…',
  'study-ask-name': 'Names',
  'study-ask-job': 'Work',
  'study-ask-hobby': 'Hobbies',
  'study-ages': 'Age',
};
type State = {
  entries: Entry[];
  custom: Entry[];
  preferences: { furigana: boolean; romaji: boolean };
  strokeIds: string[];
};

function Modal({
  children,
  onClose,
  label,
  wide = false,
}: Readonly<{
  children: ReactNode;
  onClose: () => void;
  label: string;
  wide?: boolean;
}>) {
  const ref = useRef<HTMLDialogElement>(null);
  const dismiss = useEffectEvent(onClose);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    dialog.showModal();
    // The backdrop is part of the native dialog, not its inner content.
    const dismissBackdrop = (event: MouseEvent) => {
      if (event.target === dialog) dismiss();
    };
    dialog.addEventListener('click', dismissBackdrop);
    return () => {
      dialog.removeEventListener('click', dismissBackdrop);
      dialog.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={'modal ' + (wide ? 'wide' : '')}
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div className="modal-inner">
        <button className="icon-button modal-close" aria-label="Close" onClick={onClose}>
          <X size={20} />
        </button>
        {children}
      </div>
    </dialog>
  );
}

export default function Notebook() {
  const [data, setData] = useState<State | null>(null);
  const [page, setPage] = useState('home');
  const [topicEntryId, setTopicEntryId] = useState('');
  const [entry, setEntry] = useState<Entry | null>(null);
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('all');
  const [level, setLevel] = useState('all');
  const [tag, setTag] = useState('all');
  const [menu, setMenu] = useState(false);
  const [settings, setSettings] = useState(false);
  const [numberTool, setNumberTool] = useState<'converter' | 'range' | null>(null);
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [mode, setMode] = useState('mixed');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [grammarDetailed, setGrammarDetailed] = useState(false);
  const [practiceSerial, setPracticeSerial] = useState(0);
  async function refresh() {
    const d = await api('state');
    try {
      const prefs = JSON.parse(localStorage.getItem('reading-preferences') || 'null');
      if (typeof prefs?.furigana === 'boolean') d.preferences.furigana = prefs.furigana;
    } catch {}
    d.preferences.romaji = false;
    setData(d as State);
    return d as State;
  }
  useEffect(() => {
    refresh().catch((e) => setError(e.message));
  }, []);
  async function runAction(fn: () => Promise<void>) {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function navigateToBook(p: string) {
    setPage(p);
    setTopicEntryId('');
    setGrammarDetailed(false);
    setMode(p === 'numbers' ? 'range' : 'mixed');
    setSearch('');
    setTopic('all');
    setLevel('all');
    setTag('all');
    setMenu(false);
    window.scrollTo({ top: 0 });
  }
  function openEntry(e: Entry) {
    const combinedTopic = data?.entries.find((entry) => entry.id === tenseTopicFor[e.id]);
    if (combinedTopic) e = combinedTopic;
    const book = topicBookFor(e.id);
    if (book) {
      setEntry(null);
      navigateToBook(book);
      setTopicEntryId(e.id);
    } else setEntry(e);
  }
  async function startPractice(kind?: string, entryId?: string, word?: string) {
    await runAction(async () => {
      const d = await api('practice', {
        kind,
        entryId,
        word,
        ...(kind === 'vocabulary'
          ? {
              topic: topic === 'all' ? undefined : topic,
              level: level === 'all' ? undefined : level,
            }
          : {}),
        mode: entryId && !word ? 'guided' : 'mixed',
        skill: practiceSkill(word, entryId, mode),
      });
      setEntry(null);
      setPracticeSerial((n) => n + 1);
      setQuestions(d.queue);
    });
  }
  function savePrefs() {
    if (!data) return;
    try {
      const preferences = { furigana: !data.preferences.furigana, romaji: false };
      localStorage.setItem(
        'reading-preferences',
        JSON.stringify({ furigana: preferences.furigana }),
      );
      setData({ ...data, preferences });
    } catch (error) {
      setError((error as Error).message);
    }
  }
  const current = books.find((b) => b.id === page);
  const title = pageTitle(page, current?.title);
  const inBook = entriesForBook(data?.entries ?? [], page);
  const selectedTopic = inBook.find((e) => e.id === topicEntryId) || inBook[0];
  const filtered = filterEntries(inBook, page, search, topic, level, tag);
  const availableModes = [
    ...new Set(inBook.flatMap((e) => skillsFor(e, data?.strokeIds.includes(e.japanese) || false))),
  ];

  function renderPage() {
    if (!data)
      return (
        <div className="empty">
          <h1>Opening your notebook…</h1>
          {error && (
            <button className="primary" onClick={() => refresh().catch((e) => setError(e.message))}>
              Try again
            </button>
          )}
        </div>
      );
    if (page === 'home') return renderHomePage(data);
    return renderBookPage();
  }
  function renderHomePage(data: State) {
    return (
      <>
        <section className="intro">
          <p className="eyebrow">日本語を、少しずつ。</p>
          <h1>A place for your Japanese.</h1>
          <p>Read, write, and practice. Pick a book to begin.</p>
          <div className="intro-actions">
            <button className="primary" onClick={() => navigateToBook('library')}>
              Explore the library <ArrowRight size={16} />
            </button>
            <button className="text-button" disabled={busy} onClick={() => startPractice()}>
              Quick practice <ArrowUpRight size={16} />
            </button>
          </div>
          <span className="intro-japanese jp" aria-hidden="true">
            学ぶ
          </span>
        </section>
        <div className="section-heading">
          <h2>The knowledge books</h2>
          <span>Start anywhere.</span>
        </div>
        <div className="book-grid">
          {books.map((b, i) => (
            <button className="book-card" key={b.id} onClick={() => navigateToBook(b.id)}>
              <div className="book-card-top">
                <span className="book-number">0{i + 1}</span>
                <ArrowUpRight size={18} />
              </div>
              <span className="book-jp jp" lang="ja">
                {b.jp}
              </span>
              <div className="book-card-body">
                <h3>{b.title}</h3>
                <p>{b.description}</p>
                <span>{bookSummary(b.id, data.entries)}</span>
              </div>
            </button>
          ))}
        </div>
      </>
    );
  }
  function renderBookPage() {
    return (
      <>
        <div className={'page-heading' + (page === 'numbers' ? ' numbers-page-heading' : '')}>
          <div>
            <p className="eyebrow">{current?.subtitle || 'YOUR NOTEBOOK'}</p>
            <h1>{title}</h1>
            <p>
              {current?.description ||
                (page === 'notes'
                  ? 'Your own words, examples, and discoveries.'
                  : 'Find a word, a character, or a grammar pattern.')}
            </p>
            {page === 'kana' &&
              inBook
                .filter((e) => e.topic === 'Reading rules')
                .map((e) => (
                  <p key={e.id}>
                    <strong>{e.title}: </strong>
                    {e.note}
                  </p>
                ))}
          </div>
          {!topicBooks[page] && (
            <div className="book-practice-actions">
              <div className="practice-controls">
                {page === 'vocabulary' && (
                  <>
                    <select
                      aria-label="Practice category"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    >
                      <option value="all">All categories</option>
                      {[...new Set(inBook.map((e) => e.topic))].map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                    <select
                      aria-label="Practice level"
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                    >
                      <option value="all">All levels</option>
                      {[...new Set(inBook.map((e) => e.level))].map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </>
                )}
                {page === 'numbers' && (
                  <button className="secondary" onClick={() => setNumberTool('converter')}>
                    Convert number
                  </button>
                )}
                <select
                  aria-label="Practice type"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                >
                  {page === 'numbers' && <option value="range">Range practice</option>}
                  <option value="mixed">Mixed practice</option>
                  {availableModes.map((s) => (
                    <option value={s} key={s}>
                      {s[0].toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
                <button
                  className="primary"
                  disabled={busy || !availableModes.length}
                  onClick={() =>
                    page === 'numbers' && mode === 'range'
                      ? setNumberTool('range')
                      : startPractice(page === 'notes' ? 'notes' : current?.id)
                  }
                >
                  {page === 'grammar' ? 'Mixed grammar practice' : 'Practice'}{' '}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
        {page === 'grammar' && (
          <div className="number-view-switch">
            <button
              className={!grammarDetailed ? 'selected' : ''}
              aria-pressed={!grammarDetailed}
              onClick={() => setGrammarDetailed(false)}
            >
              By level
            </button>
            <button
              className={grammarDetailed ? 'selected' : ''}
              aria-pressed={grammarDetailed}
              onClick={() => setGrammarDetailed(true)}
            >
              All entries
            </button>
          </div>
        )}
        {renderBookContents()}
      </>
    );
  }
  function renderBookContents() {
    if (!data) return null;
    if (topicBooks[page])
      return (
        <section className="topic-book" aria-label={title + ' book'}>
          {inBook.length > 1 && (
            <nav className="topic-book-tabs" aria-label={title + ' topics'}>
              {inBook.map((e) => (
                <button
                  key={e.id}
                  aria-pressed={e.id === selectedTopic?.id}
                  onClick={() => setTopicEntryId(e.id)}
                >
                  {topicLabels[e.id] || e.title}
                </button>
              ))}
            </nav>
          )}
          {selectedTopic ? (
            <EntryDetail
              key={selectedTopic.id}
              fullPage
              entry={selectedTopic}
              data={data}
              busy={busy}
              onOpen={openEntry}

              onPractice={() => startPractice(undefined, selectedTopic.id)}
            />
          ) : (
            <p>No topics are available in this book.</p>
          )}
        </section>
      );
    if (page === 'grammar' && !grammarDetailed)
      return <GrammarLessons entries={inBook} onOpen={openEntry} />;
    if (page === 'numbers' || page === 'time')
      return <NumbersGuide key={page} view={page} romaji={data.preferences.romaji} />;
    return renderLibrary();
  }
  function renderLibrary() {
    return (
      <>
        <div className="filter-bar">
          <label className="search-field">
            <Search size={17} />
            <input
              aria-label="Search entries"
              placeholder="Search Japanese, readings, or meanings…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <select
            aria-label="Filter topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          >
            <option value="all">All topics</option>
            {[...new Set(inBook.map((e) => e.topic))].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select
            aria-label="Filter level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
          >
            <option value="all">All levels</option>
            {[...new Set(inBook.map((e) => e.level))].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select aria-label="Filter tag" value={tag} onChange={(e) => setTag(e.target.value)}>
            <option value="all">All tags</option>
            {[...new Set(inBook.flatMap((e) => e.tags))]
              .sort((a, b) => a.localeCompare(b))
              .map((t) => (
                <option key={t}>{t}</option>
              ))}
          </select>
        </div>
        <p className="results-heading">
          {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
        </p>
        {renderEntryResults()}
      </>
    );
  }
  function renderEntryResults() {
    if (!data) return null;
    if (!filtered.length)
      return (
        <div className="empty">
          <h2>No entries found.</h2>
          <p>
            {page === 'notes'
              ? 'No notes have been published yet.'
              : 'Try another search or filter.'}
          </p>
        </div>
      );
    if (page === 'vocabulary')
      return (
        <div className="vocabulary-list">
          {filtered.map((e) => (
            <button
              type="button"
              className="vocabulary-row"
              key={e.id}
              onClick={() => openEntry(e)}
              aria-label={`Open ${e.japanese}: ${e.meaning}`}
            >
              <span className="jp vocabulary-word" lang="ja">
                {e.japanese}
              </span>
              <span className="vocabulary-reading">
                {data.preferences.furigana && <span lang="ja">{e.reading}</span>}
                {data.preferences.romaji && <small>{e.romaji || toRomaji(e.reading)}</small>}
              </span>
              <span>{e.meaning}</span>
              <small className="vocabulary-category">
                {e.level} · {e.topic}
              </small>
            </button>
          ))}
        </div>
      );
    if (page === 'kana') return <KanaChart entries={filtered} onOpen={openEntry} />;
    return (
      <div className="entry-grid">
        {filtered.map((e) => (
          <button className="entry-card" key={e.id} onClick={() => openEntry(e)}>
            <div className="entry-meta">
              <span>{e.level}</span>
              {e.kind !== 'kanji' && <span>{e.topic}</span>}
            </div>
            <h3
              className={e.kind === 'grammar' || e.references?.length ? '' : 'jp'}
              lang={e.kind === 'grammar' || e.references?.length ? 'en' : 'ja'}
            >
              {cardTitle(e, data.preferences.furigana)}
            </h3>
            {e.kind === 'kanji' && (
              <div className="card-kanji-readings">
                <p>
                  <small>Onyomi</small>
                  <span lang="ja">{e.on || '—'}</span>
                </p>
                <p>
                  <small>Kunyomi</small>
                  <span lang="ja">{e.kun || '—'}</span>
                </p>
              </div>
            )}
            {!e.references?.length && <p>{e.meaning}</p>}
            {e.kind !== 'kanji' && (
              <div className="entry-tags">
                {e.tags.slice(0, 3).map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
            )}
          </button>
        ))}
      </div>
    );
  }
  return (
    <div className="app">
      <aside className={'sidebar ' + (menu ? 'is-open' : '')}>
        <button type="button" className="brand" onClick={() => navigateToBook('home')}>
          <span className="brand-name">
            <span>Nihongo Notto</span>
            <small className="jp" lang="ja">
              日本語ノート
            </small>
          </span>
        </button>
        <nav aria-label="Study books">
          <button
            className={page === 'home' ? 'active' : ''}
            onClick={() => navigateToBook('home')}
          >
            <BookOpen size={17} /> Overview
          </button>
          <button
            className={page === 'library' ? 'active' : ''}
            onClick={() => navigateToBook('library')}
          >
            <Search size={17} /> All entries
          </button>
          <span className="nav-label">BOOKS</span>
          {books.map((b) => (
            <button
              key={b.id}
              className={page === b.id ? 'active' : ''}
              onClick={() => navigateToBook(b.id)}
            >
              <b.icon size={17} />
              {b.title}
            </button>
          ))}
        </nav>
        <button className="sidebar-preferences" onClick={() => setSettings(true)}>
          <Settings size={17} /> Preferences
        </button>
      </aside>
      {menu && (
        <button className="menu-overlay" aria-label="Close menu" onClick={() => setMenu(false)} />
      )}
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              aria-expanded={menu}
              onClick={() => setMenu(!menu)}
            >
              <Menu size={21} />
            </button>
            <span>Notebook</span>
            <span className="slash">/</span>
            <strong>{title}</strong>
          </div>
        </header>
        <main>
          {error && (
            <div className="error" role="alert">
              {error}
              <button
                className="icon-button"
                aria-label="Dismiss error"
                onClick={() => setError('')}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {renderPage()}
          <footer>
            <a href="/credits.html" target="_blank" rel="noreferrer">
              Credits & stroke data <ArrowUpRight size={12} />
            </a>
          </footer>
        </main>
      </div>
      {entry && data && (
        <Modal label={entry.title} onClose={() => setEntry(null)} wide>
          <EntryDetail
            entry={data.entries.find((e) => e.id === entry.id) || entry}
            data={data}
            busy={busy}
            onOpen={openEntry}

            onPractice={(word) => startPractice(undefined, entry.id, word)}
          />
        </Modal>
      )}

      {numberTool && (
        <Modal
          label={numberTool === 'converter' ? 'Number converter' : 'Range practice'}
          onClose={() => setNumberTool(null)}
        >
          {numberTool === 'converter' ? <NumberTools /> : <NumberRangePractice />}
        </Modal>
      )}
      {settings && data && (
        <Modal label="Preferences" onClose={() => setSettings(false)}>
          <p className="eyebrow">READING SUPPORT</p>
          <h2>Preferences</h2>
          <div className="preference-row">
            <div>
              <strong>Reading hints</strong>
              <small>Show furigana and kana readings.</small>
            </div>
            <button
              className={'switch ' + (data.preferences.furigana ? 'on' : '')}
              role="switch"
              aria-checked={data.preferences.furigana}
              aria-label="Reading hints"
              disabled={busy}
              onClick={() => savePrefs()}
            >
              <i />
            </button>
          </div>
        </Modal>
      )}
      {questions && data && (
        <Modal label="Practice" onClose={() => setQuestions(null)} wide>
          <Practice
            key={practiceSerial}
            entries={data.entries}
            preferences={data.preferences}
            questions={questions}
            onClose={() => setQuestions(null)}
            onNext={(e) => {
              setQuestions(null);
              openEntry(e);
            }}
            onRepeat={(e) => startPractice(undefined, e.id)}
          />
        </Modal>
      )}
    </div>
  );
}
function KanaChart({
  entries,
  onOpen,
}: Readonly<{ entries: Entry[]; onOpen: (entry: Entry) => void }>) {
  const rows = [
    ['Vowels', 'あいうえお'],
    ['K', 'かきくけこ'],
    ['S', 'さしすせそ'],
    ['T', 'たちつてと'],
    ['N', 'なにぬねの'],
    ['H', 'はひふへほ'],
    ['M', 'まみむめも'],
    ['Y', 'やゆよ'],
    ['R', 'らりるれろ'],
    ['W', 'わを'],
    ['N sound', 'ん'],
    ['G', 'がぎぐげご'],
    ['Z', 'ざじずぜぞ'],
    ['D', 'だぢづでど'],
    ['B', 'ばびぶべぼ'],
    ['P', 'ぱぴぷぺぽ'],
  ];
  const group = (e: Entry) => {
    if (e.topic === 'Reading rules') return 'Reading rules';
    if (e.tags.includes('Small kana')) return 'Small kana';
    if (e.tags.includes('Loanword sounds'))
      return e.romaji?.startsWith('small ')
        ? 'Small kana'
        : `${e.romaji?.match(/^[^aeiou]+/)?.[0].toUpperCase() || 'Vowel'} loanword sounds`;
    const first = String.fromCodePoint(
      e.japanese.codePointAt(0)! - (e.topic === 'Katakana' ? 0x60 : 0),
    );
    const row = rows.find(([, chars]) => chars.includes(first))?.[0] || 'Other sounds';
    return e.tags.includes('Combinations') ? row + ' combinations' : row;
  };
  return (
    <div className="kana-chart">
      {[...new Set(entries.map((e) => e.topic))].map((script) => (
        <section key={script}>
          <h2>{script}</h2>
          {[...new Set(entries.filter((e) => e.topic === script).map(group))].map((row) => (
            <div className="kana-sound-row" key={row}>
              <h3>{row}</h3>
              <div className="kana-sounds">
                {entries
                  .filter((e) => e.topic === script && group(e) === row)
                  .map((e) => (
                    <button
                      type="button"
                      className="kana-sound"
                      key={e.id}
                      onClick={() => onOpen(e)}
                      aria-label={`Practice strokes for ${e.japanese} (${e.romaji})`}
                    >
                      <span className="jp" lang="ja">
                        {e.japanese}
                      </span>
                      <span>{e.romaji}</span>
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

function practiceSkill(word: string | undefined, entryId: string | undefined, mode: string) {
  if (word) return 'reading';
  if (entryId || mode === 'mixed') return undefined;
  return mode;
}
function pageTitle(page: string, title?: string) {
  if (page === 'home') return 'Overview';
  if (title) return title;
  return page === 'notes' ? 'My notes' : 'All entries';
}
function entriesForBook(entries: Entry[], page: string) {
  if (topicBooks[page]) return topicBookEntries(entries, page);
  if (page === 'library' || page === 'home') return entries;
  if (page === 'family') return entries.filter((entry) => entry.id === 'study-family');
  return entries.filter((entry) => entryInBook(entry, page));
}
function filterEntries(
  entries: Entry[],
  page: string,
  search: string,
  topic: string,
  level: string,
  tag: string,
) {
  return entries.filter((entry) => {
    if (page === 'kana' && entry.topic === 'Reading rules') return false;
    if (topic !== 'all' && entry.topic !== topic) return false;
    if (level !== 'all' && entry.level !== level) return false;
    if (tag !== 'all' && !entry.tags.includes(tag)) return false;
    if (!search) return true;
    return [
      entry.title,
      entry.id === 'study-family' ? 'family tree' : '',
      entry.japanese,
      entry.reading,
      entry.romaji ?? '',
      entry.meaning,
      entry.note,
      ...entry.tags,
      ...(entry.compounds ?? []).flatMap((compound) => [
        compound.japanese,
        compound.reading,
        compound.meaning,
      ]),
    ]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase());
  });
}
function bookSummary(id: string, entries: Entry[]) {
  if (id === 'family')
    return `${entries.find((entry) => entry.id === 'study-family')?.references?.[0]?.rows.length ?? 0} relationships`;
  if (topicBooks[id]) return `${topicBookEntries(entries, id).length} topics`;
  const count = entries.filter((entry) => entryInBook(entry, id)).length;
  const unit = id === 'grammar' ? 'lessons' : 'entries';
  return `${count} ${unit}`;
}
function cardTitle(entry: Entry, furigana: boolean) {
  if (entry.kind === 'grammar' || entry.references?.length) return entry.title;
  if (furigana && ['vocabulary', 'numbers', 'adjectives'].includes(entry.kind))
    return (
      <ruby>
        {entry.japanese}
        <rt>{entry.reading}</rt>
      </ruby>
    );
  return entry.japanese;
}
