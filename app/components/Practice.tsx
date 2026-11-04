import { Check, X, SkipForward, Eye, EyeOff } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Entry } from '../lib/content/content';
import type { ReadingText } from '../lib/content/grammar-course';
import {
  promptFor,
  normalize,
  withAlternate,
  isReadingQuestion,
  type Question,
} from '../lib/practice/learning';
import { api } from '../lib/api/api';
import { Furigana, JapaneseProse, RoleText, RoleReading, AlignedTranslation } from './Reading';
import Writing from './Writing';

type Result = { correct: boolean; answers: string[]; explanation?: string };
function shuffled<T>(items: T[], key: string) {
  const copy = [...items];
  let n = [...key].reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let i = copy.length - 1; i > 0; i--) {
    n = (n * 1664525 + 1013904223) >>> 0;
    const j = n % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export default function Practice({
  entries,
  preferences,
  questions,
  onClose,
  onNext,
  onRepeat,
}: {
  entries: Entry[];
  preferences: { furigana: boolean; romaji: boolean };
  questions: Question[];
  onClose: () => void;
  onNext: (e: Entry) => void;
  onRepeat: (e: Entry) => void;
}) {
  const [queue, setQueue] = useState(questions);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hadMistake, setHadMistake] = useState(false);
  const [readingRevealed, setReadingRevealed] = useState(false);
  const q = queue[index];
  const e = entries.find((e) => e.id === q?.entryId);
  const exercise = e?.exercises?.find((x) => x.id === q?.exerciseId);
  const tiles = useMemo(
    () =>
      shuffled(
        (exercise
          ? exercise.tiles || []
          : e?.exercise?.tiles?.map((text) => ({ text, reading: knownReading(e, text) })) || []
        ).map((value, i) => ({ ...value, i })),
        q?.id || '',
      ),
    [q?.id, exercise, e],
  );
  const choices = useMemo(() => shuffled(exercise?.choices || [], q?.id || ''), [q?.id, exercise]);
  const lesson = entries.find((e) => e.id === questions[0]?.entryId);
  const nextLesson = lesson?.lesson
    ? entries.find((e) => e.lesson?.order === lesson.lesson!.order + 1)
    : undefined;
  function text(value: ReadingText, show = preferences.furigana) {
    return (
      <span lang={/[ぁ-んァ-ヶ一-龯]/.test(value.text) ? 'ja' : undefined}>
        <RoleText value={value} show={show} />
      </span>
    );
  }
  async function submit(writingCorrect?: boolean) {
    if (!q || !e) return;
    setBusy(true);
    setError('');
    try {
      const checked: Result = await api('check', {
        entryId: q.entryId,
        skill: q.skill,
        word: q.word,
        exerciseId: q.exerciseId,
        answer,
        writingCorrect,
      });
      setResult(checked);
      if (!checked.correct) setHadMistake(true);
      else if (hadMistake) setQueue((current) => withAlternate(current, e));
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function next() {
    setIndex((i) => i + 1);
    setAnswer('');
    setSelected([]);
    setResult(null);
    setError('');
    setHadMistake(false);
    setReadingRevealed(false);
  }
  function choose(i: number) {
    if (selected.includes(i)) return;
    const value = [...selected, i];
    setSelected(value);
    setAnswer(value.map((id) => tiles.find((t) => t.i === id)!.text).join(''));
  }
  if (!q || !e)
    return (
      <div className="practice-finished">
        <span className="jp" lang="ja">
          おつかれさま。
        </span>
        <h2>{queue.length ? 'Practice complete.' : 'No exercises here yet.'}</h2>
        <p>
          {queue.length
            ? 'Repeat the lesson or continue.'
            : 'Choose another lesson or practice type.'}
        </p>
        {nextLesson && (
          <button className="primary" onClick={() => onNext(nextLesson)}>
            Next lesson: {nextLesson.title} →
          </button>
        )}
        {(lesson?.lesson || lesson?.references?.length) && (
          <>
            <button className="secondary" onClick={() => onRepeat(lesson)}>
              Repeat this lesson
            </button>
          </>
        )}
        <button className="text-button" onClick={onClose}>
          Back to the books
        </button>
      </div>
    );
  const testsReading = isReadingQuestion(e, q.skill);
  const target =
    q.word ||
    (q.skill === 'reading' && e.kind === 'kanji'
      ? e.examples[0]?.japanese || e.japanese
      : e.japanese);
  const reading =
    ['writing', 'meaning'].includes(q.skill) && e.kind === 'kanji'
      ? ''
      : q.word
        ? e.compounds?.find((c) => c.japanese === q.word)?.reading || ''
        : knownReading(e, target);
  const feedback = exercise?.feedback || { text: target, reading };
  const meaning = q.word
    ? e.compounds?.find((c) => c.japanese === q.word)?.meaning || e.meaning
    : e.meaning;
  return (
    <div className="practice">
      <div className="practice-top">
        <span>
          {exercise
            ? exercise.alternate
              ? 'Extra practice'
              : exercise.type.replaceAll('-', ' ')
            : q.skill}{' '}
          / {e.lesson?.group || e.topic}
        </span>
        <span className="practice-progress">
          {index + 1} of {queue.length}
          {!result && (
            <button
              type="button"
              className="practice-skip"
              onClick={next}
              aria-label="Skip question"
              title="Skip question"
            >
              <SkipForward size={18} aria-hidden="true" />
            </button>
          )}
        </span>
      </div>
      {
        <>
          <h2>
            {exercise?.prompt ||
              annotatedPrompt(
                promptFor(e, q.skill, q.word),
                e,
                testsReading ? readingRevealed : preferences.furigana,
              )}
          </h2>
          {exercise?.context && <div className="practice-context jp">{text(exercise.context)}</div>}
          {(['reading', 'meaning', 'writing'].includes(q.skill) || testsReading) && (
            <div className="practice-character jp">
              {text(
                { text: target, reading },
                testsReading ? readingRevealed : preferences.furigana,
              )}
            </div>
          )}
          {q.skill === 'meaning' && e.kind === 'kanji' && e.examples[0] && (
            <p className="reading">
              Example word:{' '}
              {text(
                { text: e.examples[0].japanese, reading: e.examples[0].reading },
                result ? true : preferences.furigana,
              )}
            </p>
          )}
          {testsReading && !result && (
            <button
              type="button"
              className="practice-skip"
              onClick={() => setReadingRevealed((v) => !v)}
              aria-label={readingRevealed ? 'Hide reading' : 'Reveal reading'}
              title={readingRevealed ? 'Hide reading' : 'Reveal reading'}
              aria-pressed={readingRevealed}
            >
              {readingRevealed ? (
                <EyeOff size={18} aria-hidden="true" />
              ) : (
                <Eye size={18} aria-hidden="true" />
              )}
            </button>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          {!result ? (
            <>
              {q.skill === 'writing' ? (
                <Writing
                  key={q.id}
                  character={e.japanese}
                  review
                  onDone={(correct) => submit(correct)}
                />
              ) : (
                <form
                  onSubmit={(ev) => {
                    ev.preventDefault();
                    submit();
                  }}
                >
                  {choices.length > 0 ? (
                    <fieldset className="practice-choices">
                      <legend>Choose one answer</legend>
                      {choices.map((choice, i) => (
                        <label
                          key={i}
                          className={answer === choice.text ? 'choice selected-choice' : 'choice'}
                        >
                          <input
                            type="radio"
                            name="answer"
                            value={choice.text}
                            checked={answer === choice.text}
                            onChange={() => setAnswer(choice.text)}
                          />
                          {text(choice)}
                        </label>
                      ))}
                    </fieldset>
                  ) : (
                    <>
                      {q.skill === 'grammar' && tiles.length > 0 && (
                        <>
                          <div
                            className="answer-tiles"
                            aria-label="Your sentence"
                            onDragOver={(ev) => ev.preventDefault()}
                            onDrop={(ev) => {
                              ev.preventDefault();
                              const id = Number(ev.dataTransfer.getData('text/plain'));
                              if (tiles.some((t) => t.i === id)) choose(id);
                            }}
                          >
                            {selected.length ? (
                              selected.map((id, pos) => {
                                const tile = tiles.find((t) => t.i === id)!;
                                return (
                                  <button
                                    type="button"
                                    key={pos}
                                    className="tile selected-tile"
                                    aria-label={'Remove ' + tile.text}
                                    onClick={() => {
                                      const value = selected.filter((_, p) => p !== pos);
                                      setSelected(value);
                                      setAnswer(
                                        value
                                          .map((id) => tiles.find((t) => t.i === id)!.text)
                                          .join(''),
                                      );
                                    }}
                                  >
                                    {text(tile)}
                                  </button>
                                );
                              })
                            ) : (
                              <span>Tap words to build your sentence.</span>
                            )}
                          </div>
                          <div className="tiles">
                            {tiles.map((tile) => (
                              <button
                                className="tile"
                                type="button"
                                key={tile.i}
                                disabled={selected.includes(tile.i)}
                                draggable
                                onDragStart={(ev) =>
                                  ev.dataTransfer.setData('text/plain', String(tile.i))
                                }
                                onClick={() => choose(tile.i)}
                              >
                                {text(tile)}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                      {q.skill === 'recognition' ? (
                        <div className="recognition-options">
                          {[
                            e,
                            ...entries
                              .filter(
                                (x) =>
                                  x.kind === 'kana' &&
                                  x.japanese.length === e.japanese.length &&
                                  x.id !== e.id,
                              )
                              .filter((_, i) => i % 13 === 3)
                              .slice(0, 3),
                          ]
                            .sort((a, b) => a.id.localeCompare(b.id))
                            .map((x) => (
                              <button
                                type="button"
                                key={x.id}
                                className={'jp ' + (answer === x.japanese ? 'chosen' : '')}
                                onClick={() => setAnswer(x.japanese)}
                              >
                                {x.japanese}
                              </button>
                            ))}
                        </div>
                      ) : (
                        <label className="field">
                          {tiles.length ? 'Or type your answer' : 'Your answer'}
                          <span className="answer-input">
                            <input
                              autoFocus
                              key={q.id}
                              value={answer}
                              onChange={(ev) => {
                                setAnswer(ev.target.value);
                                setSelected([]);
                              }}
                              placeholder={
                                testsReading
                                  ? e.kind === 'kana'
                                    ? 'Type the sound in romaji or kana…'
                                    : 'Type the reading in kana…'
                                  : q.skill === 'grammar'
                                    ? 'Japanese or kana is accepted…'
                                    : 'Type your answer…'
                              }
                              autoComplete="off"
                              onKeyDown={(ev) => {
                                if (ev.nativeEvent.isComposing && ev.key === 'Enter')
                                  ev.preventDefault();
                              }}
                            />
                            <button
                              className="primary"
                              disabled={busy || !answer.trim()}
                              type="submit"
                            >
                              Check →
                            </button>
                          </span>
                        </label>
                      )}
                    </>
                  )}
                  {(choices.length > 0 || q.skill === 'recognition') && (
                    <div className="practice-actions">
                      <button className="primary" disabled={busy || !answer.trim()} type="submit">
                        Check answer →
                      </button>
                    </div>
                  )}
                </form>
              )}
            </>
          ) : (
            <div
              className={
                'answer-result ' +
                (result.correct ? 'correct' : 'incorrect') +
                (!exercise ? ' answer-result-compact' : '')
              }
              role="status"
            >
              <span
                className="answer-status"
                role="img"
                aria-label={result.correct ? 'Correct' : 'Incorrect'}
              >
                {result.correct ? <Check size={22} /> : <X size={22} />}
              </span>
              <p className="jp">{text(feedback, true)}</p>
              {!testsReading && feedback.reading && (
                <p className="reading" lang="ja">
                  <RoleReading value={feedback} />
                </p>
              )}
              {!exercise && <p className="answer-meaning">{meaning}</p>}
              {!result.correct && q.skill !== 'writing' && answer.trim() && (
                <p className="answer-submitted">Your answer: {answer}</p>
              )}
              {exercise?.feedback.meaning && (
                <p className="aligned-english">
                  <AlignedTranslation
                    tokens={exercise.feedback.translationTokens}
                    meaning={exercise.feedback.meaning}
                  />
                </p>
              )}
              {exercise?.type === 'gap' && <p>Missing part: {result.answers[0]}</p>}
              {(result.explanation || exercise?.explanation) && (
                <p>
                  <JapaneseProse
                    text={result.explanation || exercise?.explanation || ''}
                    show={preferences.furigana}
                  />
                </p>
              )}
              <div>
                {!result.correct && (
                  <button
                    className="secondary"
                    onClick={() => {
                      setResult(null);
                      setAnswer('');
                      setSelected([]);
                    }}
                  >
                    Try again
                  </button>
                )}
                <button className="primary" onClick={next}>
                  {result.correct ? 'Continue' : 'Move on'} →
                </button>
              </div>
            </div>
          )}
        </>
      }
    </div>
  );
}
function knownReading(e: Entry, text: string) {
  if (text === e.japanese) return e.reading;
  for (const example of [...e.examples, ...(e.lesson?.examples || [])]) {
    if (text === example.japanese || normalize(text) === normalize(example.japanese))
      return example.reading;
    const token = example.tokens?.find((t) => t.text === text);
    if (token?.reading) return token.reading;
  }
  return (
    e.lesson?.vocabulary.find((v) => v.text === text)?.reading ||
    e.compounds?.find((c) => c.japanese === text)?.reading ||
    (!/[一-龯々]/.test(text) ? text : '')
  );
}
function annotatedPrompt(prompt: string, e: Entry, show: boolean) {
  const matches = [
    ...e.examples.map((x) => ({
      text: x.japanese.replace(/。$/, ''),
      reading: x.reading.replace(/。$/, ''),
    })),
    { text: e.japanese, reading: e.reading },
    ...(e.compounds || []).map((c) => ({ text: c.japanese, reading: c.reading })),
  ].sort((a, b) => b.text.length - a.text.length);
  const found = matches.find((x) => x.text && prompt.includes(x.text));
  if (!found) return prompt;
  const at = prompt.indexOf(found.text);
  return (
    <>
      {prompt.slice(0, at)}
      <Furigana text={found.text} reading={found.reading} show={show} />
      {prompt.slice(at + found.text.length)}
    </>
  );
}
