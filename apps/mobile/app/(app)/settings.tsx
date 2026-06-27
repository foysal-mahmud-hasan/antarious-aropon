import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import i18next from '../../lib/i18n';
import { Body, Button, Card, Heading, YStack } from '@aropon/ui';
import { useAuth } from '../../lib/auth';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const locale = useAuth((s) => s.locale);
  const setLocale = useAuth((s) => s.setLocale);
  const signOut = useAuth((s) => s.signOut);

  function toggleLocale() {
    const next = locale === 'bn' ? 'en' : 'bn';
    setLocale(next);
    void i18next.changeLanguage(next);
  }

  return (
    <YStack gap="$lg">
      <Heading>{t('nav.settings')}</Heading>
      <Card gap="$md">
        <Body>{locale === 'bn' ? 'ভাষা: বাংলা' : 'Language: English'}</Body>
        <Button label={locale === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'} variant="outline" onPress={toggleLocale} />
      </Card>
      <Button
        label={t('common.cancel')}
        variant="danger"
        onPress={() => {
          signOut();
          router.replace('/sign-in');
        }}
      />
    </YStack>
  );
}
