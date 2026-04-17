import styles from './WineCard.module.css';

export default function WineCard({ wine }) {
  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.name}>{wine.name}</h3>
        <span className={`${styles.typeBadge} ${styles[wine.type]}`}>
          {wine.type}
        </span>
      </div>
      <div className={styles.meta}>
        <div className={styles.metaRow}>
          <span className={styles.metaKey}>Region</span>
          <span>{wine.region}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaKey}>Grapes</span>
          <span>{wine.grapes}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaKey}>Similar to</span>
          <span>{wine.similar_to}</span>
        </div>
      </div>
      <p className={styles.description}>{wine.description}</p>
    </article>
  );
}
