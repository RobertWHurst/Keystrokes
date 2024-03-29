/// <reference types="vite/client" />

export {
  BrowserKeyEventProps,
  BrowserKeyEvent,
  BrowserKeyComboEvent,
  BrowserKeyComboEventProps,
  MaybeBrowserKeyComboEventProps,
  browserOnActiveBinder,
  browserOnInactiveBinder,
  browserOnKeyPressedBinder,
  browserOnKeyReleasedBinder,
} from './browser-bindings'
export {
  KeyEvent,
  HandlerFn,
  HandlerObj,
  Handler,
  HandlerState,
} from './handler-state'
export { KeyComboEvent, KeyComboState } from './key-combo-state'
export {
  defaultSequenceTimeout,
  OnActiveEventBinder,
  OnKeyEventBinder,
  KeyComboEventMapper,
  KeyPress,
  KeystrokesOptions,
  BindEnvironmentOptions,
  Keystrokes,
} from './keystrokes'

import {
  MaybeBrowserKeyComboEventProps,
  MaybeBrowserKeyEventProps,
} from './browser-bindings'
import { KeyEvent } from './handler-state'
import { KeyComboState } from './key-combo-state'
import { Keystrokes, KeystrokesOptions } from './keystrokes'

let globalKeystrokesOptions: KeystrokesOptions
let globalKeystrokes: Keystrokes

export const setGlobalKeystrokes = (keystrokes?: Keystrokes) => {
  globalKeystrokes = keystrokes ?? new Keystrokes(globalKeystrokesOptions)
}

export const getGlobalKeystrokes = () => {
  if (!globalKeystrokes) setGlobalKeystrokes()
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

export const unbindKeyCombo: typeof globalKeystrokes.unbindKeyCombo = (
  ...args
) => getGlobalKeystrokes().unbindKeyCombo(...args)

export const checkKey: typeof globalKeystrokes.checkKey = (...args) =>
  getGlobalKeystrokes().checkKey(...args)

export const checkKeyCombo: typeof globalKeystrokes.checkKeyCombo = (...args) =>
  getGlobalKeystrokes().checkKeyCombo(...args)

export const normalizeKeyCombo = KeyComboState.normalizeKeyCombo
export const stringifyKeyCombo = KeyComboState.stringifyKeyCombo
export const parseKeyCombo = KeyComboState.parseKeyCombo

export type TestKeystrokes<OriginalEvent, KeyEventProps, KeyComboEventProps> =
  Keystrokes<OriginalEvent, KeyEventProps, KeyComboEventProps> & {
    activate(): void
    deactivate(): void
    press(key: Partial<KeyEvent<OriginalEvent, KeyEventProps>>): void
    release(key: Partial<KeyEvent<OriginalEvent, KeyEventProps>>): void
  }

export const createTestKeystrokes = <
  OriginalEvent = KeyboardEvent,
  KeyEventProps = MaybeBrowserKeyEventProps<OriginalEvent>,
  KeyComboEventProps = MaybeBrowserKeyComboEventProps<OriginalEvent>,
>(
  options: KeystrokesOptions<
    OriginalEvent,
    KeyEventProps,
    KeyComboEventProps
  > = {},
) => {
  let activate: () => void
  let deactivate: () => void
  let press: (event: KeyEvent<OriginalEvent, KeyEventProps>) => void
  let release: (event: KeyEvent<OriginalEvent, KeyEventProps>) => void

  const testKeystrokes = Object.assign(
    new Keystrokes<OriginalEvent, KeyEventProps, KeyComboEventProps>({
      ...options,
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
      activate() {
        activate!()
      },
      deactivate() {
        deactivate!()
      },
      press(event: KeyEvent<OriginalEvent, KeyEventProps>) {
        press!({ composedPath: () => [], ...event })
      },
      release(event: KeyEvent<OriginalEvent, KeyEventProps>) {
        release!({ composedPath: () => [], ...event })
      },
    },
  ) as TestKeystrokes<OriginalEvent, KeyEventProps, KeyComboEventProps>

  return testKeystrokes
}
