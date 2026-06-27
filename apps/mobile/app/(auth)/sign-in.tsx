import { useState } from 'react';
import { TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Body, Button, Caption, Card, Heading, YStack } from '@aropon/ui';
import { palette, radius, space } from '@aropon/ui';
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
    <YStack flex={1} justifyContent="center" padding="$lg" backgroundColor="$background" gap="$lg">
      <YStack gap="$xs">
        <Heading fontSize="$9">{t('common.appName')}</Heading>
        <Caption>{t('auth.phoneLabel')}</Caption>
      </YStack>
      <Card>
        {stage === 'phone' ? (
          <YStack gap="$md">
            <Body>{t('auth.phoneLabel')}</Body>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoFocus
              style={{
                borderWidth: 1.5,
                borderColor: palette.border,
                backgroundColor: palette.chipBg,
                borderRadius: radius.md,
                minHeight: 48,
                paddingHorizontal: space.md,
                fontSize: 16,
                color: palette.textPrimary,
              }}
            />
            <Button label={t('auth.requestOtp')} disabled={busy} onPress={requestOtp} />
          </YStack>
        ) : (
          <YStack gap="$md">
            <Body>{t('auth.otpLabel')}</Body>
            <TextInput
              value={token}
              onChangeText={setToken}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              style={{
                borderWidth: 1.5,
                borderColor: palette.border,
                backgroundColor: palette.chipBg,
                borderRadius: radius.md,
                minHeight: 48,
                paddingHorizontal: space.md,
                fontSize: 18,
                letterSpacing: 6,
                color: palette.textPrimary,
              }}
            />
            <Button label={t('auth.verify')} variant="primary" disabled={busy} onPress={verify} />
          </YStack>
        )}
      </Card>
    </YStack>
  );
}
