import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import menu from '../../data/menu.json';
import styles from './TapasTestPage.module.css';

const QUESTION_TEXT = {
  sauce:                  'Which sauce is served with this dish?',
  ingredient:             'Which of these is a main ingredient in this dish?',
  multiselect_ingredients: 'Select the main ingredients that are in this dish.',
};

const MULTI_TYPES = new Set(['multiselect_ingredients', 'multiselect_sauces']);
const isMulti = t => MULTI_TYPES.has(t);

const STATES = { idle: 'idle', active: 'active', confirmed: 'confirmed', done: 'done' };

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Two spellings of the same thing ("tomato" / "tomatoes", "red onion" / "red onions") must never
// show up as the right answer and a wrong option in the same question.
const DROP_WORDS = new Set(['fresh', 'diced', 'minced', 'chopped', 'julienne', 'julienned', 'grilled', 'roasted', 'sliced', 'mixed']);
function norm(s) {
  return s
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .split(/[^a-z]+/)
    .filter(w => w && !DROP_WORDS.has(w))
    .map(w => (/(ch|sh|x|o)es$/.test(w) ? w.slice(0, -2) : /[^su]s$/.test(w) ? w.slice(0, -1) : w))
    .join(' ');
}

// Quiz answers use core_ingredients (the food itself). The full ingredient list, with seasonings,
// herbs, oils and garnishes, stays on the review page. See scripts/classify_ingredients.py.
const coreOf = item => (item.core_ingredients?.length ? item.core_ingredients : item.ingredients);

// Pick up to n wrong options: not in the dish (any spelling, and not in any same-named variant of it,
// e.g. the two Salmon A La Plancha entries), and no two alike.
function pickWrongs(pool, item, n) {
  const taken = new Set(menu.filter(m => m.name === item.name).flatMap(m => m.ingredients).map(norm));
  const out = [];
  for (const cand of shuffle(pool)) {
    const k = norm(cand);
    if (taken.has(k)) continue;
    taken.add(k);
    out.push(cand);
    if (out.length === n) break;
  }
  return out;
}

const TYPE_LABELS = {
  cold_tapas: 'Cold Tapa', hot_tapas: 'Hot Tapa', soup: 'Soup', salad: 'Salad',
  paella: 'Paella', dessert: 'Dessert', lunch_entree: 'Lunch Entrée',
};
// Dishes that exist both as a lunch entrée and as something else (e.g. Salmon A La Plancha, which is
// a hot tapa and a lunch entrée with different sides).
const lunchNames = new Set(menu.filter(i => i.type === 'lunch_entree').map(i => i.name));

// How a dish is named in a question. A lunch entrée always says so; a dish that also exists as a
// lunch entrée says which one it is, so the question is never ambiguous.
function dishLabel(item) {
  if (item.type === 'lunch_entree') return `${item.name} (Lunch Entrée)`;
  if (lunchNames.has(item.name)) return `${item.name} (${TYPE_LABELS[item.type] ?? 'menu item'}, not the lunch entrée)`;
  return item.name;
}

function shortSauceName(s) {
  return s.split('(')[0].trim();
}

function initPending(q) {
  return isMulti(q.type) ? [] : null;
}

function checkAnswer(q, pending) {
  if (isMulti(q.type)) {
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

  // wrong options come only from other dishes' core ingredients (and never from a dish's own name)
  const dishNames = new Set(menu.map(i => i.name.toLowerCase()));
  const corePool = [...new Set(menu.flatMap(coreOf))].filter(i => !dishNames.has(i.toLowerCase()));
  const itemsWithSauces = pool.filter(i => i.sauces.length > 0);
  const allNames = pool.map(dishLabel);

  // Salads are asked about their dressing, everything else about its sauce. Wrong options come
  // from the same family: other dressings for a salad, other sauces for any other dish.
  const isSalad = item => item.type === 'salad' || /^ensalada/i.test(item.name);
  const shortSauces = item => item.sauces.map(shortSauceName);
  const DRESSING_LIKE = /vinaigrette|dressing|mayonnaise|aioli|alioli|reduction/i;
  const dressingPool = [...new Set(menu.flatMap(i => (isSalad(i)
    ? shortSauces(i)
    : shortSauces(i).filter(x => DRESSING_LIKE.test(x)))))];
  const saucePool = [...new Set(menu.filter(i => !isSalad(i)).flatMap(shortSauces))];
  const wrongSauces = (item, n) => {
    const own = new Set(menu.filter(m => m.name === item.name).flatMap(shortSauces).map(norm));
    const out = [];
    for (const cand of shuffle(isSalad(item) ? dressingPool : saucePool)) {
      if (own.has(norm(cand)) || out.some(o => norm(o) === norm(cand))) continue;
      out.push(cand);
      if (out.length === n) break;
    }
    return out;
  };

  // ── Single-select: sauce / dressing (dishes with exactly one) ─
  const sauceQs = [];
  // ── Multi-select: dishes with more than one sauce / dressing ──
  const sauceMultiQs = [];
  for (const item of shuffle([...itemsWithSauces])) {
    const noun = isSalad(item) ? 'dressing' : 'sauce';
    const all = shortSauces(item);
    if (all.length === 1) {
      const wrongs = wrongSauces(item, 3);
      if (wrongs.length < 3) continue;
      sauceQs.push({
        type: 'sauce',
        dish: dishLabel(item),
        prompt: `Which ${noun} is served with this dish?`,
        correct: all[0],
        options: shuffle([all[0], ...wrongs]),
        missedLabel: dishLabel(item),
        missedAnswer: all[0],
      });
    } else {
      const wrongs = wrongSauces(item, 4);
      if (wrongs.length < 3) continue;
      sauceMultiQs.push({
        type: 'multiselect_sauces',
        dish: dishLabel(item),
        prompt: `Select all the ${noun}s served with this dish.`,
        correct: all,
        options: shuffle([...all, ...wrongs]),
        missedLabel: dishLabel(item),
        missedAnswer: all.join(', '),
      });
    }
  }

  // ── Single-select: ingredient ─────────────────────────────────
  const ingQs = [];
  for (const item of shuffle([...pool])) {
    const core = coreOf(item);
    if (core.length === 0) continue;
    const correct = shuffle([...core])[0];
    const wrongs = pickWrongs(corePool, item, 3);
    if (wrongs.length < 3) continue;
    ingQs.push({
      type: 'ingredient',
      dish: dishLabel(item),
      correct,
      options: shuffle([correct, ...wrongs]),
      missedLabel: dishLabel(item),
      missedAnswer: dishLabel(item),
    });
  }

  // ── Multi-select: select all ingredients ─────────────────────
  const multiQs = [];
  for (const item of shuffle([...pool])) {
    const core = coreOf(item);
    if (core.length < 2) continue;
    const correct = shuffle([...core]).slice(0, Math.min(4, core.length));
    const distractors = pickWrongs(corePool, item, 4);
    if (distractors.length < 2) continue;
    multiQs.push({
      type: 'multiselect_ingredients',
      dish: dishLabel(item),
      correct,
      options: shuffle([...correct, ...distractors]),
      missedLabel: dishLabel(item),
      missedAnswer: correct.join(', '),
    });
  }

  // ── Description: name the dish ────────────────────────────────
  const descQs = [];
  for (const item of shuffle([...pool])) {
    const wrongs = shuffle(allNames.filter(n => n !== dishLabel(item))).slice(0, 3);
    if (wrongs.length < 3) continue;
    descQs.push({
      type: 'description',
      description: item.description,
      correct: dishLabel(item),
      options: shuffle([dishLabel(item), ...wrongs]),
      missedLabel: dishLabel(item),
      missedAnswer: dishLabel(item),
    });
  }

  const main  = shuffle([...sauceQs, ...ingQs]).slice(0, mainCount);
  const multi = [...shuffle(sauceMultiQs).slice(0, 2), ...shuffle(multiQs)].slice(0, multiCount);
  const desc  = shuffle(descQs).slice(0, descCount);
  const base  = shuffle([...main, ...desc]);
  const step  = Math.floor(base.length / (multi.length + 1));
  const result = [...base];
  multi.forEach((q, i) => result.splice(step * (i + 1) + i, 0, q));
  return result;
}

// "Salmon A La Plancha (Lunch Entrée)" -> the name, with the qualifier as a smaller line beneath it
function DishTitle({ label }) {
  const at = label.indexOf(' (');
  if (at === -1) return label;
  return (
    <>
      {label.slice(0, at)}
      <span className={styles.dishNote}>{label.slice(at + 1)}</span>
    </>
  );
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
    if (isMulti(q.type)) return (pending?.length ?? 0) === 0;
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
              <DishTitle label={q.dish} />
              {isConfirmed && (
                <span className={wasCorrect ? styles.iconCorrect : styles.iconWrong}>
                  {wasCorrect ? ' ✓' : ' ✗'}
                </span>
              )}
            </h2>
            <p className={styles.question}>{q.prompt ?? QUESTION_TEXT[q.type]}</p>
          </>
        )}

        {/* ── Multi-select: all ingredients ── */}
        {isMulti(q.type) && (
          <>
            <h2 className={styles.dishName}>
              <DishTitle label={q.dish} />
              {isConfirmed && (
                <span className={wasCorrect ? styles.iconCorrect : styles.iconWrong}>
                  {wasCorrect ? ' ✓' : ' ✗'}
                </span>
              )}
            </h2>
            <p className={styles.question}>{q.prompt ?? QUESTION_TEXT[q.type]}</p>
            {!isConfirmed && (
              <p className={styles.selectHint}>Select all {q.correct.length} that apply ({pending?.length ?? 0} selected)</p>
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
        {isMulti(q.type) && (
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
