import styles from './MenuItemCard.module.css';

export default function MenuItemCard({ item }) {
  return (
    <article className={styles.card}>
      <h3 className={styles.name}>{item.name}</h3>
      <div className={styles.meta}>
        {item.main_ingredients && (
          <div className={styles.metaRow}>
            <span className={styles.metaKey}>Ingredients</span>
            <span>{item.main_ingredients}</span>
          </div>
        )}
        {item.sauces && (
          <div className={styles.metaRow}>
            <span className={styles.metaKey}>Sauce</span>
            <span>{item.sauces}</span>
          </div>
        )}
      </div>
      {item.description && item.description !== item.main_ingredients && (
        <p className={styles.description}>{item.description}</p>
      )}
    </article>
  );
}
