import { styled, Text } from '@tamagui/core';

export const Heading = styled(Text, {
  name: 'Heading',
  fontFamily: '$heading',
  color: '$color',
  fontWeight: '700',
  fontSize: '$7',
});

export const Body = styled(Text, {
  name: 'Body',
  fontFamily: '$body',
  color: '$color',
  fontSize: '$3',
});

export const Caption = styled(Text, {
  name: 'Caption',
  fontFamily: '$body',
  color: '$colorSecondary',
  fontSize: '$2',
});
