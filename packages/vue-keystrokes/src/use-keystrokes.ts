import { Keystrokes } from "@rwh/keystrokes"
import { provide } from "vue"

export const keystrokesSymbol = Symbol.for('keystrokes')

export const useKeystrokes = (keystrokes: Keystrokes) => {
  provide(keystrokesSymbol, keystrokes)
}
