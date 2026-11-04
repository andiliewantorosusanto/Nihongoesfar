import type { Entry } from './content.ts';
import { makePractice, grade, answerFor, type Skill } from './learning.ts';
import strokes from './strokes.json' with { type: 'json' };

let library:
  Promise<{ content: Entry[]; preferences: { furigana: boolean; romaji: boolean } }> | undefined;
export function staticResult(entries: Entry[], resource: string, b: any) {
  if (resource === 'practice') {
    const selected =
      b.kind === 'vocabulary'
        ? entries.filter(
            (e) =>
              (b.topic === undefined || e.topic === b.topic) &&
              (b.level === undefined || e.level === b.level),
          )
        : entries;
    return { queue: makePractice(selected, Object.keys(strokes), b) };
  }
  if (resource === 'check') {
    const entry = entries.find((e) => e.id === b.entryId);
    if (!entry) throw new Error('This entry is unavailable.');
    return {
      correct:
        b.skill === 'writing'
          ? b.writingCorrect
          : grade(entry, b.skill as Skill, b.answer, b.word, b.exerciseId),
      answers: answerFor(entry, b.skill, b.word, b.exerciseId),
      explanation: b.exerciseId
        ? entry.exercises?.find((x) => x.id === b.exerciseId)?.explanation
        : entry.exercise?.explanation,
    };
  }
  throw new Error('Content is updated when this site is published.');
}
export async function staticApi(resource: string, body: unknown) {
  library ??= fetch('/notebook.json')
    .then(async (response) => {
      if (!response.ok) throw new Error('The library could not be loaded. Please refresh.');
      const manifest = await response.json();
      const groups = await Promise.all(
        manifest.files.map(async (path: string) => {
          const response = await fetch(path);
          if (!response.ok) throw new Error('The library could not be loaded. Please refresh.');
          return response.json() as Promise<Entry[]>;
        }),
      );
      return { content: groups.flat(), preferences: manifest.preferences };
    })
    .catch((error) => {
      library = undefined;
      throw error;
    });
  const snapshot = await library;
  if (resource === 'state')
    return {
      entries: snapshot.content,
      custom: snapshot.content.filter((e) => e.id.startsWith('custom-')),
      preferences: snapshot.preferences,
      strokeIds: Object.keys(strokes),
      canEdit: false,
    };
  return staticResult(snapshot.content, resource, body);
}
