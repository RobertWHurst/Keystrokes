import { Handler, HandlerFn } from "./keystrokes.js";

export class HandlerState<Event> {
  _onPressed?: HandlerFn<Event>
  _onPressedWithRepeat?: HandlerFn<Event>
  _onReleased?: HandlerFn<Event>
  _isPressed: boolean
  _identity: Handler<Event>

  constructor(handler: Handler<Event>) {
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

  isOwnHandler(handler: Handler<Event>) {
    return this._identity === handler
  }

  executePressed(event: Event) {
    if (!this._isPressed) { this._onPressed?.(event) }

    this._isPressed = true
    this._onPressedWithRepeat?.(event)
  }

  executeReleased(event: Event) {
    if (this._isPressed) { this._onReleased?.(event) }

    this._isPressed = false
  }
}
