import { getGlobalKeystrokes } from '@rwh/keystrokes'
import { ref, onMounted, onUnmounted, inject } from 'vue'
import { keystrokesSymbol } from './use-keystrokes'

export function useKeyCombo(keyCombo: string) {
  const keystrokes = inject(keystrokesSymbol, () => getGlobalKeystrokes(), true)
  const isPressed = ref(false)

  const handler = {
    onPressed: () => (isPressed.value = true),
    onReleased: () => (isPressed.value = false),
  }

  // a composable can also hook into its owner component's
  // lifecycle to setup and teardown side effects.
  onMounted(() => keystrokes.bindKeyCombo(keyCombo, handler))
  onUnmounted(() => keystrokes.bindKeyCombo(keyCombo, handler))

  // expose managed state as return value
  return isPressed
}
