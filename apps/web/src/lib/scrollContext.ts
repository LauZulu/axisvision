import { createContext, useContext } from 'react'

export type ScrollCtx = { scrollTo: (selector: string) => void }

export const ScrollContext = createContext<ScrollCtx>({ scrollTo: () => {} })

/** Desplazamiento suave (Lenis) hacia un selector, con offset para la nav fija. */
export const useScrollTo = () => useContext(ScrollContext).scrollTo
