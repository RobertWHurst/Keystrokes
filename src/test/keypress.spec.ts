import { Keystrokes, nextTick } from '../keystrokes'
import sinon from 'sinon'
import assert from 'assert'

describe("new Keypress(options)", () => {

  describe('#bindKey(keyCombo, handler)', () => {

    it('accepts a key and handler which is executed repeatedly while the key is pressed', () => {
      let press: (key: string) => void = () => {
        throw new Error('onKeyPressed not bound')
      }
      const keystrokes = new Keystrokes({
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
      const keystrokes = new Keystrokes({
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
      const keystrokes = new Keystrokes({
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
      const keystrokes = new Keystrokes({
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
      const keystrokes = new Keystrokes({
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
      const keystrokes = new Keystrokes({
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
      const keystrokes = new Keystrokes({
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

      press('a')
      press('a')

      await nextTick()

      release('a')

      press('b')
      press('c')

      await nextTick()

      release('c')
      release('b')

      press('d')
      press('d')

      await nextTick()

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
  })

  describe('#unbindKeyCombo(keyCombo, handler?)', () => {
    
  })

  describe('#checkKey(key)', () => {
    
    it('will return a boolean indicating if a key is pressed', () => {
      let press: (key: string) => void = () => {
        throw new Error('onKeyPressed not bound')
      }
      let release: (key: string) => void = () => {
        throw new Error('onKeyReleased not bound')
      }
      const keystrokes = new Keystrokes({
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
    
  })
})