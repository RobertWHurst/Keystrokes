import {
  MaybeBrowserKeyComboEventProps,
  MaybeBrowserKeyEventProps,
  browserOnActiveBinder,
  browserOnInactiveBinder,
  browserOnKeyPressedBinder,
  browserOnKeyReleasedBinder,
} from './browser-bindings'
import { Handler, HandlerState, KeyEvent } from './handler-state'
import { KeyComboEvent, KeyComboState } from './key-combo-state'

export const defaultSequenceTimeout = 1000

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
  aliases: Set<string>
  event: KeyEvent<OriginalEvent, KeyEventProps>
}

export type KeystrokesOptions<
  OriginalEvent = KeyboardEvent,
  KeyEventProps = MaybeBrowserKeyEventProps<OriginalEvent>,
  KeyComboEventProps = MaybeBrowserKeyComboEventProps<OriginalEvent>,
> = BindEnvironmentOptions<OriginalEvent, KeyEventProps, KeyComboEventProps>

export type BindEnvironmentOptions<
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

export class Keystrokes<
  OriginalEvent = KeyboardEvent,
  KeyEventProps = MaybeBrowserKeyEventProps<OriginalEvent>,
  KeyComboEventProps = MaybeBrowserKeyComboEventProps<OriginalEvent>,
> {
  sequenceTimeout: number

  private _isActive: boolean

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
  private _activeKeyMap: Map<string, KeyPress<OriginalEvent, KeyEventProps>>

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
    this.sequenceTimeout = defaultSequenceTimeout

    this._isActive = true

    this._onActiveBinder = () => {}
    this._onInactiveBinder = () => {}
    this._onKeyPressedBinder = () => {}
    this._onKeyReleasedBinder = () => {}
    this._keyComboEventMapper = () => ({}) as any
    this._selfReleasingKeys = []
    this._keyRemap = {}

    this._handlerStates = {}
    this._keyComboStates = {}
    this._keyComboStatesArray = []
    this._activeKeyPresses = []
    this._activeKeyMap = new Map()

    this._watchedKeyComboStates = {}

    this.bindEnvironment(options)
  }

  get pressedKeys() {
    return this._activeKeyPresses.map((p) => p.key)
  }

  bindKey(
    key: string | string[],
    handler: Handler<KeyEvent<OriginalEvent, KeyEventProps>>,
  ) {
    if (typeof key === 'object') {
      for (const k of key) this.bindKey(k, handler)
      return
    }

    key = key.toLowerCase()

    const handlerState = new HandlerState(handler)
    this._handlerStates[key] ??= []
    this._handlerStates[key].push(handlerState)
  }

  unbindKey(
    key: string | string[],
    handler?: Handler<KeyEvent<OriginalEvent, KeyEventProps>>,
  ) {
    if (typeof key === 'object') {
      for (const k of key) this.unbindKey(k, handler)
      return
    }

    key = key.toLowerCase()

    const handlerStates = this._handlerStates[key]
    if (!handlerStates) return

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
    keyCombo: string | string[],
    handler: Handler<
      KeyComboEvent<OriginalEvent, KeyEventProps, KeyComboEventProps>
    >,
  ) {
    if (typeof keyCombo === 'object') {
      for (const k of keyCombo) this.bindKeyCombo(k, handler)
      return
    }

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
    keyCombo: string | string[],
    handler?: Handler<
      KeyComboEvent<OriginalEvent, KeyEventProps, KeyComboEventProps>
    >,
  ) {
    if (typeof keyCombo === 'object') {
      for (const k of keyCombo) this.unbindKeyCombo(k, handler)
      return
    }

    keyCombo = KeyComboState.normalizeKeyCombo(keyCombo)

    const keyComboStates = this._keyComboStates[keyCombo]
    if (!keyComboStates) return

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
    return this._activeKeyPresses.some(
      (p) => p.key === key || p.aliases.has(key),
    )
  }

  checkKeyCombo(keyCombo: string) {
    const keyComboState = this._ensureCachedKeyComboState(keyCombo)
    return keyComboState.isPressed
  }

  checkKeyComboSequenceIndex(keyCombo: string) {
    const keyComboState = this._ensureCachedKeyComboState(keyCombo)
    return keyComboState.sequenceIndex
  }

  bindEnvironment(
    options: BindEnvironmentOptions<
      OriginalEvent,
      KeyEventProps,
      KeyComboEventProps
    > = {},
  ) {
    this.unbindEnvironment()

    this._onActiveBinder = options.onActive ?? browserOnActiveBinder
    this._onInactiveBinder = options.onInactive ?? browserOnInactiveBinder
    this._onKeyPressedBinder =
      options.onKeyPressed ??
      (browserOnKeyPressedBinder as OnKeyEventBinder<
        OriginalEvent,
        KeyEventProps
      >)
    this._onKeyReleasedBinder =
      options.onKeyReleased ??
      (browserOnKeyReleasedBinder as OnKeyEventBinder<
        OriginalEvent,
        KeyEventProps
      >)
    this._keyComboEventMapper = options.mapKeyComboEvent ?? (() => ({}) as any)
    this._selfReleasingKeys = options.selfReleasingKeys ?? []
    this._keyRemap = options.keyRemap ?? {}

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

  private _ensureCachedKeyComboState(keyCombo: string) {
    keyCombo = KeyComboState.normalizeKeyCombo(keyCombo)
    if (!this._watchedKeyComboStates[keyCombo]) {
      this._watchedKeyComboStates[keyCombo] = new KeyComboState(
        keyCombo,
        this._keyComboEventMapper,
      )
    }
    const keyComboState = this._watchedKeyComboStates[keyCombo]
    keyComboState.updateState(this._activeKeyPresses, this.sequenceTimeout)
    return keyComboState
  }

  private _handleKeyPress(event: KeyEvent<OriginalEvent, KeyEventProps>) {
    if (!this._isActive) return

    event = {
      ...event,
      key: event.key.toLowerCase(),
      aliases: event.aliases?.map((a) => a.toLowerCase()) ?? [],
    }

    const remappedKey = this._keyRemap[event.key]
    if (remappedKey) event.key = remappedKey
    for (let i = 0; i < event.aliases!.length; i += 1) {
      const remappedAlias = this._keyRemap[event.aliases![i]]
      if (remappedAlias) event.aliases![i] = remappedAlias
    }

    const keyPressHandlerStates = this._handlerStates[event.key]
    if (keyPressHandlerStates) {
      for (const s of keyPressHandlerStates) s.executePressed(event)
    }
    for (let i = 0; i < event.aliases!.length; i += 1) {
      const keyPressHandlerStates = this._handlerStates[event.aliases![i]]
      if (keyPressHandlerStates) {
        for (const s of keyPressHandlerStates) s.executePressed(event)
      }
    }

    const existingKeypress = this._activeKeyMap.get(event.key)
    if (existingKeypress) {
      existingKeypress.event = event
    } else {
      const keypress = {
        key: event.key,
        aliases: new Set(event.aliases),
        event,
      }
      this._activeKeyMap.set(event.key, keypress)
      this._activeKeyPresses.push(keypress)
    }

    this._updateKeyComboStates()

    for (const keyComboState of this._keyComboStatesArray)
      keyComboState.executePressed(event)
  }

  private _handleKeyRelease(event: KeyEvent<OriginalEvent, KeyEventProps>) {
    event = {
      ...event,
      key: event.key.toLowerCase(),
      aliases: event.aliases?.map((a) => a.toLowerCase()) ?? [],
    }

    const remappedKey = this._keyRemap[event.key]
    if (remappedKey) event.key = remappedKey
    if (event.aliases) {
      for (let i = 0; i < event.aliases.length; i += 1) {
        const remappedAlias = this._keyRemap[event.aliases[i]]
        if (remappedAlias) event.aliases[i] = remappedAlias
      }
    }

    const keyPressHandlerStates = this._handlerStates[event.key]
    if (keyPressHandlerStates) {
      for (const s of keyPressHandlerStates) s.executeReleased(event)
    }
    for (let i = 0; i < event.aliases!.length; i += 1) {
      const keyPressHandlerStates = this._handlerStates[event.aliases![i]]
      if (keyPressHandlerStates) {
        for (const s of keyPressHandlerStates) s.executeReleased(event)
      }
    }

    if (this._activeKeyMap.has(event.key)) {
      this._activeKeyMap.delete(event.key)
      for (let i = 0; i < this._activeKeyPresses.length; i += 1) {
        if (this._activeKeyPresses[i].key === event.key) {
          this._activeKeyPresses.splice(i, 1)
          i -= 1
          break
        }
      }
    }

    this._tryReleaseSelfReleasingKeys()
    this._updateKeyComboStates()

    for (const keyComboState of this._keyComboStatesArray)
      keyComboState.executeReleased(event)
  }

  private _updateKeyComboStates() {
    for (const keyComboState of this._keyComboStatesArray)
      keyComboState.updateState(this._activeKeyPresses, this.sequenceTimeout)
  }

  private _tryReleaseSelfReleasingKeys() {
    for (const activeKey of this._activeKeyPresses) {
      for (const selfReleasingKey of this._selfReleasingKeys) {
        if (activeKey.key === selfReleasingKey)
          this._handleKeyRelease(activeKey.event)
      }
    }
  }
}
