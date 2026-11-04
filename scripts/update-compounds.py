#!/usr/bin/env python3
"""Refresh the offline JMdict compound selection. Python standard library only."""
import argparse
import datetime
import gzip
import hashlib
import json
from pathlib import Path
import re
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
URL = 'https://www.edrdg.org/pub/Nihongo/JMdict_e.gz'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', type=Path, help='Use an already downloaded JMdict_e.gz')
args = parser.parse_args()
source = args.source or ROOT / 'work/compounds/JMdict_e.gz'
if not args.source:
    source.parent.mkdir(parents=True, exist_ok=True)
    urllib.request.urlretrieve(URL, source)
content = (ROOT / 'app/lib/content/content.ts').read_text()
kanji_section = content.split('const kanjiRows = rows(`', 1)[1].split('`);', 1)[0]
characters = {line.split('|')[0] for line in kanji_section.splitlines() if line}
# Prefer words already introduced in the notebook, then general-use dictionary words.
introduced = set(re.findall(r'(?:^|\|)([一-龯々ヶ]{2,8})(?:\||$)', content, re.M))
# These everyday fire words make a useful range of native and Sino-Japanese readings.
fire_basics = ['火曜日', '火山', '火事', '花火', '火災', '消火', '火傷', '火力', '火口', '防火', '出火', '引火', '点火', '発火', '火花']
by_kanji = {c: {} for c in characters}


# Keep lexical words and a few useful irregular readings; charts teach routine counting.
def useful_compound(word, reading):
    exceptions = {('一人','ひとり'),('二人','ふたり'),('一日','ついたち'),('二十日','はつか'),('十分','じゅうぶん'),('一時','ひととき')}
    if (word, reading) in exceptions:
        return True
    numeric = re.match(r'[〇零一二三四五六七八九十百千万億兆]+', word)
    if not numeric:
        return True
    counters = {'', '日', '月', '年', '時', '分', '秒', '時間', '週間', '年間', '人', '本', '枚', '匹', '個', '円', '歳', '才', '回', '台', '階', '番', '号'}
    return word[numeric.end():] not in counters


def frequency(priorities):
    ranks = [int(p[2:]) for p in priorities if re.fullmatch(r'nf\d+', p)]
    rank = min(ranks, default=49)
    familiar = 300
    if 'ichi1' in priorities:
        familiar = 0
    elif 'spec1' in priorities:
        familiar = 100
    return rank * 20 + familiar


with gzip.open(source, 'rb') as stream:
    for _, entry in ET.iterparse(stream, events=('end',)):
        if entry.tag != 'entry':
            continue
        spellings = entry.findall('k_ele')
        for spelling in spellings:
            word = spelling.findtext('keb', '')
            targets = characters.intersection(word)
            if not targets or not re.fullmatch('[一-龯々ヶ]{2,8}', word) or len(re.findall('[一-龯]', word)) < 2:
                continue
            # Avoid obsolete/irregular written variants; retain the standard spelling.
            if spelling.findall('ke_inf'):
                continue
            readings = [r for r in entry.findall('r_ele') if r.find('re_nokanji') is None and (not r.findall('re_restr') or word in [x.text for x in r.findall('re_restr')]) and all('gikun' in (x.text or '') for x in r.findall('re_inf'))]
            readings.sort(key=lambda r: frequency([x.text for x in r.findall('re_pri')]))
            for reading in readings:
                kana = reading.findtext('reb', '')
                if not useful_compound(word, kana):
                    continue
                if not kana or not re.fullmatch('[ぁ-ゖー・]+', kana):
                    continue
                priorities = [x.text for x in spelling.findall('ke_pri') + reading.findall('re_pri')]
                # A frequency marker makes this a bounded common-word selection.
                if not priorities and (word, kana) != ('火口', 'かこう'):
                    continue
                senses = []
                for sense in entry.findall('sense'):
                    if sense.findall('stagk') and word not in [x.text for x in sense.findall('stagk')]:
                        continue
                    if sense.findall('stagr') and kana not in [x.text for x in sense.findall('stagr')]:
                        continue
                    misc = ' '.join(x.text or '' for x in sense.findall('misc'))
                    if any(s in misc.lower() for s in ['archaic', 'obsolete', 'rare', 'vulgar', 'derogatory']):
                        continue
                    glosses = [g.text for g in sense.findall('gloss') if g.text and g.get('{http://www.w3.org/XML/1998/namespace}lang', 'eng') == 'eng']
                    if glosses:
                        senses.append(glosses)
                if not senses:
                    continue
                meaning = '; '.join(senses[0][:3])
                item = {'japanese': word, 'reading': kana, 'meaning': meaning, 'dictionaryId': entry.findtext('ent_seq')}
                score = frequency(priorities) + sum(c not in characters for c in word) * 1200 + len(word) * 30
                if word in introduced:
                    score -= 10000
                if word in fire_basics:
                    score -= 20000 - fire_basics.index(word) * 20
                if (word, kana) == ('火傷', 'やけど'):
                    score -= 40000
                for c in targets:
                    key = word + ':' + kana
                    old = by_kanji[c].get(key)
                    if old is None or score < old[0]:
                        by_kanji[c][key] = (score, item)
                break
        entry.clear()

selection = {c: [item for _, item in sorted(words.values(), key=lambda x: (x[0], x[1]['japanese']))] for c, words in sorted(by_kanji.items())}
missing = [c for c, words in selection.items() if not words]
if missing:
    raise SystemExit('No compounds found for: ' + ''.join(missing))
bundle = {'attribution': 'JMdict © James William Breen and the Electronic Dictionary Research and Development Group', 'license': 'CC BY-SA 4.0', 'licenseUrl': 'https://www.edrdg.org/edrdg/licence.html', 'source': URL, 'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'updatedAt': datetime.datetime.now(datetime.timezone.utc).date().isoformat(), 'modifications': 'Selected common multi-kanji spellings for the notebook’s 100 kanji; paired reading/spelling and sense restrictions respected; first applicable English sense retained. No per-character count cap, prioritizing introduced words; routine numeric, date, time and counter combinations excluded except selected irregular or lexical readings. Not an exhaustive dictionary or JLPT list.', 'characters': selection}
serialized = json.dumps(bundle, ensure_ascii=False, indent=2) + '\n'
(ROOT / 'public/compound-data.json').write_text(serialized)
# Refresh only compounds in the static library, preserving directly authored lessons.
static_path = ROOT / 'public/kanji.json'
if static_path.exists():
    static_entries = json.loads(static_path.read_text())
    for entry in static_entries:
        if entry['japanese'] in selection:
            words = {item['japanese'] + ':' + item['reading']: item for item in entry.get('compounds', [])}
            words.update({item['japanese'] + ':' + item['reading']: item for item in selection[entry['japanese']]})
            entry['compounds'] = list(words.values())
    static_path.write_text(json.dumps(static_entries, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'characters': len(selection), 'compoundRows': sum(map(len, selection.values())), 'uniqueWords': len({w['japanese'] for words in selection.values() for w in words}), 'minimum': min(map(len, selection.values())), 'fire': selection['火']}, ensure_ascii=False, indent=2))
