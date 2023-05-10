import {
  BrowserKeyComboEventProps,
  BrowserKeyEventProps,
  Keystrokes,
  nextTick,
} from '../keystrokes'
import sinon from 'sinon'
import assert from 'assert'
import { KeyComboEvent, KeyEvent, createTestKeystrokes } from '..'

describe('new Keystrokes(options)', () => {
  describe('#bindKey(keyCombo, handler)', () => {
    it('accepts a key and handler which is executed repeatedly while the key is pressed', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = sinon.stub()
      const handler2 = sinon.stub()
      keystrokes.bindKey('a', handler1)
      keystrokes.bindKey('a', handler2)

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'a' })

      sinon.assert.calledTwice(handler1)
      sinon.assert.calledTwice(handler2)
    })

    it('accepts a key and handler object containing handlers called appropriately while the key is pressed or released', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = {
        onPressed: sinon.stub(),
        onPressedWithRepeat: sinon.stub(),
        onReleased: sinon.stub(),
      }
      const handler2 = {
        onPressed: sinon.stub(),
        onPressedWithRepeat: sinon.stub(),
        onReleased: sinon.stub(),
      }
      keystrokes.bindKey('a', handler1)
      keystrokes.bindKey('a', handler2)

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'a' })
      keystrokes.release({ key: 'a' })

      sinon.assert.calledOnce(handler1.onPressed)
      sinon.assert.calledTwice(handler1.onPressedWithRepeat)
      sinon.assert.calledOnce(handler1.onReleased)
      sinon.assert.calledOnce(handler2.onPressed)
      sinon.assert.calledTwice(handler2.onPressedWithRepeat)
      sinon.assert.calledOnce(handler2.onReleased)
    })

    // TODO: This should probably be moved to a location for browser related binders. Perhaps
    // when I actually move the browser binders out to a separate file.
    it('provides an event with composedPath on it', () => {
      const keystrokes = createTestKeystrokes()

      const handler = {
        onPressed: sinon.stub(),
        onPressedWithRepeat: sinon.stub(),
        onReleased: sinon.stub(),
      }
      keystrokes.bindKey('a', handler)

      const node1 = {} as EventTarget
      const node2 = {} as EventTarget

      keystrokes.press({ key: 'a', composedPath: () => [node1, node2] })
      keystrokes.release({ key: 'a', composedPath: () => [node1, node2] })

      const event = handler.onPressed.args[0][0] as KeyEvent<KeyboardEvent, BrowserKeyEventProps>
      const composedPath = event.composedPath()

      assert.equal(composedPath[0], node1)
      assert.equal(composedPath[1], node2)
    })
  })

  describe('#unbindKey(keyCombo, handler?)', () => {
    it('will remove a handler function for a given key, preventing it from being called', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = sinon.stub()
      const handler2 = sinon.stub()
      keystrokes.bindKey('a', handler1)
      keystrokes.bindKey('a', handler2)

      keystrokes.press({ key: 'a' })

      keystrokes.unbindKey('a', handler1)

      keystrokes.press({ key: 'a' })

      sinon.assert.calledOnce(handler1)
      sinon.assert.calledTwice(handler2)
    })

    it('will remove all handler functions for a given key if no handler is given', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = sinon.stub()
      const handler2 = sinon.stub()
      keystrokes.bindKey('a', handler1)
      keystrokes.bindKey('a', handler2)

      keystrokes.press({ key: 'a' })

      keystrokes.unbindKey('a')

      keystrokes.press({ key: 'a' })

      sinon.assert.calledOnce(handler1)
      sinon.assert.calledOnce(handler2)
    })

    it('will remove a handler object for a given key, preventing it from being called', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = {
        onPressed: sinon.stub(),
        onPressedWithRepeat: sinon.stub(),
      }
      const handler2 = {
        onPressed: sinon.stub(),
        onPressedWithRepeat: sinon.stub(),
      }
      keystrokes.bindKey('a', handler1)
      keystrokes.bindKey('a', handler2)

      keystrokes.press({ key: 'a' })

      keystrokes.unbindKey('a', handler1)

      keystrokes.press({ key: 'a' })

      sinon.assert.calledOnce(handler1.onPressed)
      sinon.assert.calledOnce(handler1.onPressedWithRepeat)
      sinon.assert.calledOnce(handler2.onPressed)
      sinon.assert.calledTwice(handler2.onPressedWithRepeat)
    })

    it('will remove all handler objects for a key if no handler is given', () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = {
        onPressed: sinon.stub(),
        onPressedWithRepeat: sinon.stub(),
      }
      const handler2 = {
        onPressed: sinon.stub(),
        onPressedWithRepeat: sinon.stub(),
      }
      keystrokes.bindKey('a', handler1)
      keystrokes.bindKey('a', handler2)

      keystrokes.press({ key: 'a' })

      keystrokes.unbindKey('a')

      keystrokes.press({ key: 'a' })

      sinon.assert.calledOnce(handler1.onPressed)
      sinon.assert.calledOnce(handler1.onPressedWithRepeat)
      sinon.assert.calledOnce(handler2.onPressed)
      sinon.assert.calledOnce(handler2.onPressedWithRepeat)
    })
  })

  describe('#bindKeyCombo(keyCombo, handler)', () => {
    it('accepts a key combo and when that combo is satisfied the given handler is executed', async () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = {
        onPressed: sinon.stub(),
        onPressedWithRepeat: sinon.stub(),
        onReleased: sinon.stub(),
      }
      const handler2 = {
        onPressed: sinon.stub(),
        onPressedWithRepeat: sinon.stub(),
        onReleased: sinon.stub(),
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

      sinon.assert.calledOnce(handler1.onPressed)
      sinon.assert.calledTwice(handler1.onPressedWithRepeat)
      sinon.assert.calledOnce(handler1.onReleased)
      sinon.assert.calledOnce(handler2.onPressed)
      sinon.assert.calledTwice(handler2.onPressedWithRepeat)
      sinon.assert.calledOnce(handler2.onReleased)
    })

    it('will not trigger a key combo handler if the keys are pressed in the wrong order', async () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = {
        onPressed: sinon.stub(),
        onPressedWithRepeat: sinon.stub(),
        onReleased: sinon.stub(),
      }
      const handler2 = {
        onPressed: sinon.stub(),
        onPressedWithRepeat: sinon.stub(),
        onReleased: sinon.stub(),
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

      sinon.assert.notCalled(handler1.onPressed)
      sinon.assert.notCalled(handler1.onPressedWithRepeat)
      sinon.assert.notCalled(handler1.onReleased)
      sinon.assert.notCalled(handler2.onPressed)
      sinon.assert.notCalled(handler2.onPressedWithRepeat)
      sinon.assert.notCalled(handler2.onReleased)
    })

    it('provides all key events invoked while the combo was being satisfied', async () => {
      const keystrokes = createTestKeystrokes()

      const handler = {
        onPressed: sinon.stub(),
        onPressedWithRepeat: sinon.stub(),
        onReleased: sinon.stub(),
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

      const event = handler.onPressed.args[0][0] as KeyComboEvent<
        KeyboardEvent,
        BrowserKeyEventProps,
        BrowserKeyComboEventProps
      >

      assert.ok(event.keyEvents)
      assert.equal(event.keyEvents.length, 4)
      assert.ok(event.keyEvents.some(e => e.key === 'a'))
      assert.ok(event.keyEvents.some(e => e.key === 'b'))
      assert.ok(event.keyEvents.some(e => e.key === 'c'))
      assert.ok(event.keyEvents.some(e => e.key === 'd'))
    })

    it('provides the final key event that invoked in order to satisfy the combo', async () => {
      const keystrokes = createTestKeystrokes()

      const handler = {
        onPressed: sinon.stub(),
        onPressedWithRepeat: sinon.stub(),
        onReleased: sinon.stub(),
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

      const event = handler.onPressed.args[0][0] as KeyComboEvent<
        KeyboardEvent,
        BrowserKeyEventProps,
        BrowserKeyComboEventProps
      >

      assert.ok(event.finalKeyEvent)
      assert.ok(event.finalKeyEvent.key === 'c')
    })
  })

  describe('#unbindKeyCombo(keyCombo, handler?)', () => {
    it('remove a handler for a given key combo', async () => {
      const keystrokes = createTestKeystrokes()

      const handler1 = sinon.stub()
      const handler2 = sinon.stub()
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

      sinon.assert.calledThrice(handler1)
      sinon.assert.calledTwice(handler2)
    })
  })

  describe('#checkKey(key)', () => {
    it('will return a boolean indicating if a key is pressed', () => {
      const keystrokes = createTestKeystrokes()

      assert.ok(!keystrokes.checkKey('a'))

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'a' })

      assert.ok(keystrokes.checkKey('a'))

      keystrokes.release({ key: 'a' })

      assert.ok(!keystrokes.checkKey('a'))
    })
  })

  describe('#checkKeyCombo(keyCombo)', () => {
    it('will return a boolean indicating if a key combo is pressed and a partial key combo state array containing the pressed keys', async () => {
      const keystrokes = createTestKeystrokes()

      assert.ok(!keystrokes.checkKeyCombo('a>b'))

      keystrokes.press({ key: 'a' })
      keystrokes.press({ key: 'b' })

      assert.ok(keystrokes.checkKeyCombo('a>b'))

      keystrokes.release({ key: 'a' })

      assert.ok(!keystrokes.checkKeyCombo('a>b'))
    })
  })
})
