import { act as reactAct } from 'react-test-renderer'

export const act = async <R>(actor: () => R) => {
  let value: R
  await reactAct(async () => {
    const promiseOrValue = actor()
    value = await promiseOrValue
  })
  return value!
}
