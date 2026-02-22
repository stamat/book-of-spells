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
export function slideUp(element: HTMLElement, callback?: Function, transitionStartCallback?: Function): void;
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
export function slideDown(element: HTMLElement, callback?: Function, transitionStartCallback?: Function): void;
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
export function slideToggle(element: HTMLElement, callback?: Function, transitionStartCallback?: Function): void;
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
export function fadeIn(element: HTMLElement, callback?: Function, transitionStartCallback?: Function): void;
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
export function fadeOut(element: HTMLElement, callback?: Function, transitionStartCallback?: Function): void;
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
export function fadeToggle(element: HTMLElement, callback?: Function, transitionStartCallback?: Function): void;
