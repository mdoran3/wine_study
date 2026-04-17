import { useRef, useState, useEffect } from 'react';
import wines from '../../data/wines.json';
import styles from './PronunciationPage.module.css';

const TYPE_ORDER = ['rosé', 'white', 'red'];
const TYPE_LABELS = { rosé: 'Rosé', white: 'Whites', red: 'Reds' };

function formatGrapes(grapes, conjunction) {
  const list = grapes.split(',').map(g => g.trim());
  if (list.length === 1) return list[0];
  return list.slice(0, -1).join(', ') + ` ${conjunction} ` + list[list.length - 1];
}

function spanishPhrase(wine) {
  return `${wine.name} de ${wine.region}, elaborado con uvas ${formatGrapes(wine.grapes, 'y')}`;
}

function englishPhrase(wine) {
  return `${wine.name} from ${wine.region}, made with ${formatGrapes(wine.grapes, 'and')} grapes`;
}

function groupedWines() {
  const groups = {};
  for (const type of TYPE_ORDER) {
    groups[type] = wines.filter(w => w.type === type);
  }
  return groups;
}

function WineAudioCard({ wine }) {
  const audioRef = useRef(null);
  const [state, setState] = useState('idle');

  const play = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => setState('error'));
    setState('playing');
  };

  const onEnded = () => setState('idle');
  const onError = () => setState('error');

  return (
    <div className={styles.card}>
      <audio
        ref={audioRef}
        src={`/audio/${wine.id}.mp3`}
        onEnded={onEnded}
        onError={onError}
        preload="none"
      />
      <div className={styles.cardBody}>
        <span className={styles.nameRow}>
          <span className={styles.wineName}>{wine.name}</span>
          <span className={styles.region}>{wine.region}</span>
        </span>
        <span className={styles.phrase}>
          <span className={styles.lang}>ES</span> {spanishPhrase(wine)}
        </span>
        <span className={styles.phrase}>
          <span className={styles.lang}>EN</span> {englishPhrase(wine)}
        </span>
      </div>
      <button
        className={`${styles.playBtn} ${state === 'playing' ? styles.playing : ''} ${state === 'error' ? styles.unavailable : ''}`}
        onClick={play}
        disabled={state === 'error'}
        aria-label={`Play pronunciation of ${wine.name}`}
      >
        {state === 'error' ? '—' : '▶'}
      </button>
    </div>
  );
}

export default function PronunciationPage() {
  useEffect(() => { document.title = 'Meson Sabika - Wine Pronunciation'; }, []);
  const groups = groupedWines();

  return (
    <div className={styles.page}>
      {TYPE_ORDER.map(type => (
        groups[type].length > 0 && (
          <section key={type} className={styles.group}>
            <div className={styles.groupHeader}>
              <span className={styles.groupTitle}>{TYPE_LABELS[type]}</span>
              <div className={styles.groupDivider} />
            </div>
            <div className={styles.list}>
              {groups[type].map(wine => (
                <WineAudioCard key={wine.id} wine={wine} />
              ))}
            </div>
          </section>
        )
      ))}
    </div>
  );
}
