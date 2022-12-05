import { KeyComboState } from './key-combo-state.js'
import { Keystrokes } from './keystrokes.js'

export {
  KeyEvent,
  KeyComboEvent,
  HandlerFn,
  HandlerObj,
  Handler,
  MinimalKeyboardEvent,
  DefaultKeyboardEvent,
  OnActiveEventBinder,
  OnKeyboardEventBinder,
  KeystrokesOptions,
  Keystrokes,
} from './keystrokes.js'

let globalKeystrokes: Keystrokes
export const getGlobalKeystrokesInstance = () => {
  if (!globalKeystrokes) { globalKeystrokes = new Keystrokes() }
  return globalKeystrokes
}

export const bindKey: typeof globalKeystrokes.bindKey =
  (...args) => getGlobalKeystrokesInstance().bindKey(...args)

export const unbindKey: typeof globalKeystrokes.unbindKey =
  (...args) => getGlobalKeystrokesInstance().unbindKey(...args)

export const bindKeyCombo: typeof globalKeystrokes.bindKeyCombo =
  (...args) => getGlobalKeystrokesInstance().bindKeyCombo(...args)

export const unbindKeyCombo: typeof globalKeystrokes.unbindKeyCombo =
  (...args) => getGlobalKeystrokesInstance().unbindKeyCombo(...args)

export const checkKey: typeof globalKeystrokes.checkKey =
  (...args) => getGlobalKeystrokesInstance().checkKey(...args)

export const checkKeyCombo: typeof globalKeystrokes.checkKeyCombo =
  (...args) => getGlobalKeystrokesInstance().checkKeyCombo(...args)

export const normalizeKeyCombo = KeyComboState.normalizeKeyCombo
export const stringifyKeyCombo = KeyComboState.stringifyKeyCombo
export const parseKeyCombo = KeyComboState.parseKeyCombo
