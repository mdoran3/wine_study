import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import HomePage from './pages/HomePage/HomePage';
import ReviewPage from './pages/ReviewPage/ReviewPage';
import TestPage from './pages/TestPage/TestPage';
import PronunciationPage from './pages/PronunciationPage/PronunciationPage';
import FishReviewPage from './pages/FishReviewPage/FishReviewPage';
import FishTestPage from './pages/FishTestPage/FishTestPage';
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
            <Route path="/fish-review" element={<FishReviewPage />} />
            <Route path="/fish-test" element={<FishTestPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
