//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.sgui.Component");
dusk.load.require("dusk.sgui.IContainer");

dusk.load.provide("dusk.sgui.Group");

/** Creates a new group.
 * 
 * @param {?dusk.sgui.Component} parent The container that this component is in.
 * @param {string} componentName The name of the component.
 * 
 * @class dusk.sgui.Group
 * 
 * @classdesc A group contains multiple components, and manages things like keyboard events and drawing.
 * 
 * Components have names, which are used to reference them, these names are strings and are not case sensitive.
 * 
 * One (and only one) component may be focused. This is the ONLY component that will recieve keypress events.
 * 
 * @extends dusk.sgui.IContainer
 */
dusk.sgui.Group = function(parent, comName) {
	if (parent !== undefined){
		dusk.sgui.Component.call(this, parent, comName);
		
		/** All the components in this container, key names are component names.
		 * @type object
		 * @memberof dusk.sgui.Group
		 * @protected
		 */
		this._components = {};
		/** The current drawing order of all the components. An array of string component names, earlier entries are drawn first.
		 * @type array
		 * @memberof dusk.sgui.Group
		 * @protected
		 */
		this._drawOrder = [];
		/** The name of the currently focused component.
		 * @type string
		 * @memberof dusk.sgui.Group
		 * @protected
		 */
		this._focusedCom = "";
		
		//Add the property masks
		this._registerPropMask("focus", "focus", true);
		this._registerPropMask("children", "__children", false);
		this._registerPropMask("allChildren", "__allChildren", false);
		
		//Add the handlers
		this._registerDrawHandler(this._groupDraw);
		this._registerFrameHandler(this._groupFrame);
		
		//And set it up
		this._newComponent("blank", "NullCom");
		this.focus = "blank";
	}
};
dusk.sgui.Group.prototype = new dusk.sgui.IContainer();
dusk.sgui.Group.constructor = dusk.sgui.Group;

dusk.sgui.Group.prototype.className = "Group";
dusk.sgui.Group.prototype.isAContainer = true;

/** Container specific method of handling keypresses.
 * 
 * In this case, it will call `{@link dusk.sgui.Component.keypress}` of its focused component, and return that value.
 * 
 * @param {object} e The keypress event, must be a JQuery keypress event object.
 * @return {boolean} The return value of the focused component's keypress.
 */
dusk.sgui.Group.prototype.containerKeypress = function(e) {
	return this.getFocused().keypress(e);
};

/** Creates a new component of the specified type.
 * 
 * `type` is a string, and must correspond to a property of the namespace `{@link dusk.sgui}` and inherit from the class `{@link dusk.sgui.Component}`.
 *	This will be the object which is created.
 * 
 * @param {string} com The name of the new component.
 * @param {?string} type The type to add as described above. If not specified, `"NullCom"` is used.
 * @return The component that was added.
 * @private
 */
dusk.sgui.Group.prototype._newComponent = function(com, type) {
	if(type === undefined) type = "NullCom";
	if(!(type in dusk.sgui)){throw new Error(type + " is not a valid component type.");}
	
	this._components[com] = new dusk.sgui[type](this, com.toLowerCase());
	this._drawOrder[this._drawOrder.length] = com;
	this.bookRedraw();
	
	return this._components[com];
};

/** Modifies this component's children using JSON data.
 *	See `{@link dusk.sgui.Component.parseProps}` for a basic description on how JSON properties work.
 * 
 * `data` is either a single object or an array of objects, each describing a single component.
 * 	Each component must have a `name` property, stating the name of the component they are modifying.
 *	It may also have a `type` property, which will be used in case the component does not exist to set its type.
 * 	If the component does not exist and `type` is ommited, then a warning is raised, and that object is skipped.
 * 
 * This may be used in the JSON representation with the property `children`.
 * 
 * @param {object|array} data Information about components, as described above.
 */
dusk.sgui.Group.prototype.modifyChildren = function(data) {
	if("length" in data) {
		for (var i = 0; i < data.length; i++) {
			if (data[i].name && this.getComponent(data[i].name.toLowerCase(), data[i].type)) {
				this.getComponent(data[i].name.toLowerCase()).parseProps(data[i]);
			} else if(data[i].name) {
				console.warn(data.name + " has not been given a type and does not exist, ignoring.");
			} else {
				console.warn("A component has no name in "+this.comName+", cannot create or edit.");
			}
		}
	}else{
		if(data.name && this.getComponent(data.name.toLowerCase(), data.type)) {
			return this.getComponent(data.name.toLowerCase()).parseProps(data, this._thread);
		} else if(data.name) {
			console.warn(data.name + " has not been given a type and does not exist, ignoring.");
		} else {
			console.warn("A component has no name in "+this.comName+", cannot create or edit.");
		}
	}
};
dusk.sgui.Group.prototype.__defineSetter__("__children", function s_children(value) {this.modifyChildren(value);});

/** Similar to `{@link dusk.sgui.Group.modifyChildren}` only it modifies the properties of all the children, instead of one.
 * 
 * Hence, the `type` and `name` properties are not needed or required.
 * 
 * This may be used in the JSON representation as the property `allChildren`.
 * 
 * @param {object} data Data used to modify all the children in this group.
 */
dusk.sgui.Group.prototype.modifyAllChildren = function(data) {
	for(var c in this._components) {
		this._components[c].parseProps(data);
	}
};
dusk.sgui.Group.prototype.__defineSetter__("__allChildren", function s_allChildren(value) {this.modifyAllChildren(value);});

/** Draws all of the children in the order described by `{@link dusk.sgui.Group._drawOrder}`.
 * 
 * @param {CanvasRenderingContext2D} The canvas context on which to draw all the components.
 * @private
 */
dusk.sgui.Group.prototype._groupDraw = function(c) {
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

/** Calls the `{@link dusk.sgui.Component.frame}` method of all components.
 * 
 * @private
 */
dusk.sgui.Group.prototype._groupFrame = function() {
	for(var p in this._components){
		this._components[p].frame();
	}
};

/** Returns a component in this group.
 * 
 * If `type` is not undefined, then the component will be created of that type if it exists.
 * 
 * @param {string} com The name of the component to get.
 * @param {?string} type The type of component to create.
 * @return {?dusk.sgui.Component} The component, or null if it doesn't exist and `type` is undefined.
 */
dusk.sgui.Group.prototype.getComponent = function(com, type) {
	if (this._components[com.toLowerCase()]) {
		return this._components[com.toLowerCase()];
	};
	
	return type?this._newComponent(com, type):null;
};

/** Deletes a component in this group. This will not remove any refrences to it elsewhere, but will remove it from the list of components and the draw order.
 * 
 * @param {string} The name of the component to delete.
 * @return {boolean} If the delete was successfull, this will return false if the component doesn't exist.
 */
dusk.sgui.Group.prototype.deleteComponent = function(com) {
	if (this._components[com.toLowerCase()]){
		if(this._focusedCom == com.toLowerCase()) this.focus = "blank";
		delete this._components[com.toLowerCase()];
		this._drawOrder.splice(this._drawOrder.indexOf(com.toLowerCase()), 1);
		this.bookRedraw();
		return true;
	}
};

/** This is the name of the currently focused component.
 * 
 * When set, this calls all the expected functions on `{@link dusk.sgui.Component}` as expected.
 * 
 * If a component returns false in `{@link dusk.sgui.Component.onLooseFocus} this will abort.
 * 
 * @type string
 * @memberof dusk.sgui.Group
 * @name focus
 */
dusk.sgui.Group.prototype.__defineSetter__("focus", function s_focus(value) {
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
dusk.sgui.Group.prototype.__defineGetter__("focus", function g_focus() {
	return this._focusedCom;
});

/** Returns the currently focused component.
 * 
 * @return {dusk.sgui.Component} The currently focused component.
 */
dusk.sgui.Group.prototype.getFocused = function() {
	return this._components[this._focusedCom];
};

/** Sets the current focused component only if it exists and it's `{@link dusk.sgui.Component.enabled}` property is true.
 * 
 * @param {string} to The name of the component to flow into.
 * @return {boolean} Whether the flow was successfull.
 */
dusk.sgui.Group.prototype.flow = function(to) {
	if(this.getComponent(to) && this.getComponent(to).enabled) {
		this.focus = to;
		return true;
	}
	
	return false;
};

//Width
dusk.sgui.Group.prototype.__defineGetter__("width", function _getWidth() {
	var max = 0;
	for(var c in this._components) {
		if(this._components[c].x + this._components[c].width > max) max = this._components[c].x + this._components[c].width;
	}
	
	return max;
});
dusk.sgui.Group.prototype.__defineSetter__("width", function _setWidth(value) {
	//Do nothing
});

//Height
dusk.sgui.Group.prototype.__defineGetter__("height", function _getHeight() {
	var max = 0;
	for(var c in this._components) {
		if(this._components[c].y + this._components[c].height > max) max = this._components[c].y + this._components[c].height;
	}
	
	return max;
});
dusk.sgui.Group.prototype.__defineSetter__("height", function _setHeight(value) {
	//Do nothing
});

/** Groups will call their currently focused component's `{@link dusk.sgui.Component.onDeactive}` function. */
dusk.sgui.Group.prototype.onDeactive = function() {this._active = false;this.getFocused().onDeactive();};
/** Groups will call their currently focused component's `{@link dusk.sgui.Component.onActive}` function. */
dusk.sgui.Group.prototype.onActive = function() {this._active = true;this.getFocused().onActive();};
