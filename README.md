# Mesón Sabika Server Education

A mobile-first web application for restaurant servers to study, review, and test their knowledge of Mesón Sabika's wine list, tapas menu, fish program, sherry list, holiday menus, and allergen information.

Live at **[mesoneducation.com](https://mesoneducation.com)**

---

## Features

### 🍷 Wine

#### Review the Wines (by the glass)
Browse all wines by the glass with detailed cards showing type, region, grape varieties, tasting description, and similar wines. Sort by type, grape, region, or similar-to to group wines into labeled sections for focused study.

#### Review the Wines (by the bottle)
Browse the full bottle list grouped by region with type and varietal information for each wine.

#### Practice Wine Pronunciation
Listen to audio pronunciations of each wine name. Wines are ordered by rosé, whites, then reds. Each card displays the wine name, region, and both the Spanish and English descriptions of the wine. Tap the play button to hear the correct pronunciation.

#### Generate Wine Test
A randomized multiple-choice quiz covering all wines by the glass. Each question asks either the region or grape variety for a given wine. Questions and question types are randomly generated on every attempt. Users select an answer and must confirm before it is graded — confirmed answers cannot be changed. Results show score, percentage, and a review list of missed questions.

---

### 🍽️ Tapas Menu

#### Review Menu Knowledge
Browse all 72 menu items (cold tapas, hot tapas, soups, salads, paellas, desserts, lunch entrées) with cards showing description, ingredients, sauces, and dietary badges (GF / V / VE, with `*` indicating a modifiable variant). Filter by section type, and stack dietary filters — GF can combine with V or VE, but V and VE are mutually exclusive. Items are grouped by type with section dividers.

#### Generate Menu Test
A randomized quiz covering sauces, ingredients, and description-to-dish matching across the entire menu. Choose a section to focus on, or test against the full menu (30 questions full, 20 questions filtered). Each test mixes four question types:
- **Sauce**: which sauce is served with this dish?
- **Ingredient** (single-select): which of these is an ingredient in this dish?
- **Multi-select ingredients** (5 per test, evenly spread throughout): select *all* ingredients that are in this dish — missed correct ingredients are highlighted on confirm
- **Description**: shown a description, pick the matching dish (~10% of questions)

---

### 🐟 Fish

#### Review Fish Knowledge
Browse all fish with cards showing oil content, firmness, flake type, and a tasting description. Sort by oil content, firmness, or flake size. Includes a color-coded scatter chart mapping each fish by oil content (Y axis) and flake size (X axis).

#### Generate Fish Test
A randomized 16-question multiple-choice quiz. Each question asks either the flake size or oil content for a given fish. Randomly generated on every attempt with the same confirm-before-grading flow as the wine test.

---

### 🥃 Sherry

#### Review Sherry Knowledge
Browse the sherry list with style, dryness/sweetness, aging, and tasting notes for each bottle.

#### Generate Sherry Test
A randomized multiple-choice quiz covering style and characteristics across the sherry list, with the same confirm-before-grading flow as the other tests.

---

### 🎉 Holiday Menus

Special-event menus (e.g. Mother's Day) presented as printable course-by-course menus, with their own review and test pages tied to each event.

---

### ⚠️ Allergies

#### Menu Allergen Guide
Search every menu item by name or filter by allergen (gluten, dairy, eggs, soy, tree nuts, peanuts, fish, shellfish, sesame). Toggle **Safe Options** mode to invert the filter and show only items free of the selected allergens. Each card lists the allergens present so servers can answer guest questions confidently.

---

## Project Structure

```
wine_study/
├── data/
│   ├── wines_by_the_glass.csv     # Source of truth for wine data
│   └── fish.csv                   # Source of truth for fish data
├── scripts/
│   └── csv_to_json.py             # Converts wine CSV to JSON for the web app
└── web/                           # React application (Vite)
    ├── public/
    │   ├── audio/                 # MP3 pronunciation files (1.mp3 – 16.mp3)
    │   ├── background.jpg         # Page background image
    │   ├── og-image.svg           # Open Graph link preview image
    │   ├── grapes_dark.jpg        # Header accent image
    │   └── meson_sabika_logo.png  # Restaurant logo
    └── src/
        ├── components/
        │   ├── Header/            # Logo, title, navigation home button
        │   ├── Footer/            # Copyright footer
        │   ├── WineCard/          # Wine detail card used on review page
        │   ├── FishCard/          # Fish detail card used on fish review page
        │   └── FishChart/         # Oil content × flake size scatter chart
        ├── data/
        │   ├── wines.json                # Wines by the glass (generated from CSV)
        │   ├── wines_by_the_bottle.json  # Bottle wine list
        │   ├── fish.json                 # Fish program data
        │   ├── menu.json                 # Tapas menu (72 items w/ ingredients, sauces, dietary)
        │   ├── sherry.json               # Sherry list
        │   ├── allergies.json            # Allergen data per menu item
        │   └── mothers_day_2026.json     # Holiday menu (Mother's Day 2026)
        └── pages/
            ├── HomePage/             # Notebook-style landing page
            ├── ReviewPage/           # Wines by the glass — sort/group controls
            ├── BottleReviewPage/     # Wines by the bottle — grouped by region
            ├── TestPage/              # Randomized wine quiz
            ├── PronunciationPage/    # Audio pronunciation practice
            ├── TapasReviewPage/      # Tapas menu browser w/ type & dietary filters
            ├── TapasTestPage/        # Randomized tapas quiz (sauce, ingredient, multi-select, description)
            ├── FishReviewPage/       # Fish browser w/ sort controls and scatter chart
            ├── FishTestPage/         # Randomized fish quiz
            ├── SherryReviewPage/     # Sherry browser
            ├── SherryTestPage/       # Randomized sherry quiz
            ├── HolidayMenusPage/     # Holiday menu index
            ├── MothersDayPage/       # Mother's Day 2026 menu
            ├── MothersDayReviewPage/ # Mother's Day review
            ├── MothersDayTestPage/   # Mother's Day quiz
            └── AllergyPage/          # Allergen search & Safe Options filter
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3 (for wine data conversion script)

### Install & Run

```bash
cd web
npm install
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

### Wine CSV Columns

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

## Updating Fish Data

Fish data lives in `data/fish.csv` and is mirrored in `web/src/data/fish.json`. Edit `fish.json` directly to update the app.

### Fish CSV Columns

| Column | Description |
|---|---|
| `id` | Unique integer ID |
| `name` | Fish name |
| `oil_content` | `lean`, `semi-oily`, or `oily` |
| `firmness` | `medium` or `firm` |
| `flake_type` | `small flakes`, `medium flakes`, `large flakes`, or `fibrous` |
| `description` | Flavor and texture notes |

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
| Framework | React 19 |
| Bundler | Vite |
| Routing | React Router v7 |
| Styling | CSS Modules |
| Fonts | Playfair Display, Lato (Google Fonts) |
| Data | Static JSON bundled at build time |
| Audio | HTML5 `<audio>` element |
| Hosting | Cloudflare Workers |

---

## Design Notes

- Built mobile-first — primary use case is servers on phones during shift prep
- Background image uses a fixed attachment with dark overlay for readability
- Home page uses a notebook-style layout with each section themed by color: wine (deep red), tapas (green), fish (teal), sherry (gold), holiday (warm amber), allergy (orange)
- All interactive elements use `touch-action: manipulation` and `@media (hover: hover)` to ensure correct behavior on touchscreens
- Hover effects are desktop-only; tap feedback uses `:active` states
- All quizzes follow the same flow: confirm-before-grading, color-coded right/wrong feedback, end-of-test review of missed items
