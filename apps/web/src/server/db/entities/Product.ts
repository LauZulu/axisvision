import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm'
// import de TIPO (se borra al compilar) + relación por NOMBRE DE TABLA, para
// romper el ciclo de imports de valor Product↔ProductImage (evita TDZ al bundlear).
//
// OJO: el nombre en la relación tiene que ser el de la TABLA ('axis_product_image'),
// NO el de la clase ('AxisProductImage'). TypeORM resuelve la cadena contra
// `metadata.name` (el nombre de la clase) o `metadata.tableName`, y en el build de
// producción Next MINIFICA el código del servidor: la clase pasa a llamarse `h` y
// la cadena con el nombre original ya no encuentra nada ("Entity metadata for
// h#images was not found"). El nombre de tabla es un dato, no un identificador,
// así que el minificador no lo toca. En dev no se minifica y el fallo no aparece.
import type { AxisProductImage } from './ProductImage'
import type { AxisProductUnit } from './ProductUnit'

/** Talla del armazón (define la banda de precio). */
export type ProductSize = 'chico' | 'mediano' | 'grande'

/**
 * Producto AXIS. El copy es bilingüe en la propia DB (editable desde el admin).
 * `stock` es el número de unidades disponibles. Los precios en COP (pesos).
 */
@Entity({ name: 'axis_product' })
export class AxisProduct {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120 })
  slug!: string

  // Nombre de marca (igual en ambos idiomas): "AXIS Origin".
  @Column({ type: 'varchar', length: 120 })
  name!: string

  // Código de modelo del inventario: "M02", "AIMB-G5". Es la llave con la que el
  // Excel de inventario hace match contra el catálogo.
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 40, nullable: true })
  modelCode!: string | null

  @Column({ type: 'varchar', length: 60, default: 'AXIS' })
  brand!: string

  // Talla del armazón. Determina la banda de precio: chico < mediano < grande.
  @Column({ type: 'varchar', length: 16, nullable: true })
  size!: ProductSize | null

  @Column({ type: 'varchar', length: 200 })
  taglineEs!: string

  @Column({ type: 'varchar', length: 200 })
  taglineEn!: string

  @Column({ type: 'text' })
  descriptionEs!: string

  @Column({ type: 'text' })
  descriptionEn!: string

  // Precio en pesos colombianos (COP). Para Wompi se multiplica ×100 (centavos).
  @Column({ type: 'integer' })
  priceCop!: number

  // Precio "anterior" para mostrar descuento (tachado + badge −%). Si es null o
  // <= priceCop no hay descuento. El precio de cobro SIEMPRE es priceCop.
  @Column({ type: 'integer', nullable: true })
  compareAtPriceCop!: number | null

  @Column({ type: 'varchar', length: 8, default: 'COP' })
  currency!: string

  // Unidades disponibles. DERIVADO del inventario por unidad: lo recalcula
  // `syncStockFromUnits()` contando las `axis_product_unit` vendibles en casa o
  // local. El checkout lo descuenta. No editarlo a mano si hay unidades cargadas.
  @Column({ type: 'integer', default: 0 })
  stock!: number

  // Visible en la tienda.
  @Column({ type: 'boolean', default: true })
  active!: boolean

  // Orden en la rejilla de la tienda.
  @Column({ type: 'integer', default: 0 })
  position!: number

  @OneToMany('axis_product_image', 'product', { cascade: true })
  images!: AxisProductImage[]

  @OneToMany('axis_product_unit', 'product')
  units!: AxisProductUnit[]

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date
}
