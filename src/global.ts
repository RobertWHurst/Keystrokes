import * as keystrokes from './index'

declare global {
  interface Window {
    keystrokes: typeof keystrokes
  }
}

window.keystrokes = keystrokes
