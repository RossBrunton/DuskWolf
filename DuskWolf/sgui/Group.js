//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

loadComponent("IContainer");

sgui.Group = function(parent, events, comName) {
	//Implements _container
	if (parent !== undefined){
		sgui.Component.call(this, parent, events, comName);
		
		this._components = {};
		this._drawOrder = [];
		this._focusedCom = "";
		
		/** Whether this is the active component that will receive all keypresses. */
		this._active = false;
		/** Whether this is the focused component in its group. */
		this._focused = false;
		
		//Add the groupStuff handler
		this._registerProp("focus", function(name, value){if(this._focusedCom != value) return this.focus(value)}, function(name, value){return this._focusedCom;});
		this._registerProp("children", this._children, function(name, value){return this._components;});
		this._registerProp("allChildren", this._allChildren, function(name, value){return this._components;});
		
		this._registerDrawHandler(this._groupDraw);
		this._registerFrameHandler(this._groupFrame);
		
		this._newComponent("blank", "NullCom");
		this.prop("focus", "blank");
	}
};
sgui.Group.prototype = new sgui.IContainer();
sgui.Group.constructor = sgui.Group;

sgui.Group.prototype.className = "Group";

/** The currently active component handles the keypress. 
 * @param e The keyboard event.
 * @return The result of the focused component's keypress.
 */
sgui.Group.prototype.containerKeypress = function(e) {
	return this.getFocus().keypress(e);
};

/** This creates a new component in this group. Interesting that, isn't it?
 * 
 * <p>If you need to check the names of the component you are after, <code>Component.NAME</code> will tell you. If the type you provide isn't a real component, then a <code>NullCom</code> will be used.</p>
 * 
 * @param com The name of the component.
 * @param type The type of the component, should be the name of one of the components in <code>SimpleGui.COMS</code>. If not specified a NullCom is made.
 * @return The component that was added.
 */
sgui.Group.prototype._newComponent = function(com, type) { //Component
	//Find the type
	if (!type) {duskWolf.error("Cannot create a new component of type null!");return;}
	if (!(type in sgui)) {duskWolf.error(type + " is not a valid component type.");type = "NullCom";}
	loadComponent(type);
	
	this._components[com] = new sgui[type](this, this._events, com.toLowerCase());
	this._drawOrder[this._drawOrder.length] = com;
	this.bookRedraw();
	
	return this._components[com];
};

sgui.Group.prototype._children = function(name, value) {
	if("length" in value) {
		for (var i = 0; i < value.length; i++) {
			if (value[i].name && this.getComponent(value[i].name.toLowerCase(), value[i].type)) {
				this.getComponent(value[i].name.toLowerCase()).parseProps(value[i], this._thread);
			} else if(value[i].name) {
				duskWolf.warn(value.name + " has not been given a type and does not exist, ignoring.");
			} else {
				duskWolf.warn("A component has no name in "+this.comName+".");
			}
		}
	}else{
		if(value.name && this._getComponent(value.name.toLowerCase(), value.type)) {
			return this._getComponent(value.name.toLowerCase()).parseProps(value, this._thread);
		} else if(value.name) {
			duskWolf.warn(value.name + " has not been given a type and does not exist, ignoring.");
		} else {
			duskWolf.warn("A component has no name in "+this.comName+".");
		}
	}
};

sgui.Group.prototype._allChildren = function(name, value) {
	for (var c in this._components) {
		this._components[c].parseProps(value, this._thread);
	}
};

sgui.Group.prototype._groupDraw = function(c) {
	//Draw children
	for(var i = 0; i < this._drawOrder.length; i++) {
		if(this._drawOrder[i] in this._components) {
			this._components[this._drawOrder[i]].draw(c);
		}
	}
};

sgui.Group.prototype._groupFrame = function(e) {
	//Draw children
	for(var p in this._components){
		this._components[p].frame(e);
	}
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
sgui.Group.prototype.getComponent = function(com, type) { //Component
	if (this._components[com.toLowerCase()]) {
		return this._components[com.toLowerCase()];
	};
	
	return type?this._newComponent(com, type):null;
};

/** Deletes a component from this group. That's it.
 * @param com The name of the component to delete.
 * @return <code>true</code> when a component was deleted, <code>false</code> if it didn't exist.
 */
sgui.Group.prototype.deleteComponent = function(com) { //Boolean
	if (this._components[com.toLowerCase()]){
		if(this._getFocusName() == com.toLowerCase()) this.focus("blank");
		delete this._components[com.toLowerCase()];
		delete this._drawOrder[this._drawOrder.indexOf(com.toLowerCase())];
		this.bookRedraw();
		return true;
	}
};

/** Set the current focus to <code>com</code>. If that component does not exist, then focus will be set to "blank" instead.
 * <p>This calls the component's <code>onDeactivate()</code> (if applicable) and <code>onLooseFocus()</code> in that order.</p>
 * @param com The name of the component to focus.
 * @returns Whether the focus was successful or not; components can "resist" loosing focus by returning <code>false</code> in their <code>onLooseFocus</code> function.
 */
sgui.Group.prototype.focus = function(value) { //Bool
	if (this._components[this._focusedCom]){
		if (this._components[this._focusedCom].locked){return false;};
		
		this._active?this._components[this._focusedCom].onDeactive():null;
		this._components[this._focusedCom].onLooseFocus();
	}
	
	//Loop through all components looking for it
	if (this._components[value.toLowerCase()]){
		this._focusedCom = value.toLowerCase();
		this._components[this._focusedCom].onGetFocus();
		this._active?this._components[this._focusedCom].onActive():null;
		return true;
	}
	
	duskWolf.warn(com+" was not found, couldn't set focus.");
	
	this._focusedCom = "blank";
	return false;
};

/** Gets the currently focused component. This could be the "blank" NullCom if nothing is focused.
 * @returns The currently focused component.
 */
sgui.Group.prototype.getFocus = function() {
	return this._components[this._focusedCom];
};

/** Checks to see if it's possible to flow to the specified component, and if so, then does it.
 * @param to The component to flow to.
 * @return Whether the component could be flowed into.
 */
sgui.Group.prototype.flow = function(to) { //Bool
	return this.getComponent(to) && this.getComponent(to).enabled && this.focus(to);
};

/** Groups will call their currently focused components <code>onDeactive</code> function. */
sgui.Group.prototype.onDeactive = function() {this._active = false;this.getFocus().onDeactive();};
/** Groups will call their currently focused components <code>onActive</code> function. */
sgui.Group.prototype.onActive = function() {this._active = true;this.getFocus().onActive();};
