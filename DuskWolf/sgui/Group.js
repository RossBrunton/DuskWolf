//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require(">dusk.sgui.Component");
dusk.load.require("dusk.sgui.IContainer");

dusk.load.provide("dusk.sgui.Group");

/** @class dusk.sgui.Group
 * 
 * @classdesc A group contains multiple components, and manages things like keyboard events and drawing.
 * 
 * Components have names, which are used to reference them, these names are strings and are not case sensitive.
 * 
 * The number of components that can be focused depends on the `{@link #focusBehaviour}` property,
 *  focused components will be the only ones that receive keypresses.
 * 
 * @extends dusk.sgui.IContainer
 * @extends dusk.sgui.Component
 * @param {?dusk.sgui.Component} parent The container that this component is in.
 * @param {string} componentName The name of the component.
 * @constructor
 */
dusk.sgui.Group = function(parent, comName) {
	dusk.sgui.Component.call(this, parent, comName);
	
	/** All the components in this container, key names are component names.
	 * @type object
	 * @protected
	 */
	this._components = {};
	/** The current drawing order of all the components.
	 *   An array of string component names, earlier entries are drawn first.
	 * @type array
	 * @protected
	 */
	this._drawOrder = [];
	/** The name of the currently focused component.
	 * @type string
	 * @protected
	 */
	this._focusedCom = "";
	/** Used internally to store the current focus behaviour.
	 * @type integer
	 * @default FOCUS_ONE
	 * @private
	 * @since 0.0.18-alpha
	 */
	this._focusBehaviour = dusk.sgui.Group.FOCUS_ONE;
	/** The current behaviour used to say how focus works.
	 *  
	 * Changing this will affect any currently existing components.
	 * @type integer
	 * @default FOCUS_ONE
	 */
	this.focusBehaviour = dusk.sgui.Group.FOCUS_ONE;
	
	/** This is the name of the currently focused component.
	 * 
	 * When set, this calls all the expected functions on `{@link dusk.sgui.Component}` as expected.
	 * 
	 * If a component returns false in `{@link dusk.sgui.Component.onLooseFocus} this will abort.
	 * @type string
	 */
	this.focus = "";
	
	/** Used internally to store width.
	 * @type integer
	 * @private
	 * @since 0.0.18-alpha
	 */
	this._width = -1;
	/** Used internally to store height.
	 * @type integer
	 * @private
	 * @since 0.0.18-alpha
	 */
	this._height = -1;
	/** Used to cache drawn stuff.
	 * @type HTMLCanvasElement
	 * @private
	 * @since 0.0.18-alpha
	 */
	this._cache = null;
	/** The x offset. All the contents of this container will be moved to the left this many
	 *   and any pixels that have an x less than 0 are not drawn.
	 * @type integer
	 * @since 0.0.18-alpha
	 */
	this.xOffset = 0;
	/** The y offset. All the contents of this container will be moved upwards this many
	 *   and any pixels that have an y less than 0 are not drawn.
	 * @type integer
	 * @since 0.0.18-alpha
	 */
	this.yOffset = 0;
	
	//Prop masks
	this._registerPropMask("focus", "focus", true, ["children"]);
	this._registerPropMask("focusBehaviour", "focusBehaviour");
	this._registerPropMask("xOffset", "xOffset");
	this._registerPropMask("yOffset", "yOffset");
	this._registerPropMask("children", "__children", undefined, ["focusBehaviour"]);
	this._registerPropMask("allChildren", "__allChildren", undefined, ["focusBehaviour"]);
	
	//Listeners
	this.prepareDraw.listen(this._groupDraw, this);
	this.frame.listen(this._groupFrame, this);
	
	this.onActiveChange.listen(function(e){
		if(this.focusBehaviour == dusk.sgui.Group.FOCUS_ALL) {
			for(var c in this._components) {
				this._components[c].onActiveChange.fire(e);
			}
		}else if(this.getFocused()) {
			this.getFocused().onActiveChange.fire(e);
		}
	}, this);
	
	//Render support
	this.renderSupport |= dusk.sgui.Component.REND_OFFSET | dusk.sgui.Component.REND_SLICE;
	
	//Check interfaces
	if(!dusk.utils.doesImplement(this, dusk.sgui.IContainer)) {
		console.warn(this.toString()+" does not implement dusk.sgui.IContainer!");
	}
};
dusk.sgui.Group.prototype = new dusk.sgui.Component();
dusk.sgui.Group.constructor = dusk.sgui.Group;

dusk.sgui.Group.prototype.className = "Group";

/** A mode that indicates that only one component can be active.
 * 
 * This means that only the currently focused component will get the keypresses and such.
 * @type integer
 * @constant
 * @static
 * @value 0
 */
dusk.sgui.Group.FOCUS_ONE = 0;

/** A mode that indicates that all the components are active.
 * 
 * This means that all the components will recieve keypress events and stuff.
 *	A component is still technically "focused", but all components will act as if they are.
 * 
 * @type integer
 * @constant
 * @static
 * @value 1
 */
dusk.sgui.Group.FOCUS_ALL = 1;

/** Container specific method of handling keypresses.
 * 
 * In this case, it will call `{@link dusk.sgui.Component.keypress}` of its focused component, and return that value.
 * 
 * @param {object} e The keypress event, must be a JQuery keypress event object.
 * @return {boolean} The return value of the focused component's keypress.
 */
dusk.sgui.Group.prototype.containerKeypress = function(e) {
	if(this.focusBehaviour == dusk.sgui.Group.FOCUS_ALL) {
		var toReturn = true;
		for(var c in this._components) {
			toReturn = this._components[c].doKeyPress(e) && toReturn;
		}
		return toReturn;
	}
	if(this.getFocused()) return this.getFocused().doKeyPress(e);
	return true;
};

/** Creates a new component of the specified type.
 * 
 * `type` is a string, and must have been previously registered with `{@link dusk.sgui.registerType}`.
 *	This will be the object which is created.
 * 
 * @param {string} com The name of the new component.
 * @param {?string} type The type to add as described above. If not specified, `"NullCom"` is used.
 * @return The component that was added.
 * @private
 */
dusk.sgui.Group.prototype._newComponent = function(com, type) {
	if(type === undefined) type = "NullCom";
	if(!dusk.sgui.getType(type)){
		console.warn(type + " is not a valid component type.");
		type = "NullCom";
	}
	
	this._components[com] = new (dusk.sgui.getType(type))(this, com.toLowerCase());
	this._drawOrder[this._drawOrder.length] = com;
	dusk.sgui.applyStyles(this._components[com]);
	if(this.focusBehaviour == dusk.sgui.Group.FOCUS_ALL) this._components[com].onFocusChange.fire({"focus":true});
	
	return this._components[com];
};

/** Modifies this component's children using JSON data.
 *	See `{@link dusk.sgui.Component.parseProps}` for a basic description on how JSON properties work.
 * 
 * `data` is either a single component description, an array of component description or an object
 *   with the keys being component names, and the value being their data.
 * 	Each component must have a `name` property, stating the name of the component they are modifying.
 *   This is the key when describing multiple components using an object.
 *	It may also have a `type` property, which will be used in case the component does not exist to set its type.
 * 	If the component does not exist and `type` is omitted, then a warning is raised, and that object is skipped.
 * 
 * This may be used in the JSON representation with the property `children`.
 * 
 * @param {object|array} data Information about components, as described above.
 */
dusk.sgui.Group.prototype.modifyComponent = function(data) {
	if(Array.isArray(data)) {
		for (var i = 0; i < data.length; i++) {
			if(("name" in data[i]) && this.getComponent(data[i].name.toLowerCase(), data[i].type)) {
				this.getComponent(data[i].name.toLowerCase()).parseProps(data[i]);
			} else if(data[i].name) {
				console.warn(data[i].name + " has not been given a type and does not exist, ignoring.");
			} else {
				console.warn("A component has no name in "+this.comName+", cannot create or edit.");
			}
		}
	}else{
		if("name" in data && typeof data.name == "string") {
			if(this.getComponent(data.name.toLowerCase(), data.type)) {
				return this.getComponent(data.name.toLowerCase()).parseProps(data);
			}
			console.warn(data.name + " has not been given a type and does not exist, ignoring.");
		}else{
			for(var p in data) {
				if(this.getComponent(p.toLowerCase(), data[p].type)) {
					this.getComponent(p.toLowerCase()).parseProps(data[p]);
				}else{
					console.warn(p + " has not been given a type and does not exist, ignoring.");
				}
			}
		}
	}
};
Object.defineProperty(dusk.sgui.Group.prototype, "__children", {
	set: function(value) {this.modifyComponent(value);},
	
	get: function() {
		var hold = [];
		for(var i = 0; i < this._drawOrder.length; i++) {
			hold[hold.length] = this._components[this._drawOrder[i]].bundle();
			hold[hold.length-1].type = this._components[this._drawOrder[i]].className;
		}
		return hold;
	}
});

/** Similar to `{@link dusk.sgui.Group.modifyChildren}`
 *   only it modifies the properties of all the children instead of one.
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
Object.defineProperty(dusk.sgui.Group.prototype, "__allChildren", {
	set: function(value) {this.modifyAllChildren(value);},
	
	get: function() {return {};}
});

/** Draws all of the children in the order described by `{@link dusk.sgui.Group._drawOrder}`.
 * 
 * @param {object} e An event from `{@link dusk.sgui.Component#_prepareDraw}`
 * @private
 */
dusk.sgui.Group.prototype._groupDraw = function(e) {
	//Check support of children
	var support = this._getLeastRenderSupport();
	var cacheNeeded = false;
	
	if(!(support & dusk.sgui.Component.REND_LOCATION)) {
		console.error("All components must support origin location.");
		return;
	}
	
	if(!(support & dusk.sgui.Component.REND_OFFSET) && (this.xOffset || this.yOffset)) {
		cacheNeeded = true;
	}
	
	if(!(support & dusk.sgui.Component.REND_SLICE) && (this.width >= 0 || this.height >= 0)) {
		cacheNeeded = true;
	}
	
	if(!cacheNeeded) {
		for(var i = 0; i < this._drawOrder.length; i++) {
			if(this._drawOrder[i] in this._components) {
				var com = this._components[this._drawOrder[i]];
				var data = {"alpha":e.alpha};
				var destXAdder = com.xOrigin == dusk.sgui.Component.ORIGIN_MAX?this.width - com.width:0;
				var destYAdder = com.yOrigin == dusk.sgui.Component.ORIGIN_MAX?this.height - com.height:0;
				destXAdder = com.xOrigin == dusk.sgui.Component.ORIGIN_MIDDLE?(this.width - com.width)>>1:destXAdder;
				destYAdder = com.yOrigin == dusk.sgui.Component.ORIGIN_MIDDLE?(this.height - com.height)>>1:destYAdder;
				
				data.sourceX = (-this.xOffset + com.x + destXAdder - e.d.sourceX)<0
				 ? -(-this.xOffset + com.x + destXAdder - e.d.sourceX) : 0;
				data.sourceY = (-this.yOffset + com.y + destYAdder - e.d.sourceY)<0
				 ? -(-this.yOffset + com.y + destYAdder - e.d.sourceY) : 0;
				
				data.destX = (com.x - this.xOffset - e.d.sourceX + destXAdder)<0
				 ? e.d.destX : com.x - this.xOffset - e.d.sourceX + e.d.destX + destXAdder;
				data.destY = (com.y - this.yOffset - e.d.sourceY + destYAdder)<0
				 ? e.d.destY : com.y - this.yOffset - e.d.sourceY + e.d.destY + destYAdder;
				
				data.width = com.width - data.sourceX;
				data.height = com.height - data.sourceY;
				
				if(data.destX >= e.d.width + e.d.destX) continue;
				if(data.destY >= e.d.height + e.d.destY) continue;
				
				if(data.width <= 0 || data.height <= 0) continue;
				
				if(data.width + data.destX > e.d.width + e.d.destX) 
					data.width = (e.d.destX + e.d.width) - data.destX;
				if(data.height + data.destY > e.d.height + e.d.destY) 
					data.height = (e.d.destY + e.d.height) - data.destY;
				
				com.draw(data, e.c);
			}
		}
	}else{
		if(this._cache == null) {
			this._cache = dusk.utils.createCanvas(e.d.width + this.xOffset, e.d.height + this.yOffset);
		}else{
			this._cache.width = e.d.width + this.xOffset;
			this._cache.height = e.d.height + this.yOffset;
		}
		
		for(var i = 0; i < this._drawOrder.length; i++) {
			if(this._drawOrder[i] in this._components) {
				var com = this._components[this._drawOrder[i]];
				var data = {"alpha":e.alpha};
				var destXAdder = com.xOrigin == dusk.sgui.Component.ORIGIN_MAX?this.width - com.width:0;
				var destYAdder = com.yOrigin == dusk.sgui.Component.ORIGIN_MAX?this.height - com.height:0;
				destXAdder = com.xOrigin == dusk.sgui.Component.ORIGIN_MIDDLE?(this.width - com.width)>>1:destXAdder;
				destYAdder = com.yOrigin == dusk.sgui.Component.ORIGIN_MIDDLE?(this.height - com.height)>>1:destYAdder;
				
				data.sourceX = 0;
				data.sourceY = 0;
				data.destX = com.x + destXAdder;
				data.destY = com.y + destYAdder;
				data.width = com.width;
				data.height = com.height;
				
				//if(data.destX >= e.d.width + e.d.destX) continue; // No idea what this does...
				//if(data.destY >= e.d.height + e.d.destY) continue;
				
				if(data.width <= 0 || data.height <= 0) continue;
				
				com.draw(data, this._cache.getContext("2d"));
			}
		}
		
		e.c.drawImage(this._cache, this.xOffset + e.d.sourceX, this.yOffset + e.d.sourceY, e.d.width, e.d.height,
			e.d.destX, e.d.destY, e.d.width, e.d.height
		);
	}
};

/** Looks through all components in this group and returns the bare minimum support needed to draw all of them.
 * 
 * @returns {integer} A bitflag containing all of the render support things supported.
 * @private
 * @since 0.0.18-alpha
 */
dusk.sgui.Group.prototype._getLeastRenderSupport = function() {
	var hold = 0xffff;
	for(var p in this._components){
		hold &= this._components[p].renderSupport;
	}
	return hold;
};

/** Calls the `{@link dusk.sgui.Component.frame}` method of all components.
 * 
 * @private
 */
dusk.sgui.Group.prototype._groupFrame = function() {
	for(var p in this._components){
		this._components[p].frame.fire();
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
	}
	
	return type?this._newComponent(com, type):null;
};

/** Deletes a component in this group.
 * 
 * This will not remove any references to it elsewhere
 *  but will remove it from the list of components and the draw order.
 * 
 * @param {string} com The name of the component to delete.
 * @return {boolean} If the delete was successful, this will return false if the component doesn't exist.
 */
dusk.sgui.Group.prototype.deleteComponent = function(com) {
	if (this._components[com.toLowerCase()]){
		if(this._focusedCom == com.toLowerCase()) this.focus = "";
		this._components[com.toLowerCase()].onDelete.fire({"com":this._components[com.toLowerCase()]});
		delete this._components[com.toLowerCase()];
		this._drawOrder.splice(this._drawOrder.indexOf(com.toLowerCase()), 1);
		return true;
	}
};

/** Deletes all the components in this group.
 * 
 * @see dusk.sgui.Group#deleteComponent
 * @since 0.0.18-alpha
 */
dusk.sgui.Group.prototype.deleteAllComponents = function(com) {
	for(var p in this._components) {
		this.deleteComponent(p);
	}
};

//focus
dusk.sgui.Group.prototype.__defineSetter__("focus", function s_focus(value) {
	if(value) this.flow(value);
});
dusk.sgui.Group.prototype.__defineGetter__("focus", function g_focus() {
	return this._focusedCom;
});

/** Returns the currently focused component.
 * 
 * @return {?dusk.sgui.Component} The currently focused component or null if nothing is focused.
 */
dusk.sgui.Group.prototype.getFocused = function() {
	if(!(this._focusedCom in this._components)) return null;
	return this._components[this._focusedCom];
};

/** Sets the current focused component only if it exists,
 *   the current focus's `{@link dusk.sgui.Component.locked}` property is false
 *   and the new component's `{@link dusk.sgui.Component.enabled}` property is true.
 * 
 * @param {string} to The name of the component to flow into.
 * @return {boolean} Whether the flow was successfull.
 */
dusk.sgui.Group.prototype.flow = function(to) {
	if(this._focusedCom !== "" && this._components[this._focusedCom]){
		if(this._components[this._focusedCom].locked){return false;}
		
		if(this.focusBehaviour != dusk.sgui.Group.FOCUS_ALL && this._active)
			this._components[this._focusedCom].onActiveChange.fire({"active":false});
		if(this.focusBehaviour != dusk.sgui.Group.FOCUS_ALL)
			this._components[this._focusedCom].onFocusChange.fire({"focus":false});
	}
	
	if(this._components[to.toLowerCase()]){
		this._focusedCom = to.toLowerCase();
		if(this.focusBehaviour != dusk.sgui.Group.FOCUS_ALL)
			this._components[this._focusedCom].onFocusChange.fire({"focus":true});
		if(this.focusBehaviour != dusk.sgui.Group.FOCUS_ALL && this._active)
			this._components[this._focusedCom].onActiveChange.fire({"active":true});
		return true;
	}
	
	console.warn(to+" was not found, couldn't set focus.");
	
	this._focusedCom = "";
};

//focusBehaviour
Object.defineProperty(dusk.sgui.Group.prototype, "focusBehaviour", {
	set: function(value) {
		if(this._focusBehaviour == value) return;
		this._focusBehaviour = value;
		
		switch(this._focusBehaviour) {
			case dusk.sgui.Group.FOCUS_ONE:
				for(var c in this._components) {
					if(this._focusedCom != c) {
						if(this._active) this._components[c].onActiveChange.fire({"active":false});
						this._components[c].onFocusChange.fire({"focus":false});
					}
				}
				break;
				
			case dusk.sgui.Group.FOCUS_ALL:
				for(var c in this._components) {
					if(this._focusedCom != c) {
						if(this._active) this._components[c].onActiveChange.fire({"active":true});
						this._components[c].onFocusChange.fire({"focus":true});
					}
				}
				break;
		}
	},
	
	get: function() {
		return this._focusBehaviour;
	}
});

/** Alters the layer components are on; higher layers are drawn later, appearing on top of others.
 * 
 * See {@link dusk.sgui.IContainer.alterLayer} for a description of the value for `alter`.
 * 
 * @param {string} com The name of the component to alter the layer of.
 * @param {string} alter The alteration to make.
 * @since 0.0.17-alpha
 */
dusk.sgui.Group.prototype.alterChildLayer = function(com, alter) {
	var o = 0;
	var frags = [alter.charAt(0), alter.substr(1)];
	var dropped = false;
	
	if(frags[1] !== "" && !this.getComponent(frags[1])) {
		console.warn("Tried to alter layer based on an invalid component "+frags[1]+".");
		return;
	}
	if(!this.getComponent(com)) {
		console.warn("Tried to reorder non-existant component "+com+".");
		return;
	}
	if(!(frags[0] === "+" || frags[0] === "-")) {
		console.warn("Invalid layer alteration: Must have '+' or '-' as first character.");
		return;
	}
	
	var old = this._drawOrder;
	this._drawOrder = [];
	
	for(var i = 0; i < old.length; i ++) {
		if(!dropped && ((i == 0 && frags[0] === "-" && frags[1] === "")
		|| (old[o] === frags[1] && frags[0] === "-")
		|| (i == old.length-1 && frags[0] === "+" && frags[1] === "")
		|| (old[o-1] === frags[1] && frags[0] === "+"))) {
			this._drawOrder[i] = com;
			dropped = true;
		}else{
			if(old[o] !== com) {
				this._drawOrder[i] = old[o];
				
			}else{
				i --;
			}
			o ++;
		}
	}
};

//Please note that to set the width to -2, all the parent's must have either an explicit width, or a width of -2
// otherwise Chrome will explode.
//Width
Object.defineProperty(dusk.sgui.Group.prototype, "width", {
	get: function() {
		if(this._width == -2) {
			if(this.container !== null) {
				return this.container.width;
			}
			
			return dusk.sgui.width;
		}else if(this._width == -1) {
			var max = 0;
			for(var c in this._components) {
				if(this._components[c].x + this._components[c].width > max)
					max = this._components[c].x + this._components[c].width;
			}
			
			return max - this.xOffset;
		}else{
			return this._width;
		}
	},
	
	set: function(value) {
		this._width = value;
	}
});

//Height
Object.defineProperty(dusk.sgui.Group.prototype, "height", {
	get: function() {
		if(this._height == -2) {
			if(this.container !== null) {
				return this.container.height;
			}
			
			return dusk.sgui.height;
		}else if(this._height == -1) {
			var max = 0;
			for(var c in this._components) {
				if(this._components[c].y + this._components[c].height > max)
					max = this._components[c].y + this._components[c].height;
			}
		
			return max - this.yOffset;
		}else{
			return this._height;
		}
	},
	
	set: function(value) {
		this._height = value;
	}
});

/** Returns the smallest width which has all the components fully drawn inside.
 * 
 * @param {boolean} includeOffset If true, then the offset is taken into account, and removed from the figure.
 * @return {integer} The smallest possible width where all the components are fully inside.
 * @protected
 * @since 0.0.18-alpha
 */
dusk.sgui.Group.prototype._getTrueWidth = function(includeOffset) {
	var max = 0;
	for(var c in this._components) {
		if(this._components[c].x + this._components[c].width > max)
			max = this._components[c].x + this._components[c].width;
	}
	
	return max - (includeOffset?this.xOffset:0);
};

/** Returns the smallest height which has all the components fully drawn inside.
 * 
 * @param {boolean} includeOffset If true, then the offset is taken into account, and removed from the figure.
 * @return {integer} The smallest possible height where all the components are fully inside.
 * @protected
 * @since 0.0.18-alpha
 */
dusk.sgui.Group.prototype._getTrueHeight = function(includeOffset) {
	var max = 0;
	for(var c in this._components) {
		if(this._components[c].y + this._components[c].height > max)
			max = this._components[c].y + this._components[c].height;
	}
	
	return max - (includeOffset?this.yOffset:0);
};

Object.seal(dusk.sgui.Group);
Object.seal(dusk.sgui.Group.prototype);

dusk.sgui.registerType("Group", dusk.sgui.Group);
