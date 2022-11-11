import { Handler, HandlerFn, KeyPressedEvent, KeyReleasedEvent } from "./keystrokes.js";

export class HandlerState {
  _onPressed?: HandlerFn
  _onPressedWithRepeat?: HandlerFn
  _onReleased?: HandlerFn
  _isPressed: boolean
  _identity: Handler

  constructor(handler: Handler) {
    this._isPressed = false
    this._identity = handler

    if (typeof handler === 'function') {
      this._onPressedWithRepeat = handler
    } else {
      this._onPressed = handler.onPressed
      this._onPressedWithRepeat = handler.onPressedWithRepeat
      this._onReleased = handler.onReleased
    }
  }

  isOwnHandler(handler: Handler) {
    return this._identity === handler
  }

  executePressed(event: KeyPressedEvent) {
    if (!this._isPressed) { this._onPressed?.(event) }
    this._isPressed = true
    this._onPressedWithRepeat?.(event)
  }

  executeReleased(event: KeyReleasedEvent) {
    if (this._isPressed) { this._onReleased?.(event) }
    this._isPressed = false
  }
}