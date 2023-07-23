import { describe, it, expect, vi } from 'vitest'
import {
  BrowserKeyComboEventProps,
  BrowserKeyEventProps,
  Keystrokes,
  nextTick,
} from '../keystrokes'
import { KeyComboEvent, KeyEvent, createTestKeystrokes } from '..'

describe('new Keystrokes(options)', () => {
  it('will automatically release self-releasing keys', async () => {
    const keystrokes = createTestKeystrokes({
      selfReleasingKeys: ['meta', 'z'],
    })

    assert.ok(!keystrokes.checkKeyCombo('meta > z'))

    keystrokes.press({ key: 'meta' })
    await nextTick()
    assert.ok(keystrokes.checkKey('meta'))
    assert.ok(!keystrokes.checkKeyCombo('meta > z'))

    keystrokes.press({ key: 'z' })
    await nextTick()
    assert.ok(keystrokes.checkKey('z'))
    assert.ok(keystrokes.checkKeyCombo('meta > z'))

    keystrokes.release({ key: 'meta' })
    await nextTick()

    assert.ok(!keystrokes.checkKey('z'))
    assert.ok(!keystrokes.checkKey('meta'))
    assert.ok(!keystrokes.checkKeyCombo('meta > z'))
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

    // TODO: This should probably be moved to a location for browser related binders. Perhaps
    // when I actually move the browser binders out to a separate file.
    it('provides an event with composedPath on it', () => {
      const keystrokes = createTestKeystrokes()

      const handler = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
        onReleased: vi.fn(),
      }
      keystrokes.bindKey('a', handler)

      const node1 = {} as EventTarget
      const node2 = {} as EventTarget

      keystrokes.press({ key: 'a', composedPath: () => [node1, node2] })
      keystrokes.release({ key: 'a', composedPath: () => [node1, node2] })

      const event = handler.onPressed.mock.calls[0][0] as KeyEvent<
        KeyboardEvent,
        BrowserKeyEventProps
      >
      const composedPath = event.composedPath()

      expect(composedPath[0]).toBe(node1)
      expect(composedPath[1]).toBe(node2)
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
  })

  describe('#bindKeyCombo(keyCombo, handler)', () => {
    it('accepts a key combo and when that combo is satisfied the given handler is executed', async () => {
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

      await nextTick()

      keystrokes.release({ key: 'a' })

      await nextTick()

      keystrokes.press({ key: 'b' })
      keystrokes.press({ key: 'b' })
      keystrokes.press({ key: 'd' })
      keystrokes.press({ key: 'd' })
      keystrokes.press({ key: 'c' })
      keystrokes.press({ key: 'c' })

      await nextTick()

      keystrokes.release({ key: 'b' })
      keystrokes.release({ key: 'c' })
      keystrokes.release({ key: 'd' })

      await nextTick()
      await nextTick()

      expect(handler1.onPressed).toBeCalledTimes(1)
      expect(handler1.onPressedWithRepeat).toBeCalledTimes(2)
      expect(handler1.onReleased).toBeCalledTimes(1)
      expect(handler2.onPressed).toBeCalledTimes(1)
      expect(handler2.onPressedWithRepeat).toBeCalledTimes(2)
      expect(handler2.onReleased).toBeCalledTimes(1)
    })

    it('will not trigger a key combo handler if the keys are pressed in the wrong order', async () => {
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

      await nextTick()

      keystrokes.release({ key: 'd' })

      keystrokes.press({ key: 'b' })
      keystrokes.press({ key: 'c' })

      await nextTick()

      keystrokes.release({ key: 'c' })
      keystrokes.release({ key: 'b' })

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'a' })

      await nextTick()

      keystrokes.release({ key: 'a' })

      await nextTick()
      await nextTick()

      expect(handler1.onPressed).toBeCalledTimes(0)
      expect(handler1.onPressedWithRepeat).toBeCalledTimes(0)
      expect(handler1.onReleased).toBeCalledTimes(0)
      expect(handler2.onPressed).toBeCalledTimes(0)
      expect(handler2.onPressedWithRepeat).toBeCalledTimes(0)
      expect(handler2.onReleased).toBeCalledTimes(0)
    })

    it('provides all key events invoked while the combo was being satisfied', async () => {
      const keystrokes = createTestKeystrokes()

      const handler = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
        onReleased: vi.fn(),
      }
      keystrokes.bindKeyCombo('a,b>c+d', handler)

      keystrokes.press({ key: 'a' })

      await nextTick()

      keystrokes.release({ key: 'a' })

      await nextTick()

      keystrokes.press({ key: 'b' })
      keystrokes.press({ key: 'd' })
      keystrokes.press({ key: 'c' })

      await nextTick()

      keystrokes.release({ key: 'b' })
      keystrokes.release({ key: 'c' })
      keystrokes.release({ key: 'd' })

      await nextTick()
      await nextTick()

      const event = handler.onPressed.mock.calls[0][0] as KeyComboEvent<
        KeyboardEvent,
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

    it('provides the final key event that invoked in order to satisfy the combo', async () => {
      const keystrokes = createTestKeystrokes()

      const handler = {
        onPressed: vi.fn(),
        onPressedWithRepeat: vi.fn(),
        onReleased: vi.fn(),
      }
      keystrokes.bindKeyCombo('a,b>c+d', handler)

      keystrokes.press({ key: 'a' })

      await nextTick()

      keystrokes.release({ key: 'a' })

      await nextTick()

      keystrokes.press({ key: 'b' })
      keystrokes.press({ key: 'd' })
      keystrokes.press({ key: 'c' })

      await nextTick()

      keystrokes.release({ key: 'b' })
      keystrokes.release({ key: 'c' })
      keystrokes.release({ key: 'd' })

      await nextTick()
      await nextTick()

      const event = handler.onPressed.mock.calls[0][0] as KeyComboEvent<
        KeyboardEvent,
        BrowserKeyEventProps,
        BrowserKeyComboEventProps
      >

      expect(event.finalKeyEvent).toBeTruthy()
      expect(event.finalKeyEvent.key).toBe('c')
    })
  })

  describe('#unbindKeyCombo(keyCombo, handler?)', () => {
    it('remove a handler for a given key combo', async () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = vi.fn()
      const handler2 = vi.fn()
      keystrokes.bindKeyCombo('a>b', handler1)
      keystrokes.bindKeyCombo('a>b', handler2)

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'b' })
      keystrokes.press({ key: 'b' })

      await nextTick()
      await nextTick()

      keystrokes.unbindKeyCombo('a>b', handler2)

      keystrokes.press({ key: 'b' })

      await nextTick()
      await nextTick()

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
})
