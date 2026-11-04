import { useMemo, useState } from 'react';
import type { Entry } from '../lib/content/content';
import { withAlternate, type Question } from '../lib/practice/learning';
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
      else if (hadMistake)
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
    setIndex((index) => index + 1);
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
      count={queue.length}
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
  );
}
