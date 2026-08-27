import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import type { ImageLensVariant } from './ProductImage'

/**
 * `lens` = un tipo de lente (excluyentes entre sí).
 * `prescription` = el complemento de fórmula médica.
 * `coating` = el antirreflejo, que se puede montar sobre cualquier lente.
 */
export type LensOptionKind = 'lens' | 'prescription' | 'coating'

/**
 * Opción del configurador de lente. Son DOS preguntas independientes, no una
 * lista de excluyentes — por eso el `kind`:
 *
 *  - `kind: 'lens'` → QUÉ lente lleva la montura (sol polarizado, transitions,
 *    filtro azul…). Excluyentes entre sí; el `isDefault` es el de fábrica y va
 *    sin costo.
 *  - `kind: 'prescription'` → ¿lo quiere CON su fórmula médica? Es un
 *    complemento que se suma a cualquier tipo de lente, no un lente aparte.
 *
 * Estaban aplanados en una sola lista y se contradecían: "Transitions" decía
 * "disponible con o sin fórmula" pero elegirlo dejaba la fórmula fuera del
 * alcance. El precio final es producto + lente + (fórmula si la pidió).
 *
 * Catálogo editable desde el panel admin: NO hardcodear opciones en el frontend.
 */
@Entity({ name: 'axis_lens_option' })
export class AxisLensOption {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 80 })
  slug!: string

  // Qué pregunta responde esta fila: el tipo de lente o el complemento de fórmula.
  @Column({ type: 'varchar', length: 16, default: 'lens' })
  kind!: LensOptionKind

  @Column({ type: 'varchar', length: 120 })
  nameEs!: string

  @Column({ type: 'varchar', length: 120 })
  nameEn!: string

  @Column({ type: 'varchar', length: 300, default: '' })
  descriptionEs!: string

  @Column({ type: 'varchar', length: 300, default: '' })
  descriptionEn!: string

  // Sobrecosto en COP sobre el precio del producto. 0 = incluido.
  @Column({ type: 'integer', default: 0 })
  extraPriceCop!: number

  /**
   * El precio no se puede anunciar: se confirma después (es el caso de la
   * fórmula médica, donde el valor depende de la graduación del cliente, que
   * llega DESPUÉS de la compra). Con esto en true no se cobra nada en el
   * checkout y la tienda muestra "por confirmar" en vez de un precio.
   *
   * No basta con dejar `extraPriceCop` en 0: la tienda entera pinta el cero
   * como "Incluido", o sea gratis, que es justo lo contrario de lo que pasa.
   */
  @Column({ type: 'boolean', default: false })
  priceOnQuote!: boolean

  /**
   * Solo en las filas `kind: 'lens'`: qué cuesta añadirle el ANTIRREFLEJO a
   * ESTE lente. `null` = ya lo trae puesto (se muestra incluido y no se cobra).
   *
   * El precio vive aquí y no en la fila del complemento porque no es el mismo
   * sobre cada lente: en la lista 2026 el AR sube 20.000 sobre el transparente
   * (BLANCO→AR) pero 70.000 sobre el fotocromático (PHOTOCROMATICO→PHOTO AR),
   * y el filtro azul (AR BLUE) ya lo lleva incluido. Un precio único habría
   * cobrado de menos en uno y dos veces en el otro.
   */
  @Column({ type: 'integer', nullable: true })
  arExtraPriceCop!: number | null

  // Pide fórmula médica en el checkout (se monta con la óptica aliada). Siempre
  // true en la fila `prescription`; un tipo de lente puede marcarlo si solo
  // existe graduado.
  @Column({ type: 'boolean', default: false })
  requiresPrescription!: boolean

  // La opción con la que vienen las gafas de fábrica. Solo una debería tenerlo.
  // No aplica a la fila `prescription`.
  @Column({ type: 'boolean', default: false })
  isDefault!: boolean

  // Visible en la tienda. Las que aún no tienen precio definido van en false.
  @Column({ type: 'boolean', default: true })
  active!: boolean

  @Column({ type: 'integer', default: 0 })
  position!: number

  // Qué fotos del producto mostrar cuando se elige esta opción. Si el producto
  // no tiene fotos de esa variante, la ficha cae a las que tenga.
  @Column({ type: 'varchar', length: 24, nullable: true })
  imageVariant!: ImageLensVariant | null

  /**
   * Color con el que se SIMULA este lente sobre una foto de lente transparente
   * (capa `mix-blend-mode: multiply` recortada por `lensMask`). Es el color del
   * lente plano sobre fondo claro; `multiply` lo oscurece al mezclarlo.
   *
   * `null` = no se simula. Lo llevan el transparente (que es la foto base), el
   * antirreflejo y la fórmula: ninguno de los tres cambia el color del lente.
   *
   * Solo se usa cuando NO hay foto real de esta variante. La foto siempre gana.
   */
  @Column({ type: 'varchar', length: 9, nullable: true })
  tintColor!: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
