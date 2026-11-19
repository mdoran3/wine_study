import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import data from '../../data/new_years_eve_2026.json';
import MissedReview from '../../components/MissedReview/MissedReview';
import styles from './NewYearsEveTestPage.module.css';

const { event, menus, items } = data;
const THREE = menus.find(m => m.id === 'three');
const FOUR = menus.find(m => m.id === 'four');
const BACK = '/holiday/new-years-eve-2026';

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function pick(arr, n) {
  return shuffle(arr).slice(0, n);
}

const allSaucesLower = new Set(items.filter(i => i.sauces).map(i => i.sauces.toLowerCase()));
const splitAll = item => item.main_ingredients.split(',').map(s => s.trim());
// Ingredients that are really the dish's sauce are asked about in the sauce questions instead
const split = item => splitAll(item).filter(ing => !allSaucesLower.has(ing.toLowerCase()));

// Build a question; options are the correct answer plus 3 distractors (de-duplicated)
function mc(question, correct, distractors, qtype, item = null) {
  const pool = [...new Set(distractors.filter(d => d !== correct))];
  return {
    question,
    correct,
    options: shuffle([...pool.slice(0, 3), correct]),
    item,
    qtype,
  };
}

const isMulti = q => q.qtype === 'multi';

function generateQuiz() {
  const q = [];

  // --- Time & price questions ---
  q.push(mc('What are the seating hours for the three-course New Year\'s Eve dinner?',
    THREE.time, ['6 PM to Close', '5:00 PM - 6:00 PM', '4:00 PM - 6:00 PM', '3:00 PM - 5:00 PM'], 'time'));
  q.push(mc('What are the seating hours for the four-course New Year\'s Eve dinner?',
    FOUR.time, ['4:00 PM - 5:00 PM', '5 PM to Close', '7 PM to Close', '6 PM - 10:30 PM'], 'time'));
  q.push(mc('When will the live flamenco and Spanish guitar perform?',
    event.entertainment_time, ['4:00 PM to 8:00 PM', '6:00 PM to 10:00 PM', '7:00 PM to 11:00 PM', '6:30 PM to Close'], 'time'));
  q.push(mc('Which dinner is served first on New Year\'s Eve, before the flamenco and guitar begin?',
    'Three-course (4:00 PM - 5:00 PM)',
    ['Four-course (6 PM to Close)', 'Both start at the same time', 'Neither: the entertainment starts first'], 'time'));
  q.push(mc('The four-course dinner begins at 6 PM. What time does the live entertainment start?',
    '6:30 PM', ['6:00 PM', '7:00 PM', '5:30 PM', '8:00 PM'], 'time'));
  q.push(mc('What is the price of the three-course dinner?',
    THREE.price, ['$69 per adult', '$89 per adult', '$99 per adult', '$59 per adult'], 'time'));
  q.push(mc('What is the price of the four-course dinner?',
    FOUR.price, ['$79 per adult', '$89 per adult', '$109 per adult', '$119 per adult'], 'time'));
  q.push(mc('What date is the New Year\'s Eve dinner?',
    'Thursday, December 31, 2026', ['Wednesday, December 30, 2026', 'Friday, January 1, 2027', 'Thursday, December 24, 2026', 'Saturday, December 31, 2026'], 'time'));
  q.push(mc('How long is the photo booth available?',
    'All night', ['4:00 PM - 5:00 PM only', '6:30 PM to 10:30 PM only', 'Only during dessert'], 'time'));

  // --- Course structure questions ---
  q.push(mc('Which courses are offered in the three-course dinner?',
    THREE.courses.join(', '),
    ['Cold Tapas, Hot Tapas, Entrée', 'Hot Tapas, Entrée, Dessert', 'Cold Tapas, Hot Tapas, Dessert', FOUR.courses.join(', ')], 'course'));
  q.push(mc('Which courses are offered in the four-course dinner?',
    FOUR.courses.join(', '),
    [THREE.courses.join(', '), 'Cold Tapas, Hot Tapas, Entrée', 'Cold Tapas, Entrée, Salad, Dessert', 'Hot Tapas, Entrée, Salad, Dessert'], 'course'));
  q.push(mc('Which course is included in the four-course dinner but NOT the three-course dinner?',
    'Hot Tapas', ['Cold Tapas', 'Entrée', 'Dessert', 'Salad'], 'course'));
  q.push(mc('How many cold tapas does each guest enjoy?',
    'All three', ['Choice of one', 'Choice of two', 'All two'], 'course'));
  q.push(mc('How many hot tapas does each guest enjoy on the four-course dinner?',
    'All three', ['Choice of one', 'Choice of two', 'All two'], 'course'));
  q.push(mc('How many desserts does each guest enjoy?',
    'Both selections', ['Choice of one', 'Three selections', 'Dessert is not included'], 'course'));
  q.push(mc('How many entrées are offered?',
    'One: Mar y Montaña', ['Two: Mar y Montaña and a fish entrée', 'Three, guest chooses one', 'Two, guest chooses one'], 'course'));
  q.push(mc('What is available upon request?',
    'Young adult and vegetarian menus', ['Gluten-free and vegan menus', 'Kids and pescatarian menus', 'A private dining room', 'Wine pairings'], 'course'));

  // --- Which menu is each dish on? ---
  for (const item of items) {
    const fourOnly = item.type === 'hot tapa';
    q.push(mc(`Which dinner(s) include ${item.name}?`,
      fourOnly ? 'Four-course only' : 'Both three- and four-course',
      fourOnly
        ? ['Three-course only', 'Both three- and four-course', 'Neither']
        : ['Four-course only', 'Three-course only', 'Neither'],
      'course', item));
  }

  // --- Category questions ---
  const cats = [
    { type: 'cold tapa', label: 'a cold tapa' },
    { type: 'hot tapa',  label: 'a hot tapa' },
    { type: 'entree',    label: 'an entrée' },
    { type: 'dessert',   label: 'a dessert' },
  ];
  for (const { type, label } of cats) {
    const correct = pick(items.filter(i => i.type === type), 1)[0].name;
    q.push(mc(`Which of the following is ${label}?`, correct,
      items.filter(i => i.type !== type).map(i => i.name), 'category'));
  }
  q.push(mc('Which of these is NOT a cold tapa?',
    pick(items.filter(i => i.type !== 'cold tapa'), 1)[0].name,
    items.filter(i => i.type === 'cold tapa').map(i => i.name), 'category'));

  // --- Ingredient questions ---
  for (const item of items) {
    const own = split(item);
    const correct = pick(own, 1)[0];
    const sameType = items.filter(i => i.id !== item.id && i.type === item.type);
    const others = items.filter(i => i.id !== item.id);
    const poolItems = sameType.length >= 1 ? [...sameType, ...others] : others;
    const distractors = shuffle([...new Set(poolItems.flatMap(split))]).filter(d => !own.includes(d));
    q.push(mc(`Which is one of the ingredients in ${item.name}?`, correct, distractors, 'ingredient', item));
  }

  // "Which is NOT in" question for items with 4+ ingredients
  for (const item of items.filter(i => split(i).length >= 4)) {
    const own = split(item);
    const outsider = shuffle([...new Set(items.filter(i => i.id !== item.id).flatMap(split))].filter(d => !own.includes(d)))[0];
    q.push(mc(`Which of these is NOT in ${item.name}?`, outsider, pick(own, 3), 'ingredient', item));
  }

  // --- "What are the three ...?" select-all questions ---
  for (const { type, label } of [
    { type: 'cold tapa', label: 'cold' },
    { type: 'hot tapa', label: 'hot' },
  ]) {
    const correct = items.filter(i => i.type === type).map(i => i.name);
    q.push({
      question: `What are the three ${label} tapas?`,
      correct,
      options: shuffle(items.map(i => i.name)),
      item: null,
      qtype: 'multi',
      noun: 'tapas',
    });
  }

  // --- Select-all ingredient questions (full ingredient list, sauces included) ---
  const stems = list => new Set(list.flatMap(x => x.toLowerCase().split(/\W+/).filter(w => w.length >= 5).map(w => w.slice(0, 5))));
  for (const item of items) {
    const own = splitAll(item);
    const ownStems = stems(own);
    // avoid distractors that overlap with a real ingredient (e.g. "wild mushrooms" vs "wild mushroom croquettes")
    const pool = [...new Set(items.filter(i => i.id !== item.id).flatMap(splitAll))]
      .filter(d => !own.includes(d) && ![...stems([d])].some(st => ownStems.has(st)));
    q.push({
      question: `Select all ingredients in ${item.name}:`,
      correct: own,
      options: shuffle([...own, ...pick(pool, Math.max(8 - own.length, 4))]),
      item,
      qtype: 'multi',
      noun: 'ingredients',
    });
  }

  // --- Sauce questions ---
  const withSauce = items.filter(i => i.sauces);
  const allSauces = [...new Set(withSauce.map(i => i.sauces))];
  for (const item of withSauce) {
    q.push(mc(`Which sauce is served with ${item.name}?`, item.sauces, allSauces, 'sauce', item));
  }

  // --- Reverse lookups on specific details ---
  q.push(mc('Which tapa is finished with a pomegranate reduction sauce?', 'Rollito de Buey',
    items.filter(i => i.type.endsWith('tapa')).map(i => i.name), 'sauce'));
  q.push(mc('Which tapa comes with avocado relish?', 'Tostada con Cangrejos',
    items.filter(i => i.type.endsWith('tapa')).map(i => i.name), 'ingredient'));
  q.push(mc('Which tapa includes salmon caviar?', 'Pastelillo de Salmón Ahumado',
    items.filter(i => i.type.endsWith('tapa')).map(i => i.name), 'ingredient'));
  q.push(mc('Which dish is served with black truffle alioli?', 'Croquetas de Setas',
    items.filter(i => i.type.endsWith('tapa')).map(i => i.name), 'sauce'));
  q.push(mc('Which dessert has coconut liqueur as one of its ingredients?', 'Piña Colada Cheesecake',
    ['Pastel de Chocolate', 'Mar y Montaña', 'Rollito de Buey'], 'ingredient'));
  q.push(mc('Which dessert has dark cherries as one of its ingredients?', 'Pastel de Chocolate',
    ['Piña Colada Cheesecake', 'Dátiles con Tocino', 'Rollito de Buey'], 'ingredient'));

  // --- Sides ---
  q.push(mc('What accompanies the Mar y Montaña?',
    'Wild mushrooms and white truffle potato purée',
    ['Roasted root vegetables and tri-color quinoa', 'Garlic potatoes and grilled asparagus', 'Wild mushrooms and saffron rice', 'Truffle fries and creamed spinach'],
    'sides', items.find(i => i.type === 'entree')));
  q.push(mc('What two proteins make up the Mar y Montaña?',
    'Lobster tail and beef tenderloin medallion',
    ['Lobster tail and chicken breast', 'Shrimp and beef tenderloin medallion', 'Sea bass and pork tenderloin', 'Crab meat and lamb chop'],
    'ingredient', items.find(i => i.type === 'entree')));

  // --- Build a shorter test: every kind of question, anchored by the scheduled types ---
  const isDishSauce = x => x.qtype === 'sauce' && x.item;
  const MUST = [
    'What are the seating hours for the three-course',
    'What are the seating hours for the four-course',
    'When will the live flamenco',
    'Which courses are offered in the three-course',
    'Which courses are offered in the four-course',
    'Which course is included in the four-course dinner but NOT',
    'What is the price of the three-course',
    'What is the price of the four-course',
    'What is available upon request',
    'What are the three',
  ];
  const isMust = x => MUST.some(m => x.question.startsWith(m));
  const regular = q.filter(x => !isMulti(x) && !isDishSauce(x));
  // take n of a type, always including the must-ask questions of that type
  const quota = (type, n) => {
    const pool = regular.filter(x => x.qtype === type);
    const must = pool.filter(isMust);
    return [...must, ...pick(pool.filter(x => !isMust(x)), Math.max(n - must.length, 0))];
  };
  const multiAll = q.filter(isMulti);
  const multis = shuffle([
    ...multiAll.filter(isMust),                                   // cold & hot tapas
    ...pick(multiAll.filter(x => !isMust(x)), 7),                 // 7 ingredient select-alls
  ]);
  const sauces = shuffle(q.filter(isDishSauce));                  // every dish sauce
  const rest = shuffle([
    ...quota('time', 6),
    ...quota('course', 5),
    ...quota('category', 1),
    ...quota('ingredient', 1),
    ...quota('sides', 1),
    ...quota('sauce', 1),                                         // sauce-to-dish lookup
  ]);

  // Scheduling: one select-all question at a random spot in each block of 3, and one
  // per-dish sauce question at a random spot in each block of 4, until each runs out.
  const total = multis.length + sauces.length + rest.length;
  const slots = new Array(total).fill(null);

  const place = (list, size) => {
    for (let start = 0; start < slots.length && list.length; start += size) {
      const free = [];
      for (let k = start; k < Math.min(start + size, slots.length); k++) {
        if (!slots[k]) free.push(k);
      }
      if (free.length) slots[free[Math.floor(Math.random() * free.length)]] = list.shift();
    }
  };
  place(multis, 3);
  place(sauces, 4);
  // Anything left over (and all other questions) fills the remaining slots
  const filler = shuffle([...multis, ...sauces, ...rest]);
  return slots.map(slot => slot || filler.shift());
}

const initPending = q => (isMulti(q) ? [] : null);
const checkAnswer = (q, pending) => {
  if (isMulti(q)) {
    const sel = pending || [];
    return sel.length === q.correct.length && q.correct.every(c => sel.includes(c));
  }
  return pending === q.correct;
};

const STATES = { idle: 'idle', active: 'active', confirmed: 'confirmed', done: 'done' };

const QTYPE_LABELS = {
  time: 'Times & Pricing',
  course: 'Courses',
  category: 'Category',
  ingredient: 'Ingredient',
  sauce: 'Sauce',
  multi: 'Select All',
  sides: 'Sides',
};

export default function NewYearsEveTestPage() {
  const navigate = useNavigate();
  useEffect(() => { document.title = "Meson Sabika - New Year's Eve Test"; }, []);
  const [status, setStatus] = useState(STATES.idle);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [pending, setPending] = useState(null);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState([]);

  const start = useCallback(() => {
    const qs = generateQuiz();
    setQuestions(qs);
    setIndex(0);
    setScore(0);
    setMissed([]);
    setPending(initPending(qs[0]));
    setSelected(null);
    setStatus(STATES.active);
  }, []);

  const select = (option) => {
    if (status !== STATES.active) return;
    setPending(option);
  };

  const toggle = (opt) => {
    if (status !== STATES.active) return;
    setPending(prev => (prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]));
  };

  const confirm = () => {
    if (isMulti(questions[index]) ? pending.length === 0 : !pending) return;
    setSelected(pending);
    if (checkAnswer(questions[index], pending)) {
      setScore(s => s + 1);
    } else {
      setMissed(m => [...m, { q: questions[index], answer: pending }]);
    }
    setStatus(STATES.confirmed);
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setStatus(STATES.done);
    } else {
      setIndex(i => i + 1);
      setPending(initPending(questions[index + 1]));
      setSelected(null);
      setStatus(STATES.active);
    }
  };

  if (status === STATES.idle) {
    return (
      <div className={styles.center}>
        <h2 className={styles.heading}>New Year's Eve Menu Test</h2>
        <div className={styles.instructions}>
          <p>Covers dinner times and prices, flamenco and guitar hours, courses offered, ingredients, sauces, and sides</p>
          <p>Each test is randomly generated with a new order and question mix</p>
          <p>Once you confirm an answer, you cannot go back and change it</p>
          <p>💡 Tip: Take this test as many times as you like. Every test is uniquely generated, so it will be different each time. The more you practice, the better you'll remember!</p>
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
          <button className={styles.exitBtn} onClick={() => navigate(BACK)}>
            ✕ Exit Test
          </button>
          <h2 className={styles.heading}>Results</h2>
          <p className={styles.scoreDisplay}>
            {score} / {questions.length}
            <span className={styles.pct}>{pct}%</span>
          </p>
          {missed.length > 0 && (
            <MissedReview items={missed.map(({ q, answer }) => ({
              prompt: q.question,
              kind: isMulti(q) ? 'multi' : 'choice',
              options: q.options,
              correct: q.correct,
              answer,
            }))} />
          )}
          <p className={styles.tip}>💡 Tip: Take it again as many times as you like. Every test is uniquely generated and will be different, so keep practicing!</p>
          <button className={styles.startBtn} onClick={start}>Try Again</button>
        </div>
      </div>
    );
  }

  const q = questions[index];
  const isConfirmed = status === STATES.confirmed;
  const multi = isMulti(q);
  const wasCorrect = isConfirmed && checkAnswer(q, selected);

  return (
    <div className={styles.page}>
      <div className={styles.quizCard}>
        <button className={styles.exitBtn} onClick={() => navigate(BACK)}>
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
            <span className={wasCorrect ? styles.iconCorrect : styles.iconWrong}>
              {wasCorrect ? '✓' : '✗'}
            </span>
          )}
        </h2>

        {multi && (
          <p className={styles.selectHint}>
            {isConfirmed
              ? (wasCorrect ? '✓ All correct' : `✗ Correct ${q.noun} are highlighted`)
              : `Select all ${q.correct.length} correct ${q.noun} (${pending.length} of ${q.correct.length} selected)`}
          </p>
        )}

        {multi ? (
          <div className={styles.multiGrid}>
            {q.options.map(opt => {
              const isSel = pending.includes(opt) || (isConfirmed && selected.includes(opt));
              const isCorrect = q.correct.includes(opt);
              let cls = styles.multiBtn;
              if (isConfirmed) {
                const chosen = selected.includes(opt);
                if (chosen && isCorrect) cls = `${styles.multiBtn} ${styles.multiCorrect}`;
                else if (chosen) cls = `${styles.multiBtn} ${styles.multiWrong}`;
                else if (isCorrect) cls = `${styles.multiBtn} ${styles.multiMissed}`;
                else cls = `${styles.multiBtn} ${styles.multiDimmed}`;
              } else if (isSel) {
                cls = `${styles.multiBtn} ${styles.multiSelected}`;
              }
              return (
                <button key={opt} className={cls} onClick={() => toggle(opt)} disabled={isConfirmed}>
                  {opt}
                </button>
              );
            })}
          </div>
        ) : (
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
        )}

        {!isConfirmed && (
          <button className={styles.confirmBtn} onClick={confirm} disabled={multi ? pending.length === 0 : !pending}>
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
