// Tipos para el pipeline de imágenes responsive (vite-imagetools).
// Este archivo NO tiene import/export de nivel superior, así que sus
// declaraciones son globales para toda la app.

/** Salida de `import foo from '...jpg?picture'` (formato `as=picture`). */
interface ResponsivePicture {
  /** Clave = formato (avif/webp/jpg…), valor = `srcset` con sus anchos. */
  sources: Record<string, string>
  /** `<img>` de respaldo + dimensiones intrínsecas (para evitar CLS). */
  img: { src: string; w: number; h: number }
}

declare module '*?picture' {
  const value: ResponsivePicture
  export default value
}
