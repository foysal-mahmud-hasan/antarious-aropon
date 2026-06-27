/** Tiny global confetti emitter. `fireConfetti()` triggers any mounted <ConfettiHost/>. */
type Listener = () => void;
const listeners = new Set<Listener>();

export function fireConfetti(): void {
  listeners.forEach((l) => l());
}

export function onConfetti(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
