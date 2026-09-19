import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
@Injectable()
export class HashService {
  async hash(value: string): Promise<string> { const salt = randomBytes(16).toString('hex'); const hash = (await scrypt(value, salt, 64)) as Buffer; return `${salt}:${hash.toString('hex')}`; }
  async compare(value: string, storedHash: string): Promise<boolean> { const [salt, hash] = storedHash.split(':'); if (!salt || !hash) return false; const derivedHash = (await scrypt(value, salt, 64)) as Buffer; const storedHashBuffer = Buffer.from(hash, 'hex'); return derivedHash.length === storedHashBuffer.length && timingSafeEqual(derivedHash, storedHashBuffer); }
}
