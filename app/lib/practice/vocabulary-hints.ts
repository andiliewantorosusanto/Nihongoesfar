import type { GuidedExercise } from '../content/types.ts';

// Tiles separate vocabulary from conjugated predicates and sentence endings.
export function vocabularyHints(exercise?: GuidedExercise) {
  if (exercise?.type !== 'typing') return [];
  const tokens = exercise.feedback.tiles ?? exercise.feedback.tokens ?? [];
  return tokens
    .filter(
      (token) =>
        (/noun|adjective|adverb/.test(token.wordClass) ||
          (token.role === 'predicate' && !/[ぁ-ゖ]$/.test(token.text))) &&
        !/^(これ|それ|あれ|この|その|あの|ここ|そこ|あそこ)$/.test(token.text),
    )
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
          .replace(/^(?:(?:Is|Are|Was|Were|is|are|a|an)\s+)+/, '')
          .trim()
          .replace(/[.!?]+$/, '') || '',
    }));
}
