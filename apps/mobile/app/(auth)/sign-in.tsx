import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Caption, Card, Heading, Input, YStack } from '@aropon/ui';
import { api } from '../../lib/trpc';
import { useAuth } from '../../lib/auth';

export default function SignIn() {
  const { t } = useTranslation();
  const router = useRouter();
  const signIn = useAuth((s) => s.signIn);
  const [phone, setPhone] = useState('+8801');
  const [token, setToken] = useState('');
  const [stage, setStage] = useState<'phone' | 'otp'>('phone');
  const [busy, setBusy] = useState(false);

  async function requestOtp() {
    setBusy(true);
    try {
      await api.auth.requestOtp.mutate({ phone });
      setStage('otp');
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    try {
      await api.auth.verifyOtp.mutate({ phone, token });
      // Implementation step replaces this with the real Supabase session/user id.
      signIn({ userId: 'demo-user', token: 'demo-token' });
      router.replace('/finance');
    } finally {
      setBusy(false);
    }
  }

  return (
    <YStack gap="$lg">
      <YStack gap="$xs">
        <Heading fontSize="$9">{t('common.appName')}</Heading>
        <Caption>{t('auth.phoneLabel')}</Caption>
      </YStack>
      <Card>
        {stage === 'phone' ? (
          <YStack gap="$md">
            <Input
              label={t('auth.phoneLabel')}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoFocus
            />
            <Button label={t('auth.requestOtp')} disabled={busy} onPress={requestOtp} />
          </YStack>
        ) : (
          <YStack gap="$md">
            <Input
              label={t('auth.otpLabel')}
              value={token}
              onChangeText={setToken}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              style={{ letterSpacing: 6, fontSize: 18 }}
            />
            <Button label={t('auth.verify')} variant="primary" disabled={busy} onPress={verify} />
          </YStack>
        )}
      </Card>
    </YStack>
  );
}
