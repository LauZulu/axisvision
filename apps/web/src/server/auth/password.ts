import bcrypt from 'bcryptjs'

// bcrypt one-way, 10 salt rounds (el salt va embebido en el propio hash).
const SALT_ROUNDS = 10

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS)
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
