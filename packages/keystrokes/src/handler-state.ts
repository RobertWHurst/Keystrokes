export type KeyEvent<E, P> = P & {
  key: string
  originalEvent?: E
}

export type HandlerFn<E> = (event: E) => void

export type HandlerObj<E> = {
  onPressed?: HandlerFn<E>
  onPressedWithRepeat?: HandlerFn<E>
  onReleased?: HandlerFn<E>
}

export type Handler<E> = HandlerFn<E> | HandlerObj<E>

export class HandlerState<E> {
  _onPressed?: HandlerFn<E>
  _onPressedWithRepeat?: HandlerFn<E>
  _onReleased?: HandlerFn<E>
  _isPressed: boolean
  _identity: Handler<E>

  constructor(handler: Handler<E>) {
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

  get isEmpty() {
    return !this._onPressed && !this._onPressedWithRepeat && !this._onReleased
  }

  isOwnHandler(handler: Handler<E>) {
    return this._identity === handler
  }

  executePressed(event: E) {
    if (!this._isPressed) {
      this._onPressed?.(event)
    }

    this._isPressed = true
    this._onPressedWithRepeat?.(event)
  }

  executeReleased(event: E) {
    if (this._isPressed) {
      this._onReleased?.(event)
    }

    this._isPressed = false
  }
}
