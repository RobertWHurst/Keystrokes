import type { KeyEvent, Handler } from './handler-state'
import { HandlerState } from './handler-state'
import { KeyPress, KeyComboEventMapper } from './keystrokes'

export type KeyComboEvent<OriginalEvent, KeyEventProps, KeyComboEventProps> =
  KeyComboEventProps & {
    keyCombo: string
    keyEvents: KeyEvent<OriginalEvent, KeyEventProps>[]
    finalKeyEvent: KeyEvent<OriginalEvent, KeyEventProps>
  }

export class KeyComboState<OriginalEvent, KeyEventProps, KeyComboEventProps> {
  private static _parseCache: Record<string, string[][][]> = {}
  private static _normalizationCache: Record<string, string> = {}

  static parseKeyCombo(keyComboStr: string) {
    if (KeyComboState._parseCache[keyComboStr]) {
      return KeyComboState._parseCache[keyComboStr]
    }

    const s = keyComboStr.toLowerCase()

    // operator
    let o = ''

    // unit
    let k: string[] = []

    // group
    let x: string[][] = [k]

    // sequence
    let y: string[][][] = [x]

    // combo
    const z: string[][][][] = [y]

    let isEscaped = false

    for (let i = 0; i < keyComboStr.length; i += 1) {
      if (s[i] === '\\') {
        isEscaped = true
      } else if ((s[i] === '+' || s[i] === '>' || s[i] === ',') && !isEscaped) {
        if (o) {
          // TODO: Nice error message
        }
        o = s[i]
      } else if (s[i].match(/[^\s]/)) {
        if (o) {
          if (o === ',') {
            k = []
            x = [k]
            y = [x]
            z.push(y)
          } else if (o === '>') {
            k = []
            x = [k]
            y.push(x)
          } else if (o === '+') {
            k = []
            x.push(k)
          }
          o = ''
        }
        isEscaped = false
        k.push(s[i])
      }
    }

    const sequences = z.map((y) => y.map((x) => x.map((k) => k.join(''))))
    KeyComboState._parseCache[keyComboStr] = sequences
    return sequences
  }

  static stringifyKeyCombo(keyCombo: string[][][]) {
    return keyCombo
      .map((s) =>
        s
          .map((u) =>
            u
              .map((k) => {
                if (k === '+') {
                  return '\\+'
                }
                if (k === '>') {
                  return '\\>'
                }
                if (k === ',') {
                  return '\\,'
                }
                return k
              })
              .join('+'),
          )
          .join('>'),
      )
      .join(',')
  }

  static normalizeKeyCombo(keyComboStr: string) {
    if (KeyComboState._normalizationCache[keyComboStr]) {
      return KeyComboState._normalizationCache[keyComboStr]
    }
    const normalized = this.stringifyKeyCombo(this.parseKeyCombo(keyComboStr))
    KeyComboState._normalizationCache[keyComboStr] = normalized
    return normalized
  }

  get isPressed() {
    return !!this._isPressedWithFinalUnit
  }

  get sequenceIndex() {
    if (this.isPressed) return this._parsedKeyCombo.length
    return this._sequenceIndex
  }

  private _normalizedKeyCombo: string
  private _parsedKeyCombo: string[][][]
  private _handlerState: HandlerState<
    KeyComboEvent<OriginalEvent, KeyEventProps, KeyComboEventProps>
  >
  private _lastActiveKeyPresses: KeyPress<OriginalEvent, KeyEventProps>[][]
  private _isPressedWithFinalUnit: Set<string> | null
  private _sequenceIndex: number
  private _keyComboEventMapper: KeyComboEventMapper<
    OriginalEvent,
    KeyEventProps,
    KeyComboEventProps
  >

  constructor(
    keyCombo: string,
    keyComboEventMapper: KeyComboEventMapper<
      OriginalEvent,
      KeyEventProps,
      KeyComboEventProps
    >,
    handler: Handler<
      KeyComboEvent<OriginalEvent, KeyEventProps, KeyComboEventProps>
    > = {},
  ) {
    this._normalizedKeyCombo = KeyComboState.normalizeKeyCombo(keyCombo)
    this._parsedKeyCombo = KeyComboState.parseKeyCombo(keyCombo)
    this._handlerState = new HandlerState(handler)
    this._keyComboEventMapper = keyComboEventMapper
    this._lastActiveKeyPresses = []
    this._isPressedWithFinalUnit = null
    this._sequenceIndex = 0
  }

  isOwnHandler(
    handler: Handler<
      KeyComboEvent<OriginalEvent, KeyEventProps, KeyComboEventProps>
    >,
  ) {
    return this._handlerState.isOwnHandler(handler)
  }

  executePressed(event: KeyEvent<OriginalEvent, KeyEventProps>) {
    if (!this._isPressedWithFinalUnit?.has(event.key)) return
    this._handlerState.executePressed(
      this._wrapEvent(this._lastActiveKeyPresses, { key: event.key, event }),
    )
  }

  executeReleased(event: KeyEvent<OriginalEvent, KeyEventProps>) {
    if (!this._isPressedWithFinalUnit?.has(event.key)) return
    this._handlerState.executeReleased(
      this._wrapEvent(this._lastActiveKeyPresses, { key: event.key, event }),
    )
    this._isPressedWithFinalUnit = null
  }

  updateState(activeKeys: KeyPress<OriginalEvent, KeyEventProps>[]) {
    const sequence = this._parsedKeyCombo[this._sequenceIndex]

    // ensure all sequence keys are pressed
    let activeKeyIndex = 0
    for (const unit of sequence) {
      let unitEndIndex = activeKeyIndex
      for (const key of unit) {
        let foundKey = false
        for (let i = activeKeyIndex; i < activeKeys.length; i += 1) {
          const activeKey = activeKeys[i]
          if (key === activeKey.key) {
            if (i > unitEndIndex) {
              unitEndIndex = i
            }
            foundKey = true
            break
          }
        }
        if (!foundKey) {
          if (this._handlerState.isEmpty) {
            this._isPressedWithFinalUnit = null
          }
          return
        }
      }
      activeKeyIndex = unitEndIndex
    }

    // ensure all active keys are part of sequence
    for (const activeKey of activeKeys) {
      let foundActiveKey = false
      for (const unit of sequence) {
        for (const key of unit) {
          if (activeKey.key === key) {
            foundActiveKey = true
            break
          }
        }
      }
      if (!foundActiveKey) {
        this._lastActiveKeyPresses.length = 0
        this._sequenceIndex = 0
        return
      }
    }

    this._lastActiveKeyPresses[this._sequenceIndex] = activeKeys.slice(0)

    if (this._sequenceIndex < this._parsedKeyCombo.length - 1) {
      this._sequenceIndex += 1
      return
    }

    this._sequenceIndex = 0
    this._isPressedWithFinalUnit = new Set(sequence[sequence.length - 1])
  }

  _wrapEvent(
    activeKeyPresses: KeyPress<OriginalEvent, KeyEventProps>[][],
    finalKeyPress: KeyPress<OriginalEvent, KeyEventProps>,
  ): KeyComboEvent<OriginalEvent, KeyEventProps, KeyComboEventProps> {
    const mappedEventProps = this._keyComboEventMapper(
      activeKeyPresses,
      finalKeyPress,
    )
    return {
      ...mappedEventProps,
      keyCombo: this._normalizedKeyCombo,
      keyEvents: activeKeyPresses.flat().map((p) => p.event),
      finalKeyEvent: finalKeyPress.event,
    }
  }
}
