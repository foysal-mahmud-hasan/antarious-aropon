import { Body, Caption, Stack, XStack } from '@aropon/ui';

export function MessageBubble({
  sender,
  body,
}: {
  sender: 'customer' | 'shop' | 'auto';
  body: string;
}) {
  const fromShop = sender !== 'customer';
  return (
    <XStack justifyContent={fromShop ? 'flex-end' : 'flex-start'}>
      <Stack
        maxWidth="82%"
        backgroundColor={fromShop ? '$primary' : '$backgroundPress'}
        paddingHorizontal="$md"
        paddingVertical="$sm"
        borderRadius="$lg"
      >
        <Body color={fromShop ? '$colorInverse' : '$color'}>{body}</Body>
        {sender === 'auto' ? (
          <Caption color={fromShop ? '$colorInverse' : '$colorSecondary'}>অটো-রিপ্লাই</Caption>
        ) : null}
      </Stack>
    </XStack>
  );
}
