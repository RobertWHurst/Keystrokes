import { parseKeyCombo, stringifyKeyCombo } from '../index'
import { Keystrokes } from '../index'

// const initialKeyCombo = 'a > s > d + f, g + h > j, k + l'
const initialKeyCombo = 'a > b, c + b'

run().catch(err => {
  console.error(err)
})

async function run() {
  const keystrokes = new Keystrokes()

  let keyComboStr = ''
  const keyCombo = parseKeyCombo(initialKeyCombo)

  const keyComboEl = document.querySelector<HTMLDivElement>('#key-combo')!
  keyComboEl.innerHTML = stylizeKeyCombo(keyCombo)
  const originalBg = keyComboEl.style.background

  const handleCombo = {
    onPressed() {
      keyComboEl.style.background = '#FFBF00'
    },
    onReleased() {
      keyComboEl.style.background = originalBg
    },
  }

  const bindKeyCombo = () => {
    keystrokes.unbindKeyCombo(keyComboStr, handleCombo)
    keyComboStr = stringifyKeyCombo(keyCombo)
    console.log(keyComboStr)
    keystrokes.bindKeyCombo(keyComboStr, handleCombo)
  }

  bindKeyCombo()

  let standAloneShift = true
  let pendingOperator = ''

  keyComboEl.addEventListener('keydown', event => {
    const key = event.key.toLowerCase()
    if (key === 'shift') {
      standAloneShift = true
    }
    console.log('down', standAloneShift)
  })

  keyComboEl.addEventListener('keyup', event => {
    event.preventDefault()
    event.stopImmediatePropagation()

    const key = event.key.toLowerCase()

    let lastSequence = keyCombo[keyCombo.length - 1]
    let lastUnit = lastSequence?.[lastSequence.length - 1] ?? []

    if (key !== 'shift') {
      standAloneShift = false
    }
    if (key === 'backspace' && pendingOperator) {
      pendingOperator = ''
    } else if (key === 'backspace' && lastUnit.length !== 0) {
      lastUnit.pop()
      pendingOperator = '+'
      if (lastUnit.length === 0) {
        lastSequence.pop()
        pendingOperator = '>'
      }
      if (lastSequence.length === 0) {
        keyCombo.pop()
        pendingOperator = ','
      }
      if (keyCombo.length === 0) {
        pendingOperator = ''
      }
    } else if (key === 'enter') {
      keyComboEl.blur()
    } else if (key === '+' || key === '>' || key === ',') {
      pendingOperator = key
    } else if (pendingOperator && (key !== 'shift' || standAloneShift)) {
      if (pendingOperator === '+') {
        if (!lastSequence) {
          lastSequence = []
          keyCombo.push(lastSequence)
        }
        if (!lastUnit) {
          lastUnit = []
          lastSequence.push(lastUnit)
        }
        lastUnit.push(key)
      } else if (pendingOperator === '>') {
        lastUnit = [key]
        if (!lastSequence) {
          lastSequence = []
          keyCombo.push(lastSequence)
        }
        lastSequence.push(lastUnit)
      } else if (pendingOperator === ',') {
        lastSequence = [[key]]
        keyCombo.push(lastSequence)
      }
      pendingOperator = ''
    } else if (key !== 'shift' || standAloneShift) {
      if (!lastSequence) {
        lastSequence = []
        keyCombo.push(lastSequence)
      }
      if (!lastUnit) {
        lastUnit = []
        lastSequence.push(lastUnit)
      }
      lastUnit.pop()
      lastUnit.push(key)
    }

    keyComboEl.innerHTML = stylizeKeyCombo(keyCombo, pendingOperator)

    bindKeyCombo()
  })
}

function stylizeKeyCombo(keyCombo: string[][][], pendingOperator?: string) {
  let stylizedKeyCombo = keyCombo
    .map(
      s =>
        `<span class="sequence">${s
          .map(
            u =>
              `<span class="unit">${u
                .map(k => `<span class="key">${k}</span>`)
                .join('<span class="join"> + </span>')}</span>`,
          )
          .join('<span class="order"> &gt; </span>')}</span>`,
    )
    .join('<span class="group">, </span>')

  switch (pendingOperator) {
    case '+':
      stylizedKeyCombo += '<span class="join"> + </span>'
      break
    case '>':
      stylizedKeyCombo += '<span class="order"> &gt; </span>'
      break
    case ',':
      stylizedKeyCombo += '<span class="group">, </span>'
      break
  }

  return stylizedKeyCombo
}
