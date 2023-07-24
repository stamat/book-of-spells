/** @module WindowResizeHandler */

/**
 * Parse a media query string into a query array. Query arrays contain query entry objects {@link QueryEntryObject} and strings for the operators 'and' and 'or'.
 * 
 * @private
 * @param mediaQuery - A media query string. Example: "(min-width: 768px) and (max-width: 1024px)"
 * @returns Array<string | QueryEntryObject>
 * @example
 * const query = this._parseMediaQueryString('(min-width: 768px) and (max-width: 1024px)')
 * console.log(query) // [{ value: 768, feature: 'width', direction: 'min' }, 'and', { value: 1024, feature: 'width', direction: 'max' }]
 */
function parseMediaQueryString(mediaQuery) {
  const trimmedQuery = mediaQuery.trim().replace(/\(|\)/g, '')
  const clauses = trimmedQuery.split(/(\s+and\s+|\s+or\s+)/i)
  const query = []

  clauses.forEach((clause) => {
    clause = clause.trim().toLowerCase()

    if (!/:/.test(clause)) {
      query.push(clause)
      return
    }

    const [rawFeature, rawValue] = clause.split(/\s*:\s*/)
    const fullFeature = rawFeature.trim().toLowerCase()
    const feature = /height$/.test(fullFeature) ? 'height' : 'width'
    const direction = /^max/.test(fullFeature) ? 'max' : 'min'
    const value = parseInt(rawValue.trim())

    query.push({
      value: value,
      feature: feature,
      direction: direction,
    })
  })
  return query
}

/**
 * Perform a single query entry condition check. You can use this to check if the window width or height is within a certain range by providing a query entry object {@link QueryEntryObject}
 * Meaning, you can check if the window width is greater than or equal to 768px, or if the window height is less than or equal to 1024px.
 * 
 * @private
 * @param queryEntry - A single query entry object
 * @returns boolean
 * @example
 * const queryEntry = {
 *  value: 768,
 *  feature: 'width',
 *  direction: 'min'
 * }
 *
 * const result = validateMediaQueryEntry(queryEntry)
 * console.log(result) // true if window width is greater than or equal to 768px
 */
function validateMediaQueryEntry(queryEntry) {
  const { value, feature, direction } = queryEntry
  const windowValue = feature === 'width' ? window.innerWidth : window.innerHeight
  return direction === 'min' ?  value <= windowValue : value >= windowValue
}

/**
 * Perform a query. You can use this to check if the window width or height is within a certain range by providing a query array.
 * Query arrays are parsed from media query strings using {@link _parseMediaQueryString} and contain query entry objects {@link QueryEntryObject} and strings for the operators 'and' and 'or'.
 * 
 * @private
 * @param query - A query array
 * @returns boolean
 * @example
 * const query = [{
 *  value: 768,
 *  feature: 'width',
 *  direction: 'min'
 * },
 * 'or',
 * {
 *  value: 1024,
 *  feature: 'width',
 *  direction: 'max'
 * }]
 * 
 * const result = validateMediaQuery(query)
 * console.log(result) // true if window width is greater than or equal to 768px or less than or equal to 1024px
 */
function validateMediaQuery(query) {
  let result = true
  let operator = 'and'

  for (let i = 0; i < query.length; i++) {
    const entry = query[i]
    if (typeof entry === 'string') {
      operator = entry
      continue
    }

    const entryResult = validateMediaQueryEntry(entry)

    if (operator === 'and') {
      result = result && entryResult
    } else {
      result = result || entryResult
    }
  }

  return result
}

/**
 * Check if the window width or height is within a certain range by providing a media query string.
 * 
 * @param mediaQuery - A media query string or already parsed query array. Example: "(min-width: 768px) and (max-width: 1024px)"
 * @returns boolean
 * @example
 * const result = inRange('(min-width: 768px) and (max-width: 1024px)')
 * console.log(result) // true if window width is greater than or equal to 768px and less than or equal to 1024px
 */
function inRange(mediaQuery) {
  if (typeof mediaQuery === 'string') mediaQuery = parseMediaQueryString(mediaQuery)
  return validateMediaQuery(mediaQuery)
}

/**
 * A class for handling window resize events. 
 * Provides a way to add callbacks to be triggered when the window is resized to match a media query.
 * 
 * @example
 * const resizeHandler = new WindowResizeHandler()
 * resizeHandler.add('(min-width: 768px) and (max-width: 1024px)', () => {
 *  console.log('Between 768px and 1024px')
 * })
 */
class WindowResizeHandler {
  constructor(opts) {
    opts = opts || {}
    this._resizeCallbacks = {}
    this._resizeTimeout = 0
    this._resizeTimeoutDuration = opts.timeoutDuration || 100
    this._oldWidth = window.innerWidth
    this._oldHeight = window.innerHeight
    this._observeWidth = opts.observeHeight || true
    this._observeHeight = opts.observeHeight || true

    /**
     * Trigger a callback for a given media query string. Callbacks are bucketed by media query string.
     * Callbacks are triggered when the window is resized to match the media query or when the window is resized out of the media query range.
     * The callback is passed a boolean value that indicates if the window is currently within the media query range or not, so you can use the callback to trigger something when the window is resized out of the media query range.
     * 
     * @private
     * @param {string} query - A media query string. Example: "(min-width: 768px) and (max-width: 1024px)"
     * @returns void
     */
    this._triggerCallback = (query) => {
      for (const rc of this._resizeCallbacks[query]) {
        const { mediaArray, callback } = rc
        const inRange = validateMediaQuery(mediaArray)


        //TODO: This has no logic for when the once is not used, we should start from two cases - inRange and not inRange callbacks. This needs to be rethought...
        // not in range
        if (rc.once && (rc.performed === undefined || rc.performed) && !inRange) {
          rc.performed = false
          callback(false)
        }
        
        // already performed, skip
        if (rc.once && rc.performed) continue

        // in range
        if (inRange) {
          callback(true)
          rc.performed = true
        }
      }
    }

    this._propertyChangeHandler = () => {
      let run = false

      if (this._observeWidth && this._oldWidth !== window.innerWidth) {
        this._oldWidth = window.innerWidth
        run = true
      }

      if (this._observeHeight && this._oldHeight !== window.innerHeight) {
        this._oldHeight = window.innerHeight
        run = true
      }

      if (run) this.run()
    }

    this._resizeHandler = () => {
      if (this._resizeTimeout) {
        clearTimeout(this._resizeTimeout);
      }

      this._resizeTimeout = setTimeout(() => {
        this._resizeTimeout = 0;
        this._propertyChangeHandler()
      }, this._resizeTimeoutDuration);
    }
    window.addEventListener("resize", this._resizeHandler);
  }

  /**
   * Add a callback to be triggered when the window is resized to match the media query. Callbacks are bucketed by media query string.
   * Callbacks are triggered when the window is resized to match the media query or when the window is resized out of the media query range.
   * The callback is passed a boolean value that indicates if the window is currently within the media query range or not, so you can use the callback to trigger something when the window is resized out of the media query range.
   * 
   * @param query - A media query string. Example: "(min-width: 768px) and (max-width: 1024px)" 
   * @param callback
   * @param {boolean} [once=true] - If true, the callback will only be triggered once when the media query is matched. Defaults to true.
   * @returns void
   */
  add(query, callback, once = true) {
    let mediaArray = []

    if (!this._resizeCallbacks.hasOwnProperty(query)) {
      this._resizeCallbacks[query] = []
      mediaArray = parseMediaQueryString(query)
    }

    if (this._resizeCallbacks[query].length) {
      mediaArray = this._resizeCallbacks[query][0].mediaArray
    } else {
      mediaArray = parseMediaQueryString(query)
    }

    this._resizeCallbacks[query].push({
      query: query,
      mediaArray: mediaArray,
      callback: callback,
      once: once,
    })
  }

  /**
   * Trigger a callback manually. All callbacks for the given media query will be triggered.
   * 
   * @param {string} query - A media query string. Example: "(min-width: 768px) and (max-width: 1024px)"
   * @returns void
   */
  trigger(query) {
    if (!this._resizeCallbacks.hasOwnProperty(query)) return

    for (const rc of this._resizeCallbacks[query]) {
      const { callback } = rc
      callback(true)
    }
  }

  /**
   * Remove a callback from the resize handler. You have to provide the same callback function reference that was used when adding the callback.
   * 
   * @param {string} query - A media query string. Example: "(min-width: 768px) and (max-width: 1024px)"
   * @param {function} [callback] - The callback to remove from the resize handler for the given media query
   * @returns void
   */
  remove(query, callback) {
    if (!this._resizeCallbacks.hasOwnProperty(query)) return
    if (!callback) {
      delete this._resizeCallbacks[query]
      return
    }

    for (let i = 0; i < this._resizeCallbacks[query].length; i++) {
      const rc = this._resizeCallbacks[query][i]
      if (rc.callback === callback) {
        this._resizeCallbacks[query].splice(i, 1)
      }
    }
  }

  /**
   * Run all callbacks that match the current window size parameters. This is useful if you want to trigger all callbacks when the page loads.
   *  
   * @returns void
   */
  run() {
    for (const key in this._resizeCallbacks) {
      this._triggerCallback(key)
    }
  }

  /**
   * Destroy the resize handler
   * 
   * @returns void
   */
  destroy() {
    window.removeEventListener("resize", this._resizeHandler);
  }

  /**
   * Rebind the resize handler. This is useful if you want to rebind the resize handler after destroying it.
   * 
   * @returns void
   */
  bind() {
    window.addEventListener("resize", this._resizeHandler);
  }
}

export default WindowResizeHandler
export { WindowResizeHandler, inRange, parseMediaQueryString, validateMediaQueryEntry, validateMediaQuery }
