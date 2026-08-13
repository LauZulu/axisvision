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

  // Por NOMBRE DE TABLA, no de clase (ver la nota en Product.ts).
  @ManyToOne('axis_order', 'items', { onDelete: 'CASCADE' })
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

  // --- Complemento de antirreflejo (se monta sobre cualquier lente) ---

  // Opción `kind: 'coating'` aplicada. null = se compró sin antirreflejo.
  @Column({ type: 'uuid', nullable: true })
  coatingOptionId!: string | null

  @Column({ type: 'varchar', length: 120, nullable: true })
  coatingOptionName!: string | null

  // Parte de `unitPriceCop` que corresponde al antirreflejo. 0 cuando el lente
  // elegido ya lo traía incluido.
  @Column({ type: 'integer', default: 0 })
  coatingExtraPriceCop!: number

  // --- Complemento de fórmula médica (independiente del tipo de lente) ---

  // Opción `kind: 'prescription'` aplicada. null = se compró sin fórmula.
  @Column({ type: 'uuid', nullable: true })
  prescriptionOptionId!: string | null

  // Nombre en español del complemento al momento de comprar.
  @Column({ type: 'varchar', length: 120, nullable: true })
  prescriptionOptionName!: string | null

  // Parte de `unitPriceCop` que corresponde a montar la fórmula.
  @Column({ type: 'integer', default: 0 })
  prescriptionExtraPriceCop!: number

  // Datos de la fórmula médica cuando la línea la lleva (texto libre del
  // cliente: OD/OI, esfera, cilindro, eje, adición…).
  @Column({ type: 'text', nullable: true })
  prescriptionNote!: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
