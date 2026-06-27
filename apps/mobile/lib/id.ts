import * as Crypto from 'expo-crypto';

/** Cross-platform UUID (web + native) for offline-first client-generated ids. */
export function newId(): string {
  return Crypto.randomUUID();
}
