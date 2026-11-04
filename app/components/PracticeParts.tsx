import { Check, X, SkipForward, Eye, EyeOff } from 'lucide-react';
import type { Entry } from '../lib/content/content';
import type { ReadingText, GuidedExercise } from '../lib/content/types';
import { promptFor, normalize, isReadingQuestion, type Question } from '../lib/practice/learning';
import { keyed } from '../lib/ui/list-keys';
import { Furigana, JapaneseProse, RoleText, RoleReading, AlignedTranslation } from './Reading';
import Writing from './Writing';

export type Result = { correct: boolean; answers: string[]; explanation?: string };
export type Tile = ReadingText & { i: number };
type Preferences = { furigana: boolean; romaji: boolean };

export function shuffled<T>(items: T[], key: string) {
  const copy = [...items];
  let n = [...key].reduce((a, c) => a + c.codePointAt(0)!, 0);
  for (let i = copy.length - 1; i > 0; i--) {
    n = (n * 1664525 + 1013904223) >>> 0;
    const j = n % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function knownReading(e: Entry, text: string) {
  if (text === e.japanese) return e.reading;
  for (const example of [...e.examples, ...(e.lesson?.examples ?? [])]) {
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

export function practiceTiles(
  exercise: GuidedExercise | undefined,
  entry: Entry | undefined,
  key: string,
): Tile[] {
  let values: ReadingText[] = [];
  if (exercise) values = exercise.tiles ?? [];
  else if (entry)
    values =
      entry.exercise?.tiles?.map((text) => ({ text, reading: knownReading(entry, text) })) ?? [];
  // The source position identifies duplicate tiles before their display order is shuffled.
  return shuffled(
    values.map((value, i) => ({ ...value, i })),
    key,
  );
}

function Reading({ value, show }: Readonly<{ value: ReadingText; show: boolean }>) {
  return (
    <span lang={/[ぁ-んァ-ヶ一-龯]/.test(value.text) ? 'ja' : undefined}>
      <RoleText value={value} show={show} />
    </span>
  );
}

export function PracticeFinished({
  count,
  lesson,
  nextLesson,
  onClose,
  onNext,
  onRepeat,
}: Readonly<{
  count: number;
  lesson?: Entry;
  nextLesson?: Entry;
  onClose: () => void;
  onNext: (entry: Entry) => void;
  onRepeat: (entry: Entry) => void;
}>) {
  return (
    <div className="practice-finished">
      <span className="jp" lang="ja">
        おつかれさま。
      </span>
      <h2>{count ? 'Practice complete.' : 'No exercises here yet.'}</h2>
      <p>{count ? 'Repeat the lesson or continue.' : 'Choose another lesson or practice type.'}</p>
      {nextLesson && (
        <button className="primary" onClick={() => onNext(nextLesson)}>
          Next lesson: {nextLesson.title} →
        </button>
      )}
      {lesson && Boolean(lesson.lesson || lesson.references?.length) && (
        <button className="secondary" onClick={() => onRepeat(lesson)}>
          Repeat this lesson
        </button>
      )}
      <button className="text-button" onClick={onClose}>
        Back to the books
      </button>
    </div>
  );
}

function questionTarget(entry: Entry, question: Question) {
  if (question.word) return question.word;
  if (question.skill === 'reading' && entry.kind === 'kanji')
    return entry.examples[0]?.japanese || entry.japanese;
  return entry.japanese;
}

function questionReading(entry: Entry, question: Question, target: string) {
  if (['writing', 'meaning'].includes(question.skill) && entry.kind === 'kanji') return '';
  if (question.word)
    return entry.compounds?.find((compound) => compound.japanese === question.word)?.reading ?? '';
  return knownReading(entry, target);
}

function questionLabel(question: Question, exercise?: GuidedExercise) {
  if (!exercise) return question.skill;
  if (exercise.alternate) return 'Extra practice';
  return exercise.type.replaceAll('-', ' ');
}

function answerPlaceholder(entry: Entry, question: Question, testsReading: boolean) {
  if (testsReading && entry.kind === 'kana') return 'Type the sound in romaji or kana…';
  if (testsReading) return 'Type the reading in kana…';
  if (question.skill === 'grammar') return 'Japanese or kana is accepted…';
  return 'Type your answer…';
}

function annotatedPrompt(prompt: string, e: Entry, show: boolean) {
  const matches = [
    ...e.examples.map((x) => ({
      text: x.japanese.replace(/。$/, ''),
      reading: x.reading.replace(/。$/, ''),
    })),
    { text: e.japanese, reading: e.reading },
    ...(e.compounds ?? []).map((c) => ({ text: c.japanese, reading: c.reading })),
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

function QuestionPrompt({
  entry,
  question,
  exercise,
  target,
  reading,
  show,
  testsReading,
  readingRevealed,
  reviewing,
  preferences,
  onReveal,
}: Readonly<{
  entry: Entry;
  question: Question;
  exercise?: GuidedExercise;
  target: string;
  reading: string;
  show: boolean;
  testsReading: boolean;
  readingRevealed: boolean;
  reviewing: boolean;
  preferences: Preferences;
  onReveal: () => void;
}>) {
  return (
    <>
      <h2>
        {exercise?.prompt ||
          annotatedPrompt(promptFor(entry, question.skill, question.word), entry, show)}
      </h2>
      {exercise?.context && (
        <div className="practice-context jp">
          <Reading value={exercise.context} show={preferences.furigana} />
        </div>
      )}
      {(['reading', 'meaning', 'writing'].includes(question.skill) || testsReading) && (
        <div className="practice-character jp">
          <Reading value={{ text: target, reading }} show={show} />
        </div>
      )}
      {question.skill === 'meaning' && entry.kind === 'kanji' && entry.examples[0] && (
        <p className="reading">
          Example word:{' '}
          <Reading
            value={{ text: entry.examples[0].japanese, reading: entry.examples[0].reading }}
            show={reviewing || preferences.furigana}
          />
        </p>
      )}
      {testsReading && !reviewing && (
        <button
          type="button"
          className="practice-skip"
          onClick={onReveal}
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
    </>
  );
}

function TileAnswer({
  tiles,
  selected,
  show,
  onChoose,
  onRemove,
}: Readonly<{
  tiles: Tile[];
  selected: number[];
  show: boolean;
  onChoose: (id: number) => void;
  onRemove: (id: number) => void;
}>) {
  return (
    <>
      <div
        className="answer-tiles"
        aria-label="Your sentence"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const id = Number(event.dataTransfer.getData('text/plain'));
          if (tiles.some((tile) => tile.i === id)) onChoose(id);
        }}
      >
        {!selected.length && <span>Tap words to build your sentence.</span>}
        {selected.map((id) => {
          const tile = tiles.find((tile) => tile.i === id)!;
          return (
            <button
              type="button"
              key={id}
              className="tile selected-tile"
              aria-label={'Remove ' + tile.text}
              onClick={() => onRemove(id)}
            >
              <Reading value={tile} show={show} />
            </button>
          );
        })}
      </div>
      <div className="tiles">
        {tiles.map((tile) => (
          <button
            className="tile"
            type="button"
            key={tile.i}
            disabled={selected.includes(tile.i)}
            draggable
            onDragStart={(event) => event.dataTransfer.setData('text/plain', String(tile.i))}
            onClick={() => onChoose(tile.i)}
          >
            <Reading value={tile} show={show} />
          </button>
        ))}
      </div>
    </>
  );
}

function Choices({
  choices,
  answer,
  show,
  onAnswer,
}: Readonly<{
  choices: ReadingText[];
  answer: string;
  show: boolean;
  onAnswer: (value: string) => void;
}>) {
  return (
    <fieldset className="practice-choices">
      <legend>Choose one answer</legend>
      {keyed(choices).map(({ key, value: choice }) => (
        <label key={key} className={answer === choice.text ? 'choice selected-choice' : 'choice'}>
          <input
            type="radio"
            name="answer"
            value={choice.text}
            checked={answer === choice.text}
            onChange={() => onAnswer(choice.text)}
          />
          <Reading value={choice} show={show} />
        </label>
      ))}
    </fieldset>
  );
}

function RecognitionAnswer({
  entries,
  entry,
  answer,
  onAnswer,
}: Readonly<{
  entries: Entry[];
  entry: Entry;
  answer: string;
  onAnswer: (value: string) => void;
}>) {
  const options = [
    entry,
    ...entries
      .filter(
        (candidate) =>
          candidate.kind === 'kana' &&
          candidate.japanese.length === entry.japanese.length &&
          candidate.id !== entry.id,
      )
      .filter((_, index) => index % 13 === 3)
      .slice(0, 3),
  ].sort((a, b) => a.id.localeCompare(b.id));
  return (
    <div className="recognition-options">
      {options.map((option) => (
        <button
          type="button"
          key={option.id}
          className={'jp ' + (answer === option.japanese ? 'chosen' : '')}
          onClick={() => onAnswer(option.japanese)}
        >
          {option.japanese}
        </button>
      ))}
    </div>
  );
}

type AnswerProps = Readonly<{
  entries: Entry[];
  entry: Entry;
  question: Question;
  choices: ReadingText[];
  tiles: Tile[];
  selected: number[];
  answer: string;
  busy: boolean;
  testsReading: boolean;
  preferences: Preferences;
  onChoose: (id: number) => void;
  onRemove: (id: number) => void;
  onAnswer: (answer: string) => void;
  onSubmit: (writingCorrect?: boolean) => void;
}>;
function AnswerForm(props: AnswerProps) {
  const {
    entries,
    entry,
    question,
    choices,
    tiles,
    selected,
    answer,
    busy,
    testsReading,
    preferences,
    onChoose,
    onRemove,
    onAnswer,
    onSubmit,
  } = props;
  if (question.skill === 'writing')
    return <Writing key={question.id} character={entry.japanese} review onDone={onSubmit} />;
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {choices.length > 0 ? (
        <Choices
          choices={choices}
          answer={answer}
          show={preferences.furigana}
          onAnswer={onAnswer}
        />
      ) : (
        <>
          {question.skill === 'grammar' && tiles.length > 0 && (
            <TileAnswer
              tiles={tiles}
              selected={selected}
              show={preferences.furigana}
              onChoose={onChoose}
              onRemove={onRemove}
            />
          )}
          {question.skill === 'recognition' ? (
            <RecognitionAnswer
              entries={entries}
              entry={entry}
              answer={answer}
              onAnswer={onAnswer}
            />
          ) : (
            <label className="field">
              {tiles.length ? 'Or type your answer' : 'Your answer'}
              <span className="answer-input">
                <input
                  key={question.id}
                  value={answer}
                  onChange={(event) => onAnswer(event.target.value)}
                  placeholder={answerPlaceholder(entry, question, testsReading)}
                  autoComplete="off"
                  onKeyDown={(event) => {
                    if (event.nativeEvent.isComposing && event.key === 'Enter')
                      event.preventDefault();
                  }}
                />
                <button className="primary" disabled={busy || !answer.trim()} type="submit">
                  Check →
                </button>
              </span>
            </label>
          )}
        </>
      )}
      {(choices.length > 0 || question.skill === 'recognition') && (
        <div className="practice-actions">
          <button className="primary" disabled={busy || !answer.trim()} type="submit">
            Check answer →
          </button>
        </div>
      )}
    </form>
  );
}

function AnswerFeedback({
  entry,
  question,
  exercise,
  target,
  reading,
  result,
  answer,
  testsReading,
  preferences,
  onRetry,
  onNext,
}: Readonly<{
  entry: Entry;
  question: Question;
  exercise?: GuidedExercise;
  target: string;
  reading: string;
  result: Result;
  answer: string;
  testsReading: boolean;
  preferences: Preferences;
  onRetry: () => void;
  onNext: () => void;
}>) {
  const feedback = exercise?.feedback ?? { text: target, reading };
  let meaning = entry.meaning;
  if (question.word)
    meaning =
      entry.compounds?.find((compound) => compound.japanese === question.word)?.meaning ||
      entry.meaning;
  const explanation = result.explanation || exercise?.explanation;
  return (
    <div
      className={
        'answer-result ' +
        (result.correct ? 'correct' : 'incorrect') +
        (!exercise ? ' answer-result-compact' : '')
      }
    >
      <output className="answer-status">
        <span className="sr-only">{result.correct ? 'Correct' : 'Incorrect'}</span>
        {result.correct ? (
          <Check size={22} aria-hidden="true" />
        ) : (
          <X size={22} aria-hidden="true" />
        )}
      </output>
      <p className="jp">
        <Reading value={feedback} show />
      </p>
      {!testsReading && feedback.reading && (
        <p className="reading" lang="ja">
          <RoleReading value={feedback} />
        </p>
      )}
      {!exercise && <p className="answer-meaning">{meaning}</p>}
      {!result.correct && question.skill !== 'writing' && answer.trim() && (
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
      {explanation && (
        <p>
          <JapaneseProse text={explanation} show={preferences.furigana} />
        </p>
      )}
      <div>
        {!result.correct && (
          <button className="secondary" onClick={onRetry}>
            Try again
          </button>
        )}
        <button className="primary" onClick={onNext}>
          {result.correct ? 'Continue' : 'Move on'} →
        </button>
      </div>
    </div>
  );
}

type PracticeQuestionProps = AnswerProps &
  Readonly<{
    exercise?: GuidedExercise;
    result: Result | null;
    index: number;
    count: number;
    error: string;
    readingRevealed: boolean;
    onReveal: () => void;
    onRetry: () => void;
    onNext: () => void;
  }>;
export function PracticeQuestion(props: Omit<PracticeQuestionProps, 'testsReading'>) {
  const {
    entry,
    question,
    exercise,
    result,
    index,
    count,
    error,
    readingRevealed,
    preferences,
    onReveal,
    onRetry,
    onNext,
  } = props;
  const testsReading = isReadingQuestion(entry, question.skill);
  const target = questionTarget(entry, question);
  const reading = questionReading(entry, question, target);
  const show = testsReading ? readingRevealed : preferences.furigana;
  return (
    <div className="practice">
      <div className="practice-top">
        <span>
          {questionLabel(question, exercise)} / {entry.lesson?.group || entry.topic}
        </span>
        <span className="practice-progress">
          {index + 1} of {count}
          {!result && (
            <button
              type="button"
              className="practice-skip"
              onClick={onNext}
              aria-label="Skip question"
              title="Skip question"
            >
              <SkipForward size={18} aria-hidden="true" />
            </button>
          )}
        </span>
      </div>
      <QuestionPrompt
        entry={entry}
        question={question}
        exercise={exercise}
        target={target}
        reading={reading}
        show={show}
        testsReading={testsReading}
        readingRevealed={readingRevealed}
        reviewing={!!result}
        preferences={preferences}
        onReveal={onReveal}
      />
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {result ? (
        <AnswerFeedback
          entry={entry}
          question={question}
          exercise={exercise}
          target={target}
          reading={reading}
          result={result}
          answer={props.answer}
          testsReading={testsReading}
          preferences={preferences}
          onRetry={onRetry}
          onNext={onNext}
        />
      ) : (
        <AnswerForm {...props} testsReading={testsReading} />
      )}
    </div>
  );
}
