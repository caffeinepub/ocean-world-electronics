// ============================================================
// backend.ts - STUB (ICP backend removed)
// All backend operations now use Firebase Firestore.
// See: src/services/firestoreService.ts
// ============================================================

export type { backendInterface } from "./backend.d";
export class ExternalBlob {
  async getBytes(): Promise<Uint8Array> { return new Uint8Array(); }
  onProgress?: (p: number) => void;
  static fromURL(_url: string): ExternalBlob { return new ExternalBlob(); }
}
export function createActor(
  _canisterId: string,
  _upload: unknown,
  _download: unknown,
  _options: unknown
) { return null; }
export type CreateActorOptions = Record<string, unknown>;
