import type { GuidedExercise } from '../content/types.ts';

// Keep the tested predicate and particles hidden; hints only supply supporting vocabulary.
export function vocabularyHints(exercise?: GuidedExercise) {
  if (exercise?.type !== 'typing') return [];
  const tokens = exercise.feedback.tokens ?? [];
  return tokens
    .filter((token) => token.role !== 'predicate' && /noun|adjective|adverb/.test(token.wordClass))
    .filter((token, index, hints) => hints.findIndex((hint) => hint.text === token.text) === index)
    .map((token) => ({
      text: token.text,
      reading: token.reading || '',
      meaning:
        exercise.feedback.translationTokens
          ?.filter((translation) => translation.role === token.role)
          .map((translation) => translation.text)
          .join('')
          .trim()
          .replace(/[.!?]+$/, '') || '',
    }));
}
