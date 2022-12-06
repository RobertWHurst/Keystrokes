import { KeyEvent, Handler, HandlerState } from "./handler-state.js"

export type KeyComboEvent<E> = {
  keyCombo: string
  originalEvent?: E
}

export class KeyComboState<E> {
  static _parseCache: Record<string, string[][][]> = {}
  static _normalizationCache: Record<string, string> = {}

  static parseKeyCombo(keyComboStr: string) {
    if (KeyComboState._parseCache[keyComboStr]) { return KeyComboState._parseCache[keyComboStr] }

    const s = keyComboStr.toLowerCase()

    let o = ''
    let k: string[] = []
    let x: string[][] = [k]
    let y: string[][][] = [x]
    let z: string[][][][] = [y]
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

    const sequences = z.map(y => y.map(x => x.map(k => k.join(''))))
    KeyComboState._parseCache[keyComboStr] = sequences
    return sequences
  }

  static stringifyKeyCombo(keyCombo: string[][][]) {
    return keyCombo
      .map(s =>
        s.map(u =>
          u.map(k => {
            if (k === '+') { return '\\+' }
            if (k === '>') { return '\\>' }
            if (k === ',') { return '\\,' }
            return k
          }).join('+')
        ).join('>')
      ).join(',')
  }

  static normalizeKeyCombo(keyComboStr: string) {
    if (KeyComboState._normalizationCache[keyComboStr]) { return KeyComboState._normalizationCache[keyComboStr] }
    const normalized = this.stringifyKeyCombo(this.parseKeyCombo(keyComboStr))
    KeyComboState._normalizationCache[keyComboStr] = normalized
    return normalized
  }

  get isPressed() { return !!this._isPressedWithFinalKey }

  _normalizedKeyCombo: string
  _parsedKeyCombo: string[][][]
  _handlerState: HandlerState<KeyComboEvent<E>>
  _isPressedWithFinalKey: string
  _waitingForNextSequence: boolean
  _sequenceIndex: number

  constructor(keyCombo: string, handler: Handler<KeyComboEvent<E>> = {}) {
    this._normalizedKeyCombo = KeyComboState.normalizeKeyCombo(keyCombo)
    this._parsedKeyCombo = KeyComboState.parseKeyCombo(keyCombo)
    this._handlerState = new HandlerState(handler)
    this._isPressedWithFinalKey = ''
    this._waitingForNextSequence = false
    this._sequenceIndex = 0
  }

  isOwnHandler(handler: Handler<KeyComboEvent<E>>) {
    return this._handlerState.isOwnHandler(handler)
  }

  executePressed(event: KeyEvent<E>) {
    if (this._isPressedWithFinalKey !== event.key) { return }
    this._handlerState.executePressed(this._wrapEvent(event))
  }

  executeReleased(event: KeyEvent<E>) {
    if (this._isPressedWithFinalKey !== event.key) { return }
    this._isPressedWithFinalKey = ''
    this._handlerState.executeReleased(this._wrapEvent(event))
  }
  
  updateState (activeKeys: string[]) {
    const sequence = this._parsedKeyCombo[this._sequenceIndex]

    // Do nothing if no keys are pressed
    if (activeKeys.length === 0) { return }

    // ensure all sequence keys are pressed
    let activeKeyIndex = 0
    for (const unit of sequence) {
      let unitEndIndex = activeKeyIndex
      for (const key of unit) {
        let foundKey = false
        for (let i = activeKeyIndex; i < activeKeys.length; i += 1) {
          const activeKey = activeKeys[i]
          if (key === activeKey) {
            if (i > unitEndIndex) { unitEndIndex = i }
            foundKey = true
            break
          }
        }
        if (!foundKey) {
          if (this._handlerState.isEmpty) { this._isPressedWithFinalKey = '' }
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
          if (activeKey === key) {
            foundActiveKey = true
            break
          }
        }
      }
      if (!foundActiveKey) {
        this._sequenceIndex = 0
        return
      }
    }

    if (this._sequenceIndex < this._parsedKeyCombo.length - 1) {
      this._sequenceIndex += 1
      return
    }

    this._sequenceIndex = 0
    this._isPressedWithFinalKey = activeKeys[activeKeys.length - 1]
  }

  _wrapEvent(keyEvent: KeyEvent<E>): KeyComboEvent<E> {
    return {
      keyCombo: this._normalizedKeyCombo,
      originalEvent: keyEvent.originalEvent
    }
  }
}
