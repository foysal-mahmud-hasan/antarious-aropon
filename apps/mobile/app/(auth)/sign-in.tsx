import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Body, Button, Caption, Card, Heading, Input, YStack } from '@aropon/ui';
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
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function requestOtp() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.auth.requestOtp.mutate({ phone });
      setStage('otp');
      // Dev/test build returns the code so testers can sign in without an SMS gateway.
      if ('devCode' in res && res.devCode) {
        setDevCode(res.devCode);
        setToken(res.devCode);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'কিছু একটা সমস্যা হয়েছে');
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.auth.verifyOtp.mutate({ phone, token });
      const orgId = res.orgs[0]?.orgId;
      if (!orgId) throw new Error('No organization found');
      signIn({ userId: res.user.id, token: res.token, orgId });
      router.replace('/finance');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'যাচাই ব্যর্থ হয়েছে');
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
            {devCode ? (
              <Caption>আপনার কোড: {devCode} (টেস্ট মোড)</Caption>
            ) : null}
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
        {error ? <Body color="$expense">{error}</Body> : null}
      </Card>
    </YStack>
  );
}
