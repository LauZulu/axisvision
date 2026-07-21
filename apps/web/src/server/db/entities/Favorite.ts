import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm'

/**
 * Favorito de un usuario con cuenta. (Para invitados los favoritos viven en
 * localStorage; esta tabla se usa cuando hay sesión). Único por (usuario, producto).
 */
@Entity({ name: 'axis_favorite' })
@Index(['userId', 'productId'], { unique: true })
export class AxisFavorite {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  userId!: string

  @Column({ type: 'uuid' })
  productId!: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
