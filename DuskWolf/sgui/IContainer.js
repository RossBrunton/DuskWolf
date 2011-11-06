//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

loadComponent("Component");

/** Components that implement this interface will be able to have other components inside them.
 * 
 * <p>Generally, the main component class has some extra functionality, calling more functions and whatnot, for this interface to allow it to properly function as a container.</p>
 * 
 * @see Group
 * @see Single
 * @see Component
 */
sgui.IContainer = function(parent, events, comName) {
	if (parent !== undefined){
		sgui.Component.call(this, parent, events, comName);
	}
};
sgui.IContainer.prototype = new sgui.Component();
sgui.IContainer.constructor = sgui.IContainer;

/** Called when a key is pressed, at the start of <code>keypress</code>.
 * 
 * <p>This should be used to send keypresses to children or something...</p>
 * 
 * @param e The KeyboardEvent.
 * @return Whether to stop the main function, this will generally cause all future handling of this event to stop.
 * @see Component#keypress
 */
sgui.IContainer.prototype.containerKeypress = function(e) {duskWolf.warn("Container has not implemented \"containerKeypress\".");};

/** This should delete the component with the name <code>com</code>.
 * @param com The name of the component to delete.
 * @return Whether the delete was successful.
 */
sgui.IContainer.prototype.deleteComponent = function(com) {duskWolf.warn("Container has not implemented \"deleteComponent\".");};

/** This should return the component with the name <code>com</code>.
 * @param com The name of the component to return.
 * @param create Whether to create a new component if the current one doesn't exist.
 * @param type The type of component to create, if necessary.
 * @return The component.
 */
sgui.IContainer.prototype.getComponent = function(com, create, type) {duskWolf.warn("Container has not implemented \"getComponent\".");};

/** This tells the container that it should try to flow to the component <code>to</code>.
 * @param to The component to flow to.
 * @return Whether the flow was sucessful.
 */
sgui.IContainer.prototype.flow = function(to) {duskWolf.warn("Container has not implemented \"flow\".");};

sgui.IContainer.prototype.isAContainer = true;
