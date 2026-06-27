import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Body, Button, Caption, Card, SectionHeader, YStack } from '@aropon/ui';
import i18next from '../../lib/i18n';
import { api } from '../../lib/trpc';
import { useAuth } from '../../lib/auth';
import { PLANS } from '../../lib/plans';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const orgId = useAuth((s) => s.orgId)!;
  const locale = useAuth((s) => s.locale);
  const setLocale = useAuth((s) => s.setLocale);
  const signOut = useAuth((s) => s.signOut);
  const qc = useQueryClient();

  const orgQ = useQuery({ queryKey: ['org', orgId], queryFn: () => api.org.current.query() });
  const currentPlan = PLANS.find((p) => p.id === orgQ.data?.tier);

  const resetData = useMutation({
    mutationFn: () => api.auth.resetMyData.mutate(),
    onSuccess: () => void qc.invalidateQueries(),
  });

  function toggleLocale() {
    const next = locale === 'bn' ? 'en' : 'bn';
    setLocale(next);
    void i18next.changeLanguage(next);
  }

  return (
    <YStack gap="$md">
      <SectionHeader title={t('nav.settings')} />

      <Card gap="$md">
        <Body fontWeight="700">👑 প্যাকেজ</Body>
        <Caption>
          বর্তমান: {currentPlan ? `${currentPlan.name} (${currentPlan.price}/মাস)` : '…'}
        </Caption>
        <Button
          label="সব প্যাকেজ দেখুন ও পরিবর্তন করুন →"
          variant="primary"
          onPress={() => router.push('/plans')}
        />
      </Card>

      <Card gap="$md">
        <Body>{locale === 'bn' ? 'ভাষা: বাংলা' : 'Language: English'}</Body>
        <Button
          label={locale === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
          variant="outline"
          onPress={toggleLocale}
        />
      </Card>

      <Card gap="$md">
        <Body fontWeight="600">🧹 {locale === 'bn' ? 'ডেটা রিসেট' : 'Reset data'}</Body>
        <Caption>
          {locale === 'bn'
            ? 'এই ওয়ার্কস্পেসের সব ডেটা মুছে নতুন করে শুরু করুন'
            : 'Wipe this workspace and start fresh'}
        </Caption>
        <Button
          label={locale === 'bn' ? 'আমার ডেটা রিসেট করুন' : 'Reset my data'}
          variant="outline"
          disabled={resetData.isPending}
          onPress={() => resetData.mutate()}
        />
      </Card>

      <Button
        label={locale === 'bn' ? 'লগ আউট' : 'Log out'}
        variant="danger"
        onPress={() => {
          signOut();
          router.replace('/sign-in');
        }}
      />
    </YStack>
  );
}
