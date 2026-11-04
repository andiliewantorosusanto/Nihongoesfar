import topicBookData from '../../../public/guides/topic-books.json' with { type: 'json' };
import type { Entry } from '../content/content.ts';

export const topicBooks: Record<string, readonly string[]> = topicBookData;
export function topicBookFor(entryId: string) {
  return Object.keys(topicBooks).find((book) => topicBooks[book].includes(entryId));
}
export function topicBookEntries(entries: Entry[], book: string) {
  return (topicBooks[book] || []).flatMap((id) => {
    const entry = entries.find((e) => e.id === id);
    return entry ? [entry] : [];
  });
}
