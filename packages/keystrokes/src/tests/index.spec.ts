import { describe, it, expect, vi } from 'vitest'
import {
  bindKey,
  bindKeyCombo,
  checkKey,
  getGlobalKeystrokes,
  unbindKey,
} from '..'

let press: (key: string) => void = () => {
  throw new Error('onKeyPressed not bound')
}
let release: (key: string) => void = () => {
  throw new Error('onKeyReleased not bound')
}
global.document = {
  addEventListener: (eventName: string, handler: (event: any) => void) => {
    if (eventName === 'keydown') {
      press = (key) => handler({ key, composedPath: () => [] })
    }
    if (eventName === 'keyup') {
      release = (key) => handler({ key, composedPath: () => [] })
    }
  },
  removeEventListener: (eventName: string, handler: () => void) => {},
} as Document

getGlobalKeystrokes().bindEnvironment()

describe('exported globalKeystrokes methods', () => {
  describe('bindKey(keyCombo, handler)', () => {
    it('accepts a key and handler which is executed repeatedly while the key is pressed', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      bindKey('a', handler1)
      bindKey('a', handler2)

      press('a')
      press('a')

      expect(handler1).toBeCalledTimes(2)
      expect(handler2).toBeCalledTimes(2)
    })
  })

  describe('unbindKey(keyCombo, handler?)', () => {
    it('will remove a handler function for a given key, preventing it from being called', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      bindKey('a', handler1)
      bindKey('a', handler2)

      press('a')

      unbindKey('a', handler1)

      press('a')

      expect(handler1).toBeCalledTimes(1)
      expect(handler2).toBeCalledTimes(2)
    })
  })

  describe('bindKeyCombo(keyCombo, handler)', () => {
    it('accepts a key combo and when that combo is satisfied the given handler is executed', async () => {
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
      bindKeyCombo('a,b>c,d', handler1)
      bindKeyCombo('a,b>c,d', handler2)

      press('a')
      press('a')
      release('a')
      press('b')
      press('c')
      release('c')
      release('b')
      press('d')
      press('d')
      release('d')

      expect(handler1.onPressed).toBeCalledTimes(1)
      expect(handler1.onPressedWithRepeat).toBeCalledTimes(2)
      expect(handler1.onReleased).toBeCalledTimes(1)
      expect(handler2.onPressed).toBeCalledTimes(1)
      expect(handler2.onPressedWithRepeat).toBeCalledTimes(2)
      expect(handler2.onReleased).toBeCalledTimes(1)
    })
  })

  describe.skip('unbindKeyCombo(keyCombo, handler?)', () => {})

  describe('checkKey(key)', () => {
    it('will return a boolean indicating if a key is pressed', () => {
      expect(checkKey('a')).toBe(false)

      press('a')
      press('a')

      expect(checkKey('a')).toBe(true)

      release('a')

      expect(checkKey('a')).toBe(false)
    })
  })

  describe.skip('checkKeyCombo(keyCombo)', () => {})
})
