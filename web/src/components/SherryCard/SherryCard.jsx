import styles from './SherryCard.module.css';

const PAIRING_KEY = {
  'Aperitive':  'aperitive',
  'Dry meats':  'dry_meats',
  'Hot food':   'hot_food',
  'Dessert':    'dessert',
};

export default function SherryCard({ sherry }) {
  const badgeClass = PAIRING_KEY[sherry.pairing] ?? '';
  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.name}>{sherry.name}</h3>
        <span className={`${styles.pairingBadge} ${styles[badgeClass]}`}>
          {sherry.pairing}
        </span>
      </div>

      <div className={styles.descriptors}>
        {sherry.descriptors.map(d => (
          <span key={d} className={styles.descriptor}>{d}</span>
        ))}
      </div>

      <div className={styles.meta}>
        <div className={styles.metaRow}>
          <span className={styles.metaKey}>Sweetness</span>
          <span>{sherry.sweetness}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaKey}>Body</span>
          <span>{sherry.body}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaKey}>Aging</span>
          <span>{sherry.aging}</span>
        </div>
      </div>

      <p className={styles.description}>{sherry.description}</p>
    </article>
  );
}
