export type Point = { x: number; y: number };
export function resample(points: Point[], count = 24): Point[] {
  if (points.length < 2) return points;
  const distances = [0];
  for (let i = 1; i < points.length; i++)
    distances.push(
      distances[i - 1] + Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y),
    );
  const total = distances.at(-1)!;
  if (!total) return [points[0]];
  return Array.from({ length: count }, (_, j) => {
    const d = (total * j) / (count - 1);
    let i = 1;
    while (i < distances.length - 1 && distances[i] < d) i++;
    const t = (d - distances[i - 1]) / (distances[i] - distances[i - 1] || 1);
    return {
      x: points[i - 1].x + (points[i].x - points[i - 1].x) * t,
      y: points[i - 1].y + (points[i].y - points[i - 1].y) * t,
    };
  });
}
export function checkStroke(actual: Point[], expected: Point[]) {
  if (actual.length < 2 || expected.length < 2) return false;
  const a = resample(actual);
  const b = resample(expected);
  const d = (p: Point, q: Point) => Math.hypot(p.x - q.x, p.y - q.y);
  const length = actual.slice(1).reduce((n, p, i) => n + d(p, actual[i]), 0);
  const expectedLength = expected.slice(1).reduce((n, p, i) => n + d(p, expected[i]), 0);
  return (
    length > expectedLength * 0.45 &&
    length < expectedLength * 2.1 &&
    d(a[0], b[0]) < 16 &&
    d(a.at(-1)!, b.at(-1)!) < 16 &&
    a.reduce((n, p, i) => n + d(p, b[i]), 0) / a.length < 11
  );
}
