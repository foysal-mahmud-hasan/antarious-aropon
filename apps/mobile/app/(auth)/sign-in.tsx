import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Body, Button, Caption, Card, Heading, Input, Stack, Text, XStack, YStack } from '@aropon/ui';
import { api } from '../../lib/trpc';
import { useAuth } from '../../lib/auth';

type Mode = 'own' | { demo: 't0' | 't1' };

const DEMOS: { tier: 't0' | 't1'; emoji: string; title: string; sub: string }[] = [
  { tier: 't0', emoji: '🧾', title: 'টায়ার ০ ডেমো', sub: 'অফলাইন হিসাব রক্ষা' },
  { tier: 't1', emoji: '🛍️', title: 'টায়ার ১ ডেমো', sub: 'সোশ্যাল কমার্স — ইনবক্স, অর্ডার, ক্যালেন্ডার' },
];

export default function SignIn() {
  const router = useRouter();
  const signIn = useAuth((s) => s.signIn);

  const [stage, setStage] = useState<'select' | 'otp'>('select');
  const [mode, setMode] = useState<Mode>('own');
  const [phone, setPhone] = useState('+8801');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startOwn() {
    setBusy(true);
    setError(null);
    try {
      const res = await api.auth.requestOtp.mutate({ phone });
      setMode('own');
      setOtp('devCode' in res && res.devCode ? res.devCode : '');
      setStage('otp');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'কিছু একটা সমস্যা হয়েছে');
    } finally {
      setBusy(false);
    }
  }

  function startDemo(tier: 't0' | 't1') {
    setMode({ demo: tier });
    setOtp('000000'); // cosmetic in test mode
    setError(null);
    setStage('otp');
  }

  async function cont() {
    setBusy(true);
    setError(null);
    try {
      const res =
        mode === 'own'
          ? await api.auth.verifyOtp.mutate({ phone, token: otp })
          : await api.auth.demoLogin.mutate({ tier: mode.demo });
      const orgId = res.orgs[0]?.orgId;
      if (!orgId) throw new Error('No workspace');
      signIn({ userId: res.user.id, token: res.token, orgId });
      // New own-number signups land on "choose your plan"; everyone else goes to the app.
      const firstTime = 'created' in res && res.created;
      router.replace(firstTime ? '/plans' : '/finance');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'যাচাই ব্যর্থ হয়েছে');
    } finally {
      setBusy(false);
    }
  }

  if (stage === 'otp') {
    const isDemo = mode !== 'own';
    return (
      <YStack gap="$lg">
        <YStack gap="$xs">
          <Heading fontSize="$8">যাচাই কোড</Heading>
          <Caption>{isDemo ? 'ডেমো অ্যাকাউন্ট — কোড বসানো আছে' : `${phone} এ পাঠানো কোড`}</Caption>
        </YStack>
        <Card gap="$md">
          <Caption>টেস্ট মোড — কোড স্বয়ংক্রিয়ভাবে বসানো ✅</Caption>
          <Input
            label="OTP"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            style={{ letterSpacing: 8, fontSize: 20, textAlign: 'center' }}
          />
          <Button label="এগিয়ে যান →" variant="primary" disabled={busy} fullWidth onPress={cont} />
          <Button label="← পেছনে" variant="ghost" onPress={() => setStage('select')} />
          {error ? <Body color="$expense">{error}</Body> : null}
        </Card>
      </YStack>
    );
  }

  return (
    <YStack gap="$lg">
      <YStack gap="$xs" alignItems="center">
        <Heading fontSize="$9" color="$primary">
          আরোপন
        </Heading>
        <Caption>আপনার ব্যবসার সঙ্গী</Caption>
      </YStack>

      <Card gap="$md">
        <Body fontWeight="700">📱 নিজের নম্বর দিয়ে লগইন</Body>
        <Input label="মোবাইল নম্বর" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Button label="কোড পাঠান" variant="primary" disabled={busy} fullWidth onPress={startOwn} />
      </Card>

      <YStack gap="$sm">
        <Caption>অথবা ডেমো হিসেবে চেষ্টা করুন (ক্লিন স্লেট)</Caption>
        {DEMOS.map((d) => (
          <Stack
            key={d.tier}
            onPress={() => startDemo(d.tier)}
            backgroundColor="$backgroundStrong"
            borderRadius="$lg"
            padding="$base"
            cursor="pointer"
            animation="quick"
            pressStyle={{ scale: 0.98 }}
            hoverStyle={{ y: -2 }}
            shadowColor="$shadowColor"
            shadowOpacity={0.1}
            shadowRadius={10}
            shadowOffset={{ width: 0, height: 4 }}
          >
            <XStack alignItems="center" gap="$md">
              <Text fontSize={26}>{d.emoji}</Text>
              <YStack flex={1}>
                <Body fontWeight="700">{d.title}</Body>
                <Caption>{d.sub}</Caption>
              </YStack>
              <Text fontSize={20} color="$primary">
                ›
              </Text>
            </XStack>
          </Stack>
        ))}
      </YStack>

      {error ? <Body color="$expense">{error}</Body> : null}
    </YStack>
  );
}
