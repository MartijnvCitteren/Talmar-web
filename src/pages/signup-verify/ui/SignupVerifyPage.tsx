import { Navigate, useNavigate } from 'react-router-dom';
import { readSignupSession } from '../../../entities/account';
import { CheckYourMail } from '../../../features/verify-email';
import { Logo, OnboardingLayout } from '../../../shared/ui';

export function SignupVerifyPage() {
  const navigate = useNavigate();
  const session = readSignupSession();

  // Landing here without having signed up in this tab: nothing to wait for.
  if (!session) {
    return <Navigate to="/signup" replace />;
  }

  return (
    <OnboardingLayout leading={<Logo variant="lockup" />}>
      <CheckYourMail accountId={session.accountId} onVerified={() => navigate('/dashboard', { replace: true })} />
    </OnboardingLayout>
  );
}
