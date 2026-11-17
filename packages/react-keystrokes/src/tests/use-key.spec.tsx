import { describe, it, expect } from 'vitest'
import React from 'react'
import { create } from 'react-test-renderer'
import { KeystrokesProvider } from '../KeystrokesContext'
import { act } from './helpers/act'

import { createTestKeystrokes } from '@rwh/keystrokes'
import { useKey } from '..'

const TestComponent = () => {
  const isPressed = useKey('a')
  return <div>{isPressed ? 'isPressed' : 'isNotPressed'}</div>
}

const TestComponentWithPreventDefault = () => {
  const isPressed = useKey('a', true)
  return <div>{isPressed ? 'isPressed' : 'isNotPressed'}</div>
}

describe('useKey(key) -> isPressed', () => {
  it('initial state is unpressed', async () => {
    const keystrokes = createTestKeystrokes()
    const { root } = await act(() =>
      create(
        <KeystrokesProvider keystrokes={keystrokes}>
          <TestComponent />
        </KeystrokesProvider>,
      ),
    )

    expect(root.findByType('div').children[0]).toEqual('isNotPressed')
  })

  it('tracks the pressed state', async () => {
    const keystrokes = createTestKeystrokes()

    const { root } = await act(() =>
      create(
        <KeystrokesProvider keystrokes={keystrokes}>
          <TestComponent />
        </KeystrokesProvider>,
      ),
    )

    await act(() => {
      keystrokes.press({ key: 'a' })
    })

    expect(root.findByType('div').children[0]).toEqual('isPressed')
  })

  it('tracks the released state', async () => {
    const keystrokes = createTestKeystrokes()

    const { root } = await act(() =>
      create(
        <KeystrokesProvider keystrokes={keystrokes}>
          <TestComponent />
        </KeystrokesProvider>,
      ),
    )

    await act(() => {
      keystrokes.press({ key: 'a' })
      keystrokes.release({ key: 'a' })
    })

    expect(root.findByType('div').children[0]).toEqual('isNotPressed')
  })

  it('prevents default when configured to', async () => {
    const keystrokes = createTestKeystrokes()

    const { root } = await act(() =>
      create(
        <KeystrokesProvider keystrokes={keystrokes}>
          <TestComponentWithPreventDefault />
        </KeystrokesProvider>,
      ),
    )

    let defaultPrevented = false
    const keyEvent = {
      key: 'a',
      preventDefault() {
        defaultPrevented = true
      },
    }
    await act(() => {
      keystrokes.press(keyEvent)
      keystrokes.release(keyEvent)
    })

    expect(defaultPrevented).toEqual(true)
    expect(root.findByType('div').children[0]).toEqual('isNotPressed')
  })
})
