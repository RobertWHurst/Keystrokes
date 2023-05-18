import assert from 'assert'
import { mount } from '@vue/test-utils'

import { createTestKeystrokes, Keystrokes } from '@rwh/keystrokes'
import { useKey, useKeyCombo, useKeystrokes } from '..'
import { wait } from './helpers/next-tick'
import { defineComponent } from 'vue'

const ProviderComponent = defineComponent({
  props: ['keystrokes'],
  setup(props: { keystrokes: Keystrokes }) {
    const { keystrokes } = props
    useKeystrokes(keystrokes)
  },
  template: `
    <slot />
  `,
})

const TestComponent = defineComponent({
  setup() {
    return { isPressed: useKeyCombo('a+b') }
  },
  template: `
    <div>{{isPressed ? 'isPressed' : 'isNotPressed'}}</div>
`,
})

describe('useKeyCombo(keyCombo) -> isPressed', () => {
  it('initial state is unpressed', async () => {
    const keystrokes = createTestKeystrokes()
    const w = mount(ProviderComponent, {
      slots: { default: TestComponent },
      props: { keystrokes },
    })
    assert(w.get('div').text() === 'isNotPressed')
  })

  it('tracks the pressed state', async () => {
    const keystrokes = createTestKeystrokes()
    const w = mount(ProviderComponent, {
      slots: { default: TestComponent },
      props: { keystrokes },
    })

    keystrokes.press({ key: 'a' })
    keystrokes.press({ key: 'b' })
    await wait()

    assert(w.get('div').text() === 'isPressed')
  })

  it('tracks the released state', async () => {
    const keystrokes = createTestKeystrokes()
    const w = mount(ProviderComponent, {
      slots: { default: TestComponent },
      props: { keystrokes },
    })

    keystrokes.press({ key: 'a' })
    keystrokes.press({ key: 'b' })
    await wait()

    keystrokes.release({ key: 'a' })
    keystrokes.release({ key: 'b' })
    await wait()

    assert(w.get('div').text() === 'isNotPressed')
  })
})