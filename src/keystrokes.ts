import { Handler, HandlerState, KeyEvent } from './handler-state.js'
import { KeyComboEvent, KeyComboState } from './key-combo-state.js'

export type OnActiveEventBinder = (handler: () => void) => (() => void) | void
export type OnKeyEventBinder<E> = (handler: (event: KeyEvent<E>) => void) => (() => void) | void

export type KeystrokesOptions<E = KeyboardEvent> = {
  onActive?: OnActiveEventBinder
  onInactive?: OnActiveEventBinder
  onKeyPressed?: OnKeyEventBinder<E>
  onKeyReleased?: OnKeyEventBinder<E>
  selfReleasingKeys?: string[]
  keyRemap?: Record<string, string>
}

const nextTickBinder =
  typeof process === 'object' && typeof process.nextTick === 'function'
    ? process.nextTick
    : typeof requestAnimationFrame === 'function'
    ? requestAnimationFrame
    : (f: () => void) => setTimeout(f, 0)

export const nextTick = () => new Promise(r => nextTickBinder(r))

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

const defaultOnKeyPressedBinder: OnKeyEventBinder<KeyboardEvent> = handler => {
  try {
    const handlerWrapper = (e: KeyboardEvent) => handler({ key: e.key, originalEvent: e })
    document.addEventListener('keydown', handlerWrapper)
    return () => {
      document.removeEventListener('keydown', handlerWrapper)
    }
  } catch {}
}

const defaultOnKeyReleasedBinder: OnKeyEventBinder<KeyboardEvent> = handler => {
  try {
    const handlerWrapper = (e: KeyboardEvent) => handler({ key: e.key, originalEvent: e })
    document.addEventListener('keyup', handlerWrapper)
    return () => {
      document.removeEventListener('keyup', handlerWrapper)
    }
  } catch {}
}

export class Keystrokes<E = KeyboardEvent> {
  _isActive: boolean
  _isUpdatingKeyComboState: boolean

  _unbinder: (() => void) | undefined

  _onActiveBinder: OnActiveEventBinder
  _onInactiveBinder: OnActiveEventBinder
  _onKeyPressedBinder: OnKeyEventBinder<E>
  _onKeyReleasedBinder: OnKeyEventBinder<E>
  _selfReleasingKeys: string[]
  _keyRemap: Record<string, string>

  _handlerStates: Record<string, HandlerState<KeyEvent<E>>[]>
  _keyComboStates: Record<string, KeyComboState<E>[]>
  _keyComboStatesArray: KeyComboState<E>[]
  _activeKeys: string[]
  _activeKeySet: Set<string>

  _watchedKeyComboStates: Record<string, KeyComboState<E>>

  constructor(options: KeystrokesOptions<E> = {}) {
    this._isActive = true
    this._isUpdatingKeyComboState = false

    this._onActiveBinder = options.onActive ?? defaultOnActiveBinder
    this._onInactiveBinder = options.onInactive ?? defaultOnInactiveBinder
    this._onKeyPressedBinder = options.onKeyPressed ?? (defaultOnKeyPressedBinder as any)
    this._onKeyReleasedBinder = options.onKeyReleased ?? (defaultOnKeyReleasedBinder as any)
    this._selfReleasingKeys = options.selfReleasingKeys ?? []
    this._keyRemap = options.keyRemap ?? {}

    this._handlerStates = {}
    this._keyComboStates = {}
    this._keyComboStatesArray = []
    this._activeKeys = []
    this._activeKeySet = new Set()

    this._watchedKeyComboStates = {}

    this.bindEnvironment()
  }

  get pressedKeys() {
    return this._activeKeys.slice(0)
  }

  bindKey(key: string, handler: Handler<KeyEvent<E>>) {
    key = key.toLowerCase()

    const handlerState = new HandlerState(handler)
    this._handlerStates[key] ??= []
    this._handlerStates[key].push(handlerState)
  }

  unbindKey(key: string, handler?: Handler<KeyEvent<E>>) {
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

  bindKeyCombo(keyCombo: string, handler: Handler<KeyComboEvent<E>>) {
    keyCombo = KeyComboState.normalizeKeyCombo(keyCombo)

    const keyComboState = new KeyComboState<E>(keyCombo, handler)

    this._keyComboStates[keyCombo] ??= []
    this._keyComboStates[keyCombo].push(keyComboState)
    this._keyComboStatesArray.push(keyComboState)
  }

  unbindKeyCombo(keyCombo: string, handler?: Handler<KeyComboEvent<E>>) {
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
      this._watchedKeyComboStates[keyCombo] = new KeyComboState(keyCombo)
    }
    const keyComboState = this._watchedKeyComboStates[keyCombo]
    keyComboState.updateState(this._activeKeys)
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

  _handleKeyPress(event: KeyEvent<E>) {
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
        this._activeKeys.push(key)
      }

      await this._updateKeyComboStates()

      for (const keyComboState of this._keyComboStatesArray) {
        keyComboState.executePressed(event)
      }
    })().catch(err => {
      console.error(err)
    })
  }

  _handleKeyRelease(event: KeyEvent<E>) {
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
        for (let i = 0; i < this._activeKeys.length; i += 1) {
          if (this._activeKeys[i] === key) {
            this._activeKeys.splice(i, 1)
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

  async _updateKeyComboStates() {
    if (this._isUpdatingKeyComboState) {
      return await nextTick()
    }
    this._isUpdatingKeyComboState = true

    await nextTick()

    for (const keyComboState of this._keyComboStatesArray) {
      keyComboState.updateState(this._activeKeys)
    }

    this._isUpdatingKeyComboState = false
  }

  _tryReleaseSelfReleasingKeys() {
    for (const activeKey of this._activeKeys) {
      let isSelfReleasingKey = false
      for (const selfReleasingKey of this._selfReleasingKeys) {
        if (activeKey === selfReleasingKey) {
          isSelfReleasingKey = true
          break
        }
      }
      if (!isSelfReleasingKey) {
        return
      }
    }

    for (const activeKey of this._activeKeys) {
      this._handleKeyRelease({ key: activeKey } as any)
    }
  }
}
