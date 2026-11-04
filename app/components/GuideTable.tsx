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
}: Readonly<{
  title: string;
  rows: GuideRow[];
  romaji: boolean;
  children?: ReactNode;
}>) {
  return (
    <section className="large-number-guide guide-reference">
      <h3>{title}</h3>
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
          {rows.map((row) => {
            const reading = (
              <span className={'guide-reading' + (row.special ? ' sound-change' : '')}>
                <span className="jp" lang="ja">
                  {row.kana}
                </span>
                {romaji && <small>{row.romaji}</small>}
              </span>
            );
            return (
              <tr key={row.value}>
                <th scope="row">{row.value}</th>
                <td lang="ja">{row.japanese}</td>
                <td>{reading}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
