import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import HomePage from './pages/HomePage/HomePage';
import ReviewPage from './pages/ReviewPage/ReviewPage';
import TestPage from './pages/TestPage/TestPage';
import PronunciationPage from './pages/PronunciationPage/PronunciationPage';
import BottleReviewPage from './pages/BottleReviewPage/BottleReviewPage';
import FishReviewPage from './pages/FishReviewPage/FishReviewPage';
import FishTestPage from './pages/FishTestPage/FishTestPage';
import HolidayMenusPage from './pages/HolidayMenusPage/HolidayMenusPage';
import MothersDayPage from './pages/MothersDayPage/MothersDayPage';
import MothersDayReviewPage from './pages/MothersDayReviewPage/MothersDayReviewPage';
import MothersDayTestPage from './pages/MothersDayTestPage/MothersDayTestPage';
import SherryReviewPage from './pages/SherryReviewPage/SherryReviewPage';
import SherryTestPage from './pages/SherryTestPage/SherryTestPage';
import AllergyPage from './pages/AllergyPage/AllergyPage';
import styles from './App.module.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className={styles.layout}>
        <Header />
        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/test" element={<TestPage />} />
            <Route path="/pronunciation" element={<PronunciationPage />} />
            <Route path="/bottle-review" element={<BottleReviewPage />} />
            <Route path="/fish-review" element={<FishReviewPage />} />
            <Route path="/fish-test" element={<FishTestPage />} />
            <Route path="/holiday" element={<HolidayMenusPage />} />
            <Route path="/holiday/mothers-day-2026" element={<MothersDayPage />} />
            <Route path="/holiday/mothers-day-2026/review" element={<MothersDayReviewPage />} />
            <Route path="/holiday/mothers-day-2026/test" element={<MothersDayTestPage />} />
            <Route path="/sherry-review" element={<SherryReviewPage />} />
            <Route path="/sherry-test" element={<SherryTestPage />} />
            <Route path="/allergy" element={<AllergyPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
