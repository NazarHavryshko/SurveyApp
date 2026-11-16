import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';
import { CreateSurveyPage } from './pages/CreateSurveyPage';
import { MySurveysPage } from './pages/MySurveyPage';
import { SurveysFilterPage } from './pages/SurveysFilterPage';
import { TakeSurveyPage } from './pages/TakeSurveyPage';
import { SurveyAnalysisPage } from './pages/SurveyAnalysisPage';
import { ModerationPage } from './pages/ModerationPage';
import { BookmarkedSurveysPage } from './pages/BookmarkedSurveysPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-app text-main flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 pt-6 pb-24 md:py-10">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/surveys/create" element={<CreateSurveyPage />} />
            <Route path="/my-surveys" element={<MySurveysPage />} />
            <Route path="/surveys" element={<SurveysFilterPage />} />
            <Route path="/survey/play" element={<TakeSurveyPage />} />
            <Route path="/survey/:id" element={<TakeSurveyPage />} />
            <Route path="/surveys/:id/analysis" element={<SurveyAnalysisPage />} />
            <Route path="/moderation" element={<ModerationPage />} />
            <Route path="/bookmarks" element={<BookmarkedSurveysPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}