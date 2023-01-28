import assert from 'assert'
import React from 'react'
import { create } from 'react-test-renderer'
import { KeystrokesProvider } from '../KeystrokesContext'
import { act } from './helpers/act'

import { createTestKeystrokes, useKeyCombo } from '..'
import { wait } from './helpers/next-tick'

const TestComponent = () => {
  const isPressed = useKeyCombo('a+b')
  return <div>{isPressed ? 'isPressed' : 'isNotPressed'}</div>
}

describe('useKeyCombo(keyCombo) -> isPressed', () => {
  it('initial state is unpressed', async () => {
    const keystrokes = createTestKeystrokes()
    const { root } = await act(() =>
      create(
        <KeystrokesProvider keystrokes={keystrokes}>
          <TestComponent />
        </KeystrokesProvider>,
      ),
    )

    assert(root.findByType('div').children[0] === 'isNotPressed')
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
    keystrokes.press({ key: 'b' })
    await wait()

    assert(root.findByType('div').children[0] === 'isPressed')
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
    keystrokes.press({ key: 'b' })
    await wait()

    keystrokes.release({ key: 'a' })
    keystrokes.release({ key: 'b' })
    await wait()

    assert(root.findByType('div').children[0] === 'isNotPressed')
  })
})
