import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import type { ImageLensVariant } from './ProductImage'

/**
 * Opción de lente que el cliente elige al comprar. Las gafas salen con lente de
 * sol polarizado (la opción `isDefault`, sin costo); el resto son
 * personalizaciones que suman `extraPriceCop` al precio del producto.
 *
 * Las que llevan fórmula médica (`requiresPrescription`) piden los datos de la
 * fórmula en el checkout y se montan con la óptica aliada.
 *
 * Catálogo editable desde el panel admin: NO hardcodear opciones en el frontend.
 */
@Entity({ name: 'axis_lens_option' })
export class AxisLensOption {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 80 })
  slug!: string

  @Column({ type: 'varchar', length: 120 })
  nameEs!: string

  @Column({ type: 'varchar', length: 120 })
  nameEn!: string

  @Column({ type: 'varchar', length: 300, default: '' })
  descriptionEs!: string

  @Column({ type: 'varchar', length: 300, default: '' })
  descriptionEn!: string

  // Sobrecosto en COP sobre el precio del producto. 0 = incluido.
  @Column({ type: 'integer', default: 0 })
  extraPriceCop!: number

  // Pide fórmula médica en el checkout (se monta con la óptica aliada).
  @Column({ type: 'boolean', default: false })
  requiresPrescription!: boolean

  // La opción con la que vienen las gafas de fábrica. Solo una debería tenerlo.
  @Column({ type: 'boolean', default: false })
  isDefault!: boolean

  // Visible en la tienda. Las que aún no tienen precio definido van en false.
  @Column({ type: 'boolean', default: true })
  active!: boolean

  @Column({ type: 'integer', default: 0 })
  position!: number

  // Qué fotos del producto mostrar cuando se elige esta opción. Si el producto
  // no tiene fotos de esa variante, la ficha cae a las que tenga.
  @Column({ type: 'varchar', length: 24, nullable: true })
  imageVariant!: ImageLensVariant | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
