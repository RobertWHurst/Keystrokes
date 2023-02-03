<h1 align="center">
  <img alt="Keystrokes" title="Keystrokes" src="https://raw.githubusercontent.com/RobertWHurst/Keystrokes/master/logo.png">
</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/@rwh/keystrokes">
    <img src="https://img.shields.io/npm/v/@rwh/keystrokes">
  </a>
  <a href="https://www.npmjs.com/package/@rwh/keystrokes">
    <img src="https://img.shields.io/npm/dm/@rwh/keystrokes">
  </a>
  <a href="https://github.com/RobertWHurst/Keystrokes/actions/workflows/ci.yml">
    <img src="https://github.com/RobertWHurst/Keystrokes/actions/workflows/ci.yml/badge.svg">
  </a>
  <a href="https://github.com/sponsors/RobertWHurst">
    <img src="https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86">
  </a>
  <a href="https://openbase.com/js/@rwh/keystrokes?utm_source=embedded&amp;utm_medium=badge&amp;utm_campaign=rate-badge">
    <img src="https://badges.openbase.com/js/featured/@rwh/keystrokes.svg?token=2wanGBvFibIfrdpnvnSioqIgoC7lJt3ztNNcKsRw+Pg=">
  </a>
</p>

__Take note, Keystrokes is in beta. If you encounter a bug please [report it][bug-report].__

Keystrokes as a quick and easy to use library for binding functions to keys
and key combos. It can also be used to check if keys or key combos are pressed
ad-hoc. It supports any TypeScript or JavaScript project, and can be used in
non browser environments too.

```js
import { bindKey, bindKeyCombo } from '@rwh/keystrokes'

bindKey('a', () =>
  console.log('You\'re pressing "a"'))

bindKeyCombo('ctrl > y, r', () =>
  console.log('You pressed "ctrl" then "y", released both, and are pressing "r"'))
```

## Installation

Keystrokes is available on [npm][npm]. This works great when using a build
system like [Parcel][parcel], [Vite][vite], [Turbopack][turbopack], or
[webpack][webpack].

```sh
npm install @rwh/keystrokes
```

```js
import { bindKey } from '@rwh/keystrokes'
bindKey('a', () => console.log('you pressed a'))
```

If node modules aren't an option for you, you can use an npm CDN such as
[jsDelivr][jsdelivr] or [UNPKG][unpkg].

```html
<script src="https://unpkg.com/browse/@rwh/keystrokes@latest/keystrokes.js">
<script>
keystrokes.bindKey('a', () => console.log('you pressed a'))
</script>
```

## Binding Keys and Key Combos

As in the example at the top of the page, Keystrokes exports a bindKey and
bindKeyCombo function. These function will bind a handler function, or handler
object to a key or key combo.

The key names used in your bindings is determined by the environment you are
using Keystrokes in. They are always case insensitive. The default behavior,
intended for browser environments, is to use the value of the key property from
keyboard events. You get get a list of valid [key names here][key-names].

```js
import { bindKey, bindKeyCombo } from '@rwh/keystrokes'

bindKey('a', () =>
  console.log('You\'re pressing "a"'))

bindKeyCombo('ctrl > y, r', () =>
  console.log('You pressed "ctrl" then "y", released both, and are pressing "r"'))

bindKey('a', {
  onPressed: () => console.log('You pressed "a"'),
  onPressedWithRepeat: () => console.log('You\'re pressing "a"'),
  onReleased: () => console.log('You released "a"'),
})

bindKeyCombo('ctrl > y, r', {
  onPressed: () => console.log('You pressed "ctrl" then "y", released both, then pressed "r"'),
  onPressedWithRepeat: () => console.log('You pressed "ctrl" then "y", released both, and are pressing "r"'),
  onReleased: () => console.log('You released "r"'),
})
```

Note that when you pass a function handler instead of an object handler, it is
short hand for passing an object handler with a `onPressedWithRepeat` method.

```js
const handler = () => console.log('You pressed "ctrl" then "y", released both, and are pressing "r"')

bindKeyCombo('ctrl > y, r', handler)
// ...is shorthand for...
bindKeyCombo('ctrl > y, r', { onPressedWithRepeat: handler })
```

## Unbinding Keys and Key Combos

In more complex applications it's likely you'll need to unbind handlers, such
as when you change your view. In order to do so you just need to keep a
reference to the handler so you can unbind it.

```js
import { bindKeyCombo, unbindKeyCombo } from '@rwh/keystrokes'

const handler = () => ...

// bind the combo to the handler
bindKeyCombo('ctrl > y, r', handler)

// ...and some time later...

// unbind the handler
unbindKeyCombo('ctrl > y, r', handler)
```

You can also wipe out all bound handlers on a combo by excluding a handler
reference.

```js
// unbind all handlers for the combo 'ctrl > y, r'
unbindKeyCombo('ctrl > y, r')
```

## Checking Keys and Key Combos

If you have a situation where you want to check if a key or key combo is
pressed at anytime you can do so with `checkKey` and/or `checkKeyCombo`

```js
import { checkKey, checkKeyCombo } from '@rwh/keystrokes'

// keyIsPressed will be true if a is pressed, and false otherwise
const keyIsPressed = checkKey('a')

// keyComboIsPressed will be true if ctrl then y was pressed and r is pressed.
// It will be false otherwise.
const keyComboIsPressed = checkKeyCombo('ctrl > y, r')
```

## Using Keystrokes with React

Keystrokes has it's own react specific package with a few goodies.

```sh
npm install @rwh/keystrokes @rwh/react-keystrokes
```

You will find two hooks, `useKey` and `useKeyCombo`, as well as an optional
context provider which allows using these hooks with custom keystrokes
instances.

Using it to track key or key combo states is rather easy.

```js
import { useEffect, useState } from 'react'
import { useKey, useKeyCombo } from '@rwh/react-keystrokes'

export const Component = () => {

  const isComboPressed = useKeyCombo('a + b')
  const isKeyPressed = useKeyCombo('c')

  /* ... */
}
```

By default the hooks will use the global instance of keystrokes.

To use a custom instance of keystrokes you can wrap components using `useKey`
and/or `useKeyCombo` with `<KeystrokesProvider>`. This component allows
you to pass a custom instance of keystrokes, and all hooks rendered under it
will use the provided instance instead of the global one.

See [Creating Instances](#creating-instances) for more information on creating
custom keystrokes instances.

```js
import { useEffect, useState } from 'react'
import { Keystrokes, KeystrokesProvider, useKey, useKeyCombo } from '@rwh/react-keystrokes'

export const Component = () => {

  const isComboPressed = useKeyCombo('a + b')
  const isKeyPressed = useKeyCombo('c')

  /* ... */
}

export const App = () => {

  const keystrokes = new Keystrokes({ /* custom options */ })

  return (
    <KeystrokesProvider keystrokes={keystrokes}>
      <Component />
    </KeystrokesProvider>
  )
}
```

## Testing your Keystrokes bindings

Keystrokes also exports a function, `createTestKeystrokes`, which creates an
instance of Keystrokes modified for test cases. It has four additional methods
for controlling the internal state.

```js
import assert from 'assert'
import { createTestKeystrokes } from '@rwh/keystrokes'

describe('MyApp', () => {
  it('correctly handles the key combo', () => {
    const keystrokes = createTestKeystrokes()

    const app = new MyApp({ keystrokes })

    keystrokes.press({ key: 'a' })
    keystrokes.press({ key: 'b' })

    await app.update()

    assert(app.didComboBoundThing)
  })
})
```

If your app uses the global instance of keystrokes then this can be used in
conjunction with `setGlobalKeystrokes`.

```js
import assert from 'assert'
import { createTestKeystrokes, setGlobalKeystrokes } from '@rwh/keystrokes'

describe('MyApp', () => {
  it('correctly handles the key combo', () => {
    const keystrokes = createTestKeystrokes()
    setGlobalKeystrokes(keystrokes)

    const app = new MyApp()

    keystrokes.press({ key: 'a' })
    keystrokes.press({ key: 'b' })

    await app.update()

    assert(app.didComboBoundThing)
  })
})
```

## Creating Instances

If you'd rather create your own instances of Keystrokes, rather than using the
global instance, you can do so by constructing the Keystrokes class. Keystrokes
class instance has all of the functions we've looked at above as methods.

```js
import { Keystrokes } from '@rwh/keystrokes'

const keystrokes = new Keystrokes()

// All of the functions we've reviewed above are methods on the instance
keystrokes.bindKey(...)
keystrokes.bindKeyCombo(...)
keystrokes.unbindKey(...)
keystrokes.unbindKeyCombo(...)
keystrokes.checkKey(...)
keystrokes.checkKeyCombo(...)

```

If you want to go this route you won't have to work about overhead from the
global instance as it is only created if you use the exported functions
associated with it.

## Configuration Options

Keystrokes has a few configuration options that you can configure by passing
them to the `Keystrokes` constructor, or by calling the
`setGlobalKeystrokesOptions` before using any of the functions exported by the
package associated with the global instance.

### Available Options

  selfReleasingKeys?: string[]
  keyRemap?: Record<string, string>

Option            | Description
------------------|------------------------------------------
selfReleasingKeys | Some environments may not properly fire release events for all keys. Adding them to this array will ensure they are released automatically when no other keys are pressed.
keyRemap          | An object of key value pairs with the key being the key to rename, and the value being the new name.
onActive          | A binder to track viewport focus. See [Non Browser Environments](#non-browser-environments) for details.
onInactive        | A binder to track viewport blur. See [Non Browser Environments](#non-browser-environments) for details.
onKeyPressed      | A binder to track when keys are pressed. See [Non Browser Environments](#non-browser-environments) for details.
onKeyReleased     | A binder to track when keys are released. See [Non Browser Environments](#non-browser-environments) for details.

Here is an example where we are configuring the global instance.

```js
import { bindKey, setGlobalKeystrokesOptions } from '@rwh/keystrokes'

// Must be called before binding or checking keys or key combos
setGlobalKeystrokesOptions({
  keyRemap: { ' ': 'spacebar' }
})

bindKey(...)
```

And here is an example where we are passing the options to the `Keystrokes`
constructor. These options will only effect the constructed instance.

```js
import { Keystrokes } from '@rwh/keystrokes'

const keystrokes = new Keystrokes({
  keyRemap: { ' ': 'spacebar' }
})

keystrokes.bindKey(...)
```

## Non Browser Environments

Should you wish to use Keystrokes in a non browser environment, you can do
so with the use of the `onActive`, `onInactive`, `onKeyPressed`, and
`onKeyReleased` binder options. Binders are functions that are called by
keystrokes when constructed. The binder is passed a handler function. Your
binder is expected to call this handler whenever the event associated with the
binder occurs. Binders may also return a function which will be called when the
library is unbound from the environment.

By default Keystrokes will internally setup binders that work with browser
environments if you do not provide your own. This results in the same behavior
as the following code.

```js
import { Keystrokes } from '@rwh/keystrokes'

const keystrokes = new Keystrokes({
  onActive: handler => {
    const listener = () => handler()
    window.addEventListener('focus', listener)
    return () => {
      window.removeEventListener('focus', listener)
    }
  },
  onInactive: handler => {
    const listener = () => handler()
    window.addEventListener('blur', listener)
    return () => {
      window.removeEventListener('blur', listener)
    }
  },
  onKeyPressed: handler => {
    const listener = event => handler({ key: event.key, originalEvent: event })
    window.addEventListener('keydown', listener)
    return () => {
      window.removeEventListener('keydown', listener)
    }
  },
  onKeyReleased: handler => {
    const listener = event => handler({ key: event.key, originalEvent: event })
    window.addEventListener('keyup', listener)
    return () => {
      window.removeEventListener('keyup', listener)
    }
  }
})

keystrokes.bindKey(...)
```

## Help Welcome

If you want to support this project by throwing be some coffee money It's
greatly appreciated.

[![sponsor](https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86)](https://github.com/sponsors/RobertWHurst)

If your interested in providing feedback or would like to contribute please feel
free to do so. I recommend first [opening an issue][feature-request] expressing
your feedback or intent to contribute a change, from there we can consider your
feedback or guide your contribution efforts. Any and all help is greatly
appreciated since this is an open source effort after all.

Thank you!

[npm]: https://www.npmjs.com
[parcel]: https://parceljs.org
[vite]: https://vitejs.dev
[turbopack]: https://turbo.build/pack
[webpack]: https://webpack.js.org
[jsdelivr]: https://www.jsdelivr.com/package/npm/@rwh/keystrokes
[unpkg]: https://unpkg.com/browse/@rwh/keystrokes@latest/
[key-names]: https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
[bug-report]: https://github.com/RobertWHurst/Keystrokes/issues/new?template=bug_report.md
[feature-request]: https://github.com/RobertWHurst/Keystrokes/issues/new?template=feature_request.md
