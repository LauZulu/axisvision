import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'

export type UserRole = 'user' | 'admin'

/**
 * Usuario de AXIS. La cuenta es OPCIONAL para compradores (checkout invitado);
 * el rol `admin` habilita el panel. El hash de contraseña va `select: false`
 * para no filtrarse en respuestas normales (se recupera con addSelect en auth).
 */
@Entity({ name: 'axis_user' })
export class AxisUser {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email!: string

  // Hash bcrypt — nunca sale en respuestas normales.
  @Column({ type: 'varchar', length: 255, select: false })
  password!: string

  @Column({ type: 'varchar', length: 120, nullable: true })
  name!: string | null

  @Column({ type: 'varchar', length: 40, nullable: true })
  phone!: string | null

  @Column({ type: 'varchar', length: 16, default: 'user' })
  role!: UserRole

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
