import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import menu from '../../data/mothers_day_2026.json';
import styles from './MothersDayTestPage.module.css';

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// Extract sides for an entree (everything after the first ingredient = the protein)
function getSides(item) {
  const parts = item.main_ingredients.split(',').map(s => s.trim());
  return parts.slice(1).join(', ');
}

function generateQuiz() {
  const questions = [];

  // --- Sauce questions (items that have a sauce) ---
  const itemsWithSauces = menu.filter(i => i.sauces);
  const allSauces = [...new Set(itemsWithSauces.map(i => i.sauces))];
  for (const item of itemsWithSauces) {
    const distractors = shuffle(allSauces.filter(s => s !== item.sauces)).slice(0, 3);
    questions.push({
      question: `What sauce is served with ${item.name}?`,
      correct: item.sauces,
      options: shuffle([...distractors, item.sauces]),
      item,
      qtype: 'sauce',
    });
  }

  // --- Ingredient questions (one key ingredient per item) ---
  for (const item of menu) {
    const ingredients = item.main_ingredients.split(',').map(s => s.trim());
    const correct = ingredients[0];
    // For desserts, distractors come only from other dessert ingredients
    const pool = item.type === 'dessert'
      ? menu.filter(i => i.type === 'dessert' && i.id !== item.id)
      : menu.filter(i => i.id !== item.id);
    const allOtherIngredients = pool.flatMap(i => i.main_ingredients.split(',').map(s => s.trim()));
    const distractors = shuffle([...new Set(allOtherIngredients.filter(i => i !== correct))]).slice(0, 3);
    questions.push({
      question: `Which is a key ingredient in ${item.name}?`,
      correct,
      options: shuffle([...distractors, correct]),
      item,
      qtype: 'ingredient',
    });
  }

  // --- Sides questions (one per entree) ---
  const entrees = menu.filter(i => i.type === 'entree');
  for (const item of entrees) {
    const correct = getSides(item);
    const distractors = shuffle(entrees.filter(i => i.id !== item.id).map(getSides)).slice(0, 3);
    questions.push({
      question: `What sides come with the ${item.name}?`,
      correct,
      options: shuffle([...distractors, correct]),
      item,
      qtype: 'sides',
    });
  }

  // --- Category questions (one per course type) ---
  const categories = [
    { type: 'cold tapa',  label: 'a cold tapa' },
    { type: 'hot tapa',   label: 'a hot tapa' },
    { type: 'entree',     label: 'an entrée' },
    { type: 'dessert',    label: 'a dessert' },
  ];
  for (const { type, label } of categories) {
    const correct = shuffle(menu.filter(i => i.type === type))[0].name;
    const distractors = shuffle(menu.filter(i => i.type !== type)).slice(0, 3).map(i => i.name);
    questions.push({
      question: `Which of the following is ${label}?`,
      correct,
      options: shuffle([...distractors, correct]),
      item: null,
      qtype: 'category',
    });
  }

  return shuffle(questions);
}

const STATES = { idle: 'idle', active: 'active', confirmed: 'confirmed', done: 'done' };

export default function MothersDayTestPage() {
  const navigate = useNavigate();
  useEffect(() => { document.title = "Meson Sabika - Mother's Day Test"; }, []);
  const [status, setStatus] = useState(STATES.idle);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [pending, setPending] = useState(null);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState([]);

  const start = useCallback(() => {
    setQuestions(generateQuiz());
    setIndex(0);
    setScore(0);
    setMissed([]);
    setPending(null);
    setSelected(null);
    setStatus(STATES.active);
  }, []);

  const select = (option) => {
    if (status !== STATES.active) return;
    setPending(option);
  };

  const confirm = () => {
    if (!pending) return;
    setSelected(pending);
    if (pending === questions[index].correct) {
      setScore(s => s + 1);
    } else {
      setMissed(m => [...m, questions[index]]);
    }
    setStatus(STATES.confirmed);
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setStatus(STATES.done);
    } else {
      setIndex(i => i + 1);
      setPending(null);
      setSelected(null);
      setStatus(STATES.active);
    }
  };

  const QTYPE_LABELS = {
    sauce: 'Sauce',
    ingredient: 'Ingredient',
    sides: 'Sides',
    category: 'Category',
  };

  if (status === STATES.idle) {
    return (
      <div className={styles.center}>
        <h2 className={styles.heading}>Mother's Day Menu Test</h2>
        <div className={styles.instructions}>
          <p>{`${generateQuiz().length} questions covering sauces, ingredients, sides, and course categories`}</p>
          <p>Each test is randomly generated with a new order and question mix</p>
          <p>Once you confirm an answer, you cannot go back and change it</p>
        </div>
        <button className={styles.startBtn} onClick={start}>Start Test</button>
      </div>
    );
  }

  if (status === STATES.done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className={styles.page}>
        <div className={styles.resultsCard}>
          <button className={styles.exitBtn} onClick={() => navigate('/holiday/mothers-day-2026')}>
            ✕ Exit Test
          </button>
          <h2 className={styles.heading}>Results</h2>
          <p className={styles.scoreDisplay}>
            {score} / {questions.length}
            <span className={styles.pct}>{pct}%</span>
          </p>
          {missed.length > 0 && (
            <div className={styles.missed}>
              <h3 className={styles.missedHeading}>Review these:</h3>
              {missed.map((q, i) => (
                <div key={i} className={styles.missedRow}>
                  <span className={styles.missedDish}>{q.item ? q.item.name : 'Category'}</span>
                  <span className={styles.missedLabel}>{QTYPE_LABELS[q.qtype]}:</span>
                  <span className={styles.missedAnswer}>{q.correct}</span>
                </div>
              ))}
            </div>
          )}
          <button className={styles.startBtn} onClick={start}>Try Again</button>
        </div>
      </div>
    );
  }

  const q = questions[index];
  const isConfirmed = status === STATES.confirmed;

  return (
    <div className={styles.page}>
      <div className={styles.quizCard}>
        <button className={styles.exitBtn} onClick={() => navigate('/holiday/mothers-day-2026')}>
          ✕ Exit Test
        </button>
        <div className={styles.progress}>
          <div
            className={styles.progressBar}
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>
        <p className={styles.progressLabel}>Question {index + 1} of {questions.length}</p>

        <div className={styles.qtypeBadge}>{QTYPE_LABELS[q.qtype]}</div>

        <h2 className={styles.questionText}>
          {q.question}
          {isConfirmed && (
            <span className={selected === q.correct ? styles.iconCorrect : styles.iconWrong}>
              {selected === q.correct ? '✓' : '✗'}
            </span>
          )}
        </h2>

        <div className={styles.options}>
          {q.options.map(opt => {
            let cls = styles.optionBtn;
            if (isConfirmed) {
              if (opt === q.correct) cls = `${styles.optionBtn} ${styles.correct}`;
              else if (opt === selected) cls = `${styles.optionBtn} ${styles.wrong}`;
              else cls = `${styles.optionBtn} ${styles.dimmed}`;
            } else if (opt === pending) {
              cls = `${styles.optionBtn} ${styles.selectedPending}`;
            }
            return (
              <button key={opt} className={cls} onClick={() => select(opt)} disabled={isConfirmed}>
                {opt}
              </button>
            );
          })}
        </div>

        {!isConfirmed && (
          <button className={styles.confirmBtn} onClick={confirm} disabled={!pending}>
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
