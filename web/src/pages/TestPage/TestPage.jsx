import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import wines from '../../data/wines.json';
import styles from './TestPage.module.css';

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function generateQuiz(wines) {
  return shuffle(wines).map(wine => {
    const field = Math.random() < 0.5 ? 'region' : 'grapes';
    const correct = wine[field];
    const distractors = [...new Set(
      wines.filter(w => w.id !== wine.id && w[field] !== correct).map(w => w[field])
    )];
    const options = shuffle([...shuffle(distractors).slice(0, 3), correct]);
    return { wine, field, correct, options };
  });
}

const STATES = { idle: 'idle', active: 'active', confirmed: 'confirmed', done: 'done' };

export default function TestPage() {
  const navigate = useNavigate();
  useEffect(() => { document.title = 'Meson Sabika - Wine Test'; }, []);
  const [status, setStatus] = useState(STATES.idle);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [pending, setPending] = useState(null);   // selected but not yet graded
  const [selected, setSelected] = useState(null); // graded selection
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState([]);

  const start = useCallback(() => {
    setQuestions(generateQuiz(wines));
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
    const correct = questions[index].correct;
    if (pending === correct) {
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

  if (status === STATES.idle) {
    return (
      <div className={styles.center}>
        <h2 className={styles.heading}>Wine Knowledge Test</h2>
        <div className={styles.instructions}>
          <p>{wines.length} questions — identify each wine's region or grapes</p>
          <p>Each test is randomly generated with a new order and question types</p>
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
          <button className={styles.exitBtn} onClick={() => navigate('/')}>
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
              {missed.map(q => (
                <div key={`${q.wine.id}-${q.field}`} className={styles.missedRow}>
                  <span className={styles.missedWine}>{q.wine.name}</span>
                  <span className={styles.missedLabel}>
                    {q.field === 'region' ? 'Region' : 'Grapes'}:
                  </span>
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
        <button className={styles.exitBtn} onClick={() => navigate('/')}>
          ✕ Exit Test
        </button>
        <div className={styles.progress}>
          <div
            className={styles.progressBar}
            style={{ width: `${((index + 1) / questions.length) * 100}%` }}
          />
        </div>
        <p className={styles.progressLabel}>
          Question {index + 1} of {questions.length}
        </p>

        <h2 className={styles.wineName}>
          {q.wine.name}
          {isConfirmed && (
            <span className={selected === q.correct ? styles.iconCorrect : styles.iconWrong}>
              {selected === q.correct ? '✓' : '✗'}
            </span>
          )}
        </h2>
        <p className={styles.question}>
          {q.field === 'region'
            ? 'What region is this wine from?'
            : 'What grapes are used in this wine?'}
        </p>

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
              <button
                key={opt}
                className={cls}
                onClick={() => select(opt)}
                disabled={isConfirmed}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {!isConfirmed && (
          <button
            className={styles.confirmBtn}
            onClick={confirm}
            disabled={!pending}
          >
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
