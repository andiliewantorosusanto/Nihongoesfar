import { useState } from 'react';
import type { Entry } from '../lib/content';
import { familyTreeWord, familySiblingPositions, type FamilyWordMode } from '../lib/family-tree';

export default function FamilyTree({
  entry,
  onPractice,
  busy = false,
  romaji = true,
}: {
  romaji?: boolean;
  entry: Entry;
  onPractice?: () => void;
  busy?: boolean;
}) {
  const [mode, setMode] = useState<FamilyWordMode | 'address'>('own');
  function word(relationship: string) {
    const term = familyTreeWord(entry, relationship, mode === 'address' ? 'other' : mode);
    if (!term) return null;
    return (
      <div className="family-word">
        <strong lang="ja">{term.text}</strong>
        <span lang="ja" className="family-kana">
          {term.reading}
        </span>
        {romaji && term.romaji && <span className="family-romaji">{term.romaji}</span>}
      </div>
    );
  }
  function card(relationship: string, label = relationship) {
    return (
      <div className="family-node">
        <span className="family-relationship">{label}</span>
        {word(relationship)}
      </div>
    );
  }
  return (
    <section className="family-tree" aria-label="Japanese family tree">
      <div className="family-tree-heading">
        <div className="number-view-switch family-mode" role="group" aria-label="Whose family?">
          <button
            className={mode === 'own' ? 'selected' : ''}
            aria-pressed={mode === 'own'}
            onClick={() => setMode('own')}
          >
            About my family
          </button>
          <button
            className={mode === 'other' ? 'selected' : ''}
            aria-pressed={mode === 'other'}
            onClick={() => setMode('other')}
          >
            About someone else’s family
          </button>
          <button
            className={mode === 'address' ? 'selected' : ''}
            aria-pressed={mode === 'address'}
            onClick={() => setMode('address')}
          >
            Addressing family
          </button>
        </div>
        {onPractice && (
          <button className="primary" disabled={busy} onClick={onPractice}>
            Practice →
          </button>
        )}
      </div>
      {mode === 'own' && <p className="family-context">Talking about my family to others.</p>}
      {mode === 'address' ? (
        <section className="family-addressing">
          <p>Common ways to call family members directly. Names and nicknames vary by family.</p>
          <div className="entry-grid">
            {[
              'father',
              'mother',
              'grandfather',
              'grandmother',
              'older brother',
              'older sister',
            ].map((relationship) => (
              <div key={relationship}>{card(relationship)}</div>
            ))}
            {['younger brother', 'younger sister', 'husband', 'wife', 'son', 'daughter'].map(
              (relationship) => (
                <div className="family-node" key={relationship}>
                  <span className="family-relationship">{relationship}</span>
                  <strong>Usually their name or nickname</strong>
                </div>
              ),
            )}
          </div>
        </section>
      ) : (
        <>
          <p className="family-scroll-help">Swipe sideways to see the whole tree.</p>
          <div
            className="family-tree-scroll"
            tabIndex={0}
            role="region"
            aria-label="Family relationship diagram"
          >
            <div className="family-tree-canvas">
              <div className="family-ancestors">
                {['Father’s parents', 'Mother’s parents'].map((side) => (
                  <div className="family-side" key={side}>
                    <h4>{side}</h4>
                    <div className="family-pair">
                      {card('grandfather')}
                      {card('grandmother')}
                    </div>
                    <div className="family-stem" aria-hidden="true" />
                    {card(side === 'Father’s parents' ? 'father' : 'mother')}
                  </div>
                ))}
              </div>
              <div className="family-parent-union" aria-hidden="true" />
              <div className="family-siblings">
                {familySiblingPositions.map((relationship) =>
                  relationship === 'you' ? (
                    <div className="family-child-branch family-you-branch" key={relationship}>
                      <div className="family-node family-you">
                        <span className="family-relationship">
                          {mode === 'own' ? 'You' : 'Reference person'}
                        </span>
                        <strong lang="ja">{mode === 'own' ? '私' : 'その人'}</strong>
                        <span className="family-kana" lang="ja">
                          {mode === 'own' ? 'わたし' : 'そのひと'}
                        </span>
                        {romaji && (
                          <span className="family-romaji">
                            {mode === 'own' ? 'watashi' : 'sono hito'}
                          </span>
                        )}
                        <small>Older / younger is relative to this person.</small>
                      </div>
                    </div>
                  ) : relationship === 'spouse' ? (
                    <div className="family-spouse-branch" key={relationship}>
                      <div className="family-node family-spouse">
                        <span className="family-relationship">Spouse · husband / wife</span>
                        {word('husband')}
                        <span className="family-or">or</span>
                        {word('wife')}
                      </div>
                    </div>
                  ) : (
                    <div className="family-child-branch" key={relationship}>
                      {card(relationship)}
                    </div>
                  ),
                )}
              </div>
              <div className="family-couple-union" aria-hidden="true" />
              <div className="family-stem" aria-hidden="true" />
              <div className="family-children">
                <div className="family-child-branch">{card('son')}</div>
                <div className="family-child-branch">{card('daughter')}</div>
              </div>
            </div>
          </div>
          <div className="family-collective">
            <h4>Words for the group</h4>
            <div>
              {card('parents')}
              {card('family')}
            </div>
          </div>
          <p className="family-pronunciation-note">
            Keep the long vowels when you say: <b>otousan</b>, <b>okaasan</b>, <b>oniisan</b>,{' '}
            <b>oneesan</b>. <b>Ojiisan</b> (grandfather) is different from <b>ojisan</b> (uncle);{' '}
            <b>obaasan</b> (grandmother) is different from <b>obasan</b> (aunt).
          </p>
          <p className="family-pronunciation-note">
            These are reference words, not all direct ways to call someone. お父さん / お母さん /
            お兄さん / お姉さん are also common when addressing your own relatives. The diagram is
            an example relationship map.
          </p>
        </>
      )}
    </section>
  );
}
