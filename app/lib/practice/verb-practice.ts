import type { Entry, GuidedExercise } from '../content/types.ts';
import { wordForms } from '../japanese/word-forms.ts';
import { toRomaji } from '../japanese/romaji.ts';

export const verbTargets = [
  ['Casual negative', 'ない-form · do not'],
  ['て-form', 'て-form · connect actions'],
  ['Casual past', 'た-form · did'],
  ['Polite', 'ます-form · polite non-past'],
  ['Polite negative', 'ません · polite negative'],
  ['Polite past', 'ました · polite past'],
  ['Casual past negative', 'なかった · did not'],
  ['Polite past negative', 'ませんでした · polite past negative'],
] as const;

export function verbExercises(entry: Entry): GuidedExercise[] {
  if (entry.kind !== 'vocabulary') return [];
  const forms = wordForms(entry);
  if (!forms) return [];
  return verbTargets.flatMap(([id, label]) => {
    const row = forms.table.rows.find((r) => r[0].text === id);
    if (!row) return [];
    const feedback = row[1];
    const reading = feedback.reading || feedback.text;
    const dictionary = entry.reading;
    const end = dictionary.slice(-1);
    const base = dictionary.slice(0, -1);
    let rule: string;
    if (forms.group.startsWith('Group 3'))
      rule =
        'Irregular: learn する → しない・して・した・します and 来る (くる) → こない・きて・きた・きます.';
    else if (forms.group.startsWith('Group 2'))
      rule = 'Group 2: drop the final る, then add ない, て, た, or the polite ending.';
    else if (id.includes('negative') && !id.startsWith('Polite'))
      rule = `Group 1: ${end} → ${reading.slice(base.length, base.length + 1)}, then add ない. For past negative, change ない → なかった. Verbs ending in う use わない (いう → いわない).`;
    else if (id === 'て-form' || id === 'Casual past')
      rule =
        'Group 1: う・つ・る → って; む・ぶ・ぬ → んで; く → いて; ぐ → いで; す → して. Exception: 行く → 行って. For past, て → た and で → だ.';
    else
      rule =
        'Group 1: change the final sound to its い-row sound, then add ます, ません, ました, or ませんでした.';
    return [
      {
        id,
        type: 'typing' as const,
        prompt: `Change to ${label}.`,
        context: { text: entry.japanese, reading: entry.reading },
        answers: [...new Set([feedback.text, reading, toRomaji(reading)])],
        hint: forms.group,
        explanation: `${forms.group}. ${dictionary} (${toRomaji(dictionary)}) → ${reading} (${toRomaji(reading)}). ${rule}`,
        feedback: { ...feedback, meaning: `${entry.meaning} · ${label}` },
      },
    ];
  });
}

export function verbExercise(entry: Entry, target?: string) {
  return verbExercises(entry).find((exercise) => exercise.id === target);
}
