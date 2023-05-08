import { Handler, HandlerState, KeyEvent } from './handler-state'
import { KeyComboEvent, KeyComboState } from './key-combo-state'

export type KeyboardEventSingleProps = {
  composedPath(): EventTarget[]
}

export type KeyboardEventComboProps = {
  // todo
}

export type MaybeKeyboardEventSingleProps<E> = E extends KeyboardEvent
  ? KeyboardEventSingleProps
  : // eslint-disable-next-line @typescript-eslint/ban-types
    {}

// eslint-disable-next-line @typescript-eslint/ban-types
export type MaybeKeyboardEventComboProps<E> = E extends KeyboardEvent ? KeyboardEventComboProps : {}

export type OnActiveEventBinder = (handler: () => void) => (() => void) | void
export type OnKeyEventBinder<E, P> = (
  handler: (event: KeyEvent<E, P>) => void,
) => (() => void) | void

export type KeyComboEventMapper<E, SP, CP> = (
  activeKeyPresses: KeyPress<E, SP>[],
  finalKeyPress: KeyPress<E, SP>,
) => KeyComboEvent<E, SP, CP>

export type KeyPress<E, SP> = {
  key: string
  event: KeyEvent<E, SP>
}

export type KeystrokesOptions<
  E = KeyboardEvent,
  SP = MaybeKeyboardEventSingleProps<E>,
  CP = MaybeKeyboardEventComboProps<E>,
> = {
  onActive?: OnActiveEventBinder
  onInactive?: OnActiveEventBinder
  onKeyPressed?: OnKeyEventBinder<E, SP>
  onKeyReleased?: OnKeyEventBinder<E, SP>
  mapKeyComboEvent?: KeyComboEventMapper<E, SP, CP>
  selfReleasingKeys?: string[]
  keyRemap?: Record<string, string>
}

const nextTickBinder =
  typeof requestAnimationFrame === 'function'
    ? (r: () => void) => requestAnimationFrame(r)
    : (f: () => void) => setTimeout(f, 0)

export const nextTick = () => new Promise<void>(r => nextTickBinder(r))

const defaultOnActiveBinder: OnActiveEventBinder = handler => {
  try {
    const handlerWrapper = () => handler()
    addEventListener('focus', handlerWrapper)
    return () => {
      removeEventListener('focus', handlerWrapper)
    }
  } catch {}
}

const defaultOnInactiveBinder: OnActiveEventBinder = handler => {
  try {
    const handlerWrapper = () => handler()
    addEventListener('blur', handlerWrapper)
    return () => {
      removeEventListener('blur', handlerWrapper)
    }
  } catch {}
}

const defaultOnKeyPressedBinder: OnKeyEventBinder<
  KeyboardEvent,
  KeyboardEventSingleProps
> = handler => {
  try {
    const handlerWrapper = (e: KeyboardEvent) => {
      const originalComposedPath = e.composedPath()
      return handler({ key: e.key, originalEvent: e, composedPath: () => originalComposedPath })
    }
    document.addEventListener('keydown', handlerWrapper)
    return () => {
      document.removeEventListener('keydown', handlerWrapper)
    }
  } catch {}
}

const defaultOnKeyReleasedBinder: OnKeyEventBinder<
  KeyboardEvent,
  KeyboardEventSingleProps
> = handler => {
  try {
    const handlerWrapper = (e: KeyboardEvent) => {
      const originalComposedPath = e.composedPath()
      return handler({ key: e.key, originalEvent: e, composedPath: () => originalComposedPath })
    }
    document.addEventListener('keyup', handlerWrapper)
    return () => {
      document.removeEventListener('keyup', handlerWrapper)
    }
  } catch {}
}

export class Keystrokes<
  E = KeyboardEvent,
  SP = MaybeKeyboardEventSingleProps<E>,
  CP = MaybeKeyboardEventComboProps<E>,
> {
  private _isActive: boolean
  private _isUpdatingKeyComboState: boolean

  private _unbinder: (() => void) | undefined

  private _onActiveBinder: OnActiveEventBinder
  private _onInactiveBinder: OnActiveEventBinder
  private _onKeyPressedBinder: OnKeyEventBinder<E, SP>
  private _onKeyReleasedBinder: OnKeyEventBinder<E, SP>
  private _keyComboEventMapper: KeyComboEventMapper<E, SP, CP>
  private _selfReleasingKeys: string[]
  private _keyRemap: Record<string, string>

  private _handlerStates: Record<string, HandlerState<KeyEvent<E, SP>>[]>
  private _keyComboStates: Record<string, KeyComboState<E, SP, CP>[]>
  private _keyComboStatesArray: KeyComboState<E, SP, CP>[]
  private _activeKeyPresses: KeyPress<E, SP>[]
  private _activeKeySet: Set<string>

  private _watchedKeyComboStates: Record<string, KeyComboState<E, SP, CP>>

  constructor(options: KeystrokesOptions<E, SP, CP> = {}) {
    this._isActive = true
    this._isUpdatingKeyComboState = false

    this._onActiveBinder = options.onActive ?? defaultOnActiveBinder
    this._onInactiveBinder = options.onInactive ?? defaultOnInactiveBinder
    this._onKeyPressedBinder = options.onKeyPressed ?? (defaultOnKeyPressedBinder as any)
    this._onKeyReleasedBinder = options.onKeyReleased ?? (defaultOnKeyReleasedBinder as any)
    this._keyComboEventMapper = options.mapKeyComboEvent ?? (() => ({} as any))
    this._selfReleasingKeys = options.selfReleasingKeys ?? []
    this._keyRemap = options.keyRemap ?? {}

    this._handlerStates = {}
    this._keyComboStates = {}
    this._keyComboStatesArray = []
    this._activeKeyPresses = []
    this._activeKeySet = new Set()

    this._watchedKeyComboStates = {}

    this.bindEnvironment()
  }

  get pressedKeys() {
    return this._activeKeyPresses.map(p => p.key)
  }

  bindKey(key: string, handler: Handler<KeyEvent<E, SP>>) {
    key = key.toLowerCase()

    const handlerState = new HandlerState(handler)
    this._handlerStates[key] ??= []
    this._handlerStates[key].push(handlerState)
  }

  unbindKey(key: string, handler?: Handler<KeyEvent<E, SP>>) {
    key = key.toLowerCase()

    const handlerStates = this._handlerStates[key]
    if (!handlerStates) {
      return
    }

    if (handler) {
      for (let i = 0; i < handlerStates.length; i += 1) {
        if (handlerStates[i].isOwnHandler(handler)) {
          handlerStates.splice(i, 1)
          i -= 1
        }
      }
    } else {
      handlerStates.length = 0
    }
  }

  bindKeyCombo(keyCombo: string, handler: Handler<KeyComboEvent<E, SP, CP>>) {
    keyCombo = KeyComboState.normalizeKeyCombo(keyCombo)

    const keyComboState = new KeyComboState<E, SP, CP>(keyCombo, this._keyComboEventMapper, handler)

    this._keyComboStates[keyCombo] ??= []
    this._keyComboStates[keyCombo].push(keyComboState)
    this._keyComboStatesArray.push(keyComboState)
  }

  unbindKeyCombo(keyCombo: string, handler?: Handler<KeyComboEvent<E, SP, CP>>) {
    keyCombo = KeyComboState.normalizeKeyCombo(keyCombo)

    const keyComboStates = this._keyComboStates[keyCombo]
    if (!keyComboStates) {
      return
    }

    if (handler) {
      for (let i = 0; i < keyComboStates.length; i += 1) {
        if (keyComboStates[i].isOwnHandler(handler)) {
          for (let j = 0; j < this._keyComboStatesArray.length; j += 1) {
            if (this._keyComboStatesArray[j] === keyComboStates[i]) {
              this._keyComboStatesArray.splice(j, 1)
              j -= 1
            }
          }
          keyComboStates.splice(i, 1)
          i -= 1
        }
      }
    } else {
      keyComboStates.length = 0
    }
  }

  checkKey(key: string) {
    return this._activeKeySet.has(key.toLowerCase())
  }

  checkKeyCombo(keyCombo: string) {
    keyCombo = KeyComboState.normalizeKeyCombo(keyCombo)
    if (!this._watchedKeyComboStates[keyCombo]) {
      this._watchedKeyComboStates[keyCombo] = new KeyComboState(keyCombo, this._keyComboEventMapper)
    }
    const keyComboState = this._watchedKeyComboStates[keyCombo]
    keyComboState.updateState(this._activeKeyPresses)
    return keyComboState.isPressed
  }

  bindEnvironment() {
    this.unbindEnvironment()

    const unbindActive = this._onActiveBinder(() => {
      this._isActive = true
    })
    const unbindInactive = this._onInactiveBinder(() => {
      this._isActive = false
    })
    const unbindKeyPressed = this._onKeyPressedBinder(e => {
      this._handleKeyPress(e)
    })
    const unbindKeyReleased = this._onKeyReleasedBinder(e => {
      this._handleKeyRelease(e)
    })

    this._unbinder = () => {
      unbindActive?.()
      unbindInactive?.()
      unbindKeyPressed?.()
      unbindKeyReleased?.()
    }
  }

  unbindEnvironment() {
    this._unbinder?.()
  }

  private _handleKeyPress(event: KeyEvent<E, SP>) {
    ;(async () => {
      if (!this._isActive) {
        return
      }

      let key = event.key.toLowerCase()
      const remappedKey = this._keyRemap[key]
      if (remappedKey) {
        key = remappedKey
      }

      const keyPressHandlerStates = this._handlerStates[key]
      if (keyPressHandlerStates) {
        for (const s of keyPressHandlerStates) {
          s.executePressed(event)
        }
      }

      if (!this._activeKeySet.has(key)) {
        this._activeKeySet.add(key)
        this._activeKeyPresses.push({
          key,
          event,
        })
      }

      await this._updateKeyComboStates()

      for (const keyComboState of this._keyComboStatesArray) {
        keyComboState.executePressed(event)
      }
    })().catch(err => {
      console.error(err)
    })
  }

  private _handleKeyRelease(event: KeyEvent<E, SP>) {
    ;(async () => {
      const key = event.key.toLowerCase()

      const keyPressHandlerStates = this._handlerStates[key]
      if (keyPressHandlerStates) {
        for (const s of keyPressHandlerStates) {
          s.executeReleased(event)
        }
      }

      if (this._activeKeySet.has(key)) {
        this._activeKeySet.delete(key)
        for (let i = 0; i < this._activeKeyPresses.length; i += 1) {
          if (this._activeKeyPresses[i].key === key) {
            this._activeKeyPresses.splice(i, 1)
            i -= 1
            break
          }
        }
      }

      this._tryReleaseSelfReleasingKeys()

      await this._updateKeyComboStates()

      for (const keyComboState of this._keyComboStatesArray) {
        keyComboState.executeReleased(event)
      }
    })().catch(err => {
      console.error(err)
    })
  }

  private async _updateKeyComboStates() {
    if (this._isUpdatingKeyComboState) {
      return await nextTick()
    }
    this._isUpdatingKeyComboState = true

    await nextTick()

    for (const keyComboState of this._keyComboStatesArray) {
      keyComboState.updateState(this._activeKeyPresses)
    }

    this._isUpdatingKeyComboState = false
  }

  private _tryReleaseSelfReleasingKeys() {
    for (const activeKey of this._activeKeyPresses) {
      let isSelfReleasingKey = false
      for (const selfReleasingKey of this._selfReleasingKeys) {
        if (activeKey.key === selfReleasingKey) {
          isSelfReleasingKey = true
          break
        }
      }
      if (!isSelfReleasingKey) {
        return
      }
    }

    for (const activeKey of this._activeKeyPresses) {
      this._handleKeyRelease({ key: activeKey } as any)
    }
  }
}
