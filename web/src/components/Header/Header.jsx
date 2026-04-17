import { Link } from 'react-router-dom';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.homeLink} aria-label="Go to home">
        <img
          src="/meson_sabika_logo.png"
          alt="Meson Sabika"
          className={styles.logo}
        />
      </Link>
      <h1 className={styles.title}>
        The Spanish wine and server education center
      </h1>
      <div className={styles.grapesWrapper}>
        <img src="/grapes_dark.jpg" alt="" className={styles.grapesImg} />
      </div>
    </header>
  );
}
