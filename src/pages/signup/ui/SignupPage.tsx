import { useNavigate } from 'react-router-dom';
import { SignupWizard } from '../../../features/sign-up';

export function SignupPage() {
  const navigate = useNavigate();
  return <SignupWizard onCompleted={() => navigate('/signup/verify')} />;
}
