import React, { createContext, ReactNode } from 'react'
import { getGlobalKeystrokes, Keystrokes } from '@rwh/keystrokes'

export type KeystrokesContextData = {
  keystrokes: Keystrokes
}

export const defaultKeystrokesContext: KeystrokesContextData = {
  keystrokes: getGlobalKeystrokes(),
}

export const KeystrokesContext = createContext(defaultKeystrokesContext)

export type KeystrokesProviderProps = {
  keystrokes: Keystrokes
  children: ReactNode
}

export const KeystrokesProvider = (props: KeystrokesProviderProps) => {
  return <KeystrokesContext.Provider value={props}>{props.children}</KeystrokesContext.Provider>
}
