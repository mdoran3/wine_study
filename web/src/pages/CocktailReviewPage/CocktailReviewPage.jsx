import { useEffect } from 'react';
import styles from './CocktailReviewPage.module.css';

export default function CocktailReviewPage() {
  useEffect(() => { document.title = 'Meson Sabika - Cocktail Knowledge'; }, []);
  return (
    <section className={styles.page}>
      <h2 className={styles.heading}>Review Cocktail Knowledge</h2>
      <div className={styles.card}>
        <span className={styles.badge}>Coming soon</span>
        <p className={styles.text}>
          The cocktail menu is on its way. Check back soon to study each drink, its ingredients and how it is made.
        </p>
      </div>
    </section>
  );
}
