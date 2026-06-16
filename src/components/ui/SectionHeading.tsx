import type { ReactNode } from 'react'
import { Reveal } from './Reveal'

type Props = {
  eyebrow: string
  title: ReactNode
  intro?: string
  align?: 'left' | 'center'
  light?: boolean
  className?: string
}

/** Bloque eyebrow (DM Mono dorado) + título + intro. Reutilizable en todas las secciones. */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = 'left',
  light = false,
  className = '',
}: Props) {
  const alignCls = align === 'center' ? 'text-center mx-auto items-center' : 'text-left items-start'
  const titleColor = light ? 'text-carbon-900' : 'text-warm-white'
  const introColor = light ? 'text-carbon-900/70' : 'text-warm-gray/80'

  return (
    <div className={`flex flex-col ${alignCls} ${className}`}>
      <Reveal>
        <span className="eyebrow">{eyebrow}</span>
      </Reveal>
      <Reveal delay={0.06}>
        <h2
          className={`font-head ${titleColor} mt-5 max-w-[20ch] text-3xl leading-[1.08] font-medium tracking-[-0.01em] md:text-[2.7rem]`}
        >
          {title}
        </h2>
      </Reveal>
      {intro && (
        <Reveal delay={0.12}>
          <p className={`${introColor} mt-5 max-w-[52ch] text-lg md:text-xl`}>{intro}</p>
        </Reveal>
      )}
    </div>
  )
}
