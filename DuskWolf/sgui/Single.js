//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** A single is a container that holds a single component, hence the name.
 * 
 * <p>It is designed to generally add extra features and such to a single component.</p>
 * 
 * <p>By defualt, and if another is deleted, it contains a NullCom.</p>
 * 
 * <p>It is also somewhat "transparent", any attempt for the component inside to flow out will be passed to this single's container.</p>
 * 
 * <p><b>This component has the following properties:</b></p>
 * 
 * <p><code>&lt;(type) name='(name)'&gt;(properties)&lt;/(type)&gt;</code> --
 * Sets the properties of the component if it is named <code>name</code>, creating one if it doesn't exist. The type of the component, <code>type</code>, should be in <code>cfg/components.as</code>. Generally, most of them are, and the ones that aren't you can't add to containers.</p>
 * 
 * @see Group
 */
sgui.Single = function(parent, events, comName) {
	if (parent !== undefined){
		sgui.Component.call(this, parent, events, comName);
		
		this._component = {};
		
		/** This creates a new group and adds the "blank" component. See <code>Component</code> for parameter details.
		 * @see Component
		 */
		this.newComponent("blank", "NullCom");
			
		//Add the groupStuff handler
		this._registerStuff(this._singleStuff);
		this._registerDrawHandler(this._singleDraw);
	}
};
sgui.Single.prototype = new sgui.IContainer();
sgui.Single.constructor = sgui.Group;

sgui.Single.prototype.className = "Single";

/** The currently active component handles the keypress. 
 * @param e The keyboard event.
 * @return The result of the focused component's keypress.
 */
sgui.Single.prototype.containerKeypress = function(e) {
	return this._component.keypress(e);
};

/** This creates a new component in this group. Interesting that, isn't it?
 * 
 * <p>If you need to check the names of the component you are after, <code>Component.NAME</code> will tell you. If the type you provide isn't a real component, then a <code>NullCom</code> will be used.</p>
 * 
 * @param com The name of the component.
 * @param type The type of the component, should be the name of one of the components in <code>SimpleGui.COMS</code>. If not specified a NullCom is made.
 * @return The component that was added.
 */
sgui.Single.prototype.newComponent = function(com, type) { //Component
	//Find the type
	if (!type){duskWolf.error("Cannot create a new component of type null!");return;}
	loadComponent(type);
	
	this._component = new sgui[type](this, this._events, com.toLowerCase());
	
	return this._component;
};

sgui.Single.prototype._singleStuff = function(data) {
	//Component properties
	if (data.child) {
		if (data.child.name && this.getComponent(data.child.name.toLowerCase(), data.child.type)) {
			this.getComponent(data.child.name.toLowerCase()).doStuff(this._events.replaceVar(data.child), this._thread);
		} else {
			duskWolf.warn(data.child.name + " has not been given a type and does not exist, ignoring.");
		}
	}
};

sgui.Single.prototype._singleDraw = function(c) {
	//Draw children
	this._component.draw(c);
};

/** Gets a component in this group. It will create a new component if <code>create</code> is true.
 * 
 * <p>The type of the component is not needed if you are 100% sure the component exists.</p>
 * 
 * @param com The name of the component to get.
 * @param create Whether to create a new component if it is not found.
 * @param type The type of component to create, see <code>newComponent</code> for details.
 * @return The component, or <code>null</code> if it wasn't found and you don't want to create it.
 */
sgui.Single.prototype.getComponent = function(com, type) { //Component
	if (this._component.comName.toLowerCase() == com.toLowerCase() || com == "*" || com === "") {
		return this._component;
	};
	
	return type?this.newComponent(com, type):null;
};

/** Deletes a component from this group. That's it.
 * @param com The name of the component to delete.
 * @return <code>true</code> when a component was deleted, <code>false</code> if it didn't exist.
 */
sgui.Single.prototype.deleteComponent = function(com) { //Boolean
	if (this._component.comName == com.toLowerCase() || com == "*" || !com){
		this.newComponent("blank", "NullCom");
		return true;
	}
};

/** Checks to see if it's possible to flow to the specified component, and if so, then does it.
 * @param to The component to flow to.
 * @return Whether the component could be flowed into.
 */
sgui.Single.prototype.flow = function(to) { //Bool
	return this._container.flow(to);
};

/** Groups will call their currently focused components <code>onDeactive</code> function. */
sgui.Single.prototype.onDeactive = function() {this._component.onDeactive();};
/** Groups will call their currently focused components <code>onActive</code> function. */
sgui.Single.prototype.onActive = function() {this._component.onActive();};
