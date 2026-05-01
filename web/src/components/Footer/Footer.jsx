import styles from './Footer.module.css';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <p>&copy; {year} <a href="https://mitchelld.net" className={styles.link}>mitchelld.net</a>. All rights reserved.</p>
    </footer>
  );
}
