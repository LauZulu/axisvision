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
 * Reserva / lista de espera: alguien dejó su nombre y su WhatsApp para que le
 * avisemos cuando un modelo esté disponible.
 *
 * Dos situaciones la producen y conviene distinguirlas (`source`):
 *  - `sold_out`: el modelo se agotó (stock 0).
 *  - `preview`:  la tienda todavía no acepta pagos (Wompi sin configurar) y la
 *    persona quería comprar. Son los contactos más valiosos del sistema: gente
 *    con intención de compra a la que hay que escribirle el día que se abra.
 *
 * NO es una lista de correo. Se escribe una vez por ciclo y siempre con enlace
 * de baja; mezclar esto con marketing quema la reputación del dominio.
 *
 * **La identidad de la fila es el teléfono, no el correo** (migración `...011`).
 * El correo es opcional: quien no lo deja se contacta por WhatsApp desde el
 * panel, y por eso `notifyProductAvailable()` NO marca esas filas como
 * `notified` — el aviso automático no las cubre y darlas por avisadas las
 * dejaría enterradas.
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
// que ya existe en vez de crear duplicados que producirían dos avisos.
//
// Son DOS índices porque hay dos formas de ser la misma persona. El del
// teléfono es el principal (es el dato obligatorio); el del correo sigue vivo
// para que nadie reciba dos veces el mismo correo por el mismo modelo aunque se
// apunte desde otro número. En Postgres los NULL son distintos entre sí dentro
// de un índice único, así que las reservas sin correo conviven sin chocar.
@Index('UQ_axis_stock_alert_product_phone', ['productId', 'phone'], { unique: true })
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

  /** Cómo se llama, para escribirle por WhatsApp sin sonar a robot. */
  @Column({ type: 'varchar', length: 120, nullable: true })
  name!: string | null

  /**
   * WhatsApp en forma canónica: solo dígitos, con indicativo y sin '+'
   * (`573123727253`). Lo normaliza `normalizePhone()` (src/lib/phone.ts) — es
   * lo que pide `wa.me` y lo que hace que el índice único sirva de algo.
   *
   * NULL solo en las filas anteriores a la migración `...011`, que se dieron de
   * alta con un formulario que únicamente pedía correo.
   */
  @Column({ type: 'varchar', length: 24, nullable: true })
  phone!: string | null

  /**
   * Opcional. Siempre en minúsculas y sin espacios (lo normaliza el servidor).
   * Sin correo no hay aviso automático: esa reserva se atiende por WhatsApp.
   */
  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null

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
