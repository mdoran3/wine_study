import styles from './FishCard.module.css';

export default function FishCard({ fish }) {
  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.name}>{fish.name}</h3>
        <span className={`${styles.oilBadge} ${styles[fish.oil_content.replace('-', '_')]}`}>
          {fish.oil_content}
        </span>
      </div>
      <div className={styles.meta}>
        <div className={styles.metaRow}>
          <span className={styles.metaKey}>Oil Content</span>
          <span>{fish.oil_content}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaKey}>Firmness</span>
          <span>{fish.firmness}</span>
        </div>
        <div className={styles.metaRow}>
          <span className={styles.metaKey}>Flake</span>
          <span>{fish.flake_type}</span>
        </div>
      </div>
      <p className={styles.description}>{fish.description}</p>
    </article>
  );
}
