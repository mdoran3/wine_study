import { useState } from 'react';
import styles from './MissedReview.module.css';

const text = v => (Array.isArray(v) ? v.join(', ') : String(v ?? ''));
const sameSet = (a, b) => a.length === b.length && a.every(x => b.includes(x));
const sameOrder = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/**
 * The "Review these" section at the end of a test. One card per missed question:
 * what you answered, the correct answer hidden behind a "Reveal Answer" button, and a button to
 * retry just that question.
 *
 * item: {
 *   title?   bold name above the question (a dish, wine, sherry...)
 *   prompt   the question
 *   detail?  extra text shown as a quote under the prompt (e.g. a dish description)
 *   kind     'choice' | 'multi' | 'text' | 'sort'
 *   options? choices for 'choice' and 'multi'
 *   correct  string, or string[] for 'multi' / 'sort'
 *   answer   what the user answered (string, or string[])
 *   check?   (answer) => boolean, required for 'text' (fuzzy matching lives in the test)
 *   hint?    placeholder for 'text'
 *   initial? starting order for 'sort'
 * }
 */
export default function MissedReview({ items }) {
  return (
    <div className={styles.missed}>
      <h3 className={styles.heading}>Review these</h3>
      {items.map((item, i) => <MissedCard key={i} item={item} />)}
    </div>
  );
}

function MissedCard({ item }) {
  const { kind } = item;
  const startValue = () => (kind === 'multi' ? [] : kind === 'sort' ? [...item.initial] : '');
  const [retrying, setRetrying] = useState(false);
  const [value, setValue] = useState(startValue);
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const correct = (() => {
    if (kind === 'text') return item.check(value);
    if (kind === 'multi') return sameSet(value, item.correct);
    if (kind === 'sort') return sameOrder(value, item.correct);
    return value === item.correct;
  })();
  const ready = kind === 'multi' ? value.length > 0 : kind === 'text' ? value.trim() !== '' : kind === 'sort' ? true : !!value;
  const showAnswer = revealed || checked;
  const shownCorrect = kind === 'sort' ? item.correct.join(' → ') : text(item.correct);

  const begin = () => { setValue(startValue()); setChecked(false); setRetrying(true); };
  const toggle = opt => setValue(v => (v.includes(opt) ? v.filter(x => x !== opt) : [...v, opt]));
  const move = (i, d) => setValue(v => { const a = [...v]; [a[i], a[i + d]] = [a[i + d], a[i]]; return a; });

  return (
    <div className={styles.card}>
      {item.title && <p className={styles.title}>{item.title}</p>}
      <p className={styles.prompt}>{item.prompt}</p>
      {item.detail && <p className={styles.detail}>{item.detail}</p>}

      <p className={styles.line}>
        <span className={styles.label}>You selected:</span>{' '}
        <span className={styles.wrong}>{kind === 'sort' ? item.answer.join(' → ') : text(item.answer) || '(no answer)'}</span>
      </p>
      <div className={styles.line}>
        <span className={styles.label}>Correct answer:</span>{' '}
        <span className={styles.answerWrap}>
          <span className={showAnswer ? styles.right : `${styles.right} ${styles.blurred}`} aria-hidden={!showAnswer}>
            {shownCorrect}
          </span>
          {!showAnswer && (
            <button type="button" className={styles.reveal} onClick={() => setRevealed(true)}>
              Reveal Answer
            </button>
          )}
        </span>
      </div>

      {!retrying && (
        <button type="button" className={styles.retryBtn} onClick={begin}>↻ Retry this question</button>
      )}

      {retrying && (
        <div className={styles.retryBox}>
          {kind === 'choice' && (
            <div className={styles.options}>
              {item.options.map(opt => {
                let cls = styles.opt;
                if (checked) cls += opt === item.correct ? ` ${styles.optRight}` : opt === value ? ` ${styles.optWrong}` : ` ${styles.optDim}`;
                else if (opt === value) cls += ` ${styles.optPicked}`;
                return <button key={opt} type="button" className={cls} disabled={checked} onClick={() => setValue(opt)}>{opt}</button>;
              })}
            </div>
          )}

          {kind === 'multi' && (
            <>
              {!checked && <p className={styles.hint}>Select all {item.correct.length} that apply ({value.length} selected)</p>}
              <div className={styles.grid}>
                {item.options.map(opt => {
                  const on = value.includes(opt), right = item.correct.includes(opt);
                  let cls = styles.opt;
                  if (checked) cls += on && right ? ` ${styles.optRight}` : on ? ` ${styles.optWrong}` : right ? ` ${styles.optMissed}` : ` ${styles.optDim}`;
                  else if (on) cls += ` ${styles.optPicked}`;
                  return <button key={opt} type="button" className={cls} disabled={checked} onClick={() => toggle(opt)}>{opt}</button>;
                })}
              </div>
            </>
          )}

          {kind === 'text' && (
            <input
              className={`${styles.input} ${checked ? (correct ? styles.inputRight : styles.inputWrong) : ''}`}
              type="text"
              value={value}
              placeholder={item.hint || 'Type your answer…'}
              disabled={checked}
              onChange={e => setValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && ready && !checked) setChecked(true); }}
            />
          )}

          {kind === 'sort' && (
            <ol className={styles.sortList}>
              {value.map((v, i) => (
                <li key={v} className={styles.sortRow}>
                  <span className={styles.sortName}>{i + 1}. {v}</span>
                  {!checked && (
                    <span className={styles.sortBtns}>
                      <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move ${v} up`}>↑</button>
                      <button type="button" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label={`Move ${v} down`}>↓</button>
                    </span>
                  )}
                </li>
              ))}
            </ol>
          )}

          {!checked && (
            <button type="button" className={styles.confirm} disabled={!ready} onClick={() => setChecked(true)}>
              Confirm Answer
            </button>
          )}
          {checked && (
            <>
              <p className={correct ? styles.ok : styles.no}>{correct ? '✓ Got it!' : '✗ Not quite. The correct answer is shown above.'}</p>
              {!correct && <button type="button" className={styles.retryBtn} onClick={begin}>↻ Try again</button>}
            </>
          )}
        </div>
      )}
    </div>
  );
}
