import { useState, useContext, useEffect } from 'react'
import { KeystrokesContext } from './KeystrokesContext'

export const useKeyCombo = (keyCombo: string) => {
  const [isPressed, setIsPressed] = useState(false)

  const { keystrokes } = useContext(KeystrokesContext)

  const updatePressedEffect = () => {
    const handler = {
      onPressed: () => setIsPressed(true),
      onReleased: () => setIsPressed(false),
    }
    keystrokes.bindKeyCombo(keyCombo, handler)
    return () => {
      keystrokes.unbindKeyCombo(keyCombo, handler)
    }
  }
  useEffect(updatePressedEffect, [keystrokes])

  return isPressed
}
