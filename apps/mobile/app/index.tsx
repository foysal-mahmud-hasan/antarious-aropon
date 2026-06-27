import { Redirect } from 'expo-router';
import { useAuth } from '../lib/auth';

export default function Index() {
  const userId = useAuth((s) => s.userId);
  return <Redirect href={userId ? '/finance' : '/sign-in'} />;
}
