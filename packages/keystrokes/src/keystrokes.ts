import {
  browserOnActiveBinder,
  browserOnInactiveBinder,
  browserOnKeyPressedBinder,
  browserOnKeyReleasedBinder,
} from './browser-bindings'
import { Handler, HandlerState, KeyEvent } from './handler-state'
import { KeyComboEvent, KeyComboState } from './key-combo-state'

export type BrowserKeyEventProps = {
  composedPath(): EventTarget[]
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type BrowserKeyComboEventProps = {}

export type MaybeBrowserKeyEventProps<OriginalEvent> =
  OriginalEvent extends KeyboardEvent
    ? BrowserKeyEventProps
    : // eslint-disable-next-line @typescript-eslint/ban-types
      {}

export type MaybeBrowserKeyComboEventProps<OriginalEvent> =
  OriginalEvent extends KeyboardEvent
    ? BrowserKeyComboEventProps
    : // eslint-disable-next-line @typescript-eslint/ban-types
      {}

export type OnActiveEventBinder = (handler: () => void) => (() => void) | void
export type OnKeyEventBinder<OriginalEvent, KeyEventProps> = (
  handler: (event: KeyEvent<OriginalEvent, KeyEventProps>) => void,
) => (() => void) | void

export type KeyComboEventMapper<
  OriginalEvent,
  KeyEventProps,
  KeyComboEventProps,
> = (
  activeKeyPresses: KeyPress<OriginalEvent, KeyEventProps>[][],
  finalKeyPress: KeyPress<OriginalEvent, KeyEventProps>,
) => KeyComboEvent<OriginalEvent, KeyEventProps, KeyComboEventProps>

export type KeyPress<OriginalEvent, KeyEventProps> = {
  key: string
  event: KeyEvent<OriginalEvent, KeyEventProps>
}

export type KeystrokesOptions<
  OriginalEvent = KeyboardEvent,
  KeyEventProps = MaybeBrowserKeyEventProps<OriginalEvent>,
  KeyComboEventProps = MaybeBrowserKeyComboEventProps<OriginalEvent>,
> = {
  onActive?: OnActiveEventBinder
  onInactive?: OnActiveEventBinder
  onKeyPressed?: OnKeyEventBinder<OriginalEvent, KeyEventProps>
  onKeyReleased?: OnKeyEventBinder<OriginalEvent, KeyEventProps>
  mapKeyComboEvent?: KeyComboEventMapper<
    OriginalEvent,
    KeyEventProps,
    KeyComboEventProps
  >
  selfReleasingKeys?: string[]
  keyRemap?: Record<string, string>
}

const nextTickBinder =
  typeof requestAnimationFrame === 'function'
    ? (r: () => void) => requestAnimationFrame(r)
    : (f: () => void) => setTimeout(f, 0)

export const nextTick = () => new Promise<void>((r) => nextTickBinder(r))

export class Keystrokes<
  OriginalEvent = KeyboardEvent,
  KeyEventProps = MaybeBrowserKeyEventProps<OriginalEvent>,
  KeyComboEventProps = MaybeBrowserKeyComboEventProps<OriginalEvent>,
> {
  private _isActive: boolean
  private _isUpdatingKeyComboState: boolean

  private _unbinder: (() => void) | undefined

  private _onActiveBinder: OnActiveEventBinder
  private _onInactiveBinder: OnActiveEventBinder
  private _onKeyPressedBinder: OnKeyEventBinder<OriginalEvent, KeyEventProps>
  private _onKeyReleasedBinder: OnKeyEventBinder<OriginalEvent, KeyEventProps>
  private _keyComboEventMapper: KeyComboEventMapper<
    OriginalEvent,
    KeyEventProps,
    KeyComboEventProps
  >
  private _selfReleasingKeys: string[]
  private _keyRemap: Record<string, string>

  private _handlerStates: Record<
    string,
    HandlerState<KeyEvent<OriginalEvent, KeyEventProps>>[]
  >
  private _keyComboStates: Record<
    string,
    KeyComboState<OriginalEvent, KeyEventProps, KeyComboEventProps>[]
  >
  private _keyComboStatesArray: KeyComboState<
    OriginalEvent,
    KeyEventProps,
    KeyComboEventProps
  >[]
  private _activeKeyPresses: KeyPress<OriginalEvent, KeyEventProps>[]
  private _activeKeySet: Set<string>

  private _watchedKeyComboStates: Record<
    string,
    KeyComboState<OriginalEvent, KeyEventProps, KeyComboEventProps>
  >

  constructor(
    options: KeystrokesOptions<
      OriginalEvent,
      KeyEventProps,
      KeyComboEventProps
    > = {},
  ) {
    this._isActive = true
    this._isUpdatingKeyComboState = false

    this._onActiveBinder = options.onActive ?? browserOnActiveBinder
    this._onInactiveBinder = options.onInactive ?? browserOnInactiveBinder
    this._onKeyPressedBinder =
      options.onKeyPressed ?? (browserOnKeyPressedBinder as any)
    this._onKeyReleasedBinder =
      options.onKeyReleased ?? (browserOnKeyReleasedBinder as any)
    this._keyComboEventMapper = options.mapKeyComboEvent ?? (() => ({}) as any)
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
    return this._activeKeyPresses.map((p) => p.key)
  }

  bindKey(
    key: string,
    handler: Handler<KeyEvent<OriginalEvent, KeyEventProps>>,
  ) {
    key = key.toLowerCase()

    const handlerState = new HandlerState(handler)
    this._handlerStates[key] ??= []
    this._handlerStates[key].push(handlerState)
  }

  unbindKey(
    key: string,
    handler?: Handler<KeyEvent<OriginalEvent, KeyEventProps>>,
  ) {
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

  bindKeyCombo(
    keyCombo: string,
    handler: Handler<
      KeyComboEvent<OriginalEvent, KeyEventProps, KeyComboEventProps>
    >,
  ) {
    keyCombo = KeyComboState.normalizeKeyCombo(keyCombo)

    const keyComboState = new KeyComboState<
      OriginalEvent,
      KeyEventProps,
      KeyComboEventProps
    >(keyCombo, this._keyComboEventMapper, handler)

    this._keyComboStates[keyCombo] ??= []
    this._keyComboStates[keyCombo].push(keyComboState)
    this._keyComboStatesArray.push(keyComboState)
  }

  unbindKeyCombo(
    keyCombo: string,
    handler?: Handler<
      KeyComboEvent<OriginalEvent, KeyEventProps, KeyComboEventProps>
    >,
  ) {
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
      this._watchedKeyComboStates[keyCombo] = new KeyComboState(
        keyCombo,
        this._keyComboEventMapper,
      )
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
    const unbindKeyPressed = this._onKeyPressedBinder((e) => {
      this._handleKeyPress(e)
    })
    const unbindKeyReleased = this._onKeyReleasedBinder((e) => {
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

  private _handleKeyPress(event: KeyEvent<OriginalEvent, KeyEventProps>) {
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
    })().catch((err) => {
      console.error(err)
    })
  }

  private _handleKeyRelease(event: KeyEvent<OriginalEvent, KeyEventProps>) {
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
    })().catch((err) => {
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
      for (const selfReleasingKey of this._selfReleasingKeys) {
        if (activeKey.key === selfReleasingKey) {
          this._handleKeyRelease(activeKey.event)
        }
      }
    }
  }
}
