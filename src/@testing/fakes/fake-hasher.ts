import type HasherInterface from '../../application/@shared/hasher.interface.js';

/** Deterministic and instant: "secret" hashes to "hashed:secret". */
export default class FakeHasher implements HasherInterface {
  async hash(value: string): Promise<string> {
    return `hashed:${value}`;
  }

  async compare(value: string, hash: string): Promise<boolean> {
    return hash === `hashed:${value}`;
  }
}
