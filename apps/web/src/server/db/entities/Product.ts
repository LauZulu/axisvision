import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
// import de TIPO (se borra al compilar) + relación por NOMBRE de entidad, para
// romper el ciclo de imports de valor Product↔ProductImage (evita TDZ al bundlear).
import type { AxisProductImage } from './ProductImage'

/**
 * Producto AXIS. El copy es bilingüe en la propia DB (editable desde el admin).
 * `stock` es el número de unidades disponibles. Los precios en COP (pesos).
 */
@Entity({ name: 'axis_product' })
export class AxisProduct {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120 })
  slug!: string

  // Nombre de marca (igual en ambos idiomas): "AXIS Onyx".
  @Column({ type: 'varchar', length: 120 })
  name!: string

  @Column({ type: 'varchar', length: 200 })
  taglineEs!: string

  @Column({ type: 'varchar', length: 200 })
  taglineEn!: string

  @Column({ type: 'text' })
  descriptionEs!: string

  @Column({ type: 'text' })
  descriptionEn!: string

  // Precio en pesos colombianos (COP). Para Wompi se multiplica ×100 (centavos).
  @Column({ type: 'integer' })
  priceCop!: number

  // Precio "anterior" para mostrar descuento (tachado + badge −%). Si es null o
  // <= priceCop no hay descuento. El precio de cobro SIEMPRE es priceCop.
  @Column({ type: 'integer', nullable: true })
  compareAtPriceCop!: number | null

  @Column({ type: 'varchar', length: 8, default: 'COP' })
  currency!: string

  // Unidades disponibles (número). El admin lo ajusta; el checkout lo descuenta.
  @Column({ type: 'integer', default: 0 })
  stock!: number

  // Visible en la tienda.
  @Column({ type: 'boolean', default: true })
  active!: boolean

  // Orden en la rejilla de la tienda.
  @Column({ type: 'integer', default: 0 })
  position!: number

  @OneToMany('AxisProductImage', 'product', { cascade: true })
  images!: AxisProductImage[]

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
