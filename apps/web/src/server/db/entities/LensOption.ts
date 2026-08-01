import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
import type { ImageLensVariant } from './ProductImage'

/** `lens` = un tipo de lente (excluyentes). `prescription` = el complemento de fórmula. */
export type LensOptionKind = 'lens' | 'prescription'

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

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
