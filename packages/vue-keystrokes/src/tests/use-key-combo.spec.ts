import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createTestKeystrokes, Keystrokes } from '@rwh/keystrokes'
import { useKeyCombo, useKeystrokes } from '..'
import { wait } from './helpers/next-tick'
import { computed, defineComponent, effect } from 'vue'

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
    const isPressed = useKeyCombo('a+b')

    const text = computed(() =>
      isPressed.value ? 'isPressed' : 'isNotPressed',
    )

    return { text }
  },
  template: `
    <div>{{text}}</div>
`,
})

describe('useKeyCombo(keyCombo) -> isPressed', () => {
  it('initial state is unpressed', async () => {
    const keystrokes = createTestKeystrokes()
    const w = mount(ProviderComponent, {
      slots: { default: TestComponent },
      props: { keystrokes },
    })
    expect(w.get('div').text()).toEqual('isNotPressed')
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

    expect(w.get('div').text()).toEqual('isPressed')
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

    expect(w.get('div').text()).toEqual('isNotPressed')
  })
})
