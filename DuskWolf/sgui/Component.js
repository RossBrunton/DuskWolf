//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require(">dusk.utils");
dusk.load.require("dusk.EventDispatcher");
dusk.load.require(">dusk.keyboard");
dusk.load.require(">dusk.controls");
dusk.load.require("dusk.sgui");

dusk.load.provide("dusk.sgui.Component");
dusk.load.provide("dusk.sgui.NullCom");

/** @class dusk.sgui.Component
 * 
 * @classdesc A component is a single "thing" that exists in the SimpleGui system. Everything in the Simple GUI system must have this (or a subclass of this) as a base class.
 * 
 * This class doesn't actually display anything itself, classes that inherit from it do.
 * 	The properties for this apply to all components.
 * 
 * @param {?dusk.sgui.Component} parent The container that this component is in.
 * @param {string} componentName The name of the component.
 * @see {@link dusk.sgui}
 * @constructor
 */
dusk.sgui.Component = function (parent, componentName) {
	/** The parent container that this component is inside.
	 * @type ?dusk.sgui.Component
	 * @private
	 */
	this._container = parent===undefined?null:parent;
	/** This component's name.
	 * @type string
	 */
	this.comName = componentName;
	
	/** The components x coordinate.
	 * @type integer
	 */
	this.x = 0;
	/** The components y coordinate.
	 * @type integer
	 */
	this.y = 0;
	/** Whether the component will draw. If false, the component will not render.
	 * @type boolean
	 * @default true
	 */
	this.visible = true;
	/** The component's transparency. A number between 0 and 1, where 0 is fully transparent, and 1 is fully opaque. 
	 * @type float
	 * @default 1
	 */
	this.alpha = 1;
	/** The component's height, in pixels. 
	 * @type integer
	 */
	this.height = 0;
	/** The component's width, in pixels. 
	 * @type integer
	 */
	this.width = 0;
	/** If set to a string representing a colour ("#ff0000" or "red", for example) will draw a border of that colour around the component. This can be used to check if width and height are set properly.
	 * @type string
	 * @default null
	 */
	this.mark = null;
	
	//this.cache = false;
	//this._cacheCanvas = dusk.utils.createCanvas(0, 0);

	/** The name of the group's component that will be focused when the left key is pressed and `{@link dusk.sgui.Component.leftDirection}` returns true.
	 * @type string
	 */
	this.leftFlow = "";
	/** The name of the group's component that will be focused when the right key is pressed and `{@link dusk.sgui.Component.rightDirection}` returns true.
	 * @type string
	 */
	this.rightFlow = "";
	/** The name of the group's component that will be focused when the up key is pressed and `{@link dusk.sgui.Component.upDirection}` returns true.
	 * @type string
	 */
	this.upFlow = "";
	/** The name of the group's component that will be focused when the down key is pressed and `{@link dusk.sgui.Component.downDirection}` returns true.
	 * @type string
	 */
	this.downFlow = "";
	
	/** Fired when a key is pressed.
	 * 
	 * The event object has five properties; `key`, the keycode of the key pressed; `ctrl`, `shift` and `meta` are modifier keys; and `jquery`, the original JQuery event.
	 * @type dusk.EventDispatcher
	 * @since 0.0.17-alpha
	 */
	this.keyPress = new dusk.EventDispatcher("dusk.sgui.Component.keyPress", dusk.EventDispatcher.MODE_AND);
	/** Fired when a directional key (up, down, left, right) is pressed.
	 * 
	 * The event object has two properties, `dir`, one of the constants `DIR_*` indicating a direction, and `e` the actual keypress event.
	 * 
	 * For the component to flow to the relevent flow location, all listeners registered must return true.
	 * @type dusk.EventDispatcher
	 * @since 0.0.17-alpha
	 */
	this.dirPress = new dusk.EventDispatcher("dusk.sgui.Component.dirPress", dusk.EventDispatcher.MODE_AND);
	this.dirPress.listen(function(e){return true;}, this);
	/** An event dispatcher that is fired once per frame.
	 * 
	 * The event object has no properties.
	 * @type dusk.EventDispatcher
	 * @since 0.0.17-alpha
	 */
	this.frame = new dusk.EventDispatcher("dusk.sgui.Component.frame");
	/** An event dispatcher that is fired when the action control `"sgui_action"` is pressed.
	 * 	By default, this is the "space" key, and should be the key that would press a button, or so.
	 * 
	 * This is in OR mode, so that any function registered to this that returns `true` will stop the event bubbling to the container component.
	 * @type dusk.EventDispatcher
	 * @since 0.0.17-alpha
	 */
	this.action = new dusk.EventDispatcher("dusk.sgui.Component.action", dusk.EventDispatcher.MODE_AND);
	/** Fired as part of the drawing proccess.
	 * 
	 * The event object is a 2D canvas rendering context, which is expected to be drawn on.
	 * @type dusk.EventDispatcher
	 * @since 0.0.17-alpha
	 */
	this.prepareDraw = new dusk.EventDispatcher("dusk.sgui.Component.prepareDraw");
	/** A mapping of action object properties to real one. The key name is the action property name, and is an array in the form `[mask, redraw, depends]`.
	 * 
	 * `mask` is the actual property name that will be set/read, `redraw` is a boolean indecating that setting the variable books a redraw, and `depends` is an array of all the properties in the object that must be ran before this.
	 * @type object
	 * @private
	 */
	this._propMasks = {};
	/** An event dispatcher which fires when the element is deleted.
	 * 
	 * The event object has a single property named `component`, which is this.
	 * 
	 * @type dusk.EventDispatcher
	 * @since 0.0.15-alpha
	 */
	this.onDelete = new dusk.EventDispatcher("dusk.sgui.Component.onDelete");
	
	/** The component's "style", or an array of such values. Used for styling.
	 * @type string|array
	 * @default ""
	 */
	this.style = "";
	 
	this.enabled = true;
	/** Whether the component can become focused, if false it cannot be flowed into. 
	 * @type boolean
	 * @default true
	 */
	this.enabled = true;
	/** Whether the component can loose focus, if true it can't be flowed out of. 
	 * @type boolean
	 * @default false
	 */
	this.locked = false;
	
	/** Whether this component is focused or not.
	 * @type boolean
	 * @default false
	 * @protected
	 */
	this._focused = false;
	/** Whether this component is currently the active one.
	 * @type boolean
	 * @default false
	 * @protected
	 */
	this._active = false;
	/** Fired whenever this component becomes focused, or looses focus.
	 * 
	 * The event object has a single property, `focus`, which is true if and only if the component is now focused.
	 * @type dusk.EventDispatcher
	 */
	this.onFocusChange = new dusk.EventDispatcher("dusk.sgui.Component.onFocusChange");
	this.onFocusChange.listen(function(e){this._focused = e.focus;}, this);
	/** Fired whenever this component becomes active, or stops being active.
	 * 
	 * The event object has a single property, `active`, which is true if and only if the component is now active.
	 * @type dusk.EventDispatcher
	 */
	this.onActiveChange = new dusk.EventDispatcher("dusk.sgui.Component.onActiveChange");
	this.onActiveChange.listen(function(e){this._active = e.active;}, this);
	
	/** If the component is deleted from it's group.
	 * 
	 * Set this to true to delete the component.
	 * 
	 * This will tell the parent component to remove the child, however it will not remove any other references to it.
	 * @type boolean
	 */
	this.deleted = false;
	/** Stores internally whether the current component is deleted.
	 * @type boolean
	 * @private
	 */
	this._deleted = false;
	
	//Prop masks
	this._registerPropMask("x", "x");
	this._registerPropMask("y", "y");
	this._registerPropMask("width", "width");
	this._registerPropMask("height", "height");
	this._registerPropMask("alpha", "alpha");
	this._registerPropMask("visible", "visible");
	this._registerPropMask("mark", "mark");
	this._registerPropMask("upFlow", "upFlow");
	this._registerPropMask("downFlow", "downFlow");
	this._registerPropMask("leftFlow", "leftFlow");
	this._registerPropMask("rightFlow", "rightFlow");
	this._registerPropMask("enabled", "enabled");
	this._registerPropMask("deleted", "deleted");
	this._registerPropMask("name", "comName");
	this._registerPropMask("style", "style");
	this._registerPropMask("layer", "__layer");
};

/** The name of this component's class.
 * @type string
 * @static
 * @memberof dusk.sgui.Component
 * 
 */
dusk.sgui.Component.prototype.className = "Component";

/** The direction up, negative in the y axis.
 * @type integer
 * @value 0
 * @static
 * @constant
 * @memberof dusk.sgui.Component
 */
dusk.sgui.Component.DIR_UP = 0;

/** The direction down, positive in the y axis.
 * @type integer
 * @value 1
 * @static
 * @constant
 * @memberof dusk.sgui.Component
 */
dusk.sgui.Component.DIR_DOWN = 1;

/** The direction left, negative in the x axis.
 * @type integer
 * @value 2
 * @static
 * @constant
 * @memberof dusk.sgui.Component
 */
dusk.sgui.Component.DIR_LEFT = 2;

/** The direction right, negative in the x axis.
 * @type integer
 * @value 3
 * @static
 * @constant
 * @memberof dusk.sgui.Component
 */
dusk.sgui.Component.DIR_RIGHT = 3;

/** This causes the component to handle a keypress, it should be called by ether it's parent container or SimpleGui.
 * 
 * If the component running this is a container, then it's `{@link dusk.sgui.IContainer#containerKeypress}` function will be called.
 *	If that function returns true, then this shall return true without doing anything else.
 * 
 * This function will first check the key to see if it is a direction or the action key, if it is ether the action handlers or the "directionAction"s are called. Otherwise it looks for a keyhandler. If all of the action handlers or keyhandlers returns true, then this function will return true.
 *
 * This function returns true if either at least one keyHandler (including action and direction) returns true, or the control flows into another component.
 *	If this returns false, then the event must not be ran by it's container.
 * 
 * @param {object} e The JQuery keypress object that should be ran.
 * @return {boolean} Whether the parent container should run it's own actions.
 */
dusk.sgui.Component.prototype.doKeyPress = function (e) {
	if(this instanceof dusk.sgui.IContainer && !this.containerKeypress(e)){return false;}
	
	var eventObject = {"key":e.keyCode, "shift":e.shiftKey, "ctrl":e.ctrlKey, "meta":e.metaKey, "jquery":e};
	
	var dirReturn = true;
	if(this.keyPress.fire(eventObject)) {
		//Directions
		if(dusk.controls.checkKey("sgui_left", e.which)) {
			if((dirReturn = this.dirPress.fire({"dir":dusk.sgui.Component.DIR_LEFT, "e":e})) && this.leftFlow && this._container.flow(this.leftFlow)){return false;}
		}else if(dusk.controls.checkKey("sgui_up", e.which)) {
			if((dirReturn = this.dirPress.fire({"dir":dusk.sgui.Component.DIR_UP, "e":e})) && this.upFlow && this._container.flow(this.upFlow)){return false;}
		}else if(dusk.controls.checkKey("sgui_right", e.which)) {
			if((dirReturn = this.dirPress.fire({"dir":dusk.sgui.Component.DIR_RIGHT, "e":e})) && this.rightFlow && this._container.flow(this.rightFlow)){return false;}
		}else if(dusk.controls.checkKey("sgui_down", e.which)) {
			if((dirReturn = this.dirPress.fire({"dir":dusk.sgui.Component.DIR_DOWN, "e":e})) && this.downFlow && this._container.flow(this.downFlow)){return false;}
		}else if(dusk.controls.checkKey("sgui_action", e.which)) {
			return this.action.fire({"keyPress":e});
		}
	}
	
	return dirReturn;
};


/** This maps a property from the JSON representation of the object (One from {@link #parseProps}) to the JavaScript representation of the object.
 * 	If the property `name` exists in the JSON properties, then `mask` will be assigned it's value.
 * 
 * @param {string} name The name in the JSON representation.
 * @param {string} mask The property name that that name shall be mapped to.
 * @param {boolean} redraw Depreciated
 * @param {?array} depends An array of "dependencies" of the property.
 * 	All the properties in this array will be set (if they exist in the JSON) beforet this one.
 * @protected
 */
dusk.sgui.Component.prototype._registerPropMask = function(name, mask, redraw, depends) {
	this._propMasks[name] = [mask, null, depends];
};

/** Adds new dependancies to an existing property mask.
 * 
 * @param {string} name The property to add dependencies of.
 * @param {string|array} depends A string name, or array of such, of dependancies to add.
 * @protected
 * @since 0.0.17-alpha
 */
dusk.sgui.Component.prototype._addNewPropDepends = function(name, depends) {
	if(name in this._propMasks) {
		if(typeof depends == "string") depends = [depends];
		this._propMasks[name][2] = this._propMasks[name][2].concat(depends);
	}
};

/** Given an object, this function sets the properties of this object in relation to the properties of the object.
 * 
 * This is used to describe the component using JSON, for quicker efficiency.
 * 
 * The properties of the `props` object tend to match up with the names of properties of this class (any changes will be noted in the documentation).
 * 
 * This function will loop through all the properties is `props` and set that value to the corresponding value in this object.
 * 
 * @param {object} props The object to read the properties off.
 * @see {@link dusk.sgui.Component#_registerPropMask}
 */
dusk.sgui.Component.prototype.parseProps = function(props) {
	var toProcess = [];
	for(var p in props) {
		toProcess[toProcess.length] = p;
	}
	
	//Dependancies system
	while(toProcess.length) {
		//loop through all props needing to be processed
		for(var i = toProcess.length-1; i >= 0; i--) {
			if(this._propMasks[toProcess[i]] && this._propMasks[toProcess[i]][2]) {
				//Loop to see if dependancies need processing
				for(var j = this._propMasks[toProcess[i]][2].length-1; j >= 0; j--) {
					if(toProcess.indexOf(this._propMasks[toProcess[i]][2][j]) !== -1) {
						//If so, then skip this one
						j = -2;
					}
				}
				
				if(j < -1) continue;
			}
			
			this.prop(toProcess[i], props[toProcess[i]]);
			
			toProcess.splice(i, 1);
		}
	}
};

/** Returns or sets a single property of the component.
 *	See `{@link dusk.sgui.Component#parseProps}` for details on how properties work.
 * 
 * If value is omitted, no value will be set.
 * 
 * @param {string} name The property to set.
 * @param {?object} value The new value to set for the object.
 * @return {?object} The (new) value of the object, or null if no property by that name can be handled.
 * @see {dusk.sgui.Component#parseProps}
 */
dusk.sgui.Component.prototype.prop = function(name, value) {
	if(this._propMasks[name] !== undefined) {
		if(value === undefined) {
			return this[this._propMasks[name][0]];
		}
		
		this[this._propMasks[name][0]] = value;
		return value;
	}
	
	return null;
};

/** "Bundles up" the component into a simple object.
 * 
 * This loops through all the registered propHandlers and sets them on an object.
 * 	This object should be able to describe the component.
 * @return {object} A representation of this component.
 * @since 0.0.17-alpha
 */
dusk.sgui.Component.prototype.bundle = function() {
	var hold = {};
	for(var p in this._propMasks) {
		hold[p] = this[this._propMasks[p][0]];
	}
	return hold;
};



//deleted
Object.defineProperty(dusk.sgui.Component.prototype, "deleted", {
	set: function (value) {
		if(value && !this._deleted) {
			this._deleted = true;
			this.onDelete.fire({"component":this});
			this._container.deleteComponent(this.comName);
		}
	},
	
	get: function() {
		return this._deleted;
	}
});



/** Requests the component to draw itself onto the specified 2D canvas context.
 * 
 * The canvas' state will be restored to what it was as an argument when this function is finished, so no changes to the state will persist out of the function.
 * 
 * @param {CanvasRenderingContext2D} c The canvas context to draw onto.
 */
dusk.sgui.Component.prototype.draw = function(c) {
	if(!this.visible) return;

	var state = c.save();
	if(this.x || this.y) c.translate(~~this.x, ~~this.y);
	if(this.alpha != 1) c.globalAlpha = this.alpha;
	
	this.prepareDraw.fire(c);

	if(this.mark !== null) {
		c.strokeStyle = this.mark;
		c.strokeRect(0, 0, this.prop("width"), this.prop("height"));
	}

	c.restore(state);
};

/** Alters the layer this is on.
 *	This calls `{@link dusk.sgui.IContainer#alterChildLayer}` of it's container.
 * 
 * This can be set in the JSON representation using the property `"layer"`
 * 
 * @param {string} alteration An alteration to make to the layer this component is on.
 * @since 0.0.17-alpha
 */
dusk.sgui.Component.prototype.alterLayer = function(alteration) {
	if(this._container) {
		this._container.alterChildLayer(this.comName, alteration);
	}
};
Object.defineProperty(dusk.sgui.Component.prototype, "__layer", {
	set: function(value) {this.alterLayer(value);},
	
	get: function() {return "";}
});


/** Resolves a path relative to the current component.
 * 
 * See `{@link dusk.sgui}` for a description on how paths work.
 * 
 * @param {string} path The path to resolve.
 * @return {dusk.sgui.Component} The component the path is a path to.
 */
dusk.sgui.Component.prototype.path = function(path) {
	if(!path){
		console.warn("Path '"+path+"' is undefined or empty.");
		return null;
	}
	
	if(path.indexOf(":") !== -1) return dusk.sgui.path(path);
	
	if(typeof path == "string") {
		path = path.split("/").reverse();
	}
	
	var p = path.pop();
	switch(p) {
		case "..":
			if(path.length) return this._container.path(path);
			return this._container;
		
		case ".":
			return this;
		
		case "":
			if(!path.length) return this;
			if(this instanceof dusk.sgui.Pane) return this.path(path);
			return this._container.path(path);
		
		default:
			if(this instanceof dusk.sgui.IContainer){
				if(!path.length) return this.getComponent(p);
				return this.getComponent(p).path(path);
			}
			
			console.warn(path + " from " + this.comName + " was not found.");
			return null;
	}
};

/** Returns the full path of this component.
 * 
 * This should be able to be given to `{@link dusk.sgui.path}` and will point to this component.
 * @return {string} A full path to this component.
 * @since 0.0.17-alpha
 */
dusk.sgui.Component.prototype.fullPath = function() {
	if(this instanceof dusk.sgui.Pane) return this.comName+":/";
	
	if(this instanceof dusk.sgui.IContainer) return this._container.fullPath() + this.comName+"/";
	
	return this._container.fullPath() + this.comName;
};

/** Returns the container that this component is in.
 * @return {?dusk.sgui.IContainer} This component's container, or null if this has no parent.
 * @since 0.0.17-alpha
 */
dusk.sgui.Component.prototype.getContainer = function() {
	return this._container;
};


/** Returns a string representation of the component. 
 * 
 * @return {string} A string representation of this component.
 */
dusk.sgui.Component.prototype.toString = function() {return "[sgui "+this.className+" "+this.comName+"]";};

Object.seal(dusk.sgui.Component);
Object.seal(dusk.sgui.Component.prototype);


//-----

/** Creates a new NullComponent.
 * 
 * @param {dusk.sgui.Component} parent The container that this component is in.
 * @param {string} componentName The name of the component.
 * 
 * @class dusk.sgui.NullCom
 * 
 * @classdesc A NullCom is essentially a "blank component". It is invisible, and does nothing.
 * @extends dusk.sgui.Component
 */
dusk.sgui.NullCom = function(parent, comName) {
	dusk.sgui.Component.call(this, parent, comName);
	this.visible = false;
};
dusk.sgui.NullCom.prototype = new dusk.sgui.Component();
dusk.sgui.NullCom.constructor = dusk.sgui.NullCom;

dusk.sgui.NullCom.prototype.className = "NullCom";

Object.seal(dusk.sgui.NullCom);
Object.seal(dusk.sgui.NullCom.prototype);

dusk.sgui.registerType("NullCom", dusk.sgui.NullCom);
