import Scrollable from './Scrollable';
import { keyed } from '../lib/ui/list-keys';
import { toRomaji } from '../lib/japanese/romaji';
import type { ReadingText } from '../lib/content/grammar-course';
import type { Entry } from '../lib/content/content';
import { rubyParts, proseReadings } from '../lib/japanese/sentence-support';
export function Furigana({
  text,
  reading,
  show,
}: Readonly<{
  text: string;
  reading: string;
  show: boolean;
}>) {
  return (
    <>
      {keyed(show ? rubyParts(text, reading) : [{ text }]).map(({ value: p, key }) =>
        p.reading ? (
          <ruby key={key}>
            {p.text}
            <rt>{p.reading}</rt>
          </ruby>
        ) : (
          <span key={key}>{p.text}</span>
        ),
      )}
    </>
  );
}
function tokenRomaji(token: NonNullable<Entry['examples'][number]['tokens']>[number]) {
  if (token.role === 'particle' && token.text === 'は') return 'wa';
  if (token.role === 'particle' && token.text === 'へ') return 'e';
  return toRomaji(token.reading || token.text);
}

export function Sentence({
  example,
  furigana,
  romaji = false,
}: Readonly<{
  romaji?: boolean;
  example: Entry['examples'][number];
  furigana: boolean;
}>) {
  const tokens = example.tokens;
  const aligned = !!tokens?.length && tokens.every((t) => t.reading);
  return (
    <div className="sentence">
      {tokens?.length ? (
        <div className="sentence-tokens" lang="ja">
          {keyed(tokens).map(({ value: t, key }) => (
            <span className={'sentence-token role-' + t.role} key={key}>
              <small>{t.role}</small>
              <b title={t.wordClass}>
                <Furigana text={t.text} reading={t.reading || ''} show={furigana && !!t.reading} />
              </b>
              <em>{t.wordClass}</em>
            </span>
          ))}
        </div>
      ) : (
        <p className="jp example-jp" lang="ja">
          <Furigana text={example.japanese} reading={example.reading} show={furigana} />
        </p>
      )}
      {furigana && (
        <p className="reading aligned-reading" lang="ja">
          {aligned ? (
            <>
              {keyed(tokens!).map(({ value: t, key }) => (
                <span key={key} className={'aligned-word role-' + t.role} title={t.role}>
                  {t.reading}
                </span>
              ))}
              <span>。</span>
            </>
          ) : (
            example.reading
          )}
        </p>
      )}
      {romaji && (
        <p className="reading">
          {example.tokens?.length
            ? example.tokens.map(tokenRomaji).join(' ')
            : toRomaji(example.reading)}
        </p>
      )}
      <p className="aligned-english" lang="en">
        {example.translationTokens?.length
          ? keyed(example.translationTokens).map(({ value: t, key }) => (
              <span
                key={key}
                className={t.implicit ? 'implicit-word' : 'aligned-word role-' + t.role}
                title={
                  t.implicit
                    ? 'Understood from context; not written in the Japanese sentence'
                    : t.role
                }
              >
                {t.text}
              </span>
            ))
          : example.meaning}
      </p>
    </div>
  );
}

export function JapaneseProse({ text, show }: Readonly<{ text: string; show: boolean }>) {
  return (
    <>
      {keyed(proseReadings(text)).map(({ value: p, key }) => (
        <Furigana key={key} text={p.text} reading={p.reading} show={show} />
      ))}
    </>
  );
}

export function RoleText({ value, show }: Readonly<{ value: ReadingText; show: boolean }>) {
  if (!value.tokens?.length)
    return (
      <span
        className={value.role ? 'aligned-word role-' + value.role : undefined}
        title={value.role}
      >
        <Furigana text={value.text} reading={value.reading} show={show} />
      </span>
    );
  const covered = value.tokens.map((t) => t.text).join('');
  return (
    <span className="sentence-inline">
      {keyed(value.tokens).map(({ value: t, key }) => (
        <span key={key} className={'aligned-word role-' + t.role} title={t.role}>
          <Furigana text={t.text} reading={t.reading || ''} show={show} />
        </span>
      ))}
      {value.text.slice(covered.length)}
    </span>
  );
}
export function AlignedTranslation({
  tokens,
  meaning,
}: Readonly<{
  tokens?: NonNullable<Entry['examples'][number]['translationTokens']>;
  meaning: string;
}>) {
  return (
    <>
      {tokens?.length
        ? keyed(tokens).map(({ value: t, key }) => (
            <span
              key={key}
              className={t.implicit ? 'implicit-word' : 'aligned-word role-' + t.role}
              title={t.implicit ? 'Understood from context; not written in Japanese' : t.role}
            >
              {t.text}
            </span>
          ))
        : meaning}
    </>
  );
}

export function RoleReading({ value }: Readonly<{ value: ReadingText }>) {
  return (
    <>
      {value.tokens?.length ? (
        <>
          {keyed(value.tokens).map(({ value: t, key }) => (
            <span className={'aligned-word role-' + t.role} key={key} title={t.role}>
              {t.reading}
            </span>
          ))}
          {value.reading.slice(value.tokens.reduce((n, t) => n + (t.reading?.length || 0), 0))}
        </>
      ) : (
        value.reading
      )}
    </>
  );
}

export function ReferenceTables({
  tables,
  furigana,
  romaji = false,
}: Readonly<{
  romaji?: boolean;
  tables: NonNullable<Entry['references']>;
  furigana: boolean;
}>) {
  return (
    <>
      {keyed(tables).map(({ value: table, key }) => (
        <section className="study-reference" key={key}>
          <h3>{table.heading}</h3>
          <Scrollable className="reference-scroll" label={table.heading}>
            <table className="quick-table">
              <thead>
                <tr>
                  {keyed(table.columns).map(({ value: heading, key }) => (
                    <th scope="col" key={key}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keyed(table.rows).map(({ value: row, key }) => (
                  <tr key={key}>
                    {keyed(row).map(({ value: cell, key }) => (
                      <td key={key}>
                        <RoleText value={cell} show={furigana} />
                        {cell.reading && (
                          <small className="reading reference-kana" lang="ja">
                            {cell.reading}
                          </small>
                        )}
                        {romaji && cell.reading && (
                          <small className="reading reference-kana">{toRomaji(cell.reading)}</small>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Scrollable>
        </section>
      ))}
    </>
  );
}
