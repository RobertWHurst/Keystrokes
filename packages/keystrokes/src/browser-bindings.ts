import {
  BrowserKeyEventProps,
  OnActiveEventBinder,
  OnKeyEventBinder,
} from './keystrokes'

// NOTE: These stubs are only used if the library is used in a non-browser
// environment with default binders.
const documentStub = {
  /*
  eslint-disable
    @typescript-eslint/no-empty-function,
    @typescript-eslint/no-unused-vars
  */
  addEventListener: (..._: any[]): any => {},
  removeEventListener: (..._: any[]): any => {},
  dispatchEvent: (..._: any[]): any => {},
  /*
  eslint-enable
    @typescript-eslint/no-empty-function,
    @typescript-eslint/no-unused-vars
  */
}

const navigatorStub = {
  userAgent: '',
}

const getDoc = () => (typeof document !== 'undefined' ? document : documentStub)
const getNav = () =>
  typeof navigator !== 'undefined' ? navigator : navigatorStub

// ----------------
// NOTE: Because MacOS does not fire keyup events for the Command key, we need
// to track the state of the Command key ourselves so we can release it
// ourselves.
const isMacOs = getNav().userAgent.toLocaleLowerCase().includes('mac')
let hasPressedMacOSCommand: 'MetaLeft' | 'MetaRight' | '' = ''

const maybeHandleMacOSCommandKeyDown = (e: KeyboardEvent) => {
  if (!isMacOs || e.key !== 'Meta') return
  hasPressedMacOSCommand = e.code as 'MetaLeft' | 'MetaRight'
}

// Just in case macOS fixes this Command key issue, we will inhibit keyup events
// for the Command key.
const shouldInterceptMacOSCommandKeyUp = (e: KeyboardEvent) => {
  if (!isMacOs || e.key !== 'Meta') return false
  return true
}

const maybeDispatchMacOSCommandKeyUp = () => {
  if (!isMacOs || !hasPressedMacOSCommand) return
  const event = new KeyboardEvent('keyup', {
    key: 'Meta',
    code: hasPressedMacOSCommand,
    bubbles: true,
    cancelable: true,
  })
  hasPressedMacOSCommand = ''
  getDoc().dispatchEvent(event)
}
// ----------------

export const browserOnActiveBinder: OnActiveEventBinder = (handler) => {
  try {
    const handlerWrapper = () => handler()
    addEventListener('focus', handlerWrapper)
    return () => {
      removeEventListener('focus', handlerWrapper)
    }
  } catch {}
}

export const browserOnInactiveBinder: OnActiveEventBinder = (handler) => {
  try {
    const handlerWrapper = () => handler()

    maybeDispatchMacOSCommandKeyUp()

    addEventListener('blur', handlerWrapper)
    return () => {
      removeEventListener('blur', handlerWrapper)
    }
  } catch {}
}

export const browserOnKeyPressedBinder: OnKeyEventBinder<
  KeyboardEvent,
  BrowserKeyEventProps
> = (handler) => {
  try {
    const handlerWrapper = (e: KeyboardEvent) => {
      const originalComposedPath = e.composedPath()

      maybeHandleMacOSCommandKeyDown(e)

      return handler({
        key: e.key,
        originalEvent: e,
        composedPath: () => originalComposedPath,
      })
    }
    getDoc().addEventListener('keydown', handlerWrapper)
    return () => {
      getDoc().removeEventListener('keydown', handlerWrapper)
    }
  } catch {}
}

export const browserOnKeyReleasedBinder: OnKeyEventBinder<
  KeyboardEvent,
  BrowserKeyEventProps
> = (handler) => {
  try {
    const handlerWrapper = (e: KeyboardEvent) => {
      const originalComposedPath = e.composedPath()

      maybeDispatchMacOSCommandKeyUp()
      if (shouldInterceptMacOSCommandKeyUp(e)) return

      return handler({
        key: e.key,
        originalEvent: e,
        composedPath: () => originalComposedPath,
      })
    }
    getDoc().addEventListener('keyup', handlerWrapper)
    return () => {
      getDoc().removeEventListener('keyup', handlerWrapper)
    }
  } catch {}
}
