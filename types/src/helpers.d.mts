/**
 * Shallow merges two objects together. Used to pass simple options to functions.
 * Mutates the target object. Faster than deepMerge, so use when you don't need to merge nested objects or arrays.
 *
 * @param {object} target The target object to merge into
 * @param {object} source The source object to merge from
 * @returns object The mutated target object with the source object's properties merged into it
 * @example
 * const target = { foo: 'bar' }
 * const source = { bar: 'baz' }
 * shallowMerge(target, source) // { foo: 'bar', bar: 'baz' }
 */
export declare function shallowMerge(target: object, source: object): object;
/**
 * Deep merge function that's mindful of arrays and objects. Mutates target object.
 * shallowMerge is faster than deepMerge, so use shallowMerge when you don't need to merge nested objects or arrays.
 *
 * @param {object} target The target object to merge into
 * @param {object} source The source object to merge from
 * @returns object The mutated target object with the source object's properties merged into it
 * @example
 * const target = { foo: 'bar' }
 * const source = { bar: 'baz' }
 * deepMerge(target, source) // { foo: 'bar', bar: 'baz' }
 */
export declare function deepMerge(target: object, source: object): object;
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
export declare function clone(o: object): any;
/**
 * Check if an object is empty
 *
 * @param {object} o The object to check
 * @returns boolean True if the object is empty, false otherwise
 * @example
 * isEmptyObject({}) // => true
 * isEmptyObject({ foo: 'bar' }) // => false
 */
export declare function isEmptyObject(o: object): boolean;
/**
 * Check if an array is empty, substitute for Array.length === 0
 *
 * @param {array} o The array to check
 * @returns boolean True if the array is empty, false otherwise
 * @example
 * isEmptyArray([]) // => true
 * isEmptyArray([1, 2, 3]) // => false
 */
export declare function isEmptyArray(o: array): boolean;
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
export declare function isEmpty(o: any): boolean;
/**
 * Try to convert a string to a boolean
 *
 * @param {string} str The string to convert
 * @returns boolean The converted boolean or undefined if conversion failed
 * @example
 * stringToBoolean('true') // => true
 * stringToBoolean('false') // => false
 * stringToBoolean('foo') // => undefined
 */
export declare function stringToBoolean(str: string): boolean | undefined;
/**
 * Try to convert a string to a number
 *
 * @param {string} str The string to convert
 * @returns number The converted number or undefined if conversion failed
 * @example
 * stringToNumber('1') // => 1
 * stringToNumber('1.5') // => 1.5
 * stringToNumber('foo') // => undefined
 * stringToNumber('1foo') // => undefined
 */
export declare function stringToNumber(str: string): number | undefined;
/**
 * Try to convert a string to an array
 *
 * @param {string} str The string to convert
 * @returns array The converted array or undefined if conversion failed
 * @example
 * stringToArray('[1, 2, 3]') // => [1, 2, 3]
 * stringToArray('foo') // => undefined
 * stringToArray('1') // => undefined
 * stringToArray('{"foo": "bar"}') // => undefined
 */
export declare function stringToArray(str: string): any;
/**
 * Try to convert a string to an object
 *
 * @param {string} str The string to convert
 * @returns object The converted object or undefined if conversion failed
 * @example
 * stringToObject('{ "foo": "bar" }') // => { foo: 'bar' }
 * stringToObject('foo') // => undefined
 * stringToObject('1') // => undefined
 * stringToObject('[1, 2, 3]') // => undefined
 */
export declare function stringToObject(str: string): any;
/**
 * Try to convert a string to a regex
 *
 * @param {string} str The string to convert
 * @returns regex The converted regex or undefined if conversion failed
 * @example
 * stringToRegex('/foo/i') // => /foo/i
 * stringToRegex('foo') // => undefined
 * stringToRegex('1') // => undefined
 */
export declare function stringToRegex(str: string): RegExp | undefined;
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
export declare function stringToPrimitive(str: string): null | boolean | int | float | string;
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
export declare function stringToType(str: string): any;
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
export declare function isObject(o: any): boolean;
/**
 * If provided variable is an array. Just a wrapper for Array.isArray
 *
 * @param {any} o
 * @returns boolean
 * @example
 * isArray([]) // => true
 * isArray({}) // => false
 */
export declare function isArray(o: any): o is any[];
/**
 * If provided variable is a string. Just a wrapper for typeof === 'string'
 *
 * @param {any} o
 * @returns boolean
 * @example
 * isString('foo') // => true
 * isString({}) // => false
 */
export declare function isString(o: any): o is string;
/**
 * If provided variable is a function, substitute for typeof === 'function'
 *
 * @param {any} o
 * @returns boolean
 * @example
 * isFunction(function() {}) // => true
 * isFunction({}) // => false
 */
export declare function isFunction(o: any): boolean;
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
export declare function propertyIsFunction(obj: object, propertyName: string): boolean;
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
export declare function propertyIsString(obj: object, propertyName: string): boolean;
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
export declare function transformDashToCamelCase(str: string): string;
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
export declare function transformCamelCaseToDash(str: string): string;
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
export declare function mapByProperty(arr: array, propertyName: string): {};
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
export declare function mapPropertyToProperty(arr: array, keyPropertyName: string, valuePropertyName: string): {};
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
 * removeAccents('œ') // => 'oe'
 * removeAccents('Æ') // => 'AE'
 * removeAccents('æ') // => 'ae'
 * removeAccents('ß') // => 'ss'
 * removeAccents('Crème Brûlée') // => 'Creme Brulee'
 * removeAccents('ﬀ') // => 'ff'
 * removeAccents('ﬁ') // => 'fi'
 * removeAccents('ﬂ') // => 'fl'
 */
export declare function removeAccents(inputString: string): string;
/**
 * Strip HTML tags from a string
 *
 * @param {string} inputString
 * @returns string
 * @example
 * stripHTMLTags('<span>foo</span>') // => 'foo'
 * stripHTMLTags('<span>foo</span> <span>bar</span>') // => 'foo bar'
 */
export declare function stripHTMLTags(inputString: string): string;
/**
 * Slugify a string, e.g. 'Foo Bar' => 'foo-bar'. Similar to WordPress' sanitize_title(). Will remove accents and HTML tags.
 *
 * @param {string} str
 * @returns string
 * @example
 * slugify('Foo Bar') // => 'foo-bar'
 * slugify('Foo Bar <span>baz</span>') // => 'foo-bar-baz'
 */
export declare function slugify(str: string): string;
/**
 * Humanize a slug, e.g. 'foo-bar' => 'Foo Bar'. Opposite of slugify. Replaces dashes and underscores with spaces and applies the chosen casing.
 *
 * @param {string} str
 * @param {'title'|'sentence'|'upper'|'lower'} [casing='title'] Casing to apply: 'title' capitalizes each word, 'sentence' capitalizes the first word only, 'upper' converts to upper case, 'lower' converts to lower case
 * @returns string
 * @example
 * humanize('foo-bar') // => 'Foo Bar'
 * humanize('foo_bar-baz') // => 'Foo Bar Baz'
 * humanize('foo-bar', 'sentence') // => 'Foo bar'
 * humanize('foo-bar', 'upper') // => 'FOO BAR'
 * humanize('Foo-Bar', 'lower') // => 'foo bar'
 */
export declare function humanize(str: string, casing?: 'title' | 'sentence' | 'upper' | 'lower'): string;
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
export declare function hasOwnProperties(obj: object, properties: string | array): boolean;
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
export declare function closestNumber(goal: number, arr: array): any;
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
export declare function truncateString(str: string, numWords: number, ellipsis?: string): string;
/**
 * Generates a random integer between two values, inclusive of both
 *
 * @param {number} min Minimum value
 * @param {number} max Maximum value
 * @param {boolean} safe Defaults to false, if true will use a cryptographically secure random number generator
 * @returns number
 * @example
 * randomIntInclusive(1, 10) // => 1
 * randomIntInclusive(1, 10) // => 10
 * randomIntInclusive(1, 10) // => 5
 */
export declare function randomIntInclusive(min: number, max: number, safe?: boolean): number;
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
export declare function fixed(number: number, digits: number): number;
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
export declare function percentage(num: number, total: number): number;
/**
 * Pick properties from an object, returning a new object with only the picked properties
 *
 * @param {object} obj The object to pick properties from
 * @param {array|string} props Properties to pick, can be an array of strings or a single string
 * @returns object A new object with only the picked properties
 * @example
 * pickProperties({ foo: 'bar', baz: 'qux' }, 'foo') // => { foo: 'bar' }
 * pickProperties({ foo: 'bar', baz: 'qux' }, ['foo', 'baz']) // => { foo: 'bar', baz: 'qux' }
 */
export declare function pickProperties(obj: object, props: array | string): {};
/**
 * Remove properties from an object
 *
 * @param {object} obj The object to remove properties from
 * @param {array|string} props Properties to remove, can be an array of strings or a single string
 * @param {boolean} clone Defaults to true, will clone the object before removing properties
 * @returns object The object without the removed properties
 * @example
 * rejectProperties({ foo: 'bar', baz: 'qux' }, 'foo') // => { baz: 'qux' }
 * rejectProperties({ foo: 'bar', baz: 'qux' }, ['foo', 'baz']) // => {}
 */
export declare function rejectProperties(obj: object, props: array | string, clone?: boolean): object;
/**
 * Pick elements from an array by index, returning a new array of the picked elements
 *
 * @param {array} arr The array to pick elements from
 * @param {array|number} indexes Indexes to pick, can be an array of numbers or a single number
 * @returns array | undefined A new array of the picked elements, or undefined if arr is not an array
 * @example
 * pickArrayElements(['foo', 'bar', 'baz'], 0) // => ['foo']
 * pickArrayElements(['foo', 'bar', 'baz'], [0, 2]) // => ['foo', 'baz']
 */
export declare function pickArrayElements(arr: array, indexes: array | number): any[] | undefined;
/**
 * Remove elements from an array by index. Indexes may be passed in any order and are deduplicated.
 *
 * @param {array} arr The array to remove elements from
 * @param {array|number} indexes Indexes to remove, can be an array of numbers or a single number
 * @param {boolean} clone Defaults to true, will clone the array before removing elements
 * @returns array | undefined The array without the removed elements, or undefined if arr is not an array
 * @example
 * rejectArrayElements(['foo', 'bar', 'baz'], 0) // => ['bar', 'baz']
 * rejectArrayElements(['foo', 'bar', 'baz'], [2, 0]) // => ['bar']
 */
export declare function rejectArrayElements(arr: array, indexes: array | number, clone?: boolean): any;
/**
 * Pick properties from an object or elements from an array
 *
 * @param {array} obj Object or array to pick properties or elements from
 * @param {array | string | number} props Properties to remove, can be an array of strings or a single string or number
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
export declare function pick(obj: array, props: array | string | number): {} | undefined;
/**
 * Remove properties from an object or elements from an array
 *
 * @param {array} obj Object or array to remove properties or elements from
 * @param {array | string | number} props Properties to remove, can be an array of strings or a single string or number
 * @param {boolean} clone Defaults to true, will clone the object or array before removing properties or elements.
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
export declare function reject(obj: array, props: array | string | number, clone?: boolean): any;
/**
 * Basic timestamp first UID generator that's good enough for most use cases but not for security purposes.
 * There's an extremely small chance of collision, so create a map object to check for collisions if you're worried about that.
 *
 * - `Date.now().toString(16)` is used for the timestamp, which is a base16 representation of the current timestamp in milliseconds.
 * - `random().toString(16).substring(2)` is used for the random number, which is a base16 representation of a random number between 0 and 1, with the first two characters removed.
 *
 * @param {boolean} safe Defaults to false, if true will use a cryptographically secure random number generator for the random number improving security but reducing performance. If crypto is not available, will use Math.random() instead.
 * @returns string
 * @example
 * basicUID() // => '18d4613e4d2-750bf066ac6158'
 */
export declare function basicUID(safe?: boolean): string;
/**
 * Generates a UUID v4
 * - Uses crypto.randomUUID if available
 * - Uses crypto.getRandomValues if available
 * - Uses a fallback if neither is available, which is not safe because it uses Math.random() instead of a cryptographically secure random number generator
 *
 * I'm bad at crypto and bitwise operations, not my cup of tea, so I had to rely on StackOverflow for the fallback: https://stackoverflow.com/a/2117523/5437943
 *
 * @param {boolean} safe Defaults to true, if false will use a fallback that's not cryptographically secure but significantly faster
 * @returns string
 * @example
 * generateUUID() // UUID v4, example 09ed0fe4-8eb6-4c2a-a8d3-a862b7513294
 */
export declare function generateUUID(safe?: boolean): string;
/**
 * Generates a random number between 0 and 1, inclusive of 0 but not inclusive of 1.
 *
 * - Uses crypto.getRandomValues if available
 * - Uses Math.random() if crypto.getRandomValues is not available
 *
 * @returns number
 * @example
 * random() // => 0.123456789
 */
export declare function random(): number;
/**
 * Access nested object properties using a path
 *
 * @param {object} obj The object to access
 * @param {array|string} path The path to access
 * @returns {*} The value of the accessed property
 *
 * @example
 * const obj = { foo: { bar: 'baz' } }
 * getObjectValueByPath(obj, 'foo.bar') // => 'baz'
 */
export declare function getObjectValueByPath(obj: object, path: array | string): any;
