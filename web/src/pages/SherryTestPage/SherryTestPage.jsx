import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import sherry from '../../data/sherry.json';
import wines from '../../data/wines.json';
import styles from './SherryTestPage.module.css';

// ── constants ─────────────────────────────────────────────────────────────────

const OPTIONS = {
  pairing:   ['Aperitive', 'Dry meats', 'Hot food', 'Dessert'],
  sweetness: ['Very dry', 'Dry', 'Sweet', 'Very sweet'],
  body:      ['Light', 'Medium', 'Full'],
};

const QUESTION_TEXT = {
  pairing:   'What is the ideal food pairing for this sherry?',
  sweetness: 'What is the sweetness level of this sherry?',
  body:      'What is the body of this sherry?',
};

const FIELD_LABEL = { pairing: 'Pairing', sweetness: 'Sweetness', body: 'Body' };

const SHERRY_REGIONS = ['Jerez de la Frontera', 'Sanlúcar de Barrameda', 'El Puerto de Santa María'];

const SORT_ORDER = ['Fino', 'Manzanilla', 'Amontillado', 'Oloroso', 'East India Sherry', 'Pedro Ximénez'];

const AGING_TF = [
  { sherry: 'Fino',             statement: 'Fino is aged under a protective layer of flor yeast',                    answer: true  },
  { sherry: 'Manzanilla',       statement: 'Manzanilla undergoes oxidative ageing',                                  answer: false },
  { sherry: 'Amontillado',      statement: 'Amontillado begins its life aged under flor before transitioning to oxidative ageing', answer: true },
  { sherry: 'Oloroso',          statement: 'Oloroso is protected from oxygen by flor during ageing',                 answer: false },
  { sherry: 'East India Sherry', statement: 'East India Sherry is always aged under a layer of flor',               answer: false },
  { sherry: 'Pedro Ximénez',    statement: 'Pedro Ximénez grapes are sun-dried before fermentation',                 answer: true  },
];

const STATES = { idle: 'idle', active: 'active', confirmed: 'confirmed', done: 'done' };

// ── helpers ───────────────────────────────────────────────────────────────────

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
  return dp[m][n];
}

function fuzzyMatch(typed, target) {
  const a = typed.trim().toLowerCase();
  const b = target.toLowerCase();
  return levenshtein(a, b) <= Math.max(2, Math.floor(b.length / 4));
}

function checkAnswer(q, answer) {
  switch (q.type) {
    case 'mc':
      return answer === q.correct;
    case 'tf':
      return (answer === 'True') === q.correct;
    case 'fill': {
      if (q.answers.length === 1) return fuzzyMatch(answer, q.answers[0]);
      const typed = answer.split(',').map(s => s.trim()).filter(Boolean);
      return q.answers.every(expected => typed.some(t => fuzzyMatch(t, expected)));
    }
    case 'multiselect': {
      const sel = new Set(answer);
      return q.correct.length === sel.size && q.correct.every(r => sel.has(r));
    }
    case 'sort':
      return JSON.stringify(answer) === JSON.stringify(q.correct);
    default:
      return false;
  }
}

function initPending(q) {
  if (q.type === 'sort') return [...q.initial];
  if (q.type === 'multiselect') return [];
  return null;
}

// ── quiz generation ───────────────────────────────────────────────────────────

function generateQuiz() {
  const allRegions = [...new Set(wines.map(w => w.region))];
  const regionOptions = shuffle([...SHERRY_REGIONS, ...shuffle(allRegions).slice(0, 7)]);

  const tfQuestions = AGING_TF.map(tf => ({
    type: 'tf',
    sherryName: tf.sherry,
    statement: tf.statement,
    correct: tf.answer,
    options: ['True', 'False'],
  }));

  const mcPool = sherry.flatMap(s =>
    ['pairing', 'sweetness', 'body'].map(field => ({
      type: 'mc', sherry: s, field,
      correct: s[field],
      options: shuffle(OPTIONS[field]),
    }))
  );

  const pool12 = shuffle([...mcPool, ...tfQuestions]).slice(0, 12);

  const soilQ = {
    type: 'fill', id: 'soil',
    prompt: 'What is the unique chalky white soil of the Sherry region called?',
    hint: 'One word',
    answers: ['albariza'],
    missedLabel: 'Soil name',
  };
  const grapesQ = {
    type: 'fill', id: 'grapes',
    prompt: 'Name the three grape varieties used to make Sherry.',
    hint: 'Separate with commas — e.g. Grape One, Grape Two, Grape Three',
    answers: ['Palomino', 'Moscatel', 'Pedro Ximénez'],
    missedLabel: 'Sherry grapes',
  };
  const regionsQ = {
    type: 'multiselect', id: 'regions',
    prompt: 'Select the three towns that make up the Sherry Triangle.',
    correct: SHERRY_REGIONS,
    options: regionOptions,
    selectCount: 3,
    missedLabel: 'Sherry Triangle',
  };
  const sortQ = {
    type: 'sort', id: 'lightest-darkest',
    prompt: 'Arrange these sherries from lightest to darkest.',
    correct: SORT_ORDER,
    initial: shuffle([...SORT_ORDER]),
    missedLabel: 'Light → Dark',
  };

  // 16 slots total: soil in [0,4], grapes in [5,10], regions at 14, sort at 15
  const soilPos   = Math.floor(Math.random() * 5);       // 0–4
  const grapesPos = 5 + Math.floor(Math.random() * 6);   // 5–10

  const result = new Array(16);
  result[soilPos]   = soilQ;
  result[grapesPos] = grapesQ;
  result[14]        = regionsQ;
  result[15]        = sortQ;

  let poolIdx = 0;
  for (let i = 0; i < 16; i++) {
    if (!result[i]) result[i] = pool12[poolIdx++];
  }

  return result;
}

// ── component ─────────────────────────────────────────────────────────────────

export default function SherryTestPage() {
  const navigate = useNavigate();
  useEffect(() => { document.title = 'Meson Sabika - Sherry Test'; }, []);

  const [status,    setStatus]    = useState(STATES.idle);
  const [questions, setQuestions] = useState([]);
  const [index,     setIndex]     = useState(0);
  const [pending,   setPending]   = useState(null);
  const [selected,  setSelected]  = useState(null);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [score,     setScore]     = useState(0);
  const [missed,    setMissed]    = useState([]);
  const fillRef = useRef(null);

  const start = useCallback(() => {
    const qs = generateQuiz();
    setQuestions(qs);
    setIndex(0);
    setScore(0);
    setMissed([]);
    setSelected(null);
    setWasCorrect(false);
    setPending(initPending(qs[0]));
    setStatus(STATES.active);
  }, []);

  // auto-focus fill inputs
  useEffect(() => {
    if (status === STATES.active && questions[index]?.type === 'fill') {
      fillRef.current?.focus();
    }
  }, [status, index, questions]);

  const confirm = () => {
    const q = questions[index];
    const answer = pending;
    const correct = checkAnswer(q, answer);
    setSelected(answer);
    setWasCorrect(correct);
    if (correct) setScore(s => s + 1);
    else setMissed(m => [...m, q]);
    setStatus(STATES.confirmed);
  };

  const next = () => {
    const newIdx = index + 1;
    if (newIdx >= questions.length) {
      setStatus(STATES.done);
    } else {
      setIndex(newIdx);
      setPending(initPending(questions[newIdx]));
      setSelected(null);
      setWasCorrect(false);
      setStatus(STATES.active);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (status === STATES.active && pending?.trim()) confirm();
      if (status === STATES.confirmed) next();
    }
  };

  // sort helpers
  const moveUp = (i) => setPending(prev => {
    const a = [...prev]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; return a;
  });
  const moveDown = (i) => setPending(prev => {
    const a = [...prev]; [a[i], a[i + 1]] = [a[i + 1], a[i]]; return a;
  });

  // multiselect helpers
  const toggleRegion = (r) => {
    if (status !== STATES.active) return;
    setPending(prev => {
      const arr = prev || [];
      if (arr.includes(r)) return arr.filter(x => x !== r);
      if (arr.length >= 3) return arr;
      return [...arr, r];
    });
  };

  // ── idle screen ─────────────────────────────────────────────────────────────
  if (status === STATES.idle) {
    return (
      <div className={styles.center}>
        <h2 className={styles.heading}>Sherry Knowledge Test</h2>
        <div className={styles.instructions}>
          <p>16 questions covering everything on the sherry review page</p>
          <p>Each test is randomly generated with a new question order</p>
          <p>Once you confirm an answer, you cannot go back and change it</p>
        </div>
        <button className={styles.startBtn} onClick={start}>Start Test</button>
      </div>
    );
  }

  // ── results screen ───────────────────────────────────────────────────────────
  if (status === STATES.done) {
    const total = questions.length;
    const pct = Math.round((score / total) * 100);
    return (
      <div className={styles.page}>
        <div className={styles.resultsCard}>
          <button className={styles.exitBtn} onClick={() => navigate('/')}>✕ Exit Test</button>
          <h2 className={styles.heading}>Results</h2>
          <p className={styles.scoreDisplay}>
            {score} / {total}
            <span className={styles.pct}>{pct}%</span>
          </p>
          {missed.length > 0 && (
            <div className={styles.missed}>
              <h3 className={styles.missedHeading}>Review these:</h3>
              {missed.map((q, i) => {
                if (q.type === 'mc') return (
                  <div key={i} className={styles.missedRow}>
                    <span className={styles.missedName}>{q.sherry.name}</span>
                    <span className={styles.missedLabel}>{FIELD_LABEL[q.field]}:</span>
                    <span className={styles.missedAnswer}>{q.correct}</span>
                  </div>
                );
                if (q.type === 'tf') return (
                  <div key={i} className={styles.missedRow}>
                    <span className={styles.missedName}>{q.sherryName}:</span>
                    <span className={styles.missedAnswer}>{q.statement} — <strong>{q.correct ? 'True' : 'False'}</strong></span>
                  </div>
                );
                if (q.type === 'fill') return (
                  <div key={i} className={styles.missedRow}>
                    <span className={styles.missedName}>{q.missedLabel}:</span>
                    <span className={styles.missedAnswer}>{q.answers.join(', ')}</span>
                  </div>
                );
                if (q.type === 'multiselect') return (
                  <div key={i} className={styles.missedRow}>
                    <span className={styles.missedName}>{q.missedLabel}:</span>
                    <span className={styles.missedAnswer}>{q.correct.join(', ')}</span>
                  </div>
                );
                if (q.type === 'sort') return (
                  <div key={i} className={styles.missedRow}>
                    <span className={styles.missedName}>{q.missedLabel}:</span>
                    <span className={styles.missedAnswer}>{q.correct.join(' → ')}</span>
                  </div>
                );
                return null;
              })}
            </div>
          )}
          <button className={styles.startBtn} onClick={start}>Try Again</button>
        </div>
      </div>
    );
  }

  // ── active / confirmed question ──────────────────────────────────────────────
  const q = questions[index];
  const isConfirmed = status === STATES.confirmed;

  const isConfirmDisabled = (() => {
    if (isConfirmed) return true;
    switch (q.type) {
      case 'mc':
      case 'tf':          return !pending;
      case 'fill':        return !pending?.trim();
      case 'multiselect': return (pending?.length ?? 0) !== q.selectCount;
      case 'sort':        return false;
      default:            return true;
    }
  })();

  return (
    <div className={styles.page}>
      <div className={styles.quizCard}>
        <button className={styles.exitBtn} onClick={() => navigate('/')}>✕ Exit Test</button>

        <div className={styles.progress}>
          <div className={styles.progressBar}
            style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
        </div>
        <p className={styles.progressLabel}>Question {index + 1} of {questions.length}</p>

        {/* ── MC question ── */}
        {q.type === 'mc' && <>
          <h2 className={styles.sherryName}>
            {q.sherry.name}
            {isConfirmed && (
              <span className={wasCorrect ? styles.iconCorrect : styles.iconWrong}>
                {wasCorrect ? '✓' : '✗'}
              </span>
            )}
          </h2>
          <p className={styles.question}>{QUESTION_TEXT[q.field]}</p>
          <div className={styles.options}>
            {q.options.map(opt => {
              let cls = styles.optionBtn;
              if (isConfirmed) {
                if (opt === q.correct)   cls = `${styles.optionBtn} ${styles.correct}`;
                else if (opt === selected) cls = `${styles.optionBtn} ${styles.wrong}`;
                else                     cls = `${styles.optionBtn} ${styles.dimmed}`;
              } else if (opt === pending) {
                cls = `${styles.optionBtn} ${styles.selectedPending}`;
              }
              return (
                <button key={opt} className={cls}
                  onClick={() => { if (!isConfirmed) setPending(opt); }}
                  disabled={isConfirmed}>
                  {opt}
                </button>
              );
            })}
          </div>
        </>}

        {/* ── True / False question ── */}
        {q.type === 'tf' && <>
          <h2 className={styles.sherryName}>
            {q.sherryName}
            {isConfirmed && (
              <span className={wasCorrect ? styles.iconCorrect : styles.iconWrong}>
                {wasCorrect ? '✓' : '✗'}
              </span>
            )}
          </h2>
          <p className={styles.question}>{q.statement}</p>
          <div className={styles.options}>
            {q.options.map(opt => {
              const correctLabel = q.correct ? 'True' : 'False';
              let cls = styles.optionBtn;
              if (isConfirmed) {
                if (opt === correctLabel)  cls = `${styles.optionBtn} ${styles.correct}`;
                else if (opt === selected) cls = `${styles.optionBtn} ${styles.wrong}`;
                else                      cls = `${styles.optionBtn} ${styles.dimmed}`;
              } else if (opt === pending) {
                cls = `${styles.optionBtn} ${styles.selectedPending}`;
              }
              return (
                <button key={opt} className={cls}
                  onClick={() => { if (!isConfirmed) setPending(opt); }}
                  disabled={isConfirmed}>
                  {opt}
                </button>
              );
            })}
          </div>
        </>}

        {/* ── Fill-in-the-blank question ── */}
        {q.type === 'fill' && <>
          <p className={styles.question}>{q.prompt}</p>
          <div className={styles.fillArea}>
            <input
              ref={fillRef}
              className={`${styles.fillInput} ${isConfirmed ? (wasCorrect ? styles.fillInputCorrect : styles.fillInputWrong) : ''}`}
              type="text"
              value={pending ?? ''}
              onChange={e => { if (!isConfirmed) setPending(e.target.value); }}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer…"
              disabled={isConfirmed}
              autoComplete="off"
              spellCheck={false}
            />
            {!isConfirmed && (
              <p className={styles.fillHint}>{q.hint}</p>
            )}
            {isConfirmed && !wasCorrect && (
              <p className={styles.fillCorrectAnswer}>
                Correct answer: <strong>{q.answers.join(', ')}</strong>
              </p>
            )}
            {isConfirmed && wasCorrect && (
              <p className={styles.fillSpellingHint}>✓ Correct</p>
            )}
          </div>
        </>}

        {/* ── Multi-select regions question ── */}
        {q.type === 'multiselect' && <>
          <p className={styles.question}>{q.prompt}</p>
          <p className={styles.selectHint}>
            {isConfirmed
              ? (wasCorrect ? '✓ All three correct' : '✗ See correct answers below')
              : `${pending?.length ?? 0} / ${q.selectCount} selected`}
          </p>
          <div className={styles.regionGrid}>
            {q.options.map(region => {
              const isSelected = (pending ?? []).includes(region);
              const isCorrectRegion = q.correct.includes(region);
              let cls = styles.regionBtn;
              if (isConfirmed) {
                if (isSelected && isCorrectRegion)  cls = `${styles.regionBtn} ${styles.regionCorrect}`;
                else if (isSelected && !isCorrectRegion) cls = `${styles.regionBtn} ${styles.regionWrong}`;
                else if (!isSelected && isCorrectRegion) cls = `${styles.regionBtn} ${styles.regionMissed}`;
                else cls = `${styles.regionBtn} ${styles.regionDimmed}`;
              } else if (isSelected) {
                cls = `${styles.regionBtn} ${styles.regionSelected}`;
              }
              return (
                <button key={region} className={cls}
                  onClick={() => toggleRegion(region)}
                  disabled={isConfirmed}>
                  {region}
                </button>
              );
            })}
          </div>
        </>}

        {/* ── Sort question ── */}
        {q.type === 'sort' && <>
          <p className={styles.question}>{q.prompt}</p>
          {isConfirmed && (
            <p className={styles.selectHint}>
              {wasCorrect ? '✓ Perfect order!' : '✗ Correct order shown below'}
            </p>
          )}
          <ol className={styles.sortList}>
            {(isConfirmed ? selected : pending ?? []).map((name, i) => {
              const inCorrectPos = isConfirmed && q.correct[i] === name;
              const isWrongPos   = isConfirmed && !inCorrectPos;
              return (
                <li key={name}
                  className={`${styles.sortItem} ${isConfirmed ? (inCorrectPos ? styles.sortCorrect : styles.sortWrong) : ''}`}>
                  <span className={styles.sortPos}>{i + 1}</span>
                  <span className={styles.sortName}>{name}</span>
                  {!isConfirmed && (
                    <span className={styles.sortArrows}>
                      <button className={styles.sortArrowBtn} onClick={() => moveUp(i)}
                        disabled={i === 0} aria-label="Move up">▲</button>
                      <button className={styles.sortArrowBtn} onClick={() => moveDown(i)}
                        disabled={i === (pending?.length ?? 0) - 1} aria-label="Move down">▼</button>
                    </span>
                  )}
                  {isConfirmed && (
                    <span className={inCorrectPos ? styles.iconCorrect : styles.iconWrong}>
                      {inCorrectPos ? '✓' : '✗'}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
          {isConfirmed && !wasCorrect && (
            <div className={styles.correctOrder}>
              <p className={styles.correctOrderLabel}>Correct order:</p>
              {q.correct.map((name, i) => (
                <span key={name} className={styles.correctOrderItem}>
                  {i + 1}. {name}
                </span>
              ))}
            </div>
          )}
        </>}

        {!isConfirmed && (
          <button className={styles.confirmBtn} onClick={confirm} disabled={isConfirmDisabled}>
            Confirm Answer
          </button>
        )}
        {isConfirmed && (
          <button className={styles.nextBtn} onClick={next}>
            {index + 1 >= questions.length ? 'See Results' : 'Next Question'}
          </button>
        )}
      </div>
    </div>
  );
}
