import { useMemo, useState } from 'react';
import type { Entry } from '../lib/content/content';
import { practiceRound, withAlternate, type Question } from '../lib/practice/learning';
import { api } from '../lib/api/api';
import {
  PracticeFinished,
  PracticeQuestion,
  practiceTiles,
  shuffled,
  type Result,
} from './PracticeParts';

type PracticeProps = Readonly<{
  entries: Entry[];
  preferences: { furigana: boolean; romaji: boolean };
  questions: Question[];
  onClose: () => void;
  onNext: (entry: Entry) => void;
  onRepeat: (entry: Entry) => void;
}>;

export default function Practice({
  entries,
  preferences,
  questions,
  onClose,
  onNext,
  onRepeat,
}: PracticeProps) {
  const [queue, setQueue] = useState(questions);
  const [endless, setEndless] = useState(false);
  const [practiceType, setPracticeType] = useState('all');
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hadMistake, setHadMistake] = useState(false);
  const [readingRevealed, setReadingRevealed] = useState(false);
  const question = queue[index];
  const entry = entries.find((entry) => entry.id === question?.entryId);
  const exercise = entry?.exercises?.find((item) => item.id === question?.exerciseId);
  const tiles = useMemo(
    () => practiceTiles(exercise, entry, question?.id ?? ''),
    [question?.id, exercise, entry],
  );
  const choices = useMemo(
    () => shuffled(exercise?.choices ?? [], question?.id ?? ''),
    [question?.id, exercise],
  );
  const lesson = entries.find(
    (entry) => entry.id === (questions[0]?.lessonId || questions[0]?.entryId),
  );
  const nextOrder = lesson?.lesson?.order;
  const nextLesson = entries.find(
    (entry) => nextOrder !== undefined && entry.lesson?.order === nextOrder + 1,
  );

  async function submit(writingCorrect?: boolean) {
    if (!question || !entry) return;
    setBusy(true);
    setError('');
    try {
      const checked: Result = await api('check', {
        entryId: question.entryId,
        skill: question.skill,
        word: question.word,
        exerciseId: question.exerciseId,
        answer,
        writingCorrect,
      });
      setResult(checked);
      if (!checked.correct) setHadMistake(true);
      else if (hadMistake && practiceType === 'all')
        setQueue((current) => withAlternate(current, question.lessonId && lesson ? lesson : entry));
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  function clearAnswer() {
    setAnswer('');
    setSelected([]);
    setResult(null);
  }
  function next() {
    if (endless && index + 1 >= queue.length) {
      setQueue(practiceRound(entries, questions, practiceType, question?.id));
      setIndex(0);
    } else setIndex((index) => index + 1);
    clearAnswer();
    setError('');
    setHadMistake(false);
    setReadingRevealed(false);
  }
  function updateSelected(value: number[]) {
    setSelected(value);
    setAnswer(value.map((id) => tiles.find((tile) => tile.i === id)!.text).join(''));
  }
  function choose(id: number) {
    if (!selected.includes(id)) updateSelected([...selected, id]);
  }
  if (!question || !entry)
    return (
      <PracticeFinished
        count={queue.length}
        lesson={lesson}
        nextLesson={nextLesson}
        onClose={onClose}
        onNext={onNext}
        onRepeat={onRepeat}
      />
    );
  return (
    <>
      <div className="practice-modifiers">
        <label>
          <input
            type="checkbox"
            disabled={busy}
            checked={endless}
            onChange={(event) => setEndless(event.target.checked)}
          />{' '}
          Endless practice
        </label>
        {questions.some(
          (q) =>
            q.exerciseId &&
            !entries
              .find((e) => e.id === q.entryId)
              ?.exercises?.find((ex) => ex.id === q.exerciseId)?.particleSegments,
        ) && (
          <label>
            Question type{' '}
            <select
              disabled={busy}
              value={practiceType}
              onChange={(event) => {
                const type = event.target.value;
                setPracticeType(type);
                setQueue(type === 'all' ? questions : practiceRound(entries, questions, type));
                setIndex(0);
                clearAnswer();
                setError('');
                setHadMistake(false);
                setReadingRevealed(false);
              }}
            >
              <option value="all">All types</option>
              <option value="meaning-choice">Meaning choice</option>
              <option value="pattern-choice">Japanese choice</option>
              <option value="gap">Fill the gap</option>
              <option value="tiles">Build a sentence</option>
              <option value="typing">Write in Japanese</option>
            </select>
          </label>
        )}
      </div>
      <PracticeQuestion
        entries={entries}
        entry={entry}
        question={question}
        exercise={exercise}
        preferences={preferences}
        choices={choices}
        tiles={tiles}
        selected={selected}
        answer={answer}
        result={result}
        busy={busy}
        error={error}
        index={index}
        count={endless ? 0 : queue.length}
        readingRevealed={readingRevealed}
        onChoose={choose}
        onRemove={(id) => updateSelected(selected.filter((selectedId) => selectedId !== id))}
        onAnswer={(value) => {
          setAnswer(value);
          setSelected([]);
        }}
        onSubmit={(correct) => {
          void submit(correct);
        }}
        onReveal={() => setReadingRevealed((value) => !value)}
        onRetry={clearAnswer}
        onNext={next}
      />
    </>
  );
}
