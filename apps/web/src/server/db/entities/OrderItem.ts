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

  // Datos de la fórmula médica cuando la línea la lleva, en TEXTO: es lo que
  // lee la persona que manda a tallar. Cuando la fórmula vino del formulario de
  // la ficha, este campo lo escribe `describePrescription()`; en los pedidos
  // anteriores es lo que el cliente tecleó a mano en el checkout.
  @Column({ type: 'text', nullable: true })
  prescriptionNote!: string | null

  /**
   * La fórmula ESTRUCTURADA (esfera, cilindro, eje, adición y DIP por ojo),
   * tal como la capturó el formulario. El texto de arriba se lee; esto se
   * calcula: es lo que permite recotizar un pedido o reclamarle al laboratorio
   * sin volver a parsear un párrafo.
   *
   * `jsonb` y no columnas sueltas porque son diez campos que solo tienen
   * sentido juntos y que nunca se filtran por separado. null = pedido sin
   * fórmula, o de los anteriores al formulario.
   */
  @Column({ type: 'jsonb', nullable: true })
  prescriptionRx!: Record<string, unknown> | null

  /** 'single' | 'progressive'. Redundante con el jsonb, pero se lista mucho. */
  @Column({ type: 'varchar', length: 16, nullable: true })
  prescriptionRxType!: string | null

  /** Índice aplicado ('1.60'). Es lo que el laboratorio necesita para tallar. */
  @Column({ type: 'varchar', length: 8, nullable: true })
  prescriptionIndex!: string | null

  /**
   * true = el precio de la fórmula salió de la fórmula genérica y no de la
   * lista del laboratorio (ver `LensQuote.estimated`). Se guarda en el pedido
   * porque es el aviso que se le dio al cliente al comprar: sin él, meses
   * después nadie sabría si aquel número era firme o aproximado.
   */
  @Column({ type: 'boolean', default: false })
  prescriptionEstimated!: boolean

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
