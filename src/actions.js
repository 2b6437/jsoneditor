import first from 'lodash/first'
import initial from 'lodash/initial'
import last from 'lodash/last'
import { getIn } from './utils/immutabilityHelpers'
import { compileJSONPointer } from './utils/jsonPointer'
import { findUniqueName } from './utils/stringUtils'

/**
 * Create a JSONPatch for an insert action.
 *
 * This function needs the current data in order to be able to determine
 * a unique property name for the inserted node in case of duplicating
 * and object property
 *
 * @param {JSON} json
 * @param {Path} path
 * @param {Array.<{key?: string, value: JSON}>} values
 * @param {string[]} nextKeys   A list with all keys *after* the renamed key,
 *                              these keys will be moved down, so the renamed
 *                              key will maintain it's position above these keys
 * @return {Array}
 */
export function insertBefore (json, path, values, nextKeys) {  // TODO: find a better name and define datastructure for values
  const parentPath = initial(path)
  const parent = getIn(json, parentPath)

  if (Array.isArray(parent)) {
    const startIndex = parseInt(last(path), 10)
    return values.map((entry, offset) => ({
      op: 'add',
      path: compileJSONPointer(parentPath.concat(startIndex + offset)),
      value: entry.value
    }))
  }
  else { // 'object'
    return [
      // insert new values
      ...values.map(entry => {
        const newProp = findUniqueName(entry.key, parent)
        return {
          op: 'add',
          path: compileJSONPointer(parentPath.concat(newProp)),
          value: entry.value
        }
      }),

      // move all lower down keys so the inserted key will maintain it's position
      ...nextKeys.map(key => moveDown(parentPath, key))
    ]
  }
}

/**
 * Create a JSONPatch for an append action. The values will be appended
 * to the end of the array or object.
 *
 * This function needs the current data in order to be able to determine
 * a unique property name for the inserted node in case of duplicating
 * and object property
 *
 * @param {JSON} json
 * @param {Path} path
 * @param {Array.<{key?: string, value: JSON}>} values
 * @return {Array}
 */
export function append (json, path, values) {  // TODO: find a better name and define datastructure for values
  const parent = getIn(json, path)

  if (Array.isArray(parent)) {
    const index = parent.length
    return values.map((entry, offset) => ({
      op: 'add',
      path: compileJSONPointer(path.concat(index)),
      value: entry.value
    }))
  }
  else { // 'object'
    return values.map(entry => {
      const newProp = findUniqueName(entry.key, parent)
      return {
        op: 'add',
        path: compileJSONPointer(path.concat(newProp)),
        value: entry.value
      }
    })
  }
}

/**
 * Rename an object key
 * Not applicable to arrays
 *
 * @param {Path} parentPath
 * @param {string} oldKey
 * @param {string} newKey
 * @param {string[]} nextKeys   A list with all keys *after* the renamed key,
 *                              these keys will be moved down, so the renamed
 *                              key will maintain it's position above these keys
 * @returns {Array}
 */
export function rename(parentPath, oldKey, newKey, nextKeys) {
  return [
    // rename a key
    {
      op: 'move',
      from: compileJSONPointer(parentPath.concat(oldKey)),
      path: compileJSONPointer(parentPath.concat(newKey))
    },

    // move all lower down keys so the renamed key will maintain it's position
    ...nextKeys.map(key => moveDown(parentPath, key))
  ]
}

/**
 * Create a JSONPatch for an insert action.
 *
 * This function needs the current data in order to be able to determine
 * a unique property name for the inserted node in case of duplicating
 * and object property
 *
 * @param {JSON} json
 * @param {Path[]} paths
 * @param {Array.<{key?: string, value: JSON}>} values
 * @param {string[]} nextKeys   A list with all keys *after* the renamed key,
 *                              these keys will be moved down, so the renamed
 *                              key will maintain it's position above these keys
 * @return {Array}
 */
export function replace (json, paths, values, nextKeys) {  // TODO: find a better name and define datastructure for values
  const firstPath = first(paths)
  const parentPath = initial(firstPath)
  const parent = getIn(json, parentPath)

  if (Array.isArray(parent)) {
    const firstPath = first(paths)
    const offset = firstPath ? parseInt(last(firstPath), 10) : 0

    const removeActions = removeAll(paths)
    const insertActions = values.map((entry, index) => ({
      op: 'add',
      path: compileJSONPointer(parentPath.concat(index + offset)),
      value: entry.value
    }))

    return removeActions.concat(insertActions)
  }
  else { // parent is Object
    return [
      // remove operations
      ...removeAll(paths),

      // insert operations
      ...values.map(entry => {
        const newProp = findUniqueName(entry.key, parent)
        return {
          op: 'add',
          path: compileJSONPointer(parentPath.concat(newProp)),
          value: entry.value
        }
      }),

      // move down operations
      // move all lower down keys so the renamed key will maintain it's position
      ...nextKeys.map(key => moveDown(parentPath, key))
    ]
  }
}

/**
 * Create a JSONPatch for a remove action
 * @param {Path} path
 * @return {JSONPatchDocument}
 */
export function remove (path) {
  return [{
    op: 'remove',
    path: compileJSONPointer(path)
  }]
}

/**
 * Create a JSONPatch for a multiple remove action
 * @param {Path[]} paths
 * @return {JSONPatchDocument}
 */
export function removeAll (paths) {
  return paths
      .map(path => ({
        op: 'remove',
        path: compileJSONPointer(path)
      }))
      .reverse() // reverse is needed for arrays: delete the last index first
}

// helper function to move a key down in an object,
// so another key can get positioned before the moved down keys
function moveDown(parentPath, key) {
  return {
    op: 'move',
    from: compileJSONPointer(parentPath.concat(key)),
    path: compileJSONPointer(parentPath.concat(key))
  }
}
