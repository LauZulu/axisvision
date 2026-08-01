/**
 * Renderiza TODAS las plantillas de correo con datos de ejemplo y las escribe
 * en `.email-preview/` (ignorado por git). Genera además un índice para irlas
 * revisando una por una en el navegador.
 *
 *   pnpm email:preview
 *
 * No manda ningún correo ni necesita cuenta de Brevo: las plantillas son
 * funciones puras.
 *
 * Para probar de verdad cómo se ven en Gmail/Outlook, abre el .html generado,
 * copia el fuente y pégalo en una herramienta de previsualización, o mándate
 * uno a ti mismo cuando la cuenta esté configurada.
 */
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { TEMPLATES, type TemplateGroup } from '../src/server/email/templates/index'

const OUT = resolve(process.cwd(), '.email-preview')

const GROUPS: TemplateGroup[] = ['Compra', 'Reserva', 'Interno']

function indexHtml(): string {
  const rows = GROUPS.map((group) => {
    const items = TEMPLATES.filter((t) => t.group === group)
      .map((t) => {
        const { subject, preheader } = t.preview()
        return `<li>
          <a href="./${t.key}.html">${t.title}</a>
          <div class="meta"><strong>Asunto:</strong> ${escapeHtml(subject)}</div>
          <div class="meta"><strong>Preheader:</strong> ${escapeHtml(preheader)}</div>
          <div class="meta trigger">${escapeHtml(t.trigger)}</div>
          <div class="meta"><a class="txt" href="./${t.key}.txt">versión en texto plano</a></div>
        </li>`
      })
      .join('\n')
    return `<section><h2>${group}</h2><ul>${items}</ul></section>`
  }).join('\n')

  return `<!doctype html><html lang="es"><head><meta charset="utf-8" />
<title>Plantillas de correo · AXIS</title>
<style>
  body { margin:0; padding:48px 24px; background:#0a0a0a; color:#d8d6cf;
         font-family: 'Inter Tight', system-ui, sans-serif; }
  main { max-width: 720px; margin: 0 auto; }
  h1 { color:#f5f3ee; font-weight:500; letter-spacing:-0.01em; }
  h2 { color:#c8a96e; font-size:12px; letter-spacing:0.22em; text-transform:uppercase;
       margin:40px 0 12px; }
  ul { list-style:none; margin:0; padding:0; }
  li { padding:16px 0; border-bottom:1px solid #1c1c1c; }
  li > a { color:#f5f3ee; font-size:18px; text-decoration:none; }
  li > a:hover { color:#c8a96e; }
  .meta { font-size:13px; color:#8f8d87; margin-top:4px; }
  .trigger { font-family: ui-monospace, monospace; color:#6e6c66; }
  .txt { color:#8f8d87; }
</style></head>
<body><main>
<h1>Plantillas de correo</h1>
<p class="meta">${TEMPLATES.length} plantillas · datos de ejemplo · nada de esto se envía.</p>
${rows}
</main></body></html>`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function main() {
  await rm(OUT, { recursive: true, force: true })
  await mkdir(OUT, { recursive: true })

  for (const t of TEMPLATES) {
    const doc = t.preview()
    await writeFile(resolve(OUT, `${t.key}.html`), doc.html, 'utf8')
    await writeFile(
      resolve(OUT, `${t.key}.txt`),
      `Asunto: ${doc.subject}\nPreheader: ${doc.preheader}\n\n${doc.text}\n`,
      'utf8',
    )
    console.log(`  ${t.key.padEnd(26)} ${doc.subject}`)
  }

  await writeFile(resolve(OUT, 'index.html'), indexHtml(), 'utf8')
  console.log(`\n${TEMPLATES.length} plantillas escritas en ${OUT}`)
  console.log(`Ábrelas con:  xdg-open ${resolve(OUT, 'index.html')}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
