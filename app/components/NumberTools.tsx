import { useState } from 'react';
import { convertNumber, numberInRange, parseNumberInput } from '../lib/number-converter';
import { normalize } from '../lib/learning';

export default function NumberTools() {
  const [input, setInput] = useState('12345');
  const [min, setMin] = useState('0');
  const [max, setMax] = useState('100');
  const [session, setSession] = useState<{ min: number; max: number; value: number } | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  let conversion;
  let conversionError = '';
  try {
    conversion = convertNumber(parseNumberInput(input));
  } catch (error) {
    conversionError = (error as Error).message;
  }

  function start() {
    try {
      const lower = parseNumberInput(min);
      const upper = parseNumberInput(max);
      setSession({ min: lower, max: upper, value: numberInRange(lower, upper) });
      setAnswer('');
      setFeedback('');
      setError('');
    } catch (error) {
      setError((error as Error).message);
    }
  }

  return (
    <div className="guide-notes-grid number-tools">
      <section className="large-number-guide">
        <h3>Number converter</h3>
        <label htmlFor="number-converter">Number</label>
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
            <dl>
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
      <section className="large-number-guide">
        <h3>Practice a number range</h3>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            start();
          }}
        >
          <label htmlFor="number-min">Minimum (included)</label>
          <input
            id="number-min"
            inputMode="numeric"
            value={min}
            onChange={(event) => setMin(event.target.value)}
          />
          <label htmlFor="number-max">Maximum (included)</label>
          <input
            id="number-max"
            inputMode="numeric"
            value={max}
            onChange={(event) => setMax(event.target.value)}
          />
          <button className="primary" type="submit">
            Start range practice
          </button>
        </form>
        {error && <p role="alert">{error}</p>}
        {session && (
          <>
            <p>
              Range: {session.min.toLocaleString('en')}–{session.max.toLocaleString('en')}
            </p>
            <p>
              Write <strong>{session.value.toLocaleString('en')}</strong> in kanji or hiragana.
            </p>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const expected = convertNumber(session.value);
                const correct = [expected.kanji, expected.hiragana].some(
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
                  const result = convertNumber(session.value);
                  setFeedback(`${result.kanji} · ${result.hiragana}`);
                }}
              >
                Show answer
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setSession({ ...session, value: numberInRange(session.min, session.max) });
                  setAnswer('');
                  setFeedback('');
                }}
              >
                Next number
              </button>
            </form>
            <p role="status">{feedback}</p>
          </>
        )}
      </section>
    </div>
  );
}
