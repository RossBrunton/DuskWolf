//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Component");
dusk.load.require("dusk.sgui.IContainer");

dusk.load.provide("dusk.sgui.Group");

dusk.sgui.Group = function(parent, comName) {
	//Implements _container
	if (parent !== undefined){
		dusk.sgui.Component.call(this, parent, comName);
		
		this._components = {};
		this._drawOrder = [];
		this._focusedCom = "";
		this._width = -1;
		this._height = -1;
		
		/** Whether this is the active component that will receive all keypresses. */
		this._active = false;
		/** Whether this is the focused component in its group. */
		this._focused = false;
		
		//Add the groupStuff handler
		this._registerPropMask("focus", "focus", true);
		this._registerPropMask("children", "children", false);
		this._registerPropMask("allChildren", "allChildren", false);
		
		this._registerDrawHandler(this._groupDraw);
		this._registerFrameHandler(this._groupFrame);
		
		this._newComponent("blank", "NullCom");
		this.focus = "blank";
	}
};
dusk.sgui.Group.prototype = new dusk.sgui.IContainer();
dusk.sgui.Group.constructor = dusk.sgui.Group;

dusk.sgui.Group.prototype.className = "Group";
dusk.sgui.Group.prototype.isAContainer = true;

/** The currently active component handles the keypress. 
 * @param e The keyboard event.
 * @return The result of the focused component's keypress.
 */
dusk.sgui.Group.prototype.containerKeypress = function(e) {
	return this.getFocused().keypress(e);
};

/** This creates a new component in this group. Interesting that, isn't it?
 * 
 * <p>If you need to check the names of the component you are after, <code>Component.NAME</code> will tell you. If the type you provide isn't a real component, then a <code>NullCom</code> will be used.</p>
 * 
 * @param com The name of the component.
 * @param type The type of the component, should be the name of one of the components in <code>SimpleGui.COMS</code>. If not specified a NullCom is made.
 * @return The component that was added.
 */
dusk.sgui.Group.prototype._newComponent = function(com, type) { //Component
	//Find the type
	if(!(type in dusk.sgui)){throw new Error(type + " is not a valid component type.");}
	//loadComponent(type);
	
	this._components[com] = new dusk.sgui[type](this, com.toLowerCase());
	this._drawOrder[this._drawOrder.length] = com;
	this.bookRedraw();
	
	return this._components[com];
};

dusk.sgui.Group.prototype.__defineSetter__("children", function s_children(value) {
	if("length" in value) {
		for (var i = 0; i < value.length; i++) {
			if (value[i].name && this.getComponent(value[i].name.toLowerCase(), value[i].type)) {
				this.getComponent(value[i].name.toLowerCase()).parseProps(value[i], this._thread);
			} else if(value[i].name) {
				console.warn(value.name + " has not been given a type and does not exist, ignoring.");
			} else {
				console.warn("A component has no name in "+this.comName+", cannot create or edit.");
			}
		}
	}else{
		if(value.name && this.getComponent(value.name.toLowerCase(), value.type)) {
			return this.getComponent(value.name.toLowerCase()).parseProps(value, this._thread);
		} else if(value.name) {
			console.warn(value.name + " has not been given a type and does not exist, ignoring.");
		} else {
			console.warn("A component has no name in "+this.comName+", cannot create or edit.");
		}
	}
});

dusk.sgui.Group.prototype.__defineGetter__("children", function g_children() {
	return this._components;
});

dusk.sgui.Group.prototype.__defineSetter__("allChildren", function s_allChildren(value) {
	for (var c in this._components) {
		this._components[c].parseProps(value, this._thread);
	}
});

dusk.sgui.Group.prototype.__defineGetter__("allChildren", function g_allChildren() {
	return this._components;
});

dusk.sgui.Group.prototype._groupDraw = function(c) {
	//Draw children
	//var input;
	for(var i = 0; i < this._drawOrder.length; i++) {
		if(this._drawOrder[i] in this._components) {
			/*var com = this._components[this._drawOrder[i]]
			input = com.draw();
			if(!input || !com.width || !com.height) continue;
			c.drawImage(input, com.x, com.y, com.width, com.height);*/
			this._components[this._drawOrder[i]].draw(c);
		}
	}
};

dusk.sgui.Group.prototype._groupFrame = function(e) {
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
dusk.sgui.Group.prototype.getComponent = function(com, type) { //Component
	if (this._components[com.toLowerCase()]) {
		return this._components[com.toLowerCase()];
	};
	
	return type?this._newComponent(com, type):null;
};

/** Deletes a component from this group. That's it.
 * @param com The name of the component to delete.
 * @return <code>true</code> when a component was deleted, <code>false</code> if it didn't exist.
 */
dusk.sgui.Group.prototype.deleteComponent = function(com) { //Boolean
	if (this._components[com.toLowerCase()]){
		if(this._focusedCom == com.toLowerCase()) this.focus = "blank";
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
dusk.sgui.Group.prototype.__defineSetter__("focus", function set_focus(value) {
	if (this._components[this._focusedCom]){
		if (this._components[this._focusedCom].locked){return false;};
		
		if(this._active) this._components[this._focusedCom].onDeactive();
		this._components[this._focusedCom].onLooseFocus();
	}
	
	//Loop through all components looking for it
	if (this._components[value.toLowerCase()]){
		this._focusedCom = value.toLowerCase();
		this._components[this._focusedCom].onGetFocus();
		if(this._active) this._components[this._focusedCom].onActive();
		return true;
	}
	
	console.warn(value+" was not found, couldn't set focus.");
	
	this._focusedCom = "blank";
});

dusk.sgui.Group.prototype.__defineGetter__("focus", function get_focus() {
	return this._focusedCom;
});

/** Gets the currently focused component. This could be the "blank" NullCom if nothing is focused.
 * @returns The currently focused component.
 */
dusk.sgui.Group.prototype.getFocused = function() {
	return this._components[this._focusedCom];
};

/** Checks to see if it's possible to flow to the specified component, and if so, then does it.
 * @param to The component to flow to.
 * @return Whether the component could be flowed into.
 */
dusk.sgui.Group.prototype.flow = function(to) { //Bool
	if(this.getComponent(to) && this.getComponent(to).enabled) this.focus = to;
};

dusk.sgui.Group.prototype.__defineGetter__("width", function _getWidth() {
	if(this._width >= 0) return this._width;
	
	var max = 0;
	for(var c in this._components) {
		if(this._components[c].x + this._components[c].width > max) max = this._components[c].x + this._components[c].width;
	}
	
	return max;
});

dusk.sgui.Group.prototype.__defineSetter__("width", function _setWidth(value) {
	this._width = value;
});

dusk.sgui.Group.prototype.__defineGetter__("height", function _getHeight() {
	if(this._height >= 0) return this._height;
	
	var max = 0;
	for(var c in this._components) {
		if(this._components[c].y + this._components[c].height > max) max = this._components[c].y + this._components[c].height;
	}
	
	return max;
});

dusk.sgui.Group.prototype.__defineSetter__("height", function _setHeight(value) {
	this._height = value;
});

/** Groups will call their currently focused components <code>onDeactive</code> function. */
dusk.sgui.Group.prototype.onDeactive = function() {this._active = false;this.getFocused().onDeactive();};
/** Groups will call their currently focused components <code>onActive</code> function. */
dusk.sgui.Group.prototype.onActive = function() {this._active = true;this.getFocused().onActive();};
