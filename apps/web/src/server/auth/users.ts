import { getDb } from '../db'
import { AxisUser } from '../db/entities/User'

export type PublicUser = {
  id: string
  email: string
  name: string | null
  phone: string | null
  role: AxisUser['role']
}

export function toPublicUser(u: AxisUser): PublicUser {
  return { id: u.id, email: u.email, name: u.name, phone: u.phone, role: u.role }
}

/** Trae el usuario CON el hash (password es select:false por defecto). Solo en auth. */
export async function findByEmailWithPassword(email: string): Promise<AxisUser | null> {
  const db = await getDb()
  return db
    .getRepository(AxisUser)
    .createQueryBuilder('u')
    .addSelect('u.password')
    .where('u.email = :email', { email })
    .getOne()
}

export async function findById(id: string): Promise<AxisUser | null> {
  const db = await getDb()
  return db.getRepository(AxisUser).findOne({ where: { id } })
}

export async function emailExists(email: string): Promise<boolean> {
  const db = await getDb()
  const count = await db.getRepository(AxisUser).count({ where: { email } })
  return count > 0
}
