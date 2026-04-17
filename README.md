# Wine & Server Education Center

A mobile-first web application for restaurant staff to study, review, and test their knowledge of a Spanish wine list.

---

## Features

### 🍷 Review the Wines
Browse all wines by the glass with detailed cards showing type, region, grape varieties, tasting description, and similar wines. Sort by type, grape, region, or similar-to to group wines into labeled sections for focused study.

### 📝 Generate Wine Test
A randomized multiple-choice quiz covering all 16 wines. Each question asks either the region or grape variety for a given wine. Questions and question types are randomly generated on every attempt. Users select an answer and must confirm before it is graded — confirmed answers cannot be changed. Results show score, percentage, and a review list of missed questions.

### 🔊 Practice Pronunciation
Listen to audio pronunciations of each wine name. Wines are ordered by rosé, whites, then reds. Each card displays the wine name, region, and both the Spanish and English descriptions of the wine. Tap the play button to hear the correct pronunciation.

---

## Project Structure

```
wine_study/
├── assets/                        # Source images and logo
├── data/
│   └── wines_by_the_glass.csv     # Source of truth for all wine data
├── scripts/
│   └── csv_to_json.py             # Converts CSV to JSON for the web app
└── web/                           # React application (Vite)
    ├── public/
    │   ├── audio/                 # MP3 pronunciation files (1.mp3 – 16.mp3)
    │   ├── background.jpg         # Page background image
    │   ├── grapes_dark.jpg        # Header accent image
    │   └── meson_sabika_logo.png  # Restaurant logo
    └── src/
        ├── components/
        │   ├── Header/            # Logo, title, navigation home button
        │   ├── Footer/            # Copyright footer
        │   └── WineCard/          # Wine detail card used on review page
        ├── data/
        │   └── wines.json         # Generated from CSV — do not edit directly
        └── pages/
            ├── HomePage/          # Landing page with navigation buttons
            ├── ReviewPage/        # Wine browser with sort/group controls
            ├── TestPage/          # Randomized quiz
            └── PronunciationPage/ # Audio pronunciation practice
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3 (for data conversion script)

### Install & Run

```bash
# Install dependencies
cd web
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Build for Production

```bash
cd web
npm run build
```

Output is in `web/dist/`.

---

## Updating Wine Data

All wine data lives in `data/wines_by_the_glass.csv`. After making changes, regenerate the JSON:

```bash
python scripts/csv_to_json.py
```

This writes `web/src/data/wines.json`, which is bundled into the app at build time.

### CSV Columns

| Column | Description |
|---|---|
| `id` | Unique integer ID (used to match audio files) |
| `name` | Wine name |
| `type` | `white`, `red`, or `rosé` |
| `grapes` | Grape variety or varieties (comma-separated) |
| `region` | Spanish wine region |
| `description` | Tasting notes |
| `similar_to` | Familiar wine comparison for guests |

---

## Adding Pronunciation Audio

Audio files are stored in `web/public/audio/` and named by wine ID.

| ID | File | Wine |
|---|---|---|
| 1 | 1.mp3 | Tarima |
| 2 | 2.mp3 | Shaya |
| 3 | 3.mp3 | Polvorete |
| 4 | 4.mp3 | Inazio Urruzola |
| 5 | 5.mp3 | Hacienda Arinzano Blanco |
| 6 | 6.mp3 | Mar de Frades |
| 7 | 7.mp3 | Pazo Barrantes |
| 8 | 8.mp3 | El Coto "Crianza" |
| 9 | 9.mp3 | Finca Resalso |
| 10 | 10.mp3 | Juan Gil Silver |
| 11 | 11.mp3 | Termes |
| 12 | 12.mp3 | Marqués de Murrieta "Reserva" |
| 13 | 13.mp3 | Juan Gil Blue |
| 14 | 14.mp3 | Clio |
| 15 | 15.mp3 | Emilio Moro |
| 16 | 16.mp3 | Hacienda Arinzano Rosé |

Each audio file should contain the full Spanish and English introduction phrase in the format:
> *[Name] de [Region], elaborado con uvas [Grapes]. [Name] from [Region], made with [Grapes] grapes.*

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Bundler | Vite |
| Routing | React Router v6 |
| Styling | CSS Modules |
| Fonts | Playfair Display, Lato (Google Fonts) |
| Data | Static JSON bundled at build time |
| Audio | HTML5 `<audio>` element |

---

## Design Notes

- Built mobile-first — primary use case is staff on phones during shift prep
- Background image uses a fixed attachment with dark overlay for readability
- All interactive elements use `touch-action: manipulation` and `@media (hover: hover)` to ensure correct behavior on touchscreens
- Hover effects are desktop-only; tap feedback uses `:active` states
