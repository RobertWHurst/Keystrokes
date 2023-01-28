import { useState, useContext, useEffect } from 'react'
import { KeystrokesContext } from './KeystrokesContext'

export const useKey = (key: string) => {
  const [isPressed, setIsPressed] = useState(false)

  const { keystrokes } = useContext(KeystrokesContext)

  const updatePressedEffect = () => {
    const handler = {
      onPressed: () => setIsPressed(true),
      onReleased: () => setIsPressed(false),
    }
    keystrokes.bindKey(key, handler)
    return () => {
      keystrokes.unbindKey(key, handler)
    }
  }
  useEffect(updatePressedEffect, [keystrokes])

  return isPressed
}
