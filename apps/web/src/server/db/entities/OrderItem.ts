import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm'
import type { AxisOrder } from './Order'

/**
 * Línea de un pedido. Guarda un SNAPSHOT del nombre y precio al momento de la
 * compra (para que el historial no cambie si luego se edita/borra el producto).
 */
@Entity({ name: 'axis_order_item' })
export class AxisOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index()
  @Column({ type: 'uuid' })
  orderId!: string

  @ManyToOne('AxisOrder', 'items', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order!: AxisOrder

  // Referencia al producto (nullable: el producto puede borrarse después).
  @Column({ type: 'uuid', nullable: true })
  productId!: string | null

  @Column({ type: 'varchar', length: 120 })
  productName!: string

  @Column({ type: 'integer' })
  unitPriceCop!: number

  @Column({ type: 'integer', default: 1 })
  quantity!: number

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
