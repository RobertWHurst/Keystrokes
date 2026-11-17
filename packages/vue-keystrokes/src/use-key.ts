import {
  BrowserKeyEventProps,
  getGlobalKeystrokes,
  Handler,
  KeyEvent,
} from '@rwh/keystrokes'
import { ref, onMounted, onUnmounted, inject } from 'vue'
import { keystrokesSymbol } from './use-keystrokes'

export function useKey(key: string, preventDefault?: boolean) {
  const keystrokes = inject(keystrokesSymbol, () => getGlobalKeystrokes(), true)
  const isPressed = ref(false)

  const handler: Handler<KeyEvent<KeyboardEvent, BrowserKeyEventProps>> = {
    onPressed: (e: KeyEvent<KeyboardEvent, BrowserKeyEventProps>) => {
      isPressed.value = true
      if (e.preventDefault && preventDefault === true) {
        e.preventDefault()
      }
    },

    onReleased: () => (isPressed.value = false),
  }

  // a composable can also hook into its owner component's
  // lifecycle to setup and teardown side effects.
  onMounted(() => keystrokes.bindKey(key, handler))
  onUnmounted(() => keystrokes.unbindKey(key, handler))

  // expose managed state as return value
  return isPressed
}
