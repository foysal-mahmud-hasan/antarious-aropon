import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { Tier } from '@aropon/validators';
import { Body, Button, Caption, Card, Chip, SectionHeader, XStack, YStack } from '@aropon/ui';
import i18next from '../../lib/i18n';
import { api } from '../../lib/trpc';
import { useAuth } from '../../lib/auth';

const TIERS: Tier[] = ['t0', 't1'];

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const orgId = useAuth((s) => s.orgId)!;
  const locale = useAuth((s) => s.locale);
  const setLocale = useAuth((s) => s.setLocale);
  const signOut = useAuth((s) => s.signOut);
  const qc = useQueryClient();

  const orgQ = useQuery({ queryKey: ['org', orgId], queryFn: () => api.org.current.query() });
  const currentTier = orgQ.data?.tier;

  const switchTier = useMutation({
    mutationFn: (tier: Tier) => api.billing.setTier.mutate({ orgId, tier }),
    onSuccess: () => {
      void qc.invalidateQueries(); // refresh entitlement-gated screens
    },
  });

  function toggleLocale() {
    const next = locale === 'bn' ? 'en' : 'bn';
    setLocale(next);
    void i18next.changeLanguage(next);
  }

  return (
    <YStack gap="$md">
      <SectionHeader title={t('nav.settings')} />

      {/* TEST BUILD: switch tier to try T0 vs T1 features. Replaced by real billing in production. */}
      <Card gap="$md">
        <Body fontWeight="600">প্যাকেজ (টেস্ট)</Body>
        <Caption>
          {locale === 'bn' ? 'বর্তমান প্যাকেজ' : 'Current plan'}: {currentTier ? t(`tier.${currentTier}`) : '…'}
        </Caption>
        <XStack gap="$sm" flexWrap="wrap">
          {TIERS.map((tier) => (
            <Chip
              key={tier}
              label={t(`tier.${tier}`)}
              active={currentTier === tier}
              onPress={() => switchTier.mutate(tier)}
            />
          ))}
        </XStack>
      </Card>

      <Card gap="$md">
        <Body>{locale === 'bn' ? 'ভাষা: বাংলা' : 'Language: English'}</Body>
        <Button
          label={locale === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
          variant="outline"
          onPress={toggleLocale}
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
