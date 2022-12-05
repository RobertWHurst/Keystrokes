import { Keystrokes, MinimalKeyboardEvent, nextTick } from '../keystrokes'
import sinon from 'sinon'
import assert from 'assert'

describe("new Keypress(options)", () => {

  describe('#bindKey(keyCombo, handler)', () => {

    it('accepts a key and handler which is executed repeatedly while the key is pressed', () => {
      let press: (key: string) => void = () => {
        throw new Error('onKeyPressed not bound')
      }
      const keystrokes = new Keystrokes<MinimalKeyboardEvent>({
        onKeyPressed: h => { press = k => h({ key: k }) }
      })

      const handler1 = sinon.stub()
      const handler2 = sinon.stub()
      keystrokes.bindKey('a', handler1)
      keystrokes.bindKey('a', handler2)

      press('a')
      press('a')

      sinon.assert.calledTwice(handler1)
      sinon.assert.calledTwice(handler2)
    })

    it('accepts a key and handler object containing handlers called appropriately while the key is pressed or released', () => {
      let press: (key: string) => void = () => {
        throw new Error('onKeyPressed not bound')
      }
      let release: (key: string) => void = () => {
        throw new Error('onKeyReleased not bound')
      }
      const keystrokes = new Keystrokes<MinimalKeyboardEvent>({
        onKeyPressed: h => { press = k => h({ key: k }) },
        onKeyReleased: h => { release = k => h({ key: k }) }
      })

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

      press('a')
      press('a')
      release('a')

      sinon.assert.calledOnce(handler1.onPressed)
      sinon.assert.calledTwice(handler1.onPressedWithRepeat)
      sinon.assert.calledOnce(handler1.onReleased)
      sinon.assert.calledOnce(handler2.onPressed)
      sinon.assert.calledTwice(handler2.onPressedWithRepeat)
      sinon.assert.calledOnce(handler2.onReleased)
    })
  })

  describe('#unbindKey(keyCombo, handler?)', () => {
    
    it('will remove a handler function for a given key, preventing it from being called', () => {
      let press: (key: string) => void = () => {
        throw new Error('onKeyPressed not bound')
      }
      const keystrokes = new Keystrokes<MinimalKeyboardEvent>({
        onKeyPressed: h => { press = k => h({ key: k }) }
      })

      const handler1 = sinon.stub()
      const handler2 = sinon.stub()
      keystrokes.bindKey('a', handler1)
      keystrokes.bindKey('a', handler2)

      press('a')

      keystrokes.unbindKey('a', handler1)

      press('a')

      sinon.assert.calledOnce(handler1)
      sinon.assert.calledTwice(handler2)
    })
    
    it('will remove all handler functions for a given key if no handler is given', () => {
      let press: (key: string) => void = () => {
        throw new Error('onKeyPressed not bound')
      }
      const keystrokes = new Keystrokes<MinimalKeyboardEvent>({
        onKeyPressed: h => { press = k => h({ key: k }) }
      })

      const handler1 = sinon.stub()
      const handler2 = sinon.stub()
      keystrokes.bindKey('a', handler1)
      keystrokes.bindKey('a', handler2)

      press('a')

      keystrokes.unbindKey('a')

      press('a')

      sinon.assert.calledOnce(handler1)
      sinon.assert.calledOnce(handler2)
    })
    
    it('will remove a handler object for a given key, preventing it from being called', () => {
      let press: (key: string) => void = () => {
        throw new Error('onKeyPressed not bound')
      }
      const keystrokes = new Keystrokes<MinimalKeyboardEvent>({
        onKeyPressed: h => { press = k => h({ key: k }) }
      })

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

      press('a')

      keystrokes.unbindKey('a', handler1)

      press('a')

      sinon.assert.calledOnce(handler1.onPressed)
      sinon.assert.calledOnce(handler1.onPressedWithRepeat)
      sinon.assert.calledOnce(handler2.onPressed)
      sinon.assert.calledTwice(handler2.onPressedWithRepeat)
    })
    
    it('will remove all handler objects for a key if no handler is given', () => {
      let press: (key: string) => void = () => {
        throw new Error('onKeyPressed not bound')
      }
      const keystrokes = new Keystrokes<MinimalKeyboardEvent>({
        onKeyPressed: h => { press = k => h({ key: k }) }
      })

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

      press('a')

      keystrokes.unbindKey('a')

      press('a')

      sinon.assert.calledOnce(handler1.onPressed)
      sinon.assert.calledOnce(handler1.onPressedWithRepeat)
      sinon.assert.calledOnce(handler2.onPressed)
      sinon.assert.calledOnce(handler2.onPressedWithRepeat)
    })
  })

  describe('#bindKeyCombo(keyCombo, handler)', () => {
    
    it('accepts a key combo and when that combo is satisfied the given handler is executed', async () => {
      let press: (key: string) => void = () => {
        throw new Error('onKeyPressed not bound')
      }
      let release: (key: string) => void = () => {
        throw new Error('onKeyReleased not bound')
      }
      const keystrokes = new Keystrokes<MinimalKeyboardEvent>({
        onKeyPressed: h => { press = k => h({ key: k }) },
        onKeyReleased: h => { release = k => h({ key: k }) }
      })

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

      press('a')
      press('a')

      await nextTick()

      release('a')

      await nextTick()

      press('b')
      press('b')
      press('d')
      press('d')
      press('c')
      press('c')

      await nextTick()

      release('b')
      release('c')
      release('d')

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
      let press: (key: string) => void = () => {
        throw new Error('onKeyPressed not bound')
      }
      let release: (key: string) => void = () => {
        throw new Error('onKeyReleased not bound')
      }
      const keystrokes = new Keystrokes<MinimalKeyboardEvent>({
        onKeyPressed: h => { press = k => h({ key: k }) },
        onKeyReleased: h => { release = k => h({ key: k }) }
      })

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

      press('d')
      press('d')

      await nextTick()

      release('d')

      press('b')
      press('c')

      await nextTick()

      release('c')
      release('b')

      press('a')
      press('a')

      await nextTick()

      release('a')

      await nextTick()
      await nextTick()

      sinon.assert.notCalled(handler1.onPressed)
      sinon.assert.notCalled(handler1.onPressedWithRepeat)
      sinon.assert.notCalled(handler1.onReleased)
      sinon.assert.notCalled(handler2.onPressed)
      sinon.assert.notCalled(handler2.onPressedWithRepeat)
      sinon.assert.notCalled(handler2.onReleased)
    })
  })

  describe('#unbindKeyCombo(keyCombo, handler?)', () => {
    
    it('remove a handler for a given key combo', async () => {
      let press: (key: string) => void = () => {
        throw new Error('onKeyPressed not bound')
      }
      const keystrokes = new Keystrokes<MinimalKeyboardEvent>({
        onKeyPressed: h => { press = k => h({ key: k }) }
      })

      const handler1 = sinon.stub()
      const handler2 = sinon.stub()
      keystrokes.bindKeyCombo('a>b', handler1)
      keystrokes.bindKeyCombo('a>b', handler2)

      press('a')
      press('b')
      press('b')

      await nextTick()
      await nextTick()

      keystrokes.unbindKeyCombo('a>b', handler2)

      press('b')

      await nextTick()
      await nextTick()

      sinon.assert.calledThrice(handler1)
      sinon.assert.calledTwice(handler2)
    })
  })

  describe('#checkKey(key)', () => {
    
    it('will return a boolean indicating if a key is pressed', () => {
      let press: (key: string) => void = () => {
        throw new Error('onKeyPressed not bound')
      }
      let release: (key: string) => void = () => {
        throw new Error('onKeyReleased not bound')
      }
      const keystrokes = new Keystrokes<MinimalKeyboardEvent>({
        onKeyPressed: h => { press = k => h({ key: k }) },
        onKeyReleased: h => { release = k => h({ key: k }) }
      })

      assert.ok(!keystrokes.checkKey('a'))

      press('a')
      press('a')

      assert.ok(keystrokes.checkKey('a'))

      release('a')

      assert.ok(!keystrokes.checkKey('a'))
    })
  })

  describe('#checkKeyCombo(keyCombo)', () => {
    
    it('will return a boolean indicating if a key combo is pressed and a partial key combo state array containing the pressed keys', async () => {
      let press: (key: string) => void = () => {
        throw new Error('onKeyPressed not bound')
      }
      let release: (key: string) => void = () => {
        throw new Error('onKeyReleased not bound')
      }
      const keystrokes = new Keystrokes<MinimalKeyboardEvent>({
        onKeyPressed: h => { press = k => h({ key: k }) },
        onKeyReleased: h => { release = k => h({ key: k }) }
      })

      assert.ok(!keystrokes.checkKeyCombo('a>b'))

      press('a')
      press('b')

      assert.ok(keystrokes.checkKeyCombo('a>b'))

      release('a')

      assert.ok(!keystrokes.checkKeyCombo('a>b'))
    })
  })
})