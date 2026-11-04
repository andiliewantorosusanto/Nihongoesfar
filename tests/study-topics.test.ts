import { test } from 'node:test';
import assert from 'node:assert/strict';
import { proseReadings } from '../app/lib/japanese/sentence-support.ts';
import { entries } from '../app/lib/content/content.ts';
import {
  makePractice,
  grade,
  skillsFor,
  isReadingQuestion,
  entryInBook,
} from '../app/lib/practice/learning.ts';
const get = (id: string) => {
  const e = entries.find((e) => e.id === 'study-' + id);
  assert.ok(e, id);
  return e;
};
test('vehicle and appliance pairs keep their particles and opposite actions distinct', () => {
  const entry = get('vehicles-appliances');
  const cells = entry.references!.flatMap((table) => table.rows.flat());
  for (const [text, reading] of [
    ['車に乗ります', 'くるまにのります'],
    ['車を降ります', 'くるまをおります'],
    ['電気をつけます', 'でんきをつけます'],
    ['テレビを消す', 'てれびをけす'],
  ]) {
    assert.ok(
      cells.some((cell) => cell.text === text && cell.reading === reading),
      text,
    );
  }
  assert.ok(grade(entry, 'grammar', 'テレビを消します', undefined, 'tiles'));
  assert.equal(grade(entry, 'grammar', 'テレビをつけます', undefined, 'tiles'), false);
  assert.ok(grade(entry, 'grammar', '車に乗ります', undefined, 'typing'));
  assert.equal(grade(entry, 'grammar', '車を乗ります', undefined, 'typing'), false);
});
test('introduction topics stay outside grammar and lesson text has no class/page labels', () => {
  for (const id of ['ask-name', 'ask-job', 'ask-hobby', 'ask-time', 'daily-routine']) {
    assert.equal(entryInBook(get(id), 'grammar'), false, id);
  }
  const queue = makePractice(entries, [], { kind: 'grammar' });
  assert.ok(
    queue.every((question) =>
      entryInBook(
        entries.find((entry) => entry.id === question.entryId)!,
        'grammar',
      ),
    ),
  );
  assert.doesNotMatch(
    JSON.stringify(entries),
    /Class assignment|Practice Book|Grammar Book|Class grammar|Class vocabulary|Class topics|your class board/,
  );
});
test('noun sentence class notes cover all four forms, pointing words and polite variants', () => {
  const entry = get('noun-sentences');
  assert.equal(entry.topic, 'Sentence basics');
  const cells = entry.references!.flatMap((table) => table.rows.flat());
  for (const text of [
    '学生です',
    '学生じゃありません',
    '学生でした',
    '学生じゃありませんでした',
    'どれがあなたのペンですか',
  ]) {
    assert.ok(
      cells.some((cell) => cell.text === text),
      text,
    );
  }
  assert.ok(grade(entry, 'grammar', 'じゃありません', undefined, 'gap'));
  assert.ok(grade(entry, 'grammar', 'ではありません', undefined, 'gap'));
  assert.equal(grade(entry, 'grammar', 'でした', undefined, 'gap'), false);
  assert.ok(grade(entry, 'grammar', 'この建物は病院でした', undefined, 'typing'));
});
test('adjective grammar guides stay in grammar rather than the adjective word book', () => {
  const forms = get('adjective-forms');
  const joining = get('adjective-joining');
  const nouns = get('noun-descriptions');
  for (const entry of [forms, joining, nouns]) {
    // The old all-tense form guide is now reached through the combined tense topics.
    assert.equal(entryInBook(entry, 'adjectives'), false);
    assert.equal(entryInBook(entry, 'grammar'), entry !== forms);
    assert.equal(makePractice(entries, [], { entryId: entry.id, mode: 'guided' }).length, 5);
  }
  const cells = forms.references!.flatMap((reference) => reference.rows.flat());
  for (const text of [
    '暑くなかったです',
    '元気じゃありませんでした',
    '雨だった',
    'よくなかったです',
  ]) {
    assert.ok(
      cells.some((cell) => cell.text === text),
      text,
    );
  }
  const adjectivePractice = makePractice(entries, [], { kind: 'adjectives' });
  assert.ok(adjectivePractice.length);
  for (const question of adjectivePractice) {
    assert.equal(entries.find((entry) => entry.id === question.entryId)!.kind, 'adjectives');
  }
  const adjectiveWords = new Set(
    entries.filter((entry) => entry.kind === 'adjectives').map((entry) => entry.japanese),
  );
  const examples = forms.references![1].rows;
  assert.ok(examples.length);
  for (const row of examples) assert.ok(adjectiveWords.has(row[0].text), row[0].text);
  assert.ok(grade(joining, 'grammar', '有名で', undefined, 'gap'));
  assert.equal(grade(joining, 'grammar', '有名くて', undefined, 'gap'), false);
  assert.ok(grade(nouns, 'grammar', 'な', undefined, 'gap'));
  assert.equal(grade(nouns, 'grammar', 'の', undefined, 'gap'), false);
  assert.ok(grade(nouns, 'grammar', '日本の料理です', undefined, 'typing'));
});
test('tense topics keep positive, negative and question forms together', () => {
  const headings = [
    'Polite',
    'Casual',
    'Negative polite',
    'Negative casual',
    'Question / negative question',
  ];
  for (const id of ['present-tense', 'past-tense']) {
    const entry = get(id);
    assert.equal(entry.topic, 'Tenses');
    assert.deepEqual(
      entry.references!.map((reference) => reference.heading),
      headings,
    );
    assert.ok(entryInBook(entry, 'grammar'));
    assert.equal(entryInBook(entry, 'adjectives'), false);
  }
  const past = get('past-tense');
  const cells = past.references!.flatMap((reference) => reference.rows.flat());
  for (const text of [
    '食べました',
    '食べた',
    '食べませんでした',
    '食べなかった',
    '食べましたか',
    '食べませんでしたか',
  ]) {
    assert.ok(
      cells.some((cell) => cell.text === text),
      text,
    );
  }
  for (const id of [
    'grammar-noun-negative',
    'grammar-masen',
    'grammar-verb-past',
    'grammar-noun-past',
    'grammar-existence-negative',
  ]) {
    assert.equal(
      entryInBook(
        entries.find((entry) => entry.id === id)!,
        'grammar',
      ),
      false,
    );
  }
  assert.ok(grade(past, 'grammar', '食べなかった', undefined, 'gap'));
  assert.equal(grade(past, 'grammar', '食べない', undefined, 'gap'), false);
});
test('class travel notes combine transport, time, destinations and past tense', () => {
  const travel = get('travel-when-how');
  assert.equal(travel.topic, 'Polite verbs and particles');
  assert.ok(grade(travel, 'grammar', '昨日十一時に家へ帰りました', undefined, 'typing'));
  assert.ok(
    grade(travel, 'grammar', 'きのうじゅういちじにいえにかえりました', undefined, 'typing'),
  );
  assert.ok(grade(travel, 'grammar', '昨日日本へ来ました', undefined, 'tiles'));
  assert.equal(grade(travel, 'grammar', '昨日日本で来ました', undefined, 'tiles'), false);
  const cells = travel.references!.flatMap((table) => table.rows.flat());
  for (const text of ['歩いて', 'バイクで', '大使館', '分ける', '分かる']) {
    assert.ok(
      cells.some((cell) => cell.text === text),
      text,
    );
  }
  assert.ok(cells.some((cell) => cell.text === '十分' && cell.reading === 'じゅうぶん'));
  const embassy = entries.filter(
    (entry) => entry.kind === 'vocabulary' && entry.japanese === '大使館',
  );
  assert.ok(embassy.length);
  for (const entry of embassy) assert.equal(entry.reading, 'たいしかん');
});
test('desire, movement and kara have references and correctly scoped practice', () => {
  const desire = entries.find((entry) => entry.id === 'grammar-tai')!;
  assert.doesNotMatch(desire.note, /Practice Book|Class assignment/);
  assert.ok(desire.references![0].rows.flat().some((cell) => cell.text === '勉強したいです'));
  assert.ok(grade(desire, 'grammar', '本を読みたいです', undefined, 'tiles'));
  const movement = entries.find((entry) => entry.id === 'grammar-destination')!;
  for (const text of ['ここに来ます', 'ここへ来ます', '家に帰ります', '家へ帰ります']) {
    assert.ok(
      movement.references![0].rows.flat().some((cell) => cell.text === text),
      text,
    );
  }
  assert.ok(grade(movement, 'grammar', 'に', undefined, 'gap'));
  assert.ok(grade(movement, 'grammar', 'へ', undefined, 'gap'));
  const kara = get('particle-kara');
  assert.doesNotMatch(kara.note, /Practice Book|Class assignment/);
  assert.ok(grade(kara, 'grammar', 'から', undefined, 'gap'));
  assert.equal(grade(kara, 'grammar', 'に', undefined, 'gap'), false);
});
test('special verb–particle pairs preserve readings, polite/casual forms, and particle practice', () => {
  const entry = get('verb-particle-pairs');
  assert.equal(entry.topic, 'Polite verbs and particles');
  const cells = entry.references![0].rows.flat();
  for (const [text, reading] of [
    ['電車に乗ります', 'でんしゃにのります'],
    ['バスを降ります', 'ばすをおります'],
    ['部屋に入る', 'へやにはいる'],
    ['家を出る', 'いえをでる'],
    ['友達に会います', 'ともだちにあいます'],
  ])
    assert.ok(
      cells.some((cell) => cell.text === text && cell.reading === reading),
      text,
    );
  assert.ok(grade(entry, 'grammar', 'を', undefined, 'gap'));
  assert.equal(grade(entry, 'grammar', 'に', undefined, 'gap'), false);
  assert.ok(grade(entry, 'grammar', 'バスを降ります', undefined, 'pattern'));
  assert.equal(grade(entry, 'grammar', 'バスに降ります', undefined, 'pattern'), false);
  assert.doesNotMatch(entry.note, /Practice Book|Class assignment/);
});
test('requested class topics are present with full comparison tables, rather than placeholder entries', () => {
  for (const id of [
    'kore-sore-are',
    'kono-sono-ano',
    'particle-e',
    'particle-o',
    'particle-wa',
    'particle-ga',
    'family',
    'ask-name',
    'ask-job',
    'ask-hobby',
    'ask-time',
    'ages',
    'existence',
    'months',
    'dates',
    'weekdays',
    'relative-time',
    'durations',
    'every',
    'large-numbers',
    'katakana-sounds',
  ])
    assert.ok(get(id).references?.[0].rows.length);
  assert.equal(get('months').references![0].rows.length, 12);
  assert.equal(get('dates').references![0].rows.length, 31);
  assert.equal(get('weekdays').references![0].rows.length, 7);
  assert.equal(get('family').references![0].rows.length, 14);
  const family = JSON.stringify(get('family').references);
  for (const term of [
    '父',
    'ちち',
    'お父さん',
    'おとうさん',
    '兄',
    'お兄さん',
    '祖父',
    'おじいさん',
    '夫',
    'ご主人',
    '妻',
    '奥さん',
  ])
    assert.ok(family.includes(term), term);
  for (const [jp, r] of [
    ['行きます', 'いきます'],
    ['来ます', 'きます'],
    ['帰ります', 'かえります'],
  ])
    assert.ok(entries.some((e) => e.kind === 'vocabulary' && e.japanese === jp && e.reading === r));
  assert.match(get('particle-e').note, /not limited/);
  assert.match(get('existence').note, /plants/);
});
test('calendar readings distinguish irregular dates, month names, durations and ages', () => {
  const rows = (id: string) => get(id).references![0].rows;
  for (const [jp, kana] of [
    ['四月', 'しがつ'],
    ['七月', 'しちがつ'],
    ['九月', 'くがつ'],
  ])
    assert.ok(
      rows('months')
        .flat()
        .some((c) => c.text === jp && c.reading === kana),
    );
  for (const [jp, kana] of [
    ['一日', 'ついたち'],
    ['二日', 'ふつか'],
    ['十四日', 'じゅうよっか'],
    ['二十日', 'はつか'],
    ['二十四日', 'にじゅうよっか'],
  ])
    assert.ok(
      rows('dates')
        .flat()
        .some((c) => c.text === jp && c.reading === kana),
    );
  for (const [jp, kana] of [
    ['一日', 'いちにち'],
    ['二日間', 'ふつかかん'],
    ['二週間', 'にしゅうかん'],
    ['二か月', 'にかげつ'],
    ['二年間', 'にねんかん'],
  ])
    assert.ok(
      rows('durations')
        .flat()
        .some((c) => c.text === jp && c.reading === kana),
    );
  for (const [jp, kana] of [
    ['一歳', 'いっさい'],
    ['八歳', 'はっさい'],
    ['十歳', 'じゅっさい'],
    ['二十歳', 'はたち'],
    ['二十一歳', 'にじゅういっさい'],
  ])
    assert.ok(
      rows('ages')
        .flat()
        .some((c) => c.text === jp && c.reading === kana),
    );
  const relative = JSON.stringify(rows('relative-time'));
  for (const word of [
    '一昨日',
    'おととい',
    '昨日',
    '今日',
    '明日',
    '明後日',
    'あさって',
    '先週',
    '来月',
    '今年',
  ])
    assert.ok(relative.includes(word));
  assert.ok(get('ask-name').examples.some((e) => e.japanese === 'お名前は何ですか。'));
  assert.ok(get('ask-time').examples.some((e) => e.japanese === '今何時ですか。'));
});
test('number and katakana additions cover the requested boundaries and spellings', () => {
  const anchors = get('large-numbers').references!.find((table) =>
    table.rows.some((row) => row.some((cell) => cell.text === '百万')),
  )!;
  assert.ok(anchors);
  const values = new Set(anchors.rows.map((row) => Number(row[0].text.replaceAll(',', ''))));
  for (const value of [10, 100, 1000, 10000, 100000, 1000000])
    assert.ok(values.has(value), String(value));
  assert.ok(
    anchors.rows.some((row) =>
      row.some((cell) => cell.reading === 'ひゃくまん' || cell.text === 'ひゃくまん'),
    ),
  );

  assert.ok(
    entries.some(
      (e) => e.kind === 'numbers' && e.japanese === '百万' && e.reading === 'ひゃくまん',
    ),
  );
  for (const kana of [
    'ヴァ',
    'ヴィ',
    'ヴ',
    'ヴェ',
    'ヴォ',
    'ヴュ',
    'ワ',
    'ウィ',
    'ウ',
    'ウェ',
    'ウォ',
    'ファ',
    'フィ',
    'フ',
    'フェ',
    'フォ',
    'フュ',
    'チャ',
    'チュ',
    'チェ',
    'チョ',
    'シャ',
    'シュ',
    'シェ',
    'ショ',
    'ジャ',
    'ジュ',
    'ジェ',
    'ジョ',
    'ティ',
    'トゥ',
    'テュ',
    'ディ',
    'ドゥ',
    'デュ',
  ])
    assert.ok(
      entries.some((e) => e.kind === 'kana' && e.japanese === kana),
      kana,
    );
  assert.match(get('katakana-sounds').note, /not a separate modern/);
});
test('every new guide has varied, readable, color-aligned examples and five valid practice stages', () => {
  const guides = entries.filter((e) => e.references && !e.lesson);
  assert.equal(guides.length, 33);
  for (const e of guides) {
    assert.equal(e.examples.length, 4, e.id);
    assert.equal(new Set(e.examples.map((x) => x.japanese)).size, 4, e.id);
    for (const ex of e.examples) {
      assert.equal(ex.tokens!.map((t) => t.text).join('') + '。', ex.japanese, e.id);
      assert.equal(ex.tokens!.map((t) => t.reading).join('') + '。', ex.reading, e.id);
      assert.equal(ex.translationTokens!.map((t) => t.text).join(''), ex.meaning, e.id);
      const roles = new Set(ex.tokens!.map((t) => t.role));
      for (const t of ex.translationTokens!)
        assert.ok(t.implicit || roles.has(t.role), e.id + ': ' + t.text);
    }
    for (const ref of e.references!)
      for (const row of ref.rows) {
        assert.equal(row.length, ref.columns.length);
        for (const cell of row) assert.ok(!/[一-龯々]/.test(cell.text) || cell.reading, cell.text);
      }
    assert.deepEqual(skillsFor(e, false), ['grammar']);
    assert.equal(isReadingQuestion(e, 'grammar'), false);
    const queue = makePractice(entries, [], { entryId: e.id, mode: 'guided' });
    assert.equal(queue.length, 5, e.id);
    assert.deepEqual(
      queue.map((q) => e.exercises!.find((x) => x.id === q.exerciseId)!.type),
      ['meaning-choice', 'pattern-choice', 'gap', 'tiles', 'typing'],
    );
    for (const x of e.exercises!) {
      for (const answer of x.answers)
        assert.ok(grade(e, 'grammar', answer, undefined, x.id), e.id + '/' + x.id);
      if (x.choices)
        assert.equal(
          x.choices.filter((c) => grade(e, 'grammar', c.text, undefined, x.id)).length,
          1,
          e.id + '/' + x.id,
        );
    }
  }
  const typing = (id: string) => get(id).exercises!.find((e) => e.id === 'typing')!;
  assert.match(typing('large-numbers').feedback.text, /百万/);
  assert.match(typing('durations').feedback.text, /二か月/);
  assert.match(typing('months').feedback.text, /七月/);
  assert.match(typing('weekdays').feedback.text, /土曜日/);
});

test('family honorifics keep whole-word readings in explanation text', () => {
  const parts = proseReadings('お母さん、お父さん、お兄さん、お姉さん');
  for (const [text, reading] of [
    ['お母さん', 'おかあさん'],
    ['お父さん', 'おとうさん'],
    ['お兄さん', 'おにいさん'],
    ['お姉さん', 'おねえさん'],
  ])
    assert.ok(
      parts.some((p) => p.text === text && p.reading === reading),
      text,
    );
  assert.ok(!parts.some((p) => p.text === '母' && p.reading === 'はは'));
});

test('tense practice tests close vocabulary and ending contrasts with specific feedback', () => {
  for (const id of ['study-present-tense', 'study-past-tense']) {
    const entry = entries.find((e) => e.id === id)!;
    const practice = entry.exercises!;
    assert.equal(practice[0].choices!.length, 4);
    assert.equal(practice[1].choices!.length, 4);
    assert.equal(new Set(practice.map((e) => e.explanation)).size, practice.length);
    for (const exercise of practice) assert.notEqual(exercise.explanation, entry.note);
  }
  const present = entries.find((e) => e.id === 'study-present-tense')!;
  assert.deepEqual(
    present.exercises![0].choices!.map((c) => c.text),
    ['I am a student.', 'I am a teacher.', 'I am an employee.', 'I was a student.'],
  );
});
