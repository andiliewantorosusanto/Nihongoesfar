// Repeated words need distinct keys; unrelated reordering must not change their identity.
export function keyed<T>(items: readonly T[]): { key: string; value: T }[] {
  const occurrences = new Map<string, number>();
  return items.map((value) => {
    const identity = JSON.stringify(value) ?? String(value);
    const occurrence = occurrences.get(identity) ?? 0;
    occurrences.set(identity, occurrence + 1);
    return { key: `${identity}:${occurrence}`, value };
  });
}
