import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entries, type Entry } from '../app/lib/content.ts';
import { staticResult, staticApi } from '../app/lib/static-api.ts';
import { readFile } from 'node:fs/promises';

test('static practice filters vocabulary and grades answers without a server', () => {
  const entry = entries.find((e) => e.kind === 'vocabulary')!;
  const { queue } = staticResult(entries, 'practice', {
    kind: 'vocabulary',
    topic: entry.topic,
    level: entry.level,
    skill: 'reading',
  });
  assert.ok(queue?.length);
  for (const q of queue!) {
    const e = entries.find((e) => e.id === q.entryId)!;
    assert.equal(e.topic, entry.topic);
    assert.equal(e.level, entry.level);
  }
  assert.equal(
    staticResult(entries, 'check', { entryId: entry.id, skill: 'reading', answer: entry.reading })
      .correct,
    true,
  );
  assert.equal(
    staticResult(entries, 'check', { entryId: entry.id, skill: 'reading', answer: 'wrong' })
      .correct,
    false,
  );
  assert.equal(
    staticResult(entries, 'check', { entryId: entry.id, skill: 'writing', writingCorrect: true })
      .correct,
    true,
  );
  assert.throws(() => staticResult(entries, 'content', {}), /published/);
});

test('published snapshot loads and guided practice works using only its static file', async () => {
  const manifest = JSON.parse(await readFile('dist/notebook.json', 'utf8'));
  const content = (
    await Promise.all(
      manifest.files.map(async (path: string) => JSON.parse(await readFile(`dist${path}`, 'utf8'))),
    )
  ).flat();
  assert.equal(new Set(content.map((entry: Entry) => entry.id)).size, content.length);
  const snapshot = { ...manifest, content };
  assert.doesNotMatch(
    JSON.stringify(snapshot.content),
    /Class assignment|Practice Book|Grammar Book|Class grammar|Class vocabulary|Class topics|your class board/,
  );
  assert.ok(snapshot.content.some((e: any) => e.id === 'study-daily-routine'));
  assert.ok(snapshot.content.some((e: any) => e.id === 'study-verb-particle-pairs'));
  assert.ok(snapshot.content.some((e: any) => e.id === 'study-particle-kara'));
  assert.ok(snapshot.content.some((e: any) => e.id === 'study-travel-when-how'));
  assert.ok(snapshot.content.some((e: any) => e.id === 'study-noun-sentences'));
  assert.ok(snapshot.content.some((e: any) => e.id === 'study-vehicles-appliances'));
  for (const id of ['study-present-tense', 'study-past-tense']) {
    assert.ok(
      snapshot.content.some((entry: Entry) => entry.id === id),
      id,
    );
  }
  for (const id of [
    'study-adjective-forms',
    'study-adjective-joining',
    'study-noun-descriptions',
  ]) {
    assert.ok(
      snapshot.content.some((entry: Entry) => entry.id === id),
      id,
    );
  }
  for (const id of ['grammar-tai', 'grammar-destination']) {
    assert.ok(snapshot.content.find((entry: Entry) => entry.id === id)?.references?.length);
  }
  const original = globalThis.fetch;
  globalThis.fetch = async (input) => {
    assert.ok(input === '/notebook.json' || manifest.files.includes(input));
    return Response.json(JSON.parse(await readFile(`dist${input}`, 'utf8')));
  };
  try {
    const state = await staticApi('state', undefined);
    assert.ok('entries' in state);
    assert.equal(state.canEdit, false);
    assert.equal(state.entries.length, snapshot.content.length);
    const lesson = state.entries.find((e: Entry) => e.exercises?.length)!;
    const practice = await staticApi('practice', { entryId: lesson.id, mode: 'guided' });
    assert.ok('queue' in practice);
    const { queue } = practice;
    assert.ok(queue?.length);
    for (const q of queue!) {
      const exercise = lesson.exercises!.find((e: any) => e.id === q.exerciseId)!;
      const result = await staticApi('check', {
        entryId: lesson.id,
        skill: q.skill,
        exerciseId: q.exerciseId,
        answer: exercise.answers[0],
      });
      assert.ok('correct' in result);
      assert.equal(result.correct, true);
    }
  } finally {
    globalThis.fetch = original;
  }
});
