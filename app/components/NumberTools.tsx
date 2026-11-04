import { useState } from 'react';
import { convertNumber, parseNumberInput } from '../lib/guides/number-converter';
import { numberPracticeQuestion, type NumberPracticeMode } from '../lib/guides/number-practice';
import { normalize } from '../lib/practice/learning';

export default function NumberTools() {
  const [input, setInput] = useState('12345');
  let conversion;
  let conversionError = '';
  try {
    conversion = convertNumber(parseNumberInput(input));
  } catch (error) {
    conversionError = (error as Error).message;
  }

  return (
    <section className="number-tools number-converter">
      <h3>Number converter</h3>
      <label className="sr-only" htmlFor="number-converter">
        Number
      </label>
      <input
        id="number-converter"
        inputMode="numeric"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        aria-invalid={!!conversionError}
        aria-describedby="number-conversion"
      />
      <div id="number-conversion" aria-live="polite">
        {conversion ? (
          <dl className="number-conversion-result">
            <dt>Kanji</dt>
            <dd lang="ja" className="jp">
              {conversion.kanji}
            </dd>
            <dt>Hiragana</dt>
            <dd lang="ja">{conversion.hiragana}</dd>
          </dl>
        ) : (
          <p>{conversionError}</p>
        )}
      </div>
      <small>Whole numbers from 0 to 999,999,999,999. No commas needed.</small>
    </section>
  );
}

export function NumberRangePractice({ mode }: { mode: NumberPracticeMode }) {
  const [min, setMin] = useState('0');
  const [max, setMax] = useState('100');
  const [session, setSession] = useState<{
    min: number;
    max: number;
    question: ReturnType<typeof numberPracticeQuestion>;
  } | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  function start() {
    try {
      const lower = parseNumberInput(min);
      const upper = parseNumberInput(max);
      setSession({ min: lower, max: upper, question: numberPracticeQuestion(lower, upper, mode) });
      setAnswer('');
      setFeedback('');
      setError('');
    } catch (error) {
      setError((error as Error).message);
    }
  }

  return (
    <section className="number-tools number-range-practice">
      <h3>{mode === 'mixed' ? 'Mixed' : mode[0].toUpperCase() + mode.slice(1)} practice</h3>
      <form
        className="number-range-form"
        onSubmit={(event) => {
          event.preventDefault();
          start();
        }}
      >
        <label htmlFor="number-min">Min (included)</label>
        <input
          id="number-min"
          inputMode="numeric"
          value={min}
          onChange={(event) => setMin(event.target.value)}
        />
        <label htmlFor="number-max">Max (included)</label>
        <input
          id="number-max"
          inputMode="numeric"
          value={max}
          onChange={(event) => setMax(event.target.value)}
        />
        <button className="primary" type="submit">
          Start
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      {session && (
        <>
          <p>
            Range: {session.min.toLocaleString('en')}–{session.max.toLocaleString('en')}
          </p>
          <p lang="ja">{session.question.prompt}</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const correct = session.question.answers.some(
                (text) => normalize(text) === normalize(answer),
              );
              setFeedback(correct ? 'Correct!' : 'Try again, or reveal the answer.');
            }}
          >
            <label htmlFor="number-answer">Your answer</label>
            <input
              id="number-answer"
              lang="ja"
              value={answer}
              onChange={(event) => {
                setAnswer(event.target.value);
                setFeedback('');
              }}
              autoComplete="off"
            />
            <button type="submit" className="primary" disabled={!answer.trim()}>
              Check answer
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setFeedback(session.question.answers.join(' · '));
              }}
            >
              Show answer
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                setSession({
                  ...session,
                  question: numberPracticeQuestion(session.min, session.max, mode),
                });
                setAnswer('');
                setFeedback('');
              }}
            >
              Next number
            </button>
          </form>
          <output className="number-feedback">{feedback}</output>
        </>
      )}
    </section>
  );
}
