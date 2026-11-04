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
  showTitle = true,
  combineReading = false,
}: Readonly<{
  title: string;
  rows: GuideRow[];
  romaji: boolean;
  children?: ReactNode;
  showTitle?: boolean;
  combineReading?: boolean;
}>) {
  return (
    <section className="large-number-guide guide-reference">
      {showTitle && <h3>{title}</h3>}
      {children}
      <table className="quick-table">
        <caption className="sr-only">{title}</caption>
        <thead>
          <tr>
            <th scope="col">Value</th>
            <th scope="col">{combineReading ? 'Japanese & reading' : 'Japanese'}</th>
            {!combineReading && <th scope="col">Reading</th>}
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
                <td>
                  <span lang="ja" className={combineReading ? 'guide-kanji jp' : undefined}>
                    {row.japanese}
                  </span>
                  {combineReading && reading}
                </td>
                {!combineReading && <td>{reading}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
