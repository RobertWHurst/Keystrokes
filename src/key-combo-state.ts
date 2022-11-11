import { HandlerState } from "./handler-state.js"
import { Handler, KeyPressedEvent, KeyReleasedEvent } from "./keystrokes.js"

export class KeyComboState {
  static _parseCache: Record<string, string[][][]> = {}
  static _normalizationCache: Record<string, string> = {}

  static parseKeyCombo(keyCombo: string) {
    if (KeyComboState._parseCache[keyCombo]) { return KeyComboState._parseCache[keyCombo] }
    const sequences = keyCombo.toLowerCase().split(/\s*,\s*/g).map(s => s.split(/\s*>\s*/g).map(u => u.split(/\s*\+\s*/g)))
    KeyComboState._parseCache[keyCombo] = sequences
    return sequences
  }

  static normalizeKeyCombo(keyCombo: string) {
    if (KeyComboState._normalizationCache[keyCombo]) { return KeyComboState._normalizationCache[keyCombo] }
    const normalized = this.parseKeyCombo(keyCombo).map(s => s.map(u => u.join('+')).join('>')).join(',')
    KeyComboState._normalizationCache[keyCombo] = normalized
    return normalized
  }

  get isPressed() { return this._isPressedWithFinalKey }

  _parsedKeyCombo: string[][][]
  _handlerState: HandlerState
  _isPressedWithFinalKey: string
  _sequenceIndex: number

  constructor(keyCombo: string, handler: Handler = {}) {
    this._parsedKeyCombo = KeyComboState.parseKeyCombo(keyCombo)
    this._handlerState = new HandlerState(handler)
    this._isPressedWithFinalKey = ''
    this._sequenceIndex = 0
  }

  isOwnHandler(handler: Handler) {
    return this._handlerState.isOwnHandler(handler)
  }

  executePressed(event: KeyPressedEvent) {
    if (this._isPressedWithFinalKey !== event.key) { return }
    this._handlerState.executePressed(event)
  }

  executeReleased(event: KeyReleasedEvent) {
    if (this._isPressedWithFinalKey !== event.key) { return }
    this._isPressedWithFinalKey = ''
    this._handlerState.executeReleased(event)
  }

  updateState (activeKeys: string[]) {
    const sequence = this._parsedKeyCombo[this._sequenceIndex]

    let activeKeysIndex = 0
    let key = ''

    for (let i = 0; i < sequence.length; i += 1) {
      const unit = sequence[i]

      for (let j = 0; j < unit.length; j += 1) {
        key = unit[j]

        let highestFoundActiveKeyIndex = -1
        for (let k = activeKeysIndex; k < activeKeys.length; k += 1) {
          const activeKey = activeKeys[k]
          if (key === activeKey && k > highestFoundActiveKeyIndex) {
            highestFoundActiveKeyIndex = k
            break
          }
        }

        if (highestFoundActiveKeyIndex === -1) {
          this._sequenceIndex = 0
          return
        }
      }
    }

    if (this._sequenceIndex === this._parsedKeyCombo.length - 1) {
      this._sequenceIndex = 0
      this._isPressedWithFinalKey = key
      return
    }

    this._sequenceIndex += 1
  }
}
