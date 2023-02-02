import React, { createContext, ReactNode } from 'react'
import { getGlobalKeystrokes, Keystrokes } from '@rwh/keystrokes'

export type KeystrokesContextData = () => Keystrokes

export const defaultKeystrokesContext: KeystrokesContextData = () => getGlobalKeystrokes()

export const KeystrokesContext = createContext(defaultKeystrokesContext)

export type KeystrokesProviderProps = {
  keystrokes: Keystrokes
  children: ReactNode
}

export const KeystrokesProvider = (props: KeystrokesProviderProps) => {
  const { keystrokes, children } = props

  return (
    <KeystrokesContext.Provider value={() => keystrokes}>
      {children}
    </KeystrokesContext.Provider>
  )
}
