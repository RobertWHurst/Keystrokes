import {
  getGlobalKeystrokes,
  Handler,
  KeyComboEvent,
  Keystrokes,
} from '@rwh/keystrokes'
import { ref, onMounted, onUnmounted, inject } from 'vue'
import { keystrokesSymbol } from './use-keystrokes'

type ExtractedType<T> =
  T extends Keystrokes<
    infer OriginalEvent,
    infer KeyEventProps,
    infer KeyComboEventProps
  >
    ? {
        OriginalEvent: OriginalEvent
        KeyEventProps: KeyEventProps
        KeyComboEventProps: KeyComboEventProps
      }
    : never

export function useKeyCombo(keyCombo: string, preventDefault?: boolean) {
  const keystrokes = inject(keystrokesSymbol, () => getGlobalKeystrokes(), true)
  const isPressed = ref(false)

  type Extracted = ExtractedType<typeof keystrokes>
  type KeyComboEventHandler = Handler<
    KeyComboEvent<
      Extracted['OriginalEvent'],
      Extracted['KeyEventProps'],
      Extracted['KeyComboEventProps']
    >
  >

  const handler: KeyComboEventHandler = {
    onPressed: (e) => {
      isPressed.value = true
      if (e.finalKeyEvent?.preventDefault && preventDefault === true) {
        e.finalKeyEvent.preventDefault()
      }
    },

    onReleased: () => (isPressed.value = false),
  }

  // a composable can also hook into its owner component's
  // lifecycle to set up and teardown side effects.
  onMounted(() => keystrokes.bindKeyCombo(keyCombo, handler))
  onUnmounted(() => keystrokes.unbindKeyCombo(keyCombo, handler))

  // expose managed state as return value
  return isPressed
}
