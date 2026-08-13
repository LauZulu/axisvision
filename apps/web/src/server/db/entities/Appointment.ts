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
 * Cita para tomar la fórmula.
 *
 * El configurador de la ficha pregunta primero si la persona tiene su fórmula a
 * la mano. Quien dice que no se quedaba sin salida: la compra exige graduación
 * y no se la podíamos pedir. Esta tabla es esa salida — deja su WhatsApp, el
 * modelo que le gustó y cuándo puede, y alguien le escribe para agendarla.
 *
 * **No es una reserva** (`axis_stock_alert`), aunque se parezcan en los campos.
 * Aquella responde "avísame cuando vuelva a haber"; esta, "necesito que me
 * midan la vista para poder comprar". Mezclarlas habría ensuciado la lista de
 * espera con gente que sí tiene el modelo disponible, y habría hecho que el
 * aviso automático de stock le escribiera a quien está esperando otra cosa.
 *
 * El teléfono se guarda canónico (`normalizePhone`), igual que en las reservas:
 * es lo que pide `wa.me` y lo que evita que "312 372 7253" y "+573123727253"
 * sean dos personas.
 */
export type AppointmentStatus =
  /** Recién pedida, nadie la ha atendido. */
  | 'pending'
  /** Ya se acordó día y hora con la persona. */
  | 'scheduled'
  /** Se le tomó la fórmula. */
  | 'done'
  /** No se concretó. */
  | 'cancelled'

/** Desde dónde la pidió. Hoy solo la ficha, pero el dato no se recupera después. */
export type AppointmentSource = 'product' | 'checkout' | 'other'

@Entity({ name: 'axis_appointment' })
export class AxisAppointment {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  /**
   * Modelo que le interesaba. Nullable a propósito: la cita vale igual sin él
   * (alguien que quiere tomarse la fórmula y todavía no eligió montura), y
   * hacerlo obligatorio habría dejado fuera justo ese caso.
   */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  productId!: string | null

  // Por NOMBRE DE TABLA, no de clase (ver la nota en Product.ts).
  @ManyToOne('axis_product', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'productId' })
  product!: AxisProduct | null

  /** Lente que estaba mirando. Contexto para la conversación, no un compromiso. */
  @Column({ type: 'uuid', nullable: true })
  lensOptionId!: string | null

  @Column({ type: 'varchar', length: 120 })
  name!: string

  /** WhatsApp canónico (solo dígitos con indicativo). Es el canal de respuesta. */
  @Index()
  @Column({ type: 'varchar', length: 24 })
  phone!: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null

  /** Dónde está: decide a qué óptica aliada se le manda. */
  @Column({ type: 'varchar', length: 120, nullable: true })
  city!: string | null

  /** Cuándo le sirve, en sus palabras ("mañanas entre semana"). */
  @Column({ type: 'varchar', length: 200, nullable: true })
  preferredTime!: string | null

  /** Lo que quiera añadir. */
  @Column({ type: 'text', nullable: true })
  note!: string | null

  @Index()
  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status!: AppointmentStatus

  @Column({ type: 'varchar', length: 16, default: 'product' })
  source!: AppointmentSource

  @Column({ type: 'varchar', length: 8, default: 'es' })
  locale!: string

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
