'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Icon } from '../ui/Icon'
import { useDict } from '../../i18n/useDict'
import { fill } from '../../lib/format'
import { formatCop, type ProductDTO } from '../../lib/products'
import { resolveProductSrc } from '../../lib/productImages'
import { lensName, type LensOptionDTO } from '../../lib/lenses'
import { quoteLens, type RxPriceDTO } from '../../lib/lensPricing'
import { indexRxPrices } from '../../lib/lensPricing'
import {
  ADD_VALUES,
  AXIS_MAX,
  AXIS_MIN,
  CYL_VALUES,
  PD_MONO_VALUES,
  PD_VALUES,
  SPH_VALUES,
  emptyPrescription,
  formatDiopter,
  formatPd,
  validatePrescription,
  type Prescription,
  type RxFieldError,
  type RxType,
} from '../../lib/prescription'
import { AppointmentForm } from './AppointmentForm'

/**
 * El configurador de la fórmula médica: un panel por pasos, no un formulario de
 * quince campos abiertos a la vez.
 *
 * Una fórmula son diez números con nombres que casi nadie sabe leer (esfera,
 * cilindro, eje, adición, DIP). Pedirlos todos de golpe es la forma más segura
 * de que la persona cierre la pestaña; preguntarlos de a un bloque, con el
 * subtotal siempre a la vista, es lo que hace Meta en su tienda de Ray-Ban y es
 * lo que se replica aquí.
 *
 * El primer paso NO pregunta números: pregunta si tiene la fórmula a la mano.
 * Quien no la tiene —que es mucha gente— acababa antes en un callejón sin
 * salida: el lente graduado necesita datos que esa persona no tiene encima. Ese
 * camino ahora lleva a pedir cita, y la venta sigue viva.
 *
 * El precio se recalcula en cada paso con `quoteLens()`, el MISMO árbol de
 * decisión que usa el servidor al cobrar. Aquí es para mostrar; lo cobrado se
 * recalcula siempre en `createGuestOrder()`.
 */

type Step = 'source' | 'type' | 'values' | 'review' | 'appointment'

const STEPS: Step[] = ['source', 'type', 'values', 'review']

export function PrescriptionModal({
  open,
  onClose,
  product,
  lens,
  withCoating,
  rxPrices,
  value,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  product: ProductDTO
  /** El lente elegido en la ficha: es lo que se está graduando. */
  lens: LensOptionDTO | null
  withCoating: boolean
  rxPrices: RxPriceDTO[]
  /** Fórmula ya capturada (se está editando), o null. */
  value: Prescription | null
  onConfirm: (rx: Prescription) => void
}) {
  const { t, lang } = useDict()
  const r = t.store.rx

  const [step, setStep] = useState<Step>(value ? 'values' : 'source')
  const [rx, setRx] = useState<Prescription>(value ?? emptyPrescription())
  const [dualPd, setDualPd] = useState(Boolean(value?.pdOd && value?.pdOs))
  const [touched, setTouched] = useState(false)

  // Al reabrirlo se vuelve al principio, salvo que ya hubiera una fórmula: ahí
  // se entra directo a los valores, que es lo que se viene a corregir.
  useEffect(() => {
    if (!open) return
    setRx(value ?? emptyPrescription())
    setDualPd(Boolean(value?.pdOd && value?.pdOs))
    setStep(value ? 'values' : 'source')
    setTouched(false)
  }, [open, value])

  // Cerrar con Escape y bloquear el scroll de la página detrás. Sin lo segundo,
  // en móvil el dedo arrastra el fondo en vez del panel y el formulario "no
  // baja".
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open, onClose])

  if (!open) return null

  const errors = validatePrescription(rx)
  const has = (field: RxFieldError) => touched && errors.includes(field)

  const prices = indexRxPrices(rxPrices)
  // La cotización de la pantalla de resumen: el lente que eligió en la ficha,
  // graduado con lo que lleve escrito hasta ahora.
  const quote = quoteLens({ lens, withCoating, rx: errors.length ? null : rx, prices })
  const unitPrice = product.priceCop + quote.extraCop

  const setEye = (side: 'od' | 'os', patch: Partial<Prescription['od']>) =>
    setRx((p) => ({ ...p, [side]: { ...p[side], ...patch } }))

  function goBack() {
    if (step === 'appointment') return setStep('source')
    if (step === 'review') return setStep('values')
    if (step === 'values') return setStep('type')
    if (step === 'type') return setStep('source')
    onClose()
  }

  function next() {
    if (step === 'values') {
      setTouched(true)
      if (errors.length) return
      return setStep('review')
    }
    if (step === 'review') return onConfirm(rx)
  }

  const stepIndex = STEPS.indexOf(step)
  const progress = step === 'appointment' ? 1 : (stepIndex + 1) / STEPS.length

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={r.title}
      className="fixed inset-0 z-[70] flex items-stretch justify-center bg-carbon-900/80 backdrop-blur-sm sm:items-center sm:p-6"
    >
      {/* Clic fuera = cerrar, pero solo en pantallas donde hay "fuera": en móvil
          el panel ocupa todo y este hueco no existe. */}
      <button
        type="button"
        aria-hidden
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 hidden cursor-default sm:block"
      />

      {/* `min-h-0` en la rejilla y `overflow-y-auto` SOLO en la columna de la
          derecha: es lo que deja el pie (subtotal + continuar) pegado abajo
          mientras el contenido del paso se desplaza. */}
      <div className="relative flex max-h-full w-full flex-col overflow-hidden bg-carbon-850 sm:max-w-5xl sm:rounded-2xl sm:border sm:border-line lg:grid lg:grid-cols-[1fr_minmax(0,26rem)]">
        {/* Columna izquierda: el producto. En móvil se reduce a una franja —la
            foto es contexto, no el trabajo que la persona vino a hacer. */}
        <aside className="hidden border-line bg-carbon-900/40 p-8 lg:flex lg:flex-col lg:border-r">
          <span className="eyebrow text-gold">{t.store.eyebrow}</span>
          <h2 className="mt-3 font-head text-2xl font-medium text-warm-white">{product.name}</h2>
          {lens && <p className="mt-1 text-sm text-warm-gray/65">{lensName(lens, lang)}</p>}
          <div className="relative my-8 min-h-0 flex-1">
            <Image
              src={resolveProductSrc(product.images[0] ?? { key: '', url: null })}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 0px, 30vw"
              className="object-contain"
            />
          </div>
          <dl className="space-y-1.5 text-sm">
            <Row label={r.frameLine} value={formatCop(product.priceCop)} />
            {quote.lensBaseCop > 0 && (
              <Row label={r.lensLine} value={`+ ${formatCop(quote.lensBaseCop)}`} />
            )}
            {quote.rxDeltaCop > 0 && (
              <Row label={r.rxLine} value={`+ ${formatCop(quote.rxDeltaCop)}`} />
            )}
            {quote.coatingCop > 0 && (
              <Row label={r.coatingLine} value={`+ ${formatCop(quote.coatingCop)}`} />
            )}
          </dl>
        </aside>

        {/* Columna derecha: los pasos. */}
        <div className="flex min-h-0 flex-1 flex-col">
          <header className="shrink-0 border-b border-line">
            <div className="flex items-center justify-between px-4 py-3 sm:px-6">
              <button
                type="button"
                onClick={goBack}
                aria-label={r.back}
                className="grid h-9 w-9 place-items-center rounded-full text-warm-gray/70 transition-colors hover:bg-carbon-900 hover:text-gold"
              >
                <Icon name="arrow" size={18} className="rotate-180" />
              </button>
              <span className="font-mono text-[0.65rem] tracking-widest text-warm-gray/50">
                {step === 'appointment'
                  ? r.appointmentStep
                  : fill(r.stepOf, { n: stepIndex + 1, total: STEPS.length })}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label={r.close}
                className="grid h-9 w-9 place-items-center rounded-full text-warm-gray/70 transition-colors hover:bg-carbon-900 hover:text-gold"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            {/* Barra de avance: la misma señal que da Meta de "esto se acaba". */}
            <div className="h-0.5 w-full bg-line">
              <div
                className="h-full bg-gold transition-[width] duration-300"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            {step === 'source' && (
              <StepSource
                onHave={() => setStep('type')}
                onNeed={() => setStep('appointment')}
                labels={r}
              />
            )}

            {step === 'type' && (
              <StepType
                value={rx.rxType}
                onChange={(rxType) => {
                  // Al pasar a monofocal se limpia la adición: dejarla puesta
                  // mandaría a tallar una progresiva que nadie pidió.
                  setRx((p) => ({
                    ...p,
                    rxType,
                    od: { ...p.od, add: rxType === 'progressive' ? p.od.add : null },
                    os: { ...p.os, add: rxType === 'progressive' ? p.os.add : null },
                  }))
                  setStep('values')
                }}
                labels={r}
              />
            )}

            {step === 'values' && (
              <StepValues
                rx={rx}
                setEye={setEye}
                setRx={setRx}
                dualPd={dualPd}
                setDualPd={setDualPd}
                has={has}
                labels={r}
                onNeedAppointment={() => setStep('appointment')}
              />
            )}

            {step === 'review' && (
              <StepReview rx={rx} quote={quote} lens={lens} labels={r} lang={lang} />
            )}

            {step === 'appointment' && (
              <AppointmentForm
                productId={product.id}
                lensOptionId={lens?.id ?? null}
                productName={product.name}
                onDone={onClose}
              />
            )}
          </div>

          {/* Pie fijo con el subtotal. Es la pieza que evita la pregunta "¿y
              esto cuánto me va a costar?" mientras se rellenan diez casillas. */}
          {step !== 'appointment' && step !== 'source' && (
            <footer className="shrink-0 border-t border-line bg-carbon-850 px-4 py-4 sm:px-6">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-warm-gray/60">{r.subtotal}</span>
                <span className="font-head text-xl text-warm-white">{formatCop(unitPrice)}</span>
              </div>
              {quote.estimated && (
                <p className="mt-1.5 text-xs leading-relaxed text-warm-gray/55">{r.estimatedNote}</p>
              )}
              {step !== 'type' && (
                <button
                  type="button"
                  onClick={next}
                  disabled={step === 'values' && touched && errors.length > 0}
                  className="btn-axis mt-4 w-full disabled:opacity-50"
                >
                  {step === 'review' ? r.confirm : r.continue}
                  <Icon name="arrow" size={18} />
                </button>
              )}
            </footer>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-warm-gray/60">{label}</dt>
      <dd className="font-mono text-xs tracking-wide text-warm-gray/80">{value}</dd>
    </div>
  )
}

type Labels = ReturnType<typeof useDict>['t']['store']['rx']

/** Paso 1: ¿la tiene o hay que tomársela? */
function StepSource({
  onHave,
  onNeed,
  labels,
}: {
  onHave: () => void
  onNeed: () => void
  labels: Labels
}) {
  return (
    <div>
      <h3 className="text-center font-head text-2xl font-medium text-warm-white">
        {labels.haveTitle}
      </h3>
      <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-warm-gray/65">
        {labels.haveBody}
      </p>
      <div className="mt-7 space-y-3">
        <Choice title={labels.haveYes} description={labels.haveYesDesc} onClick={onHave} />
        <Choice title={labels.haveNo} description={labels.haveNoDesc} onClick={onNeed} />
      </div>
    </div>
  )
}

/** Paso 2: monofocal o progresiva — el primer nodo que mueve el precio. */
function StepType({
  value,
  onChange,
  labels,
}: {
  value: RxType
  onChange: (v: RxType) => void
  labels: Labels
}) {
  return (
    <div>
      <h3 className="text-center font-head text-2xl font-medium text-warm-white">
        {labels.typeTitle}
      </h3>
      <div className="mt-7 space-y-3">
        <Choice
          title={labels.single}
          description={labels.singleDesc}
          selected={value === 'single'}
          onClick={() => onChange('single')}
        />
        <Choice
          title={labels.progressive}
          description={labels.progressiveDesc}
          selected={value === 'progressive'}
          onClick={() => onChange('progressive')}
        />
      </div>
    </div>
  )
}

function Choice({
  title,
  description,
  selected,
  onClick,
}: {
  title: string
  description: string
  selected?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`block w-full rounded-xl border px-4 py-4 text-left transition-colors ${
        selected ? 'border-gold/70 bg-gold/[0.07]' : 'border-line hover:border-gold/50'
      }`}
    >
      <span className="block text-warm-white">{title}</span>
      <span className="mt-1 block text-sm leading-relaxed text-warm-gray/60">{description}</span>
    </button>
  )
}

/** Paso 3: los números. */
function StepValues({
  rx,
  setEye,
  setRx,
  dualPd,
  setDualPd,
  has,
  labels,
  onNeedAppointment,
}: {
  rx: Prescription
  setEye: (side: 'od' | 'os', patch: Partial<Prescription['od']>) => void
  setRx: React.Dispatch<React.SetStateAction<Prescription>>
  dualPd: boolean
  setDualPd: (v: boolean) => void
  has: (f: RxFieldError) => boolean
  labels: Labels
  onNeedAppointment: () => void
}) {
  return (
    <div>
      <h3 className="text-center font-head text-2xl font-medium text-warm-white">
        {labels.valuesTitle}
      </h3>

      <div className="mt-6 space-y-6">
        <EyeRow
          side="od"
          label={labels.od}
          eye={rx.od}
          rxType={rx.rxType}
          onChange={(patch) => setEye('od', patch)}
          has={has}
          labels={labels}
        />
        <EyeRow
          side="os"
          label={labels.os}
          eye={rx.os}
          rxType={rx.rxType}
          onChange={(patch) => setEye('os', patch)}
          has={has}
          labels={labels}
        />
      </div>

      <div className="mt-8 border-t border-line pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-warm-white">{labels.pdTitle}</span>
        </div>
        <label className="mt-3 flex cursor-pointer items-start gap-2.5 text-sm text-warm-gray/75">
          <input
            type="checkbox"
            checked={dualPd}
            onChange={(e) => {
              setDualPd(e.target.checked)
              // Se limpian los del otro modo: dejar los dos rellenos haría que
              // el servidor tuviera que adivinar cuál manda.
              setRx((p) =>
                e.target.checked
                  ? { ...p, pd: null }
                  : { ...p, pdOd: null, pdOs: null },
              )
            }}
            className="mt-0.5 h-4 w-4 shrink-0 accent-[#c8a96e]"
          />
          {labels.pdDual}
        </label>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {dualPd ? (
            <>
              <Select
                label={labels.pdRight}
                value={rx.pdOd}
                options={PD_MONO_VALUES}
                format={formatPd}
                invalid={has('pd')}
                onChange={(v) => setRx((p) => ({ ...p, pdOd: v }))}
              />
              <Select
                label={labels.pdLeft}
                value={rx.pdOs}
                options={PD_MONO_VALUES}
                format={formatPd}
                invalid={has('pd')}
                onChange={(v) => setRx((p) => ({ ...p, pdOs: v }))}
              />
            </>
          ) : (
            <Select
              label={labels.pdValue}
              value={rx.pd}
              options={PD_VALUES}
              format={formatPd}
              invalid={has('pd')}
              onChange={(v) => setRx((p) => ({ ...p, pd: v }))}
            />
          )}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-warm-gray/50">{labels.pdHelp}</p>
      </div>

      {has('empty') && <p className="mt-5 text-sm text-red-400">{labels.errorEmpty}</p>}

      <p className="mt-6 text-xs leading-relaxed text-warm-gray/45">{labels.legal}</p>

      {/* El recordatorio del otro camino, en el paso donde de verdad aparece la
          duda: quien se atasca leyendo su fórmula todavía puede pedir cita. */}
      <button
        type="button"
        onClick={onNeedAppointment}
        className="mt-4 text-sm text-gold/85 underline underline-offset-4 transition-colors hover:text-gold"
      >
        {labels.haveNo}
      </button>
    </div>
  )
}

function EyeRow({
  side,
  label,
  eye,
  rxType,
  onChange,
  has,
  labels,
}: {
  side: 'od' | 'os'
  label: string
  eye: Prescription['od']
  rxType: RxType
  onChange: (patch: Partial<Prescription['od']>) => void
  has: (f: RxFieldError) => boolean
  labels: Labels
}) {
  return (
    <fieldset>
      <legend className="text-sm text-warm-white">{label}</legend>
      {/* Tres columnas desde el móvil: son campos cortos y partirlos en filas
          rompe la lectura horizontal de una fórmula, que es como está impresa
          en el papel del optómetra. */}
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Select
          label={labels.sph}
          value={eye.sph}
          options={SPH_VALUES}
          format={formatDiopter}
          invalid={has(`${side}.sph`)}
          onChange={(v) => onChange({ sph: v ?? 0 })}
          allowEmpty={false}
        />
        <Select
          label={labels.cyl}
          value={eye.cyl}
          options={CYL_VALUES}
          format={formatDiopter}
          onChange={(v) => onChange({ cyl: v ?? 0, axis: v ? eye.axis : null })}
          allowEmpty={false}
        />
        <label className="block">
          <span className="mb-1 block font-mono text-[0.6rem] tracking-widest text-warm-gray/50 uppercase">
            {labels.axis}
          </span>
          {/* Deshabilitado sin cilindro, igual que en la referencia: un eje sin
              astigmatismo no significa nada y confunde al laboratorio. */}
          <input
            type="number"
            inputMode="numeric"
            min={AXIS_MIN}
            max={AXIS_MAX}
            disabled={eye.cyl === 0}
            value={eye.axis ?? ''}
            onChange={(e) =>
              onChange({ axis: e.target.value === '' ? null : Number(e.target.value) })
            }
            className={`w-full rounded-md border bg-carbon-900 px-2.5 py-2.5 text-base text-warm-white outline-none disabled:opacity-40 ${
              has(`${side}.axis`) ? 'border-red-400/70' : 'border-line focus:border-gold/60'
            }`}
          />
        </label>
      </div>
      {rxType === 'progressive' && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Select
            label={labels.add}
            value={eye.add}
            options={ADD_VALUES}
            format={formatDiopter}
            invalid={has(`${side}.add`)}
            onChange={(v) => onChange({ add: v })}
          />
        </div>
      )}
    </fieldset>
  )
}

/**
 * Select de dioptrías. `text-base` (16px) NO es decorativo: por debajo de eso,
 * Safari de iOS hace zoom al enfocar el campo y descoloca el panel entero —
 * misma regla que en los inputs del admin.
 */
function Select({
  label,
  value,
  options,
  format,
  onChange,
  invalid,
  allowEmpty = true,
}: {
  label: string
  value: number | null
  options: number[]
  format: (v: number) => string
  onChange: (v: number | null) => void
  invalid?: boolean
  allowEmpty?: boolean
}) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[0.6rem] tracking-widest text-warm-gray/50 uppercase">
        {label}
      </span>
      <select
        value={value === null ? '' : String(value)}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className={`w-full rounded-md border bg-carbon-900 px-2.5 py-2.5 text-base text-warm-white outline-none ${
          invalid ? 'border-red-400/70' : 'border-line focus:border-gold/60'
        }`}
      >
        {allowEmpty && <option value="">—</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {format(o)}
          </option>
        ))}
      </select>
    </label>
  )
}

/** Paso 4: qué se va a montar y cuánto cuesta, antes de aceptar. */
function StepReview({
  rx,
  quote,
  lens,
  labels,
  lang,
}: {
  rx: Prescription
  quote: ReturnType<typeof quoteLens>
  lens: LensOptionDTO | null
  labels: Labels
  lang: 'es' | 'en'
}) {
  const eye = (e: Prescription['od']) => {
    const parts = [formatDiopter(e.sph)]
    if (e.cyl !== 0) parts.push(formatDiopter(e.cyl), `× ${e.axis ?? 0}°`)
    if (rx.rxType === 'progressive' && e.add !== null) parts.push(`ADD ${formatDiopter(e.add)}`)
    return parts.join('  ')
  }

  return (
    <div>
      <h3 className="text-center font-head text-2xl font-medium text-warm-white">
        {labels.reviewTitle}
      </h3>

      <dl className="mt-6 space-y-2.5 rounded-xl border border-line bg-carbon-900/50 p-4">
        <Row
          label={labels.typeTitleShort}
          value={rx.rxType === 'progressive' ? labels.progressive : labels.single}
        />
        <Row label={labels.od} value={eye(rx.od)} />
        <Row label={labels.os} value={eye(rx.os)} />
        <Row
          label={labels.pdTitle}
          value={
            rx.pdOd !== null && rx.pdOs !== null
              ? `${formatPd(rx.pdOd)} / ${formatPd(rx.pdOs)} mm`
              : rx.pd !== null
                ? `${formatPd(rx.pd)} mm`
                : '—'
          }
        />
        {quote.index && <Row label={labels.indexLabel} value={quote.index} />}
      </dl>

      <dl className="mt-4 space-y-2.5 rounded-xl border border-line p-4">
        {lens && <Row label={labels.lensLine} value={lensName(lens, lang)} />}
        {quote.rxDeltaCop > 0 && (
          <Row label={labels.rxLine} value={`+ ${formatCop(quote.rxDeltaCop)}`} />
        )}
        {quote.coatingIncluded ? (
          <Row label={labels.coatingLine} value={labels.included} />
        ) : (
          quote.coatingCop > 0 && (
            <Row label={labels.coatingLine} value={`+ ${formatCop(quote.coatingCop)}`} />
          )
        )}
      </dl>

      <p className="mt-4 text-xs leading-relaxed text-warm-gray/50">{labels.reviewNote}</p>
    </div>
  )
}
