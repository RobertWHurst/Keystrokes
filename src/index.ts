export type { KeyEvent, HandlerFn, HandlerObj, Handler } from './handler-state'
export type { KeyComboEvent } from './key-combo-state'
export type { OnActiveEventBinder, OnKeyEventBinder, KeystrokesOptions } from './keystrokes'

import { KeyComboState } from './key-combo-state'
import { Keystrokes, KeystrokesOptions } from './keystrokes'

export { Keystrokes } from './keystrokes'

let globalKeystrokesOptions: KeystrokesOptions
let globalKeystrokes: Keystrokes
export const getGlobalKeystrokesInstance = () => {
  if (!globalKeystrokes) {
    globalKeystrokes = new Keystrokes(globalKeystrokesOptions)
  }
  return globalKeystrokes
}

export const setGlobalKeystrokesOptions = (options: KeystrokesOptions) => {
  globalKeystrokesOptions = options
}

export const bindKey: typeof globalKeystrokes.bindKey = (...args) =>
  getGlobalKeystrokesInstance().bindKey(...args)

export const unbindKey: typeof globalKeystrokes.unbindKey = (...args) =>
  getGlobalKeystrokesInstance().unbindKey(...args)

export const bindKeyCombo: typeof globalKeystrokes.bindKeyCombo = (...args) =>
  getGlobalKeystrokesInstance().bindKeyCombo(...args)

export const unbindKeyCombo: typeof globalKeystrokes.unbindKeyCombo = (...args) =>
  getGlobalKeystrokesInstance().unbindKeyCombo(...args)

export const checkKey: typeof globalKeystrokes.checkKey = (...args) =>
  getGlobalKeystrokesInstance().checkKey(...args)

export const checkKeyCombo: typeof globalKeystrokes.checkKeyCombo = (...args) =>
  getGlobalKeystrokesInstance().checkKeyCombo(...args)

export const normalizeKeyCombo = KeyComboState.normalizeKeyCombo
export const stringifyKeyCombo = KeyComboState.stringifyKeyCombo
export const parseKeyCombo = KeyComboState.parseKeyCombo
