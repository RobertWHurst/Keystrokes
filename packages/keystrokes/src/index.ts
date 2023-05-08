export type { KeyEvent, HandlerFn, HandlerObj, Handler } from './handler-state'
export type { KeyComboEvent } from './key-combo-state'
export type { OnActiveEventBinder, OnKeyEventBinder, KeystrokesOptions } from './keystrokes'

import { KeyEvent } from './handler-state'
import { KeyComboState } from './key-combo-state'
import {
  Keystrokes,
  KeystrokesOptions,
  MaybeKeyboardEventComboProps,
  MaybeKeyboardEventSingleProps,
} from './keystrokes'

export { Keystrokes } from './keystrokes'

let globalKeystrokesOptions: KeystrokesOptions
let globalKeystrokes: Keystrokes

export const setGlobalKeystrokes = (keystrokes?: Keystrokes) => {
  globalKeystrokes = keystrokes ?? new Keystrokes(globalKeystrokesOptions)
}

export const getGlobalKeystrokes = () => {
  if (!globalKeystrokes) {
    setGlobalKeystrokes()
  }
  return globalKeystrokes
}

export const setGlobalKeystrokesOptions = (options: KeystrokesOptions) => {
  globalKeystrokesOptions = options
}

export const bindKey: typeof globalKeystrokes.bindKey = (...args) =>
  getGlobalKeystrokes().bindKey(...args)

export const unbindKey: typeof globalKeystrokes.unbindKey = (...args) =>
  getGlobalKeystrokes().unbindKey(...args)

export const bindKeyCombo: typeof globalKeystrokes.bindKeyCombo = (...args) =>
  getGlobalKeystrokes().bindKeyCombo(...args)

export const unbindKeyCombo: typeof globalKeystrokes.unbindKeyCombo = (...args) =>
  getGlobalKeystrokes().unbindKeyCombo(...args)

export const checkKey: typeof globalKeystrokes.checkKey = (...args) =>
  getGlobalKeystrokes().checkKey(...args)

export const checkKeyCombo: typeof globalKeystrokes.checkKeyCombo = (...args) =>
  getGlobalKeystrokes().checkKeyCombo(...args)

export const normalizeKeyCombo = KeyComboState.normalizeKeyCombo
export const stringifyKeyCombo = KeyComboState.stringifyKeyCombo
export const parseKeyCombo = KeyComboState.parseKeyCombo

export type TestKeystrokes<E, SP, CP> = Keystrokes<E, SP, CP> & {
  activate(): void
  deactivate(): void
  press(key: KeyEvent<E, SP>): void
  release(key: KeyEvent<E, SP>): void
}

export const createTestKeystrokes = <
  E = KeyboardEvent,
  SP = MaybeKeyboardEventSingleProps<E>,
  CP = MaybeKeyboardEventComboProps<E>,
>() => {
  let activate: () => void
  let deactivate: () => void
  let press: (key: KeyEvent<E, SP>) => void
  let release: (key: KeyEvent<E, SP>) => void

  const testKeystrokes = Object.assign(
    new Keystrokes<E, SP, CP>({
      onActive(f) {
        activate = f
      },
      onInactive(f) {
        deactivate = f
      },
      onKeyPressed(f) {
        press = f
      },
      onKeyReleased(f) {
        release = f
      },
    }),
    {
      activate: activate!,
      deactivate: deactivate!,
      press: press!,
      release: release!,
    },
  ) as TestKeystrokes<E, SP, CP>

  return testKeystrokes
}
