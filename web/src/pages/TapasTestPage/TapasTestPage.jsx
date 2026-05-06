import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import menu from '../../data/menu.json';
import styles from './TapasTestPage.module.css';

const QUESTION_TEXT = {
  sauce:                  'Which sauce is served with this dish?',
  ingredient:             'Which of these is an ingredient in this dish?',
  multiselect_ingredients: 'Select all ingredients that are in this dish.',
};

const STATES = { idle: 'idle', active: 'active', confirmed: 'confirmed', done: 'done' };

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function shortSauceName(s) {
  return s.split('(')[0].trim();
}

function initPending(q) {
  return q.type === 'multiselect_ingredients' ? [] : null;
}

function checkAnswer(q, pending) {
  if (q.type === 'multiselect_ingredients') {
    const sel = pending || [];
    return sel.length === q.correct.length && q.correct.every(c => sel.includes(c));
  }
  return pending === q.correct;
}

const FILTER_TYPES = {
  cold_tapas:   ['cold_tapas'],
  soup_salad:   ['soup', 'salad'],
  hot_tapas:    ['hot_tapas'],
  dessert:      ['dessert'],
  lunch_entree: ['lunch_entree'],
};

const FILTER_LABELS = {
  cold_tapas:   'Cold Tapas',
  soup_salad:   'Soup & Salad',
  hot_tapas:    'Hot Tapas',
  dessert:      'Desserts',
  lunch_entree: 'Lunch Entrees',
};

function generateQuiz(filter) {
  const total      = filter ? 20 : 30;
  const descCount  = Math.round(total * 0.1);
  const multiCount = 5;
  const mainCount  = total - descCount - multiCount;

  const pool = filter && FILTER_TYPES[filter]
    ? menu.filter(i => FILTER_TYPES[filter].includes(i.type))
    : menu;

  const allIngredients = [...new Set(menu.flatMap(i => i.ingredients))];
  const itemsWithSauces = pool.filter(i => i.sauces.length > 0);
  const allShortSauces = [...new Set(menu.filter(i => i.sauces.length > 0).flatMap(i => i.sauces.map(shortSauceName)))];
  const allNames = pool.map(i => i.name);

  // ── Single-select: sauce ──────────────────────────────────────
  const sauceQs = [];
  for (const item of shuffle([...itemsWithSauces])) {
    const correct = shortSauceName(shuffle([...item.sauces])[0]);
    const wrongs = shuffle(allShortSauces.filter(s => !item.sauces.map(shortSauceName).includes(s))).slice(0, 3);
    if (wrongs.length < 3) continue;
    sauceQs.push({
      type: 'sauce',
      dish: item.name,
      correct,
      options: shuffle([correct, ...wrongs]),
      missedLabel: item.name,
      missedAnswer: correct,
    });
  }

  // ── Single-select: ingredient ─────────────────────────────────
  const ingQs = [];
  for (const item of shuffle([...pool])) {
    if (item.ingredients.length === 0) continue;
    const correct = shuffle([...item.ingredients])[0];
    const wrongs = shuffle(allIngredients.filter(i => !item.ingredients.includes(i))).slice(0, 3);
    if (wrongs.length < 3) continue;
    ingQs.push({
      type: 'ingredient',
      dish: item.name,
      correct,
      options: shuffle([correct, ...wrongs]),
      missedLabel: item.name,
      missedAnswer: item.name,
    });
  }

  // ── Multi-select: select all ingredients ─────────────────────
  const multiQs = [];
  for (const item of shuffle([...pool])) {
    if (item.ingredients.length < 2) continue;
    const correct = shuffle([...item.ingredients]).slice(0, Math.min(4, item.ingredients.length));
    const distractors = shuffle(allIngredients.filter(i => !item.ingredients.includes(i))).slice(0, 4);
    if (distractors.length < 2) continue;
    multiQs.push({
      type: 'multiselect_ingredients',
      dish: item.name,
      correct,
      options: shuffle([...correct, ...distractors]),
      missedLabel: item.name,
      missedAnswer: correct.join(', '),
    });
  }

  // ── Description: name the dish ────────────────────────────────
  const descQs = [];
  for (const item of shuffle([...pool])) {
    const wrongs = shuffle(allNames.filter(n => n !== item.name)).slice(0, 3);
    if (wrongs.length < 3) continue;
    descQs.push({
      type: 'description',
      description: item.description,
      correct: item.name,
      options: shuffle([item.name, ...wrongs]),
      missedLabel: item.name,
      missedAnswer: item.name,
    });
  }

  const main  = shuffle([...sauceQs, ...ingQs]).slice(0, mainCount);
  const multi = shuffle(multiQs).slice(0, multiCount);
  const desc  = shuffle(descQs).slice(0, descCount);
  const base  = shuffle([...main, ...desc]);
  const step  = Math.floor(base.length / (multi.length + 1));
  const result = [...base];
  multi.forEach((q, i) => result.splice(step * (i + 1) + i, 0, q));
  return result;
}

export default function TapasTestPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState(null);
  const filterLabel = filter ? FILTER_LABELS[filter] : 'All Items';

  useEffect(() => { document.title = 'Meson Sabika - Tapas Menu Test'; }, []);

  const [status,     setStatus]     = useState(STATES.idle);
  const [questions,  setQuestions]  = useState([]);
  const [index,      setIndex]      = useState(0);
  const [pending,    setPending]    = useState(null);
  const [selected,   setSelected]   = useState(null);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [score,      setScore]      = useState(0);
  const [missed,     setMissed]     = useState([]);

  const start = useCallback(() => {
    const qs = generateQuiz(filter);
    setQuestions(qs);
    setIndex(0);
    setScore(0);
    setMissed([]);
    setSelected(null);
    setWasCorrect(false);
    setPending(initPending(qs[0]));
    setStatus(STATES.active);
  }, [filter]);

  const confirm = () => {
    const q = questions[index];
    const correct = checkAnswer(q, pending);
    setSelected(pending);
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

  const toggleIngredient = (opt) => {
    if (status !== STATES.active) return;
    setPending(prev => {
      const arr = prev || [];
      return arr.includes(opt) ? arr.filter(x => x !== opt) : [...arr, opt];
    });
  };

  const isConfirmDisabled = (() => {
    if (status === STATES.confirmed) return true;
    const q = questions[index];
    if (!q) return true;
    if (q.type === 'multiselect_ingredients') return (pending?.length ?? 0) === 0;
    return !pending;
  })();

  // ── Idle ──────────────────────────────────────────────────────
  if (status === STATES.idle) {
    return (
      <div className={styles.center}>
        <h2 className={styles.heading}>Menu Test</h2>
        <p className={styles.filterPrompt}>Choose a section to test:</p>
        <div className={styles.filterGrid}>
          {[{ key: null, label: 'All Items' }, ...Object.entries(FILTER_LABELS).map(([key, label]) => ({ key, label }))].map(({ key, label }) => (
            <button
              key={key ?? 'all'}
              className={`${styles.filterChoice} ${filter === key ? styles.filterChoiceActive : ''}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={styles.instructions}>
          <p>{filter ? '20' : '30'} randomly generated questions per test</p>
          <p>Covers sauces, ingredients, and matching descriptions to dishes</p>
          <p>Once you confirm an answer, you cannot go back and change it</p>
        </div>
        <button className={styles.startBtn} onClick={start}>Start Test</button>
      </div>
    );
  }

  // ── Results ───────────────────────────────────────────────────
  if (status === STATES.done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className={styles.page}>
        <div className={styles.resultsCard}>
          <button className={styles.exitBtn} onClick={() => navigate('/')}>✕ Exit Test</button>
          <h2 className={styles.heading}>Results — {filterLabel}</h2>
          <p className={styles.scoreDisplay}>
            {score} / {questions.length}
            <span className={styles.pct}>{pct}%</span>
          </p>
          {missed.length > 0 && (
            <div className={styles.missed}>
              <h3 className={styles.missedHeading}>Review these:</h3>
              {missed.map((q, i) => (
                <div key={i} className={styles.missedRow}>
                  <span className={styles.missedName}>{q.missedLabel}</span>
                  <span className={styles.missedAnswer}>{q.missedAnswer}</span>
                </div>
              ))}
            </div>
          )}
          <button className={styles.startBtn} onClick={start}>Try Again</button>
        </div>
      </div>
    );
  }

  // ── Active question ───────────────────────────────────────────
  const q = questions[index];
  const isConfirmed = status === STATES.confirmed;

  return (
    <div className={styles.page}>
      <div className={styles.quizCard}>
        <button className={styles.exitBtn} onClick={() => navigate('/')}>✕ Exit Test</button>

        <div className={styles.progress}>
          <div
            className={styles.progressBar}
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>
        <p className={styles.progressLabel}>Question {index + 1} of {questions.length}</p>

        {/* ── Description question ── */}
        {q.type === 'description' && (
          <>
            <p className={styles.question}>
              Which dish is being described?
              {isConfirmed && (
                <span className={wasCorrect ? styles.iconCorrect : styles.iconWrong}>
                  {wasCorrect ? ' ✓' : ' ✗'}
                </span>
              )}
            </p>
            <p className={styles.descriptionText}>{q.description}</p>
          </>
        )}

        {/* ── Single-select questions (sauce / ingredient) ── */}
        {(q.type === 'sauce' || q.type === 'ingredient') && (
          <>
            <h2 className={styles.dishName}>
              {q.dish}
              {isConfirmed && (
                <span className={wasCorrect ? styles.iconCorrect : styles.iconWrong}>
                  {wasCorrect ? ' ✓' : ' ✗'}
                </span>
              )}
            </h2>
            <p className={styles.question}>{QUESTION_TEXT[q.type]}</p>
          </>
        )}

        {/* ── Multi-select: all ingredients ── */}
        {q.type === 'multiselect_ingredients' && (
          <>
            <h2 className={styles.dishName}>
              {q.dish}
              {isConfirmed && (
                <span className={wasCorrect ? styles.iconCorrect : styles.iconWrong}>
                  {wasCorrect ? ' ✓' : ' ✗'}
                </span>
              )}
            </h2>
            <p className={styles.question}>{QUESTION_TEXT[q.type]}</p>
            {!isConfirmed && (
              <p className={styles.selectHint}>{pending?.length ?? 0} selected</p>
            )}
            {isConfirmed && (
              <p className={styles.selectHint}>
                {wasCorrect ? '✓ All correct' : '✗ Missed some — correct ingredients highlighted'}
              </p>
            )}
          </>
        )}

        {/* ── Options (single-select) ── */}
        {(q.type === 'sauce' || q.type === 'ingredient' || q.type === 'description') && (
          <div className={styles.options}>
            {q.options.map(opt => {
              let cls = styles.optionBtn;
              if (isConfirmed) {
                if (opt === q.correct)     cls = `${styles.optionBtn} ${styles.correct}`;
                else if (opt === selected) cls = `${styles.optionBtn} ${styles.wrong}`;
                else                       cls = `${styles.optionBtn} ${styles.dimmed}`;
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
        )}

        {/* ── Options (multi-select) ── */}
        {q.type === 'multiselect_ingredients' && (
          <div className={styles.multiGrid}>
            {q.options.map(opt => {
              const isSelected = (pending || []).includes(opt);
              const isCorrect  = q.correct.includes(opt);
              let cls = styles.multiBtn;
              if (isConfirmed) {
                if (isSelected && isCorrect)   cls = `${styles.multiBtn} ${styles.multiCorrect}`;
                else if (isSelected && !isCorrect) cls = `${styles.multiBtn} ${styles.multiWrong}`;
                else if (!isSelected && isCorrect) cls = `${styles.multiBtn} ${styles.multiMissed}`;
                else                               cls = `${styles.multiBtn} ${styles.multiDimmed}`;
              } else if (isSelected) {
                cls = `${styles.multiBtn} ${styles.multiSelected}`;
              }
              return (
                <button key={opt} className={cls}
                  onClick={() => toggleIngredient(opt)}
                  disabled={isConfirmed}>
                  {opt}
                </button>
              );
            })}
          </div>
        )}

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
