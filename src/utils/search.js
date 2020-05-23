import { SEARCH_PROPERTY, SEARCH_VALUE } from '../constants.js'
import { valueType } from './typeUtils.js'

export function search (key, value, searchText) {
  let results = undefined

  if (typeof key === 'string' && containsCaseInsensitive(key, searchText)) {
    results = createOrAdd(results, SEARCH_PROPERTY, 'search')
  }

  const type = valueType(value)
  if (type === 'array') {
    value.forEach((item, index) => {
      let childResults = search(index, item, searchText)
      if (childResults) {
        results = createOrAdd(results, index, childResults)
      }
    })
  } else if (type === 'object') {
    Object.keys(value).forEach(prop => {
      let childResults = search(prop, value[prop], searchText)
      if (childResults) {
        results = createOrAdd(results, prop, childResults)
      }
    })
  } else { // type is a value
    if (containsCaseInsensitive(value, searchText)) {
      results = createOrAdd(results, SEARCH_VALUE, 'search')
    }
  }

  return results
}

export function flattenSearch (searchResult) {
  const resultArray = []

  function _flattenSearch (value, path) {
    if (value) {
      if (value[SEARCH_PROPERTY]) {
        resultArray.push({
          what: SEARCH_PROPERTY,
          path
        })
      }
      if (value[SEARCH_VALUE]) {
        resultArray.push({
          what: SEARCH_VALUE,
          path
        })
      }
    }

    const type = valueType(value)
    if (type === 'array') {
      searchResult.forEach((item, index) => {
        _flattenSearch(item, path.concat(index))
      })
    } else if (type === 'object') {
      Object.keys(value).forEach(prop => {
        _flattenSearch(value[prop], path.concat(prop))
      })
    }
  }

  _flattenSearch(searchResult, [])

  return resultArray
}

function createOrAdd(object, key, value) {
  if (object) {
    object[key] = value
    return object
  } else {
    return {
      [key]: value
    }
  }
}

/**
 * Do a case insensitive search for a search text in a text
 * @param {String} text
 * @param {String} searchText
 * @return {boolean} Returns true if `search` is found in `text`
 */
export function containsCaseInsensitive (text, searchText) {
  return String(text).toLowerCase().indexOf(searchText.toLowerCase()) !== -1
}
