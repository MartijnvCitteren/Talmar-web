import { Navigate, Route, Routes } from 'react-router-dom';
import { OnboardingPage } from '../pages/onboarding';
import { VacancyCreatePage } from '../pages/vacancy-create';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/vacancies/new" replace />} />
      <Route path="/vacancies/new" element={<VacancyCreatePage />} />
      {/* The last sign-up step, after the Keycloak pages: outside the app shell, no navigation yet. */}
      <Route path="/onboarding" element={<OnboardingPage />} />
    </Routes>
  );
}
