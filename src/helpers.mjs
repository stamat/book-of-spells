/**
 * Shallow merges two objects together. Used to pass simple options to functions.
 * 
 * @param {object} target The target object to merge into
 * @param {object} source The source object to merge from
 * @returns object The merged object
 * @example
 * const target = { foo: 'bar' }
 * const source = { bar: 'baz' }
 * shallowMerge(target, source) // { foo: 'bar', bar: 'baz' }
 */
export function shallowMerge(target, source) {
  for (const key in source) {
    target[key] = source[key]
  }
}

/**
 * Deep merge function that's mindful of arrays and objects
 * 
 * @param {object} target The target object to merge into
 * @param {object} source The source object to merge from
 * @returns object The merged object
 * @example
 * const target = { foo: 'bar' }
 * const source = { bar: 'baz' }
 * deepMerge(target, source) // { foo: 'bar', bar: 'baz' }
 */
export function deepMerge(target, source) {
  for (const key in source) {
    if (source[key] instanceof Object) {
      Object.assign(source[key], deepMerge(target[key], source[key]))
    }
  }

  Object.assign(target || {}, source)
  return target
}

function _cloneObject(o) {
  let res = {}
  for (const i in o) {
    res[i] = clone(o[i])
  }
  return res
}

export function _cloneArray(a) {
  let res = []
  for(var i = 0; i < a.length; i++) {
    res[i] = clone(a[i])
  }
  return res
}

/**
 * Deep clone function that's mindful of arrays and objects
 * 
 * @param {object} o The object to clone
 * @returns object The cloned object
 * @example
 * const obj = { foo: 'bar' }
 * const clone = clone(obj)
 * clone.foo = 'baz'
 * console.log(obj.foo) // 'bar'
 * console.log(clone.foo) // 'baz'
 * @todo Check if faster than assign. This function is pretty old...
 */ 
export function clone(o) {
  let res = null
  if(Array.isArray(o)) {
    res = _cloneArray(o)
  } else if(typeof o === 'object' && o !== null) {
    res = _cloneObject(o)
  } else {
    res = o;
  }
  return res;
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
  return o && typeof o === 'object' && !Array.isArray(o) && o !== null
}

/**
 * If provided variable is a function
 * 
 * @param {any} o
 * @returns boolean
 * @example
 * isFunction(function() {}) // => true
 * isFunction({}) // => false
 */
export function isFunction(o) {
  return o && typeof o === 'function'
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
  return o.hasOwnProperty(propertyName) && isFunction(obj[propertyName])
}

/**
 * Transforms a dash-case string to camelCase
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
