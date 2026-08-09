import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm'
import type { AxisProduct } from './Product'
import type { AxisLensOption } from './LensOption'

/**
 * Qué opciones de lente ofrece CADA modelo.
 *
 * Regla central: **sin filas = las ofrece todas**. Las opciones son globales y
 * casi todos los modelos las ofrecen enteras, así que la tabla solo guarda la
 * excepción; un producto sin filas se comporta exactamente como antes de que
 * esta tabla existiera (y un modelo nuevo no nace sin lentes por descuido).
 *
 * Existe porque el catálogo tiene un modelo deportivo (Apex) con un ÚNICO
 * lente: la ficha le ofrecía transitions o lente transparente, que no existen
 * para él, y el servidor le habría cobrado el sobrecosto de un lente que nadie
 * puede fabricar. Se modela por producto y no con una categoría "sport" porque
 * lo que varía de verdad es qué lentes ofrece cada modelo, no a qué familia
 * pertenece: una segunda deportiva con dos lentes rompería la categoría.
 *
 * Guarda opciones de los DOS tipos (`kind`): así se puede decir tanto qué
 * lentes ofrece un modelo como si admite fórmula médica.
 */
@Entity({ name: 'axis_product_lens_option' })
@Index(['productId'])
export class AxisProductLensOption {
  @PrimaryColumn({ type: 'uuid' })
  productId!: string

  @PrimaryColumn({ type: 'uuid' })
  lensOptionId!: string

  // Relaciones por NOMBRE DE TABLA (ver la nota en Product.ts).
  @ManyToOne('axis_product', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product!: AxisProduct

  @ManyToOne('axis_lens_option', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lensOptionId' })
  lensOption!: AxisLensOption

  // Orden en el que se ofrece dentro del producto (0 = primero). Sin uso hoy:
  // la ficha respeta el `position` global de la opción.
  @Column({ type: 'integer', default: 0 })
  position!: number
}
