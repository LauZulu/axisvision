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
import type { AxisLensOption } from './LensOption'
import type { LensIndex, RxType } from '../../../lib/prescription'

/**
 * Precio de un lente CON graduación, tal como lo cotiza el laboratorio.
 *
 * `axis_lens_option.extraPriceCop` es el precio del lente TERMINADO (sin
 * graduar): sirve para quien compra unas gafas de sol y no para quien lleva
 * fórmula. El mismo lente cambia de precio con dos cosas —el tipo de
 * graduación (una progresiva es otro tallado) y el índice del material, que a
 * su vez sale de la potencia— y esta tabla es esa matriz.
 *
 * **Lo que no está aquí no rompe nada**: `quoteLens()` cae a la fórmula
 * genérica (`estimateRxPrice`) y marca el resultado como estimado. La tabla se
 * llena renglón a renglón desde `/admin/lentes` a medida que el laboratorio
 * confirme precios, y cada fila nueva apaga una estimación. El default seguro
 * es "puedo dar un número aproximado", no "no puedo vender".
 */
@Entity({ name: 'axis_lens_rx_price' })
// Un precio por combinación: sin el único, dos filas para el mismo (lente,
// tipo, índice) dejarían el cobro a merced del orden de lectura.
@Index('UQ_axis_lens_rx_price', ['lensOptionId', 'rxType', 'lensIndex'], { unique: true })
export class AxisLensRxPrice {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index()
  @Column({ type: 'uuid' })
  lensOptionId!: string

  // Por NOMBRE DE TABLA, no de clase (ver la nota en Product.ts).
  @ManyToOne('axis_lens_option', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lensOptionId' })
  lensOption!: AxisLensOption

  /** `single` = monofocal, `progressive` = progresiva. */
  @Column({ type: 'varchar', length: 16 })
  rxType!: RxType

  /** Índice de refracción: '1.50' … '1.74'. */
  @Column({ type: 'varchar', length: 8 })
  lensIndex!: LensIndex

  /**
   * Precio TOTAL del lente graduado, no un recargo sobre el terminado. Se
   * guarda así porque es como viene la lista del laboratorio (cada renglón es
   * un producto con su precio); el desglose "base + fórmula" que ve el cliente
   * lo calcula `quoteLens()`.
   */
  @Column({ type: 'integer' })
  priceCop!: number

  /**
   * Qué cuesta el antirreflejo sobre ESTE lente graduado. `null` = ya lo trae
   * puesto — mismo significado que en `axis_lens_option.arExtraPriceCop`, y por
   * el mismo motivo: el tratamiento no vale igual sobre cada material.
   */
  @Column({ type: 'integer', nullable: true })
  arExtraPriceCop!: number | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
