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

  // Precio unitario COBRADO = precio del producto + extra del lente elegido.
  @Column({ type: 'integer' })
  unitPriceCop!: number

  @Column({ type: 'integer', default: 1 })
  quantity!: number

  // --- Personalización de lente (snapshot, igual que nombre/precio) ---

  @Column({ type: 'uuid', nullable: true })
  lensOptionId!: string | null

  // Nombre en español de la opción elegida al momento de comprar.
  @Column({ type: 'varchar', length: 120, nullable: true })
  lensOptionName!: string | null

  // Parte de `unitPriceCop` que corresponde al lente (0 si es el de fábrica).
  @Column({ type: 'integer', default: 0 })
  lensExtraPriceCop!: number

  // Datos de la fórmula médica cuando la opción los exige (texto libre del
  // cliente: OD/OI, esfera, cilindro, eje, adición…).
  @Column({ type: 'text', nullable: true })
  prescriptionNote!: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
