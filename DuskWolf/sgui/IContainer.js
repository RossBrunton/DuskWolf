//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Component");

dusk.load.provide("dusk.sgui.IContainer");

/** @class dusk.sgui.IContainer
 * 
 * @classdesc A container.
 *
 * An interface; it is expected all subclasses of this supply the methods on this class.
 * 
 * By implementing this interface, it means that the component can contain other components inside it.
 * 
 * It is expected that components be stored and referenced to a name.
 *	A Container may use a name that contains at least one non-alphanumeric character for special purposes.
 * 
 * Any means of creating a component must call `{@link dusk.sgui.applyStyle}` on the component.
 * 
 * List of methods required:
 * 
 * - {@link dusk.sgui.IContainer.containerKeypress}
 * - {@link dusk.sgui.IContainer.deleteComponent}
 * - {@link dusk.sgui.IContainer.flow}
 * - {@link dusk.sgui.IContainer.getComponent}
 * - {@link dusk.sgui.IContainer.alterChildLayer}
 * 
 * This class cannot be used on its own as a component.
 * 
 * @param {dusk.sgui.IContainer} parent The container that this component is in.
 * @param {string} comName The name of the component.
 * @extends dusk.sgui.Component
 * @see {@link dusk.sgui.Group}
 * @see {@link dusk.sgui.Single}
 * @constructor
 */
dusk.sgui.IContainer = function(parent, comName) {
	dusk.sgui.Component.call(this, parent, comName);
};
dusk.sgui.IContainer.prototype = new dusk.sgui.Component();
dusk.sgui.IContainer.constructor = dusk.sgui.IContainer;

dusk.sgui.IContainer.prototype.className = "IContainer";

/** Container specific method of handling keypresses.
 * 
 * This is different from the normal keypress handler, in that it is ran before the listener is fired.
 * 	If it returns true, then proccessing the keypress stops, hence the event doesn't "bubble".
 * 
 * It is expected that a Container use this method to call one or more of it's children, and if any of those return values are true, then this must return true.
 * 
 * @param {object} e The keypress event, must be a JQuery keypress event object.
 * @return {boolean} The return value of the focused component's keypress.
 */
dusk.sgui.IContainer.prototype.containerKeypress = function(e) {
	console.warn("Container "+this.className+" has not implemented \"containerKeypress\".");
	return false;
};

/** Deletes a component from this container if possible.
 * 	It is not expected that this method remove all refrences outside itself, but it must fire the component's `{@link dusk.sgui.Component.onDelete}` event dispatcher.
 * 
 * @param {string} com The name of the component to delete.
 * @return {boolean} If the delete was successfull, this will return false if the component doesn't exist.
 */
dusk.sgui.IContainer.prototype.deleteComponent = function(com) {
	console.warn("Container "+this.className+" has not implemented \"deleteComponent\".");
};

/** Return the component with that name in this container, and potentially create it.
 * 
 * If `type` is defined, then it is suggested that if the component doesn't exist, then it should be created as the specified type.
 * 
 * @param {string} com The name of the component to get.
 * @param {?string} type The type of component to create if possible.
 * @return {?dusk.sgui.Component} The component, or null if it doesn't exist and wasn't created.
 */
dusk.sgui.IContainer.prototype.getComponent = function(com, type) {
	console.warn("Container "+this.className+" has not implemented \"getComponent\".");
	return null;
};

/** Modifies a component in this container using JSON data.
 *	
 * A component is expected to check what component to send the data to (Possibly using the `name` property), and call `{@link dusk.sgui.Component.parseProps}` on the data.
 * 
 * An array may also be specified, in which case it should behave as if multiple called had been made; one for each element.
 * @param {object|array} data Information about components, as described above.
 */
dusk.sgui.IContainer.prototype.modifyComponent = function(data) {
	console.warn("Container "+this.className+" has not implemented \"modifyComponent\".");
};

/** If it makes sense, this should change focus to the specified component under the following conditions:
 * 
 * - The target component exists.
 * - The current component's `{@link dusk.sgui.Component.lock}` value is false.
 * - The target component's `{@link dusk.sgui.Component.enabled}` value is true.
 * 
 * It must also fire `{@link dusk.sgui.Component.onFocusChange}` and `{@link dusk.sgui.Component.onActiveChange}` as appropriate.
 * 
 * @param {string} to The name of the component to flow into.
 * @return {boolean} Whether the flow was successfull.
 */
dusk.sgui.IContainer.prototype.flow = function(to) {
	console.warn("Container "+this.className+" has not implemented \"flow\".");
	return false;
};

/** Alters the layer that the specified component is on.
 * 
 * It is assumed that components on a higher layer will be drawn first.
 * 
 * The alter must be an expression that says how to alter the layer, and be in one of the following forms.
 * 
 * - `"+"` Raises the component to the top, making it on top of all other components.
 * - `"-"` Lowers the component below all the others, meaning that it will appear below them.
 * - `"+com"` Raises it just above the component named "com" (which must exist).
 * - `"-com"` Lowers it just below the compoment named "com" (which must exist).
 * 
 * If changing layers is not possible for the container, this should exit silently.
 * 
 * @param {string} com The name of the component to alter the layer of.
 * @param {string} alter The alteration to make to the component's layer, as described above.
 * @since 0.0.17-alpha
 */
dusk.sgui.IContainer.prototype.alterChildLayer = function(com, alter) {
	console.warn("Container "+this.className+" has not implemented \"alterChildLayer\".");
};

Object.seal(dusk.sgui.IContainer);
Object.seal(dusk.sgui.IContainer.prototype);