/**
 * @module animations
 * @description
 * A collection of functions animating element transitions.
 * Substitutes for jQuery's "animation" functions slideUp(), slideDown(), slideToggle(), fadeIn(), fadeOut() functions.
 * Leans onto CSS transitions, reading the height transition duration and setting a timer based on that to clear the height property on animation end.
 * There is a unique reason for this, for instance animating height is ony possible through max-height, and if the max-height, which can produce inconsistent
 * animation duration depending on the element's actual height. Or, animating display none to display block, this can be done via opacity and pointer-events:none
 * this means the element will have to overlay the screen but be inaccessible. This module provides "javascript wrappers" that substitute the shortcomings of
 * the CSS transitions regarding these two cases.
 */
/**
 * Slides an element's height to or from its content height, without touching `display`.
 *
 * The counterpart to slideUp()/slideDown() for elements whose visibility something else
 * already owns - a `<details>` panel, a popover, a dialog. Those hide their own contents,
 * so a slide that also sets `display` fights them: on `<details>` in particular a leftover
 * inline `display: none` survives the close and then hides the panel body even after the
 * browser reopens it for find-in-page.
 *
 * The starting height is yours to pass, which is what makes an interrupted slide
 * recoverable: hand it the element's current height and it picks up from where the last
 * one stopped instead of jumping. Reduced motion, or no height transition in the CSS,
 * finishes immediately and still calls back.
 *
 * The caller is responsible for the element being rendered before the call - an
 * unrendered box has no height to measure and the slide has nothing to animate.
 *
 * @param {HTMLElement} element
 * @param {number} from The height in pixels to start from, usually 0 or the current height
 * @param {boolean} open True to slide to the content height, false to slide to 0
 * @param {Function} [callback] Called when the slide ends, with the element
 * @example
 * // open, from collapsed
 * details.open = true
 * slide(content, 0, true)
 *
 * // close, and only actually close once the slide is done
 * slide(content, content.offsetHeight, false, () => { details.open = false })
 */
export declare function slide(element: HTMLElement, from: number, open: boolean, callback?: Function): void;
/**
 * Slides up an element. The element must have a CSS transition set for the height property.
 * The transition duration is used to determine how long the slide up animation will take.
 * Substitutes for jQuery's slideUp() function.
 *
 * @param {HTMLElement} element
 * @param {Function} [callback]
 * @param {Function} [transitionStartCallback] callback function to be called when the transition starts
 * @example
 * slideUp(element)
 */
export declare function slideUp(element: HTMLElement, callback?: Function, transitionStartCallback?: Function): void;
/**
 * Slides down an element. The element must have a CSS transition set for the height property.
 * The transition duration is used to determine how long the slide down animation will take.
 * Substitutes for jQuery's slideDown() function.
 *
 * @param {HTMLElement} element
 * @param {Function} [callback] callback function to be called when the transition ends
 * @param {Function} [transitionStartCallback] callback function to be called when the transition starts
 * @example
 * slideDown(element)
 */
export declare function slideDown(element: HTMLElement, callback?: Function, transitionStartCallback?: Function): void;
/**
 * Toggles the slide state of an element. The element must have a CSS transition set for the height property.
 * The transition duration is used to determine how long the slide animation will take.
 * Substitutes for jQuery's slideToggle() function.
 *
 * @param {HTMLElement} element
 * @param {Function} [callback] callback function to be called when the transition ends
 * @param {Function} [transitionStartCallback] callback function to be called when the transition starts
 * @example
 * slideToggle(element)
 */
export declare function slideToggle(element: HTMLElement, callback?: Function, transitionStartCallback?: Function): void;
/**
 * Fades in an element. The element must have a CSS transition set for the opacity property, and initial opacity to 0.
 * The transition duration is used to determine how long the fade in animation will take.
 * Substitutes for jQuery's fadeIn() function.
 *
 * @param {HTMLElement} element
 * @param {Function} [callback] callback function to be called when the transition ends
 * @param {Function} [transitionStartCallback] callback function to be called when the transition starts
 * @example
 * fadeIn(element)
 */
export declare function fadeIn(element: HTMLElement, callback?: Function, transitionStartCallback?: Function): void;
/**
 * Fades out an element. The element must have a CSS transition set for the opacity property.
 * The transition duration is used to determine how long the fade out animation will take.
 * Substitutes for jQuery's fadeOut() function.
 *
 * @param {HTMLElement} element
 * @param {Function} [callback] callback function to be called when the transition ends
 * @param {Function} [transitionStartCallback] callback function to be called when the transition starts
 * @example
 * fadeOut(element)
 */
export declare function fadeOut(element: HTMLElement, callback?: Function, transitionStartCallback?: Function): void;
/**
 * Toggles the fade state of an element. The element must have a CSS transition set for the opacity property.
 * The transition duration is used to determine how long the fade animation will take.
 * Substitutes for jQuery's fadeToggle() function.
 *
 * @param {HTMLElement} element
 * @param {Function} [callback] callback function to be called when the transition ends
 * @param {Function} [transitionStartCallback] callback function to be called when the transition starts
 * @example
 * fadeToggle(element)
 */
export declare function fadeToggle(element: HTMLElement, callback?: Function, transitionStartCallback?: Function): void;
