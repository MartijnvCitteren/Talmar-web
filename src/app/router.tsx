import { Navigate, Route, Routes } from 'react-router-dom';
import { DashboardPage } from '../pages/dashboard';
import { SignupPage } from '../pages/signup';
import { SignupVerifyPage } from '../pages/signup-verify';
import { VacancyCreatePage } from '../pages/vacancy-create';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/vacancies/new" replace />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/signup/verify" element={<SignupVerifyPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/vacancies/new" element={<VacancyCreatePage />} />
    </Routes>
  );
}
