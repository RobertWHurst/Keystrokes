<p align="center">
  <a href="https://github.com/RobertWHurst/Keystrokes/actions/workflows/ci.yml">
    <img src="https://github.com/RobertWHurst/Keystrokes/actions/workflows/ci.yml/badge.svg">
  </a>
</p>

Keystrokes as a quick and easy to use library for binding keys and key combos.

```js
import { bindKeyCombo } from '@rwh/keystrokes'

bindKeyCombo('ctrl > y, r', () => console.log('You pressed ctrl then y followed by r'))
```

More examples and documentation will be added soon. Currently the library is in
a very early stage of development.
