import assert from 'assert'
import {
  compareStrings,
  duplicateInText,
  findUniqueName,
  toCapital
} from './stringUtils.js'

describe('stringUtils', () => {
  it('findUniqueName', () => {
    assert.deepStrictEqual(findUniqueName('other', {'a': true, 'b': true, 'c': true}), 'other')
    assert.deepStrictEqual(findUniqueName('b', {'a': true, 'b': true, 'c': true}), 'b (copy)')
    assert.deepStrictEqual(findUniqueName('b', {'a': true, 'b': true, 'c': true, 'b (copy)': true}), 'b (copy 2)')
    assert.deepStrictEqual(findUniqueName('b', {'a': true, 'b': true, 'c': true, 'b (copy)': true, 'b (copy 2)': true}), 'b (copy 3)')
  })

  it('toCapital', () => {
    assert.deepStrictEqual(toCapital('hello'), 'Hello')
    assert.deepStrictEqual(toCapital('HEllo'), 'Hello')
    assert.deepStrictEqual(toCapital('HEllo'), 'Hello')
    assert.deepStrictEqual(toCapital(''), '')
    assert.deepStrictEqual(toCapital(undefined), undefined)
  })

  it('compareStrings', () => {
    assert.deepStrictEqual(compareStrings('a', 'b'), -1)
    assert.deepStrictEqual(compareStrings('b', 'a'), 1)
    assert.deepStrictEqual(compareStrings('a', 'a'), 0)

    const array = ['b', 'c', 'a']
    assert.deepStrictEqual(array.sort(compareStrings), ['a', 'b', 'c'])
  })

  it('duplicateInText', () => {
    assert.deepStrictEqual(duplicateInText('abcdef', 2, 4), 'abcdcdef')
    assert.deepStrictEqual(duplicateInText('abcdef', 4, 2), 'abcdcdef')
  })
})
