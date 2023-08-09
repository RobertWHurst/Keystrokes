import { describe, it, expect } from 'vitest'
import React from 'react'
import { create } from 'react-test-renderer'
import { KeystrokesProvider } from '../KeystrokesContext'
import { act } from './helpers/act'

import { createTestKeystrokes } from '@rwh/keystrokes'
import { useKey } from '..'
import { wait } from './helpers/next-tick'

const TestComponent = () => {
  const isPressed = useKey('a')
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

    keystrokes.press({ key: 'a' })
    await wait()

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

    keystrokes.press({ key: 'a' })
    keystrokes.release({ key: 'a' })
    await wait()

    expect(root.findByType('div').children[0]).toEqual('isNotPressed')
  })
})
