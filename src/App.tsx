import { Route, Routes, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupChoicePage from './pages/SignupChoicePage';
import SignupEmailPage from './pages/SignupEmailPage';
import SignupCategoriesPage from './pages/SignupCategoriesPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupChoicePage />} />
      <Route path="/signup/email" element={<SignupEmailPage />} />
      <Route path="/signup/categories" element={<SignupCategoriesPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
