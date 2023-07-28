import { describe, it, expect, vi } from 'vitest'
import { browserOnActiveBinder, browserOnInactiveBinder, browserOnKeyPressedBinder, browserOnKeyReleasedBinder } from '../browser-bindings'
import { execFile } from 'child_process'

describe('browserOnActiveBinder(handler) -> void', () => {
  it('correctly binds the given handler to window focus', () => {
    const addEventListenerStub = vi.fn()
    const handlerStub = vi.fn()
    vi.stubGlobal('addEventListener', addEventListenerStub)

    browserOnActiveBinder(handlerStub)

    const handler = addEventListenerStub.mock.calls[0][1]

    handler()

    expect(addEventListenerStub).nthCalledWith(1, 'focus', expect.any(Function))
    expect(handlerStub).nthCalledWith(1)

    vi.unstubAllGlobals()
  })
})

describe('browserOnInactiveBinder(handler) -> void', () => {
  it('correctly binds the given handler to window blur', () => {
    const addEventListenerStub = vi.fn()
    const handlerStub = vi.fn()
    vi.stubGlobal('addEventListener', addEventListenerStub)

    browserOnInactiveBinder(handlerStub)

    const handler = addEventListenerStub.mock.calls[0][1]

    handler()

    expect(addEventListenerStub).nthCalledWith(1, 'blur', expect.any(Function))
    expect(handlerStub).nthCalledWith(1)

    vi.unstubAllGlobals()
  })

  it('will create synthetic keyup events for all pressed keys', () => {
    const winAddEventListenerStub = vi.fn()
    const docAddEventListenerStub = vi.fn()
    const inactiveHandlerStub = vi.fn()
    const keyPressHandlerStub = vi.fn()
    const dispatchEventStub = vi.fn()
    vi.stubGlobal('addEventListener', winAddEventListenerStub)
    vi.spyOn(document, 'addEventListener').mockImplementation(docAddEventListenerStub)
    vi.spyOn(document, 'dispatchEvent').mockImplementation(dispatchEventStub)

    browserOnInactiveBinder(inactiveHandlerStub)
    browserOnKeyPressedBinder(keyPressHandlerStub)

    const inactiveHandler = winAddEventListenerStub.mock.calls[0][1]
    const keyPressHandler = docAddEventListenerStub.mock.calls[0][1]

    const keydownEvent = new KeyboardEvent('keydown', {
      key: 'a',
      code: 'a',
      bubbles: true,
      cancelable: true,
    })
    keyPressHandler(keydownEvent)
    inactiveHandler()

    expect(winAddEventListenerStub).nthCalledWith(1, 'blur', expect.any(Function))
    expect(docAddEventListenerStub).nthCalledWith(1, 'keydown', expect.any(Function))
    expect(keyPressHandlerStub).nthCalledWith(1, expect.objectContaining({
      composedPath: expect.any(Function),
      key: 'a',
      originalEvent: keydownEvent
    }))
    expect(dispatchEventStub).nthCalledWith(1, expect.any(KeyboardEvent))

    const syntheticKeyboardEvent = dispatchEventStub.mock.calls[0][0]
    expect(syntheticKeyboardEvent.type).toBe('keyup')
    expect(syntheticKeyboardEvent.key).toBe('a')

    vi.unstubAllGlobals()
  })
})

describe('browserOnKeyPressedBinder(handler) -> void', () => {
  it('correctly binds the given handler to document keydown', () => {
    const addEventListenerStub = vi.fn()
    const handlerStub = vi.fn()
    vi.spyOn(document, 'addEventListener').mockImplementation(addEventListenerStub)

    browserOnKeyPressedBinder(handlerStub)

    const handler = addEventListenerStub.mock.calls[0][1]

    const keydownEvent = new KeyboardEvent('keydown', {
      key: 'a',
      code: 'a',
      bubbles: true,
      cancelable: true,
    })
    handler(keydownEvent)

    expect(addEventListenerStub).nthCalledWith(1, 'keydown', expect.any(Function))
    expect(handlerStub).nthCalledWith(1, expect.objectContaining({
      composedPath: expect.any(Function),
      key: 'a',
      originalEvent: keydownEvent
    }))

    vi.unstubAllGlobals()
  })

  describe('/macOS Specific Behavior/', () => {
    it.only('generates a synthetic keyup for the command key when any other key is released', () => {
      const addEventListenerStub = vi.fn()
      const keyPressedhandlerStub = vi.fn()
      const keyReleasehandlerStub = vi.fn()
      const dispatchEventStub = vi.fn()
      vi.spyOn(document, 'addEventListener').mockImplementation(addEventListenerStub)
      vi.spyOn(document, 'dispatchEvent').mockImplementation(dispatchEventStub)
      vi.stubGlobal('navigator', { userAgent: 'mac' })

      browserOnKeyPressedBinder(keyPressedhandlerStub)
      browserOnKeyReleasedBinder(keyReleasehandlerStub)

      const keyPressedHandler = addEventListenerStub.mock.calls[0][1]
      const keyReleasedHandler = addEventListenerStub.mock.calls[1][1]

      const metaKeydownEvent = new KeyboardEvent('keydown', {
        key: 'Meta',
        code: 'MetaRight',
        bubbles: true,
        cancelable: true,
      })
      const aKeydownEvent = new KeyboardEvent('keydown', {
        key: 'a',
        code: 'a',
        bubbles: true,
        cancelable: true,
      })
      const aKeyupEvent = new KeyboardEvent('keydown', {
        key: 'a',
        code: 'a',
        bubbles: true,
        cancelable: true,
      })

      keyPressedHandler(metaKeydownEvent)
      keyPressedHandler(aKeydownEvent)
      keyReleasedHandler(aKeyupEvent)

      expect(addEventListenerStub).nthCalledWith(1, 'keydown', expect.any(Function))
      expect(addEventListenerStub).nthCalledWith(2, 'keyup', expect.any(Function))
      expect(keyPressedhandlerStub).nthCalledWith(1, expect.objectContaining({
        composedPath: expect.any(Function),
        key: 'Meta',
        originalEvent: metaKeydownEvent
      }))
      expect(keyPressedhandlerStub).nthCalledWith(2, expect.objectContaining({
        composedPath: expect.any(Function),
        key: 'a',
        originalEvent: aKeydownEvent,
      }))
      expect(keyReleasehandlerStub).nthCalledWith(1, expect.objectContaining({
        composedPath: expect.any(Function),
        key: 'a',
        originalEvent: aKeyupEvent
      }))
      expect(dispatchEventStub).nthCalledWith(1, expect.any(KeyboardEvent))

      const syntheticKeyboardEvent = dispatchEventStub.mock.calls[0][0]
      expect(syntheticKeyboardEvent.type).toBe('keyup')
      expect(syntheticKeyboardEvent.key).toBe('Meta')

      vi.unstubAllGlobals()
    })
  })
})

describe('browserOnKeyReleased(handler) -> void', () => {
  it('correctly binds the given handler to document keyup', () => {
    const addEventListenerStub = vi.fn()
    const handlerStub = vi.fn()
    vi.spyOn(document, 'addEventListener').mockImplementation(addEventListenerStub)

    browserOnKeyReleasedBinder(handlerStub)

    const handler = addEventListenerStub.mock.calls[0][1]

    const keyupEvent = new KeyboardEvent('keyup', {
      key: 'a',
      code: 'a',
      bubbles: true,
      cancelable: true,
    })
    handler(keyupEvent)

    expect(addEventListenerStub).nthCalledWith(1, 'keyup', expect.any(Function))
    expect(handlerStub).nthCalledWith(1, expect.objectContaining({
      composedPath: expect.any(Function),
      key: 'a',
      originalEvent: keyupEvent
    }))

    vi.unstubAllGlobals()
  })

  describe('/macOS Specific Behavior/', () => {
    it('intercepts and blocks command key release events for command', () => {
      
    })
  })
})
