import { useState, useCallback, useEffect, useRef } from 'react';
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

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => Array(n + 1).fill(0).map((_, j) => j === 0 ? i : 0));
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function normalizeAnswer(str) {
  return str.split(',').map(s => s.trim().toLowerCase()).sort().join(', ');
}

function fuzzyMatch(typed, correct) {
  const a = normalizeAnswer(typed.trim());
  const b = normalizeAnswer(correct);
  const tolerance = Math.max(1, Math.floor(b.length / 5));
  return levenshtein(a, b) <= tolerance;
}

const STATES = { idle: 'idle', active: 'active', confirmed: 'confirmed', done: 'done' };

export default function TestPage() {
  const navigate = useNavigate();
  useEffect(() => { document.title = 'Meson Sabika - Wine Test'; }, []);
  const [status, setStatus] = useState(STATES.idle);
  const [difficulty, setDifficulty] = useState(null); // 'easy' | 'hard'
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [pending, setPending] = useState(null);
  const [selected, setSelected] = useState(null);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState([]);
  const inputRef = useRef(null);

  const start = useCallback((mode) => {
    setDifficulty(mode);
    setQuestions(generateQuiz(wines));
    setIndex(0);
    setScore(0);
    setMissed([]);
    setPending(null);
    setSelected(null);
    setWasCorrect(false);
    setStatus(STATES.active);
  }, []);

  const restart = useCallback(() => {
    setDifficulty(null);
    setStatus(STATES.idle);
  }, []);

  useEffect(() => {
    if (status === STATES.active && difficulty === 'hard') {
      inputRef.current?.focus();
    }
  }, [status, index, difficulty]);

  const select = (option) => {
    if (status !== STATES.active) return;
    setPending(option);
  };

  const confirm = () => {
    const value = difficulty === 'hard' ? (pending ?? '').trim() : pending;
    if (!value) return;
    setSelected(value);
    const correct = questions[index].correct;
    const isCorrect = difficulty === 'hard'
      ? fuzzyMatch(value, correct)
      : value === correct;
    setWasCorrect(isCorrect);
    if (isCorrect) {
      setScore(s => s + 1);
    } else {
      setMissed(m => [...m, questions[index]]);
    }
    setStatus(STATES.confirmed);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && status === STATES.active) confirm();
    if (e.key === 'Enter' && status === STATES.confirmed) next();
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setStatus(STATES.done);
    } else {
      setIndex(i => i + 1);
      setPending(null);
      setSelected(null);
      setWasCorrect(false);
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
        <p className={styles.difficultyLabel}>Choose a difficulty</p>
        <div className={styles.difficultyRow}>
          <button className={`${styles.difficultyBtn} ${styles.difficultyEasy}`} onClick={() => start('easy')}>
            <span className={styles.difficultyTitle}>Easy</span>
            <span className={styles.difficultyDesc}>Multiple choice</span>
          </button>
          <button className={`${styles.difficultyBtn} ${styles.difficultyHard}`} onClick={() => start('hard')}>
            <span className={styles.difficultyTitle}>Hard</span>
            <span className={styles.difficultyDesc}>Fill in the blank</span>
          </button>
        </div>
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
          <button className={styles.startBtn} onClick={restart}>Try Again</button>
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
            <span className={wasCorrect ? styles.iconCorrect : styles.iconWrong}>
              {wasCorrect ? '✓' : '✗'}
            </span>
          )}
        </h2>
        <p className={styles.question}>
          {q.field === 'region'
            ? 'What region is this wine from?'
            : 'What grapes are used in this wine?'}
        </p>

        {difficulty === 'easy' ? (
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
        ) : (
          <div className={styles.fillArea}>
            <input
              ref={inputRef}
              className={`${styles.fillInput} ${isConfirmed ? (wasCorrect ? styles.fillInputCorrect : styles.fillInputWrong) : ''}`}
              type="text"
              value={pending ?? ''}
              onChange={e => setPending(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer…"
              disabled={isConfirmed}
              autoComplete="off"
              spellCheck={false}
            />
            {!isConfirmed && q.field === 'grapes' && (
              <p className={styles.fillHint}>
                List all grapes separated by commas — e.g. <em>Tempranillo, Garnacha</em>
              </p>
            )}
            {isConfirmed && selected.trim().toLowerCase() !== q.correct.toLowerCase() && (
              <p className={wasCorrect ? styles.fillSpellingHint : styles.fillCorrectAnswer}>
                {wasCorrect ? 'Correct spelling:' : 'Correct answer:'} <strong>{q.correct}</strong>
              </p>
            )}
          </div>
        )}

        {!isConfirmed && (
          <button
            className={styles.confirmBtn}
            onClick={confirm}
            disabled={difficulty === 'hard' ? !(pending ?? '').trim() : !pending}
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
