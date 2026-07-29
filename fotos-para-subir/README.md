# Fotos para subir a S3

Buzón temporal: deja aquí las fotos originales de cada modelo y se suben a S3
organizadas y renombradas. **Estas carpetas no se versionan** (van en `.gitignore`)
y no las consume la aplicación: la web lee siempre desde CloudFront.

## Cómo se usa

1. Pon las fotos dentro de la carpeta del modelo, y dentro de una subcarpeta con
   la **variante de lente** con la que se tomaron: `sunglass/` (lente de sol),
   `oftalmica/` (lente transparente) o `amarillo/` (filtro amarillo). Si una foto
   sirve para cualquier lente (estuche, empaque, accesorios), déjala suelta en la
   carpeta del modelo. El nombre del archivo da igual — se renombran al subirlas.
2. Avisa cuando estén listas. Se revisan una por una para clasificarlas
   (frente, ángulo, detalle, con estuche, puestas…) y elegir cuál va de portada.
3. Se suben con `pnpm images:upload`, que además reemplaza en la base de datos
   las fotos de ejemplo por las nuevas y borra las de ejemplo del bucket.

## Las carpetas

| Carpeta          | Modelo   | Nombre en tienda | Talla   |
| ---------------- | -------- | ---------------- | ------- |
| `axis-origin/`   | M02      | AXIS Origin      | Grande  |
| `axis-apex/`     | AIMB-G5  | AXIS Apex        | Grande  |
| `axis-crystal/`  | HK01     | AXIS Crystal     | Mediano |
| `axis-shadow/`   | E03L     | AXIS Shadow      | Chico   |
| `axis-ocean/`    | E03S     | AXIS Ocean       | Chico   |
| `axis-eclypse/`  | M01PRO   | AXIS Eclypse     | Chico   |

Si un modelo no tiene fotos todavía, deja su carpeta vacía: se salta y conserva
lo que ya tenga en la tienda.

**Estado:** las 57 fotos de la primera tanda ya están subidas y publicadas
(Origin y Eclypse con sol + oftálmica; Shadow y Ocean solo sol; Crystal solo
oftálmica; Apex con lente espejado + amarillo). Para reemplazarlas o añadir más,
deja los archivos nuevos y vuelve a correr el script.

## Cómo quedan en S3

Una carpeta por modelo, con la categoría en el nombre y numeradas por el orden en
que se muestran (la `01` de la primera categoría es la portada):

```
products/axis-origin/sunglass/frente-01.jpg
products/axis-origin/sunglass/angulo-01.jpg
products/axis-origin/oftalmica/frente-01.jpg
products/axis-origin/oftalmica/estuche-01.jpg
products/axis-apex/yellow/frente-01.jpg
```

La variante importa: en la ficha del producto, la galería cambia según el lente
que elija el cliente. Si el modelo no tiene fotos de esa variante, se muestran
las de lente de sol (o las que haya), nunca una mezcla.

Categorías: `frente` (vista frontal) · `angulo` (3/4, lateral, perspectiva) ·
`detalle` (primer plano: patilla, bisagra, grabado, lente) · `estuche` (con el
forro/empaque) · `puesta` (alguien llevándolas) · `otro`.

## Formato de los originales

- JPG, PNG, WebP o AVIF.
- La mayor resolución que tengas (ideal ≥ 2400 px de ancho). No hace falta
  recortar ni comprimir.
- Sin acentos ni espacios en el nombre del archivo (se renombran igual, pero
  evita problemas al copiarlos).
