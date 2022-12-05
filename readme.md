<p align="center">
  <a href="https://github.com/RobertWHurst/Keystrokes/actions/workflows/ci.yml">
    <img src="https://github.com/RobertWHurst/Keystrokes/actions/workflows/ci.yml/badge.svg">
  </a>
</p>

Keystrokes as a quick and easy to use library for binding keys and key combos.

```js
import { bindKey, bindKeyCombo } from '@rwh/keystrokes'

bindKeyCombo('a', () =>
  console.log('You pressed the a key'))

bindKeyCombo('ctrl > y, r', () =>
  console.log('You pressed ctrl then y, released both, then pressed r'))
```

