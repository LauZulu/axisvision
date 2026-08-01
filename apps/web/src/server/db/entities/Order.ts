import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import type { AxisOrderItem } from './OrderItem'

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'failed'

/**
 * Pedido / venta. Soporta compra como INVITADO (`userId` nulo) con los datos
 * de contacto/envío escritos en el checkout. Si el comprador crea cuenta, se
 * enlaza por `userId`. `reference` es la referencia única para Wompi (Fase 7).
 */
@Entity({ name: 'axis_order' })
export class AxisOrder {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  reference!: string

  /**
   * Clave que manda el navegador para que un doble clic en "pagar" no cree dos
   * pedidos. Única (los NULL no chocan entre sí en Postgres); nula en los
   * pedidos anteriores a la migración `...006`.
   */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64, nullable: true })
  idempotencyKey!: string | null

  @Index()
  @Column({ type: 'uuid', nullable: true })
  userId!: string | null

  @Column({ type: 'varchar', length: 120 })
  customerName!: string

  @Index()
  @Column({ type: 'varchar', length: 255 })
  customerEmail!: string

  @Column({ type: 'varchar', length: 40, nullable: true })
  customerPhone!: string | null

  // Dirección/notas de envío (estructura flexible).
  @Column({ type: 'jsonb', nullable: true })
  shipping!: Record<string, unknown> | null

  @Column({ type: 'integer' })
  amountCop!: number

  @Column({ type: 'varchar', length: 8, default: 'COP' })
  currency!: string

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status!: OrderStatus

  @Column({ type: 'varchar', length: 128, nullable: true })
  wompiTransactionId!: string | null

  // Método con el que se pagó (CARD, NEQUI, PSE, …) — lo reporta el webhook.
  @Column({ type: 'varchar', length: 32, nullable: true })
  paymentMethodType!: string | null

  @Column({ type: 'timestamptz', nullable: true })
  paidAt!: Date | null

  @OneToMany('AxisOrderItem', 'order', { cascade: true })
  items!: AxisOrderItem[]

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
