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

// `findById` y `emailExists` vivían aquí para /api/auth/me y /api/auth/register.
// Ambas rutas se eliminaron: la tienda es de invitado y el único que necesita
// cuenta es el admin, que se crea con `scripts/seed.ts`. Si algún día hay
// cuentas de cliente, se reponen junto con sus endpoints.
