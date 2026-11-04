import type { Entry } from './content.ts';

export const topicBooks: Record<string, readonly string[]> = {
  family: ['study-family'],
  calendar: [
    'study-weekdays',
    'study-months',
    'study-dates',
    'study-relative-time',
    'study-durations',
    'study-every',
  ],
  introductions: [
    'study-ask-name',
    'study-ask-job',
    'study-ask-hobby',
    'study-ages',
    'study-daily-routine',
  ],
};
export function topicBookFor(entryId: string) {
  return Object.keys(topicBooks).find((book) => topicBooks[book].includes(entryId));
}
export function topicBookEntries(entries: Entry[], book: string) {
  return (topicBooks[book] || []).flatMap((id) => {
    const entry = entries.find((e) => e.id === id);
    return entry ? [entry] : [];
  });
}
