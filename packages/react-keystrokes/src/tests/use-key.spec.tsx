import assert from 'assert'
import React from 'react'
import { create } from 'react-test-renderer'
import { KeystrokesProvider } from '../KeystrokesContext'
import { act } from './helpers/act'

import { createTestKeystrokes, useKey } from '..'
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
    await wait()

    keystrokes.release({ key: 'a' })
    await wait()

    assert(root.findByType('div').children[0] === 'isNotPressed')
  })
})
