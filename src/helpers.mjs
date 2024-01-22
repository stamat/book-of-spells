/**
 * Shallow merges two objects together. Used to pass simple options to functions.
 * 
 * @param {object} target The target object to merge into
 * @param {object} source The source object to merge from
 * @returns object The merged object, in this case the target object with the source object's properties merged into it
 * @example
 * const target = { foo: 'bar' }
 * const source = { bar: 'baz' }
 * shallowMerge(target, source) // { foo: 'bar', bar: 'baz' }
 */
export function shallowMerge(target, source) {
  for (const key in source) {
    target[key] = source[key]
  }

  return target
}

/**
 * Deep merge function that's mindful of arrays and objects
 * 
 * @param {object} target The target object to merge into
 * @param {object} source The source object to merge from
 * @returns object The merged object, in this case the target object with the source object's properties merged into it
 * @example
 * const target = { foo: 'bar' }
 * const source = { bar: 'baz' }
 * deepMerge(target, source) // { foo: 'bar', bar: 'baz' }
 */
export function deepMerge(target, source) {
  if (isObject(source) && isObject(target)) {
    for (const key in source) {
      target[key] = deepMerge(target[key], source[key])
    }
  } else if (isArray(source) && isArray(target)) {
    for (let i = 0; i < source.length; i++) {
      target[i] = deepMerge(target[i], source[i])
    }
  } else {
    target = source
  }
  return target
}

/**
 * Deep clone function that's mindful of nested arrays and objects
 * 
 * @param {object} o The object to clone
 * @returns object The cloned object
 * @example
 * const obj = { foo: 'bar' }
 * const clone = clone(obj)
 * clone.foo = 'baz'
 * console.log(obj.foo) // 'bar'
 * console.log(clone.foo) // 'baz'
 * console.log(obj === clone) // false
 * console.log(JSON.stringify(obj) === JSON.stringify(clone)) // true
 * @todo Check if faster than assign. This function is pretty old...
 */ 
export function clone(o) {
  let res = null
  if (isArray(o)) {
    res = []
    for (const i in o) {
      res[i] = clone(o[i])
    }
  } else if (isObject(o)) {
    res = {}
    for (const i in o) {
      res[i] = clone(o[i])
    }
  } else {
    res = o
  }
  return res
}

/**
 * Check if an object is empty
 * 
 * @param {object} o The object to check
 * @returns boolean True if the object is empty, false otherwise
 * @example
 * isEmptyObject({}) // => true
 * isEmptyObject({ foo: 'bar' }) // => false
 */
export function isEmptyObject(o) {
  for (const i in o) {
    return false
  }
  return true
}

/**
 * Check if an array is empty, substitute for Array.length === 0
 * 
 * @param {array} o The array to check
 * @returns boolean True if the array is empty, false otherwise
 * @example
 * isEmptyArray([]) // => true
 * isEmptyArray([1, 2, 3]) // => false
 */
export function isEmptyArray(o) {
  return o.length === 0
}

/**
 * Check if a variable is empty
 * 
 * @param {any} o The variable to check
 * @returns boolean True if the variable is empty, false otherwise
 * @example
 * isEmpty({}) // => true
 * isEmpty([]) // => true
 * isEmpty('') // => true
 * isEmpty(null) // => false
 * isEmpty(undefined) // => false
 * isEmpty(0) // => false
 */
export function isEmpty(o) {
  if (isObject(o)) {
    return isEmptyObject(o)
  } else if (isArray(o)) {
    return isEmptyArray(o)
  } else if (isString(o)) {
    return o === ''
  }
  return false
}

/**
 * Try to convert a string to a boolean
 * 
 * @param {string} str The string to convert
 * @returns boolean The converted boolean or undefined if conversion failed
 * @example
 * stringToBoolean('true') // => true
 * stringToBoolean('false') // => false
 * stringToBoolean('foo') // => null
 */
export function stringToBoolean(str) {
  if (/^\s*(true|false)\s*$/i.test(str)) return str === 'true'
}

/**
 * Try to convert a string to a number
 * 
 * @param {string} str The string to convert
 * @returns number The converted number or undefined if conversion failed
 * @example
 * stringToNumber('1') // => 1
 * stringToNumber('1.5') // => 1.5
 * stringToNumber('foo') // => null
 * stringToNumber('1foo') // => null
 */
export function stringToNumber(str) {
  if (/^\s*\d+\s*$/.test(str)) return parseInt(str)
  if (/^\s*[\d.]+\s*$/.test(str)) return parseFloat(str)
}

/**
 * Try to convert a string to an array
 * 
 * @param {string} str The string to convert
 * @returns array The converted array or undefined if conversion failed
 * @example
 * stringToArray('[1, 2, 3]') // => [1, 2, 3]
 * stringToArray('foo') // => null
 * stringToArray('1') // => null
 * stringToArray('{"foo": "bar"}') // => null
 */
export function stringToArray(str) {
  if (!/^\s*\[.*\]\s*$/.test(str)) return
  try {
    return JSON.parse(str)
  } catch (e) {}
}

/**
 * Try to convert a string to an object
 * 
 * @param {string} str The string to convert
 * @returns object The converted object or undefined if conversion failed
 * @example
 * stringToObject('{ "foo": "bar" }') // => { foo: 'bar' }
 * stringToObject('foo') // => null
 * stringToObject('1') // => null
 * stringToObject('[1, 2, 3]') // => null
 */
export function stringToObject(str) {
  if (!/^\s*\{.*\}\s*$/.test(str)) return
  try {
    return JSON.parse(str)
  } catch (e) {}
}

/**
 * Try to convert a string to a regex
 * 
 * @param {string} str The string to convert
 * @returns regex The converted regex or undefined if conversion failed
 * @example
 * stringToRegex('/foo/i') // => /foo/i
 * stringToRegex('foo') // => null
 * stringToRegex('1') // => null
 */
export function stringToRegex(str) {
  if (!/^\s*\/.*\/g?i?\s*$/.test(str)) return
  try {
    return new RegExp(str)
  } catch (e) {}
}

/**
 * Try to convert a string to a primitive
 * 
 * @param {string} str The string to convert
 * @returns {null|boolean|int|float|string} The converted primitive or input string if conversion failed
 * @example
 * stringToPrimitive('null') // => null
 * stringToPrimitive('true') // => true
 * stringToPrimitive('false') // => false
 * stringToPrimitive('1') // => 1
 * stringToPrimitive('1.5') // => 1.5
 * stringToPrimitive('foo') // => 'foo'
 * stringToPrimitive('1foo') // => '1foo'
 */
export function stringToPrimitive(str) {
  if (/^\s*null\s*$/.test(str)) return null
  const bool = stringToBoolean(str)
  if (bool !== undefined) return bool
  return stringToNumber(str) || str
}

/**
 * Try to convert a string to a data type
 * 
 * @param {string} str The string to convert
 * @returns any The converted data type or input string if conversion failed
 * @example
 * stringToData('null') // => null
 * stringToData('true') // => true
 * stringToData('false') // => false
 * stringToData('1') // => 1
 * stringToData('1.5') // => 1.5
 * stringToData('foo') // => 'foo'
 * stringToData('1foo') // => '1foo'
 * stringToData('[1, 2, 3]') // => [1, 2, 3]
 * stringToData('{ "foo": "bar" }') // => { foo: 'bar' }
 * stringToData('/foo/i') // => /foo/i
 */
export function stringToType(str) {
  if (/^\s*null\s*$/.test(str)) return null
  const bool = stringToBoolean(str)
  if (bool !== undefined) return bool
  return stringToNumber(str) || stringToArray(str) || stringToObject(str) || stringToRegex(str) || str
}

/**
 * If provided variable is an object
 * 
 * @param {any} o 
 * @returns boolean
 * @example
 * isObject({}) // => true
 * isObject([]) // => false
 * isObject(null) // => false
 */
export function isObject(o) {
  return typeof o === 'object' && !Array.isArray(o) && o !== null
}

/**
 * If provided variable is an array. Just a wrapper for Array.isArray
 * 
 * @param {any} o
 * @returns boolean
 * @example
 * isArray([]) // => true
 * isArray({}) // => false
 */
export function isArray(o) {
  return Array.isArray(o)
}

/**
 * If provided variable is a string. Just a wrapper for typeof === 'string'
 * 
 * @param {any} o
 * @returns boolean
 * @example
 * isString('foo') // => true
 * isString({}) // => false
 */
export function isString(o) {
  return typeof o === 'string'
}

/**
 * If provided variable is a function, substitute for typeof === 'function'
 * 
 * @param {any} o
 * @returns boolean
 * @example
 * isFunction(function() {}) // => true
 * isFunction({}) // => false
 */
export function isFunction(o) {
  return typeof o === 'function'
}

/**
 * If object property is a function
 * 
 * @param {object} obj
 * @param {string} propertyName
 * @returns boolean
 * @example
 * const obj = { foo: 'bar', baz: function() {} }
 * propertyIsFunction(obj, 'foo') // => false
 * propertyIsFunction(obj, 'baz') // => true
 */
export function propertyIsFunction(obj, propertyName) {
  return obj.hasOwnProperty(propertyName) && isFunction(obj[propertyName])
}

/**
 * If object property is a string
 * 
 * @param {object} obj
 * @param {string} propertyName
 * @returns boolean
 * @example
 * const obj = { foo: 'bar', baz: function() {} }
 * propertyIsString(obj, 'foo') // => true
 * propertyIsString(obj, 'baz') // => false
 */
export function propertyIsString(obj, propertyName) {
  return obj.hasOwnProperty(propertyName) && isString(obj[propertyName])
}

/**
 * Transforms a dash separated string to camelCase
 *
 * @param {string} str
 * @returns boolean
 * @example
 * transformDashToCamelCase('foo-bar') // => 'fooBar'
 * transformDashToCamelCase('foo-bar-baz') // => 'fooBarBaz'
 * transformDashToCamelCase('foo') // => 'foo'
 * transformDashToCamelCase('fooBarBaz-qux') // => 'fooBarBazQux'
 */
export function transformDashToCamelCase(str) {
  return str.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase() });
}

/**
 * Transforms a camelCase string to dash separated string
 * 
 * @param {string} str
 * @returns boolean
 * @example
 * transformCamelCaseToDash('fooBar') // => 'foo-bar'
 * transformCamelCaseToDash('fooBarBaz') // => 'foo-bar-baz'
 * transformCamelCaseToDash('foo') // => 'foo'
 * transformDashToCamelCase('fooBarBaz-qux') // => 'foo-bar-baz-qux'
 */
export function transformCamelCaseToDash(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * Maps an array of objects by a property name
 * 
 * @param {array} arr
 * @param {string} propertyName
 * @returns object
 * @example
 * const arr = [{ foo: 'bar' }, { foo: 'baz' }]
 * mapByProperty(arr, 'foo') // => { bar: { foo: 'bar' }, baz: { foo: 'baz' } }
 */
export function mapByProperty(arr, propertyName) {
  const res = {}
  for (let i = 0; i < arr.length; i++) {
    res[arr[i][propertyName]] = arr[i]
  }
  return res
}

/**
 * Maps an array of objects by a property name to another property name
 * 
 * @param {array} arr
 * @param {string} keyPropertyName
 * @param {string} valuePropertyName
 * @returns object
 * @example
 * const arr = [{ foo: 'bar', baz: 'qux' }, { foo: 'quux', baz: 'corge' }]
 * mapPropertyToProperty(arr, 'foo', 'baz') // => { bar: 'qux', quux: 'corge' }
 */
export function mapPropertyToProperty(arr, keyPropertyName, valuePropertyName) {
  const res = {}
  for (let i = 0; i < arr.length; i++) {
    res[arr[i][keyPropertyName]] = arr[i][valuePropertyName]
  }
  return res
}

/**
 * Remove accents from a string
 * 
 * @param {string} inputString
 * @returns string
 * @example
 * removeAccents('áéíóú') // => 'aeiou'
 * removeAccents('ÁÉÍÓÚ') // => 'AEIOU'
 * removeAccents('señor') // => 'senor'
 * removeAccents('Œ') // => 'OE'
 */
export function removeAccents(inputString) {
  return inputString.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\œ/g, "oe").replace(/\æ/g, "ae").normalize('NFC')
}

/**
 * Strip HTML tags from a string
 * 
 * @param {string} inputString
 * @returns string
 * @example
 * stripHTMLTags('<span>foo</span>') // => 'foo'
 * stripHTMLTags('<span>foo</span> <span>bar</span>') // => 'foo bar'
 */
export function stripHTMLTags(inputString) {
  return inputString.replace(/<[^>]*>/g, '')
}

/**
 * Slugify a string, e.g. 'Foo Bar' => 'foo-bar'. Similar to WordPress' sanitize_title(). Will remove accents and HTML tags.
 * 
 * @param {string} str 
 * @returns string
 * @example
 * slugify('Foo Bar') // => 'foo-bar'
 * slugify('Foo Bar <span>baz</span>') // => 'foo-bar-baz'
 */
export function slugify(str) {
  str = str.trim().toLowerCase()
  str = removeAccents(str)
  str = stripHTMLTags(str)
  return str.replace(/\s+|\.+|\/+|\\+|—+|–+/g, '-').replace(/[^\w0-9\-]+/g, '').replace(/-{2,}/g, '-').replace(/^-|-$/g, '')
}

/**
 * Check if object has multiple properties
 * 
 * @param {object} obj
 * @param {string|array} properties
 * @returns boolean
 * @example
 * const obj = { foo: 'bar', baz: 'qux' }
 * hasOwnProperties(obj, ['foo', 'baz']) // => true
 * hasOwnProperties(obj, ['foo', 'baz', 'qux']) // => false
 */
export function hasOwnProperties(obj, properties) {
  if(!isArray(properties)) properties = [properties]
  for (let i = 0; i < properties.length; i++) {
    if (!obj.hasOwnProperty(properties[i])) return false
  }
  return true
}

/**
 * Finds the closest number to the set goal in an array to a given number
 * 
 * @param {number} goal Number to search for
 * @param {array} arr Array of numbers to search in
 * @returns number
 * @example
 * closestNumber(10, [1, 2, 3, 4, 5, 6, 7, 8, 9]) // => 9
 * closestNumber(10, [1, 2, 3, 4, 5, 6, 7, 8, 9, 11]) // => 9
 * closestNumber(10, [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 9.5]) // => 9.5
 * closestNumber(10, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11) // => 10
 */
export function closestNumber(goal, arr) {
  return arr.reduce(function(prev, curr) {
    return Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev
  })
}

/**
 * Truncate a string to a given number of words
 * 
 * @param {string} str String to truncate
 * @param {number} numWords Number of words to truncate to
 * @param {string} ellipsis Ellipsis to append to the end of the string
 * @returns string
 * @example
 * truncateString('foo bar baz', 2) // => 'foo bar…'
 * truncateString('foo bar baz', 2, '...') // => 'foo bar...'
 * truncateString('foo bar. baz', 2, '...') // => 'foo bar. ...'
 */
export function truncateString(str, numWords, ellipsis = '…') {
  const words = str.trim().split(' ')
  if (words.length <= numWords) return str
  if (numWords <= 0) return ''
  if (/[.?!]$/.test(words[numWords - 1]) && ellipsis.trim() !== '') ellipsis = ` ${ellipsis}`
  return words.slice(0, numWords).join(' ') + ellipsis
}

/**
 * Generates a random integer between two values, inclusive of both
 * 
 * @param {number} min Minimum value
 * @param {number} max Maximum value
 * @returns number
 * @example
 * randomIntInclusive(1, 10) // => 1
 * randomIntInclusive(1, 10) // => 10
 * randomIntInclusive(1, 10) // => 5
 */
export function randomIntInclusive(min, max) {
  if (min > max) [min, max] = [max, min]
  if (min === max) return min
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Gets fixed number of digits after the decimal point
 * 
 * @param {number} number Number to fix
 * @param {number} digits Number of digits to fix to
 * @returns number
 * @example
 * fixed(1.234, 2) // => 1.23
 * fixed(1.235, 2) // => 1.24
 * fixed(1.234) // => 1
 * fixed(1.234, 0) // => 1
 * fixed(1.234, 5) // => 1.234
 * @note Gotta ask myself why I wrote this function in the first place... 🤔 It's just not useful in a lot of cases lol...
 */
export function fixed(number, digits) {
  if (!digits) return parseInt(number)
  return parseFloat(number.toFixed(digits))
}

/**
 * Calculates the percentage of a number in relation to another number
 * 
 * @param {number} num Number to calculate percentage of
 * @param {number} total Total number
 * @returns number
 * @example
 * percentage(1, 10) // => 10
 * percentage(5, 10) // => 50
 * percentage(10, 10) // => 100
 * percentage(0, 10) // => 0
 * percentage(10, 2) // => 500
 */
export function percentage(num, total) {
  if (!num || !total || Number.isNaN(num) || Number.isNaN(total)) return 0
  return num / total * 100
}

export function pickProperties(obj, props) {
  const res = {}
  if (!props) return res
  if (!isArray(props)) props = [props]
  for (let i = 0; i < props.length; i++) {
    if (obj.hasOwnProperty(props[i])) res[props[i]] = obj[props[i]]
  }
  return res
}

export function rejectProperties(obj, props) {
  if (!props) return obj
  if (!isArray(props)) props = [props]
  for (let i = 0; i < props.length; i++) {
    if (obj.hasOwnProperty(props[i])) delete obj[props[i]]
  }
  return obj
}

export function pickArrayElements(arr, indexes) {
  if (!isArray(arr)) return
  if (!isArray(indexes)) indexes = [indexes]
  const res = []
  for (let i = 0; i < indexes.length; i++) {
    if (arr.hasOwnProperty(indexes[i])) res.push(arr[indexes[i]])
  }
  return res
}


export function rejectArrayElements(arr, indexes) {
  if (!isArray(arr)) return
  if (!isArray(indexes)) indexes = [indexes]
  for (let i = indexes.length - 1; i >= 0; i--) {
    if (arr.hasOwnProperty(indexes[i])) arr.splice(indexes[i], 1)
  }
  return arr
}

/**
 * Pick properties from an object or elements from an array
 * 
 * @param {array} obj Object or array to pick properties or elements from
 * @param {array | string | number} props properties to remove, can be an array of strings or a single string or number
 * @returns object | array | undefined
 * @example
 * 
 * pick({ foo: 'bar', bar: 'baz', baz: 'qux' }) // => {}
 * pick({}, []) // => {}
 * pick(null, 'foo') // => undefined
 * pick({ foo: 'bar', bar: 'baz', baz: 'qux' }, undefined) // => {}
 * pick({ foo: 'bar', bar: 'baz', baz: 'qux' }, 'foo') // => { foo: 'bar'}
 * pick({ foo: 'bar', bar: 'baz', baz: 'qux' }, ['foo', 'baz']) // => { foo: 'bar', baz: 'qux' }
 * 
 * pick(['foo', 'bar', 'baz'], []) // => []
 * pick([], []) // => []
 * pick(null, 0) // => undefined
 * pick(['foo', 'bar', 'baz'], undefined) // => []
 * pick(['foo', 'bar', 'baz'], 0) // => ['foo']
 * pick(['foo', 'bar', 'baz'], [0, 2]) // => ['foo', 'baz']
 * pick(['foo', 'bar', 'baz'], [0, 2, 3]) // => ['foo', 'baz']
 */
export function pick(obj, props) {
  return isObject(obj) ? pickProperties(obj, props) : pickArrayElements(obj, props)
}

/**
 * Remove properties from an object or elements from an array
 * 
 * @param {array} obj Object or array to remove properties or elements from
 * @param {array | string | number} props properties to remove, can be an array of strings or a single string or number
 * @returns object | array | undefined
 * @example
 * 
 * reject({ foo: 'bar', bar: 'baz', baz: 'qux' }) // => {}
 * reject({}, []) // => {}
 * reject(null, 'foo') // => undefined
 * reject({ foo: 'bar', bar: 'baz', baz: 'qux' }, undefined) // => {}
 * reject({ foo: 'bar', bar: 'baz', baz: 'qux' }, 'foo') // => { bar: 'baz', baz: 'qux' }
 * reject({ foo: 'bar', bar: 'baz', baz: 'qux' }, ['foo', 'baz']) // => { bar: 'baz' }
 * 
 * reject(['foo', 'bar', 'baz'], []) // => []
 * reject([], []) // => []
 * reject(null, 0) // => undefined
 * reject(['foo', 'bar', 'baz'], undefined) // => []
 * reject(['foo', 'bar', 'baz'], 0) // => ['bar', 'baz']
 * reject(['foo', 'bar', 'baz'], [0, 2]) // => ['bar']
 * reject(['foo', 'bar', 'baz'], [0, 2, 3]) // => ['bar']
 */
export function reject(obj, props) {
  return isObject(obj) ? rejectProperties(obj, props) : rejectArrayElements(obj, props)
}
