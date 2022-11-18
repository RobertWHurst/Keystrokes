import { HandlerState } from "./handler-state.js"
import { KeyComboState } from "./key-combo-state.js"

export type KeyEvent<KeyboardEvent> = {
  key: string
  originalEvent: KeyboardEvent
}

export type KeyComboEvent<KeyboardEvent> = {
  keyCombo: string
  originalEvent: KeyboardEvent
}

export type HandlerFn<Event> = (event: Event) => void

export type HandlerObj<Event> = {
  onPressed?: HandlerFn<Event>
  onPressedWithRepeat?: HandlerFn<Event>
  onReleased?: HandlerFn<Event>
}

export type Handler<Event> = HandlerFn<Event> | HandlerObj<Event>

export type MinimalEvent = {
  key: string
}

export type OnActiveEventBinder = (handler: () => void) => (() => void) | void
export type OnKeyboardEventBinder<KeyboardEvent> = (handler: (event: KeyboardEvent) => void) => (() => void) | void

export type KeystrokesOptions<KeyboardEvent> = {
  onActive?: OnActiveEventBinder
  onInactive?: OnActiveEventBinder
  onKeyPressed?: OnKeyboardEventBinder<KeyboardEvent>
  onKeyReleased?: OnKeyboardEventBinder<KeyboardEvent>
}

const nextTickBinder =
  typeof process === 'object' && typeof process.nextTick === 'function' ? process.nextTick :
  typeof requestAnimationFrame === 'function' ? requestAnimationFrame :
  (f: () => void) => setTimeout(f, 0)

export const nextTick = () => new Promise(r => nextTickBinder(r))

const defaultOnActiveBinder: OnActiveEventBinder = (handler) => {
  try {
    const handlerWrapper = () => handler()
    addEventListener('focus', handlerWrapper)
    return () => { removeEventListener('focus', handlerWrapper) }
  } catch {}
}

const defaultOnInactiveBinder: OnActiveEventBinder = (handler) => {
  try {
    const handlerWrapper = () => handler()
    addEventListener('blur', () => handler())
    return () => { removeEventListener('blur', handlerWrapper) }
  } catch {}
}

const defaultOnKeyPressedBinder: OnKeyboardEventBinder<any> = (handler) => {
  try {
    const handlerWrapper = (e: any) => handler({ key: e.key, originalEvent: e })
    document.addEventListener('keydown', handlerWrapper)
    return () => { document.removeEventListener('keydown', handlerWrapper) }
  } catch {}
}

const defaultOnKeyReleasedBinder: OnKeyboardEventBinder<any> = (handler) => {
  try {
    const handlerWrapper = (e: any) => handler({ key: e.key, originalEvent: e })
    document.addEventListener('keyup', handlerWrapper)
    return () => { document.removeEventListener('keyup', handlerWrapper) }
  } catch {}
}

export class Keystrokes<KeyboardEvent extends MinimalEvent> {
  _isActive: boolean
  _isUpdatingKeyComboState: boolean

  _unbinder: (() => void) | undefined

  _onActiveBinder: OnActiveEventBinder
  _onInactiveBinder: OnActiveEventBinder
  _onKeyPressedBinder: OnKeyboardEventBinder<KeyboardEvent>
  _onKeyReleasedBinder: OnKeyboardEventBinder<KeyboardEvent>

  _handlerStates: Record<string, HandlerState<KeyEvent<KeyboardEvent>>[]>
  _keyComboStates: Record<string, KeyComboState<KeyboardEvent>[]>
  _keyComboStatesArray: KeyComboState<KeyboardEvent>[]
  _activeKeys: string[]
  _activeKeySet: Set<string>

  constructor (options: KeystrokesOptions<KeyboardEvent> = {}) {
    this._isActive = true
    this._isUpdatingKeyComboState = false

    this._onActiveBinder = options.onActive ?? defaultOnActiveBinder
    this._onInactiveBinder = options.onInactive ?? defaultOnInactiveBinder
    this._onKeyPressedBinder = options.onKeyPressed ?? defaultOnKeyPressedBinder
    this._onKeyReleasedBinder = options.onKeyReleased ?? defaultOnKeyReleasedBinder
    
    this._handlerStates = {}
    this._keyComboStates = {}
    this._keyComboStatesArray = []
    this._activeKeys = []
    this._activeKeySet = new Set()

    this._bindEnvironment()
  }

  bindKey (key: string, handler: Handler<KeyEvent<KeyboardEvent>>) {
    key = key.toLowerCase()

    const handlerState = new HandlerState(handler)
    this._handlerStates[key] ??= []
    this._handlerStates[key].push(handlerState)
  }

  unbindKey (key: string, handler?: Handler<KeyEvent<KeyboardEvent>>) {
    key = key.toLowerCase()

    const handlerStates = this._handlerStates[key]
    if (!handlerStates) { return }

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

  bindKeyCombo (keyCombo: string, handler: Handler<KeyComboEvent<KeyboardEvent>>) {
    keyCombo = KeyComboState.normalizeKeyCombo(keyCombo)
  
    const keyComboState = new KeyComboState<KeyboardEvent>(keyCombo, handler)

    this._keyComboStates[keyCombo] ??= []
    this._keyComboStates[keyCombo].push(keyComboState)
    this._keyComboStatesArray.push(keyComboState)
  }

  unbindKeyCombo (keyCombo: string, handler?: Handler<KeyComboEvent<KeyboardEvent>>) {
    keyCombo = KeyComboState.normalizeKeyCombo(keyCombo)

    const keyComboStates = this._keyComboStates[keyCombo]
    if (!keyComboStates) { return }

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

  checkKey (key: string) {
    return this._activeKeySet.has(key.toLowerCase())
  }

  checkKeyCombo (keyCombo: string) {
    const keyComboState = new KeyComboState(keyCombo)
    keyComboState.updateState(this._activeKeys)
    return keyComboState.isPressed
  }

  _bindEnvironment() {
    this._unbinder?.()

    const unbindActive = this._onActiveBinder(() => { this._isActive = true })
    const unbindInactive = this._onInactiveBinder(() => { this._isActive = false })
    const unbindKeyPressed = this._onKeyPressedBinder((e) => { this._handleKeyPress(e) })
    const unbindKeyReleased = this._onKeyReleasedBinder((e) => { this._handleKeyRelease(e) })

    this._unbinder = () => {
      unbindActive?.()
      unbindInactive?.()
      unbindKeyPressed?.()
      unbindKeyReleased?.()
    }
  }

  _handleKeyPress (event: KeyboardEvent) {
    (async () => {
      if (!this._isActive) { return }

      const key = event.key.toLowerCase()
      const wrappedEvent = this._wrapEvent(event)

      const keyPressHandlerStates = this._handlerStates[key]
      if (keyPressHandlerStates) {
        for (const s of keyPressHandlerStates) { s.executePressed(wrappedEvent) }
      }

      if (!this._activeKeySet.has(key)) {
        this._activeKeySet.add(key)
        this._activeKeys.push(key)
      }

      await this._updateKeyComboStates()

      for (const keyComboState of this._keyComboStatesArray) {
        keyComboState.executePressed(wrappedEvent)
      }
    })().catch(err => { console.error(err) })
  }

  _handleKeyRelease (event: KeyboardEvent) {
    (async () => {
      if (!this._isActive) { return }

      const key = event.key.toLowerCase()
      const wrappedEvent = this._wrapEvent(event)

      const keyPressHandlerStates = this._handlerStates[key]
      if (keyPressHandlerStates) {
        for (const s of keyPressHandlerStates) { s.executeReleased(wrappedEvent) }
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

      await this._updateKeyComboStates()

      for (const keyComboState of this._keyComboStatesArray) {
        keyComboState.executeReleased(wrappedEvent)
      }
    })().catch(err => { console.error(err) })
  }

  async _updateKeyComboStates () {
    if (this._isUpdatingKeyComboState) { return await nextTick() }
    this._isUpdatingKeyComboState = true

    await nextTick()

    for (const keyComboState of this._keyComboStatesArray) {
      keyComboState.updateState(this._activeKeys)
    }

    this._isUpdatingKeyComboState = false
  }

  _wrapEvent(event: KeyboardEvent): KeyEvent<KeyboardEvent> {
    return {
      key: event.key,
      originalEvent: event
    }
  }
}
