import { Redirect } from 'expo-router';
import { useAuth } from '../lib/auth';

export default function Index() {
  const hydrated = useAuth((s) => s.hydrated);
  const userId = useAuth((s) => s.userId);
  // Wait for the persisted session to rehydrate before deciding where to send the user.
  if (!hydrated) return null;
  return <Redirect href={userId ? '/finance' : '/sign-in'} />;
}
