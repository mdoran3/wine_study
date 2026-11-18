import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import data from '../../data/new_years_eve_2026.json';
import styles from './NewYearsEveMenuPdfPage.module.css';

const { event, menus, items } = data;

const COURSE_TYPES = {
  'Cold Tapas': 'cold tapa',
  'Hot Tapas': 'hot tapa',
  'Entrée': 'entree',
  'Dessert': 'dessert',
};

const SELECTIONS = {
  'Cold Tapas': 'Enjoy all three selections',
  'Hot Tapas': 'Enjoy all three selections',
  'Dessert': 'Enjoy both selections',
};

function PrintedMenu({ menu, first }) {
  return (
    <article className={styles.sheet}>
      <p className={styles.kicker}>A Taste of Spain</p>
      <h3 className={styles.title}>New Year's Eve</h3>
      <p className={styles.subtitle}>A Festive {menu.name}</p>
      <p className={styles.date}>{event.date}</p>
      <p className={styles.timePrice}>{menu.time} | {menu.price}</p>
      <p className={styles.small}>Plus tax and gratuity</p>

      {menu.courses.map(course => (
        <section key={course} className={styles.course}>
          <hr className={styles.rule} />
          <h4 className={styles.courseName}>{course}</h4>
          {SELECTIONS[course] && <p className={styles.selections}>{SELECTIONS[course]}</p>}
          {items.filter(i => i.type === COURSE_TYPES[course]).map(item => (
            <div key={item.id} className={styles.dish}>
              <p className={styles.dishName}>{item.name}</p>
              <p className={styles.dishDesc}>{item.description}.</p>
            </div>
          ))}
        </section>
      ))}

      {first && (
        <>
          <hr className={styles.rule} />
          <p className={styles.note}>{event.special_menus}.</p>
          <p className={styles.entertainment}>{event.entertainment}</p>
          <p className={styles.entertainment}>{event.entertainment_time}</p>
          <p className={styles.photo}>Capture the memories at our photo booth {event.photo_booth}</p>
        </>
      )}
    </article>
  );
}

export default function NewYearsEveMenuPdfPage() {
  const navigate = useNavigate();
  const close = () => navigate('/holiday/new-years-eve-2026');
  useEffect(() => { document.title = "Meson Sabika - New Year's Eve Printed Menu"; }, []);
  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.closeBtn} onClick={close}>✕ Close Menu</button>
      </div>
      <h2 className={styles.heading}>New Year's Eve Printed Menu</h2>
      {menus.map((m, i) => <PrintedMenu key={m.id} menu={m} first={i === 0} />)}
      <button className={styles.closeBtn} onClick={close}>✕ Close Menu</button>
    </div>
  );
}
