import { useState, useEffect, useRef } from 'react';
import data from '../../data/allergies.json';
import styles from './AllergyPage.module.css';

const ALLERGEN_META = {
  Dairy:       { emoji: '🥛', label: 'Dairy-Free',     color: '#c0392b', bg: '#fdecea', border: '#e8a09a' },
  Eggs:        { emoji: '🥚', label: 'Egg-Free',       color: '#b8860b', bg: '#fdf6e3', border: '#e8c97a' },
  'Tree Nuts': { emoji: '🌰', label: 'Tree Nut-Free',  color: '#5a7a00', bg: '#f4fae8', border: '#b8d878' },
  Peanuts:     { emoji: '🥜', label: 'Peanut-Free',    color: '#2e7d32', bg: '#edf7ee', border: '#90c893' },
  Shellfish:   { emoji: '🦐', label: 'Shellfish-Free', color: '#1565c0', bg: '#e8f0fb', border: '#90b4e8' },
  Gluten:      { emoji: '🌾', label: 'Gluten-Free',    color: '#6a1fa8', bg: '#f5f0fd', border: '#c8a8e8' },
};

const allItems = data.categories.flatMap(cat =>
  cat.items.map(item => ({ ...item, category: cat.name }))
);

export default function AllergyPage() {
  useEffect(() => { document.title = 'Meson Sabika - Allergy Guide'; }, []);

  const [active, setActive] = useState(new Set());

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef(null);

  const searchResults = searchQuery.trim().length > 0
    ? allItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : [];

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setSelectedItem(null);
    setDropdownOpen(true);
  };

  const handleSelect = (item) => {
    setSelectedItem(item);
    setSearchQuery('');
    setDropdownOpen(false);
  };

  const handleSearchBlur = () => {
    setTimeout(() => setDropdownOpen(false), 150);
  };

  const handleClear = () => {
    setSelectedItem(null);
    setSearchQuery('');
    setDropdownOpen(false);
    searchRef.current?.focus();
  };

  const toggle = (a) => {
    setSelectedItem(null);
    setActive(prev => {
      const next = new Set(prev);
      next.has(a) ? next.delete(a) : next.add(a);
      return next;
    });
  };

  const filteredCategories = active.size === 0 ? [] : data.categories.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      item.allergens.every(a => !active.has(a))
    ),
  })).filter(cat => cat.items.length > 0);

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h2 className={styles.heading}>Menu Allergen Guide</h2>

        {/* ── Search bar ── */}
        <div className={styles.searchWrapper}>
          <div className={styles.searchInputRow}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              ref={searchRef}
              className={styles.searchInput}
              type="text"
              placeholder="Search for a dish…"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => searchQuery.trim().length > 0 && setDropdownOpen(true)}
              onBlur={handleSearchBlur}
              autoComplete="off"
            />
            {(searchQuery || selectedItem) && (
              <button className={styles.searchClear} onClick={handleClear} tabIndex={-1}>✕</button>
            )}
          </div>

          {dropdownOpen && searchResults.length > 0 && (
            <ul className={styles.dropdown}>
              {searchResults.map(item => (
                <li
                  key={`${item.category}__${item.name}`}
                  className={styles.dropdownItem}
                  onMouseDown={() => handleSelect(item)}
                >
                  <span className={styles.dropdownName}>{item.name}</span>
                  <span className={styles.dropdownCat}>{item.category}</span>
                </li>
              ))}
            </ul>
          )}

          {dropdownOpen && searchQuery.trim().length > 0 && searchResults.length === 0 && (
            <div className={styles.dropdownEmpty}>No dishes match "{searchQuery}"</div>
          )}
        </div>

        {/* ── Selected item detail ── */}
        {selectedItem && (
          <div className={styles.selectedCard}>
            <p className={styles.selectedCategory}>{selectedItem.category}</p>
            <h3 className={styles.selectedName}>{selectedItem.name}</h3>
            {selectedItem.allergens.length === 0 ? (
              <span className={styles.safeTag}>✓ No allergens</span>
            ) : (
              <div className={styles.selectedAllergenRow}>
                <span className={styles.selectedContainsLabel}>Contains:</span>
                <div className={styles.selectedTags}>
                  {selectedItem.allergens.map(a => {
                    const meta = ALLERGEN_META[a];
                    return (
                      <span
                        key={a}
                        className={styles.selectedTag}
                        style={{ background: meta.bg, borderColor: meta.border, color: meta.color }}
                      >
                        {meta.emoji} {a}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Free-from filter chips ── */}
        <p className={styles.subheading}>Select dietary needs to find safe dishes.</p>

        <div className={styles.chips}>
          {data.allergens.map(a => {
            const meta = ALLERGEN_META[a];
            const isOn = active.has(a);
            return (
              <button
                key={a}
                className={`${styles.chip} ${isOn ? styles.chipOn : styles.chipOff}`}
                style={isOn ? {
                  background: meta.color,
                  borderColor: meta.color,
                  color: '#fff',
                } : {
                  background: meta.bg,
                  borderColor: meta.border,
                  color: meta.color,
                }}
                onClick={() => toggle(a)}
              >
                <span className={styles.chipEmoji}>{meta.emoji}</span>
                {meta.label}
              </button>
            );
          })}
        </div>


        {active.size > 0 && filteredCategories.length === 0 && (
          <div className={styles.empty}>
            <p>No dishes found that are free from all selected allergens.</p>
          </div>
        )}

        {filteredCategories.length > 0 && (() => {
          const labels = [...active].map(a => ALLERGEN_META[a].label.toLowerCase());
          const text = labels.length === 1
            ? labels[0]
            : labels.slice(0, -1).join(', ') + ', and ' + labels[labels.length - 1];
          return <p className={styles.resultsTitle}>The items below are {text}.</p>;
        })()}

        {filteredCategories.map(cat => (
          <div key={cat.name} className={styles.category}>
            <div className={styles.categoryHeader}>
              <h3 className={styles.categoryName}>{cat.name}</h3>
              <div className={styles.categoryDivider} />
            </div>
            <div className={styles.itemList}>
              {cat.items.map(item => (
                <div key={item.name} className={styles.item}>
                  <span className={styles.itemName}>{item.name}</span>
                  <div className={styles.itemTags}>
                    <span className={styles.safeTag}>✓ Safe</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
