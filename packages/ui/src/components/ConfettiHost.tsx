import { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, View } from 'react-native';
import { onConfetti } from '../confetti';

const EMOJI = ['🎉', '✨', '💙', '⭐', '🎊', '💫'];

/** Mount once at the app root. Renders a celebratory burst whenever fireConfetti() is called. */
export function ConfettiHost() {
  const [bursts, setBursts] = useState<number[]>([]);
  const seq = useRef(0);
  useEffect(
    () =>
      onConfetti(() => {
        const id = ++seq.current;
        setBursts((b) => [...b, id]);
      }),
    [],
  );
  return (
    <>
      {bursts.map((id) => (
        <Burst key={id} onDone={() => setBursts((b) => b.filter((x) => x !== id))} />
      ))}
    </>
  );
}

function Burst({ onDone }: { onDone: () => void }) {
  const width = Dimensions.get('window').width;
  const parts = useRef(
    Array.from({ length: 18 }, (_, i) => ({
      x: (Math.random() - 0.5) * Math.min(width * 0.7, 320),
      rot: Math.random() * 720 - 360,
      emoji: EMOJI[i % EMOJI.length],
      av: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    Animated.stagger(
      18,
      parts.map((p) =>
        Animated.timing(p.av, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ),
    ).start(() => onDone());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, alignItems: 'center' }}
    >
      {parts.map((p, i) => (
        <Animated.Text
          key={i}
          style={{
            position: 'absolute',
            top: '38%',
            fontSize: 22,
            opacity: p.av.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateX: p.av.interpolate({ inputRange: [0, 1], outputRange: [0, p.x] }) },
              { translateY: p.av.interpolate({ inputRange: [0, 1], outputRange: [0, 320] }) },
              { rotate: p.av.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.rot}deg`] }) },
            ],
          }}
        >
          {p.emoji}
        </Animated.Text>
      ))}
    </View>
  );
}
