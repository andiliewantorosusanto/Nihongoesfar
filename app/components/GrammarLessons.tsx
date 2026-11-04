import { keyed } from '../lib/ui/list-keys';
import type { Entry } from '../lib/content/content';
import { Sentence, Furigana, JapaneseProse } from './Reading';
export function GrammarLessons({
  entries,
  onOpen,
}: Readonly<{
  entries: Entry[];
  onOpen: (e: Entry) => void;
}>) {
  const lessonOrder = (entry: Entry) => {
    if (entry.id === 'study-present-tense') return -2;
    if (entry.id === 'study-past-tense') return -1;
    return entry.lesson?.order ?? Number.MAX_SAFE_INTEGER;
  };
  const ordered = [...entries].sort((a, b) => lessonOrder(a) - lessonOrder(b));
  const displayLevel = (entry: Entry) => (entry.level === 'Beginner' ? 'N5' : entry.level);
  const levels = [...new Set(['N5', ...ordered.map(displayLevel)])].filter((level) =>
    ordered.some((entry) => displayLevel(entry) === level),
  );
  return (
    <section className="grammar-course" aria-label="Grammar by level">
      {levels.map((level) => {
        const lessons = ordered.filter((e) => displayLevel(e) === level);
        return (
          <section className="lesson-group" key={level}>
            <div className="section-heading">
              <h2>{level}</h2>
              <span>
                {lessons.length} {lessons.length === 1 ? 'entry' : 'entries'}
              </span>
            </div>
            {lessons.length ? (
              <>
                {[...new Set(lessons.map((e) => e.lesson?.group || e.topic))].map((group) => (
                  <section className="grammar-topic-group" key={group}>
                    <h3>{group}</h3>
                    <div className="lesson-list">
                      {lessons
                        .filter((e) => (e.lesson?.group || e.topic) === group)
                        .map((e) => (
                          <button className="lesson-card" key={e.id} onClick={() => onOpen(e)}>
                            <span>
                              <strong>{e.title}</strong>
                              {(!e.references?.length || e.lesson) && (
                                <span className="lesson-goal">{e.lesson?.goal || e.meaning}</span>
                              )}
                            </span>
                            <span aria-hidden="true">→</span>
                          </button>
                        ))}
                    </div>
                  </section>
                ))}
              </>
            ) : (
              <p className="book-note">No grammar entries at this level yet.</p>
            )}
          </section>
        );
      })}
    </section>
  );
}

export function LessonIntro({
  entry,
  entries,
  furigana,
  onOpen,
  romaji = false,
}: Readonly<{
  romaji?: boolean;
  entry: Entry;
  entries: Entry[];
  furigana: boolean;
  onOpen?: (e: Entry) => void;
}>) {
  const l = entry.lesson;
  if (!l) return null;
  return (
    <section className="lesson-intro">
      <p className="eyebrow">
        LESSON {l.order} / {l.group}
      </p>
      <h3>Your goal</h3>
      <p>{l.goal}</p>
      <div className="lesson-prerequisites">
        <small>Useful first: </small>
        {l.prerequisites.length ? (
          l.prerequisites.map((id) => {
            const e = entries.find((x) => x.id === id);
            return e ? (
              <button
                className="text-button"
                key={id}
                disabled={!onOpen}
                onClick={() => onOpen?.(e)}
              >
                {e.title}
              </button>
            ) : null;
          })
        ) : (
          <span>No earlier grammar lesson needed.</span>
        )}
      </div>
      <h3>Quick recap</h3>
      <p>
        <JapaneseProse text={entry.note} show={furigana} />
      </p>
      <div className="lesson-comparison">
        <h3>A common mix-up</h3>
        <p>
          <JapaneseProse text={l.comparison} show={furigana} />
        </p>
      </div>
      <h3>See the pattern in three examples</h3>
      {keyed(l.examples).map(({ value: example, key }) => (
        <Sentence romaji={romaji} key={key} example={example} furigana={furigana} />
      ))}
      <details className="lesson-vocabulary">
        <summary>Words used in this lesson</summary>
        <dl>
          {l.vocabulary.map((v) => (
            <div key={v.text}>
              <dt lang="ja">
                <Furigana text={v.text} reading={v.reading} show={furigana} />
              </dt>
              <dd>{v.meaning}</dd>
            </div>
          ))}
        </dl>
      </details>
    </section>
  );
}
