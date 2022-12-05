import sinon from 'sinon'
import assert from 'assert'
import { bindKey, bindKeyCombo, checkKey, getGlobalKeystrokesInstance, unbindKey } from '..'
import { nextTick } from '../keystrokes'

let press: (key: string) => void = () => {
  throw new Error('onKeyPressed not bound')
}
let release: (key: string) => void = () => {
  throw new Error('onKeyReleased not bound')
}
global.document = {
  addEventListener: (eventName: string, handler: (event: any) => void) => {
    if (eventName === 'keydown') { press = key => handler({ key }) }
    if (eventName === 'keyup') { release = key => handler({ key }) }
  },
  removeEventListener: (eventName: string, handler: () => void) => {}
} as Document

getGlobalKeystrokesInstance()._bindEnvironment()

describe('exported globalKeystrokes methods', () => {
  describe('bindKey(keyCombo, handler)', () => {

    it('accepts a key and handler which is executed repeatedly while the key is pressed', () => {
      const handler1 = sinon.stub()
      const handler2 = sinon.stub()
      bindKey('a', handler1)
      bindKey('a', handler2)

      press('a')
      press('a')

      sinon.assert.calledTwice(handler1)
      sinon.assert.calledTwice(handler2)
    })
  })

  describe('unbindKey(keyCombo, handler?)', () => {
    
    it('will remove a handler function for a given key, preventing it from being called', () => {
      const handler1 = sinon.stub()
      const handler2 = sinon.stub()
      bindKey('a', handler1)
      bindKey('a', handler2)

      press('a')

      unbindKey('a', handler1)

      press('a')

      sinon.assert.calledOnce(handler1)
      sinon.assert.calledTwice(handler2)
    })
  })

  describe('bindKeyCombo(keyCombo, handler)', () => {
    
    it('accepts a key combo and when that combo is satisfied the given handler is executed', async () => {
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
      bindKeyCombo('a,b>c,d', handler1)
      bindKeyCombo('a,b>c,d', handler2)

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

  describe('unbindKeyCombo(keyCombo, handler?)', () => {
    
  })

  describe('checkKey(key)', () => {
    
    it('will return a boolean indicating if a key is pressed', () => {
      assert.ok(!checkKey('a'))

      press('a')
      press('a')

      assert.ok(checkKey('a'))

      release('a')

      assert.ok(!checkKey('a'))
    })
  })

  describe('checkKeyCombo(keyCombo)', () => {
    
  })
})
