import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
// import de TIPO (ver nota en Product.ts sobre el ciclo de imports de valor).
import type { AxisProduct } from './Product'

/** Dónde está físicamente la unidad. Mapea la columna G del inventario:
 *  0 → 'fds', 1 → 'casa', 2 → 'local', 3 → 'sold'. */
export type UnitLocation = 'fds' | 'casa' | 'local' | 'sold'

/** Lente con el que salió de fábrica. Las gafas vienen con sol polarizado; las
 *  oftálmicas (sufijo "/O" en el inventario) son de lente transparente. */
export type UnitLensType = 'sunglass_polarized' | 'ophthalmic'

/**
 * Una gafa FÍSICA (un serial: AX01, AX02…). El inventario es por unidad, no por
 * cantidad: esto da trazabilidad real y permite DERIVAR `axis_product.stock` en
 * vez de teclearlo (ver `syncStockFromUnits` en src/server/inventory.ts).
 *
 * Una unidad cuenta como stock vendible si `sellable` y `location` ∈ (casa, local).
 */
@Entity({ name: 'axis_product_unit' })
export class AxisProductUnit {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  // Serial del inventario: "AX01". Único en toda la operación.
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 24 })
  code!: string

  @Index()
  @Column({ type: 'uuid' })
  productId!: string

  @ManyToOne('AxisProduct', 'units', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product!: AxisProduct

  // Consecutivo dentro del modelo (columna "Unidad" del inventario).
  @Column({ type: 'integer' })
  unitNumber!: number

  @Column({ type: 'varchar', length: 24, default: 'sunglass_polarized' })
  lensType!: UnitLensType

  @Column({ type: 'varchar', length: 16, default: 'casa' })
  location!: UnitLocation

  // false = no cuenta para el stock publicado (hoy: las oftálmicas, que se usan
  // como muestra). El admin puede activarlas sin tocar código.
  @Column({ type: 'boolean', default: true })
  sellable!: boolean

  // Texto libre operativo (columna ADICIONAL): "COMERCIO VA CON PAPELETA", etc.
  @Column({ type: 'text', nullable: true })
  note!: string | null

  // Línea de pedido que se llevó esta unidad (se asigna al despachar).
  @Column({ type: 'uuid', nullable: true })
  orderItemId!: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
