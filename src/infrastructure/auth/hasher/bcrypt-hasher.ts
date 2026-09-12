import bcrypt from 'bcrypt';
import type HasherInterface from '../../../application/@shared/hasher.interface.js';

const SALT_ROUNDS = 10;

export default class BcryptHasher implements HasherInterface {
  hash(value: string): Promise<string> {
    return bcrypt.hash(value, SALT_ROUNDS);
  }

  compare(value: string, hash: string): Promise<boolean> {
    return bcrypt.compare(value, hash);
  }
}
