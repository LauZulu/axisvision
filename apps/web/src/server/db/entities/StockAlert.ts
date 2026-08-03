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
import type { AxisProduct } from './Product'

/**
 * Reserva / lista de espera: alguien dejó su correo para que le avisemos
 * cuando un modelo esté disponible.
 *
 * Dos situaciones la producen y conviene distinguirlas (`source`):
 *  - `sold_out`: el modelo se agotó (stock 0).
 *  - `preview`:  la tienda todavía no acepta pagos (Wompi sin configurar) y la
 *    persona quería comprar. Son los correos más valiosos del sistema: gente
 *    con intención de compra a la que hay que escribirle el día que se abra.
 *
 * NO es una lista de correo. Se escribe una vez por ciclo y siempre con enlace
 * de baja; mezclar esto con marketing quema la reputación del dominio.
 */
export type StockAlertStatus =
  /** Correo sin verificar (solo con doble opt-in activado). */
  | 'pending'
  /** En espera: es a quien se le avisa. */
  | 'active'
  /** Ya se le avisó de este ciclo. */
  | 'notified'
  /** Se dio de baja. */
  | 'unsubscribed'

export type StockAlertSource = 'sold_out' | 'preview'

@Entity({ name: 'axis_stock_alert' })
// Una persona, un modelo, una sola fila: si vuelve a apuntarse se reactiva la
// que ya existe en vez de crear duplicados que producirían dos correos.
@Index('UQ_axis_stock_alert_product_email', ['productId', 'email'], { unique: true })
export class AxisStockAlert {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index()
  @Column({ type: 'uuid' })
  productId!: string

  // Por NOMBRE DE TABLA, no de clase (ver la nota en Product.ts).
  @ManyToOne('axis_product', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product!: AxisProduct

  /** Siempre en minúsculas y sin espacios (lo normaliza el servidor). */
  @Column({ type: 'varchar', length: 255 })
  email!: string

  @Index()
  @Column({ type: 'varchar', length: 16, default: 'active' })
  status!: StockAlertStatus

  @Column({ type: 'varchar', length: 16, default: 'sold_out' })
  source!: StockAlertSource

  /**
   * Idioma en el que escribirle. Hoy siempre 'es' (solo vendemos en Colombia),
   * pero se guarda desde ya: recuperar el idioma después es imposible.
   */
  @Column({ type: 'varchar', length: 8, default: 'es' })
  locale!: string

  /**
   * Token de un solo uso para confirmar y para darse de baja. Va en la URL de
   * los correos, así que es aleatorio y opaco — nunca el id de la fila.
   */
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  token!: string

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt!: Date | null

  /** Última vez que se le avisó de disponibilidad. */
  @Column({ type: 'timestamptz', nullable: true })
  notifiedAt!: Date | null

  @Column({ type: 'timestamptz', nullable: true })
  unsubscribedAt!: Date | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
