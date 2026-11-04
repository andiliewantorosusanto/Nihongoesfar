import type { ReactNode } from 'react';

export type GuideRow = {
  value: string;
  japanese: string;
  kana: string;
  romaji: string;
  special?: boolean;
};

export default function GuideTable({
  title,
  rows,
  romaji,
  children,
  collapsible = true,
}: Readonly<{
  title: string;
  rows: GuideRow[];
  romaji: boolean;
  children?: ReactNode;
  collapsible?: boolean;
}>) {
  const Container = collapsible ? 'details' : 'section';
  const Heading = collapsible ? 'summary' : 'h3';
  return (
    <Container className="large-number-guide guide-reference">
      <Heading>{title}</Heading>
      {children}
      <table className="quick-table">
        <caption className="sr-only">{title}</caption>
        <thead>
          <tr>
            <th scope="col">Value</th>
            <th scope="col">Japanese</th>
            <th scope="col">Reading</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.value}>
              <th scope="row">{row.value}</th>
              <td lang="ja">{row.japanese}</td>
              <td className={row.special ? 'sound-change' : undefined}>
                <span className="guide-reading">
                  <span lang="ja">{row.kana}</span>
                  {romaji && <small>{row.romaji}</small>}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Container>
  );
}
