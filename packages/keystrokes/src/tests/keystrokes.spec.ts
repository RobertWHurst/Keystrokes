import { describe, it, expect, vi } from 'vitest'
import { Keystrokes } from '../keystrokes'
import { KeyComboEvent, KeyEvent, createTestKeystrokes } from '..'
import {
  BrowserKeyComboEventProps,
  BrowserKeyEventProps,
} from '../browser-bindings'

describe('new Keystrokes(options)', () => {
  it('will automatically release self-releasing keys', () => {
    const keystrokes = createTestKeystrokes({
      selfReleasingKeys: ['meta', 'z'],
    })

    expect(keystrokes.checkKeyCombo('meta > z')).toBe(false)

    keystrokes.press({ key: 'meta' })

    expect(keystrokes.checkKey('meta')).toBe(true)
    expect(keystrokes.checkKeyCombo('meta > z')).toBe(false)

    keystrokes.press({ key: 'z' })

    expect(keystrokes.checkKey('z')).toBe(true)
    expect(keystrokes.checkKeyCombo('meta > z')).toBe(true)

    keystrokes.release({ key: 'meta' })

    expect(keystrokes.checkKey('z')).toBe(false)
    expect(keystrokes.checkKey('meta')).toBe(false)
    expect(keystrokes.checkKeyCombo('meta > z')).toBe(false)
  })

  describe('#bindEnvironment(options)', () => {
    it('accepts a custom focus, blur, key pressed and key released binder', () => {
      const keystrokes = new Keystrokes()

      type EmptyObject = Record<never, never>

      let press: ((event: KeyEvent<EmptyObject, EmptyObject>) => void) | null =
        null
      let release:
        | ((event: KeyEvent<EmptyObject, EmptyObject>) => void)
        | null = null

      const onActive = vi.fn()
      const onInactive = vi.fn()
      const onKeyPressed = vi.fn((p) => (press = p))
      const onKeyReleased = vi.fn((r) => (release = r))

      const aPressed = vi.fn()
      const aReleased = vi.fn()

      // Replaces the default browser binders
      keystrokes.bindEnvironment({
        onActive,
        onInactive,
        onKeyPressed,
        onKeyReleased,
      })

      expect(onActive).toBeCalledTimes(1)
      expect(onActive).toBeCalledWith(expect.any(Function))

      expect(onInactive).toBeCalledTimes(1)
      expect(onInactive).toBeCalledWith(expect.any(Function))

      expect(onKeyPressed).toBeCalledTimes(1)
      expect(onKeyPressed).toBeCalledWith(expect.any(Function))

      expect(onKeyReleased).toBeCalledTimes(1)
      expect(onKeyReleased).toBeCalledWith(expect.any(Function))

      keystrokes.bindKey('a', { onPressed: aPressed, onReleased: aReleased })

      expect(aPressed).toBeCalledTimes(0)
      expect(aReleased).toBeCalledTimes(0)

      press!({ key: 'a' })

      expect(aPressed).toBeCalledTimes(1)
      expect(aReleased).toBeCalledTimes(0)

      release!({ key: 'a' })

      expect(aPressed).toBeCalledTimes(1)
      expect(aReleased).toBeCalledTimes(1)
    })

    it('can setup key remaps', () => {
      const keystrokes = createTestKeystrokes()

      keystrokes.bindEnvironment({
        keyRemap: {
          a: 'b',
          b: 'c',
        },
      })

      const aPressed = vi.fn()
      const bPressed = vi.fn()
      const cPressed = vi.fn()

      keystrokes.bindKey('a', aPressed)
      keystrokes.bindKey('b', bPressed)
      keystrokes.bindKey('c', cPressed)

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'b' })
      keystrokes.press({ key: 'c' })

      expect(aPressed).toBeCalledTimes(0)
      expect(bPressed).toBeCalledTimes(1)
      expect(cPressed).toBeCalledTimes(2)
    })
  })

  describe('#bindKey(keyCombo, handler)', () => {
    it('accepts a key and handler which is executed repeatedly while the key is pressed', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = vi.fn()
      const handler2 = vi.fn()
      keystrokes.bindKey('a', handler1)
      keystrokes.bindKey('a', handler2)

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'a' })

      expect(handler1).toBeCalledTimes(2)
      expect(handler2).toBeCalledTimes(2)
    })

    it('accepts a key and handler object containing handlers called appropriately while the key is pressed or released', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
        onReleased: vi.fn(),
      }
      const handler2 = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
        onReleased: vi.fn(),
      }
      keystrokes.bindKey('a', handler1)
      keystrokes.bindKey('a', handler2)

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'a' })
      keystrokes.release({ key: 'a' })

      expect(handler1.onPressed).toBeCalledTimes(1)
      expect(handler1.onPressedWithRepeat).toBeCalledTimes(2)
      expect(handler1.onReleased).toBeCalledTimes(1)
      expect(handler2.onPressed).toBeCalledTimes(1)
      expect(handler2.onPressedWithRepeat).toBeCalledTimes(2)
      expect(handler2.onReleased).toBeCalledTimes(1)
    })

    it('allows binding several keyCombos at the same time', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = vi.fn()
      const handler2 = vi.fn()
      keystrokes.bindKey(['a', 'b'], handler1)
      keystrokes.bindKey(['a'], handler2)

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'b' })

      expect(handler1).toBeCalledTimes(2)
      expect(handler2).toBeCalledTimes(1)
    })
  })

  describe('#unbindKey(keyCombo, handler?)', () => {
    it('will remove a handler function for a given key, preventing it from being called', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = vi.fn()
      const handler2 = vi.fn()
      keystrokes.bindKey('a', handler1)
      keystrokes.bindKey('a', handler2)

      keystrokes.press({ key: 'a' })

      keystrokes.unbindKey('a', handler1)

      keystrokes.press({ key: 'a' })

      expect(handler1).toBeCalledTimes(1)
      expect(handler2).toBeCalledTimes(2)
    })

    it('will remove all handler functions for a given key if no handler is given', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = vi.fn()
      const handler2 = vi.fn()
      keystrokes.bindKey('a', handler1)
      keystrokes.bindKey('a', handler2)

      keystrokes.press({ key: 'a' })

      keystrokes.unbindKey('a')

      keystrokes.press({ key: 'a' })

      expect(handler1).toBeCalledTimes(1)
      expect(handler2).toBeCalledTimes(1)
    })

    it('will remove a handler object for a given key, preventing it from being called', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
      }
      const handler2 = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
      }
      keystrokes.bindKey('a', handler1)
      keystrokes.bindKey('a', handler2)

      keystrokes.press({ key: 'a' })

      keystrokes.unbindKey('a', handler1)

      keystrokes.press({ key: 'a' })

      expect(handler1.onPressed).toBeCalledTimes(1)
      expect(handler1.onPressedWithRepeat).toBeCalledTimes(1)
      expect(handler2.onPressed).toBeCalledTimes(1)
      expect(handler2.onPressedWithRepeat).toBeCalledTimes(2)
    })

    it('will remove all handler objects for a key if no handler is given', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
      }
      const handler2 = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
      }
      keystrokes.bindKey('a', handler1)
      keystrokes.bindKey('a', handler2)

      keystrokes.press({ key: 'a' })

      keystrokes.unbindKey('a')

      keystrokes.press({ key: 'a' })

      expect(handler1.onPressed).toBeCalledTimes(1)
      expect(handler1.onPressedWithRepeat).toBeCalledTimes(1)
      expect(handler2.onPressed).toBeCalledTimes(1)
      expect(handler2.onPressedWithRepeat).toBeCalledTimes(1)
    })

    it('allows unbinding several keyCombos at the same time', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = vi.fn()
      const handler2 = vi.fn()
      keystrokes.bindKey(['a', 'b'], handler1)
      keystrokes.bindKey(['a'], handler2)

      keystrokes.press({ key: 'a' })

      keystrokes.unbindKey(['a'], handler1)

      keystrokes.press({ key: 'a' })

      expect(handler1).toBeCalledTimes(1)
      expect(handler2).toBeCalledTimes(2)
    })
  })

  describe('#bindKeyCombo(keyCombo, handler)', () => {
    it('accepts a key combo and when that combo is satisfied the given handler is executed', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
        onReleased: vi.fn(),
      }
      const handler2 = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
        onReleased: vi.fn(),
      }
      keystrokes.bindKeyCombo('a,b>c+d', handler1)
      keystrokes.bindKeyCombo('a,b>c+d', handler2)

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'a' })
      keystrokes.release({ key: 'a' })

      keystrokes.press({ key: 'b' })
      keystrokes.press({ key: 'b' })
      keystrokes.press({ key: 'd' })
      keystrokes.press({ key: 'd' })
      keystrokes.press({ key: 'c' })
      keystrokes.press({ key: 'c' })
      keystrokes.release({ key: 'b' })
      keystrokes.release({ key: 'c' })
      keystrokes.release({ key: 'd' })

      expect(handler1.onPressed).toBeCalledTimes(1)
      expect(handler1.onPressedWithRepeat).toBeCalledTimes(2)
      expect(handler1.onReleased).toBeCalledTimes(1)
      expect(handler2.onPressed).toBeCalledTimes(1)
      expect(handler2.onPressedWithRepeat).toBeCalledTimes(2)
      expect(handler2.onReleased).toBeCalledTimes(1)

      expect(handler1.onPressed).toBeCalledWith(
        expect.objectContaining({
          finalKeyEvent: expect.objectContaining({ key: 'c' }),
          keyCombo: 'a,b>c+d',
          keyEvents: expect.arrayContaining([
            expect.objectContaining({ key: 'a' }),
            expect.objectContaining({ key: 'b' }),
            expect.objectContaining({ key: 'c' }),
            expect.objectContaining({ key: 'd' }),
          ]),
        }),
      )
    })

    it('will not trigger a key combo handler if the keys are pressed in the wrong order', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
        onReleased: vi.fn(),
      }
      const handler2 = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
        onReleased: vi.fn(),
      }
      keystrokes.bindKeyCombo('a,b>c,d', handler1)
      keystrokes.bindKeyCombo('a,b>c,d', handler2)

      keystrokes.press({ key: 'd' })
      keystrokes.press({ key: 'd' })
      keystrokes.release({ key: 'd' })

      keystrokes.press({ key: 'b' })
      keystrokes.press({ key: 'c' })
      keystrokes.release({ key: 'c' })
      keystrokes.release({ key: 'b' })

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'a' })
      keystrokes.release({ key: 'a' })

      expect(handler1.onPressed).toBeCalledTimes(0)
      expect(handler1.onPressedWithRepeat).toBeCalledTimes(0)
      expect(handler1.onReleased).toBeCalledTimes(0)
      expect(handler2.onPressed).toBeCalledTimes(0)
      expect(handler2.onPressedWithRepeat).toBeCalledTimes(0)
      expect(handler2.onReleased).toBeCalledTimes(0)
    })

    it('provides all key events invoked while the combo was being satisfied', () => {
      const keystrokes = createTestKeystrokes()

      const handler = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
        onReleased: vi.fn(),
      }
      keystrokes.bindKeyCombo('a,b>c+d', handler)

      keystrokes.press({ key: 'a' })
      keystrokes.release({ key: 'a' })
      keystrokes.press({ key: 'b' })
      keystrokes.press({ key: 'd' })
      keystrokes.press({ key: 'c' })
      keystrokes.release({ key: 'b' })
      keystrokes.release({ key: 'c' })
      keystrokes.release({ key: 'd' })

      const event = handler.onPressed.mock.calls[0][0] as KeyComboEvent<
        keyboardEvent,
        BrowserKeyEventProps,
        BrowserKeyComboEventProps
      >

      expect(event.keyEvents).toBeTruthy()
      expect(event.keyEvents.length).toBe(4)
      expect(event.keyEvents.some((e) => e.key === 'a')).toBe(true)
      expect(event.keyEvents.some((e) => e.key === 'b')).toBe(true)
      expect(event.keyEvents.some((e) => e.key === 'c')).toBe(true)
      expect(event.keyEvents.some((e) => e.key === 'd')).toBe(true)
    })

    it('provides the final key event that invoked in order to satisfy the combo', () => {
      const keystrokes = createTestKeystrokes()

      const handler = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
        onReleased: vi.fn(),
      }
      keystrokes.bindKeyCombo('a,b>c+d', handler)

      keystrokes.press({ key: 'a' })
      keystrokes.release({ key: 'a' })
      keystrokes.press({ key: 'b' })
      keystrokes.press({ key: 'd' })
      keystrokes.press({ key: 'c' })
      keystrokes.release({ key: 'b' })
      keystrokes.release({ key: 'c' })
      keystrokes.release({ key: 'd' })

      const event = handler.onPressed.mock.calls[0][0] as KeyComboEvent<
        keyboardEvent,
        BrowserKeyEventProps,
        BrowserKeyComboEventProps
      >

      expect(event.finalKeyEvent).toBeTruthy()
      expect(event.finalKeyEvent.key).toBe('c')
    })

    it('correctly handles combos with the shift key', () => {
      const keystrokes = createTestKeystrokes()

      const handler = {
        onPressed: vi.fn(),
        onReleased: vi.fn(),
      }
      keystrokes.bindKeyCombo('shift>s', handler)

      keystrokes.press({ key: 'shift' })
      keystrokes.press({ key: 'S' })

      expect(handler.onPressed).toBeCalledTimes(1)

      keystrokes.release({ key: 'S' })

      expect(handler.onReleased).toBeCalledTimes(1)
    })

    it('cancels a combo if an unexpected character is pressed before starting next sequence', () => {
      const keystrokes = createTestKeystrokes()

      const handler = {
        onPressed: vi.fn(),
        onReleased: vi.fn(),
      }
      keystrokes.bindKeyCombo('a>b,c>d', handler)

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'b' })
      keystrokes.release({ key: 'a' })
      keystrokes.release({ key: 'b' })

      keystrokes.press({ key: 'x' })
      keystrokes.release({ key: 'x' })

      keystrokes.press({ key: 'c' })
      keystrokes.press({ key: 'd' })
      keystrokes.release({ key: 'c' })
      keystrokes.release({ key: 'd' })

      expect(handler.onPressed).toBeCalledTimes(0)
      expect(handler.onReleased).toBeCalledTimes(0)
    })

    it('will correctly handle escaped characters', () => {
      const keystrokes = createTestKeystrokes()

      const handler = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
        onReleased: vi.fn(),
      }
      keystrokes.bindKeyCombo('a + \\+', handler)

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: '+' })
      keystrokes.release({ key: 'a' })
      keystrokes.release({ key: '+' })

      expect(handler.onPressed).toBeCalledTimes(1)
    })

    it.only('accepts a key combo made up of aliases and when that combo is satisfied the given handler is executed', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
        onReleased: vi.fn(),
      }
      const handler2 = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
        onReleased: vi.fn(),
      }
      keystrokes.bindKeyCombo('@keya,@keyb>@keyc+@keyd', handler1)
      keystrokes.bindKeyCombo('@keya,@keyb>@keyc+@keyd', handler2)

      keystrokes.press({ key: 'a', aliases: ['@keya'] })
      keystrokes.press({ key: 'a', aliases: ['@keya'] })
      keystrokes.release({ key: 'a', aliases: ['@keya'] })

      keystrokes.press({ key: 'b', aliases: ['@keyb'] })
      keystrokes.press({ key: 'b', aliases: ['@keyb'] })
      keystrokes.press({ key: 'd', aliases: ['@keyd'] })
      keystrokes.press({ key: 'd', aliases: ['@keyd'] })
      keystrokes.press({ key: 'c', aliases: ['@keyc'] })
      keystrokes.press({ key: 'c', aliases: ['@keyc'] })
      keystrokes.release({ key: 'b', aliases: ['@keyb'] })
      keystrokes.release({ key: 'c', aliases: ['@keyc'] })
      keystrokes.release({ key: 'd', aliases: ['@keyd'] })

      expect(handler1.onPressed).toBeCalledTimes(1)
      expect(handler1.onPressedWithRepeat).toBeCalledTimes(2)
      expect(handler1.onReleased).toBeCalledTimes(1)
      expect(handler2.onPressed).toBeCalledTimes(1)
      expect(handler2.onPressedWithRepeat).toBeCalledTimes(2)
      expect(handler2.onReleased).toBeCalledTimes(1)

      expect(handler1.onPressed).toBeCalledWith(
        expect.objectContaining({
          finalKeyEvent: expect.objectContaining({ key: 'c' }),
          keyCombo: '@keya,@keyb>@keyc+@keyd',
          keyEvents: expect.arrayContaining([
            expect.objectContaining({ key: 'a' }),
            expect.objectContaining({ key: 'b' }),
            expect.objectContaining({ key: 'c' }),
            expect.objectContaining({ key: 'd' }),
          ]),
        }),
      )
    })
  })

  describe('#unbindKeyCombo(keyCombo, handler?)', () => {
    it('remove a handler for a given key combo', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = vi.fn()
      const handler2 = vi.fn()
      keystrokes.bindKeyCombo('a>b', handler1)
      keystrokes.bindKeyCombo('a>b', handler2)

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'b' })
      keystrokes.press({ key: 'b' })

      keystrokes.unbindKeyCombo('a>b', handler2)

      keystrokes.press({ key: 'b' })

      expect(handler1).toBeCalledTimes(3)
      expect(handler2).toBeCalledTimes(2)
    })
  })

  describe('#checkKey(key)', () => {
    it('will return a boolean indicating if a key is pressed', () => {
      const keystrokes = createTestKeystrokes()

      expect(keystrokes.checkKey('a')).toBe(false)

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'a' })

      expect(keystrokes.checkKey('a')).toBe(true)

      keystrokes.release({ key: 'a' })

      expect(keystrokes.checkKey('a')).toBe(false)
    })
  })

  describe('#checkKeyCombo(keyCombo)', () => {
    it('will return a boolean indicating if a key combo is pressed and a partial key combo state array containing the pressed keys', () => {
      const keystrokes = createTestKeystrokes()

      expect(keystrokes.checkKeyCombo('a>b')).toBe(false)

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'b' })

      expect(keystrokes.checkKeyCombo('a>b')).toBe(true)

      keystrokes.release({ key: 'a' })

      expect(keystrokes.checkKeyCombo('a>b')).toBe(false)
    })
  })

  describe('#checkKeyComboSequenceIndex(keyCombo)', () => {
    it('will return the index of the last active key combo sequence', () => {
      const keystrokes = createTestKeystrokes()

      const keyCombo = 'a>b,c+d,e,f>g'

      expect(keystrokes.checkKeyComboSequenceIndex(keyCombo)).toBe(0)

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'b' })

      expect(keystrokes.checkKeyComboSequenceIndex(keyCombo)).toBe(0)

      keystrokes.release({ key: 'a' })
      keystrokes.release({ key: 'b' })

      expect(keystrokes.checkKeyComboSequenceIndex(keyCombo)).toBe(1)

      keystrokes.press({ key: 'd' })
      keystrokes.press({ key: 'c' })

      expect(keystrokes.checkKeyComboSequenceIndex(keyCombo)).toBe(1)

      keystrokes.release({ key: 'c' })
      keystrokes.release({ key: 'd' })

      expect(keystrokes.checkKeyComboSequenceIndex(keyCombo)).toBe(2)

      keystrokes.press({ key: 'e' })

      expect(keystrokes.checkKeyComboSequenceIndex(keyCombo)).toBe(2)

      keystrokes.release({ key: 'e' })

      expect(keystrokes.checkKeyComboSequenceIndex(keyCombo)).toBe(3)

      keystrokes.press({ key: 'f' })
      keystrokes.press({ key: 'g' })

      expect(keystrokes.checkKeyComboSequenceIndex(keyCombo)).toBe(4)

      keystrokes.release({ key: 'f' })
      keystrokes.release({ key: 'g' })

      expect(keystrokes.checkKeyComboSequenceIndex(keyCombo)).toBe(0)
    })
  })
})
