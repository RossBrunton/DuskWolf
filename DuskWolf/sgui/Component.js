//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require(">dusk.utils");
dusk.load.require("dusk.EventDispatcher");
dusk.load.require(">dusk.keyboard");
dusk.load.require(">dusk.controls");
dusk.load.require("dusk.sgui");
dusk.load.require("dusk.Mapper");

dusk.load.provide("dusk.sgui.Component");
dusk.load.provide("dusk.sgui.NullCom");

/** @class dusk.sgui.Component
 * 
 * @classdesc A component is a single "thing" that exists in the SimpleGui system.
 *  Everything in the Simple GUI system must have this (or a subclass of this) as a base class.
 * 
 * This class doesn't actually display anything itself, classes that inherit from it do.
 * 	The properties for this apply to all components.
 * 
 * @param {?dusk.sgui.IContainer} parent The container that this component is in.
 * @param {string} componentName The name of the component.
 * @see {@link dusk.sgui}
 * @constructor
 */
dusk.sgui.Component = function (parent, componentName) {
	/** The parent container that this component is inside.
	 * @type ?dusk.sgui.Component
	 */
	this.container = parent===undefined?null:parent;
	/** This component's name.
	 * @type string
	 */
	this.comName = componentName;
	
	/** The components x coordinate.
	 * @type integer
	 */
	this.x = 0;
	/** The origin point for the x coordinate, this describes where the x coordinate "begins".
	 * 
	 * Must be one of the `ORIGIN_*` constants.
	 * @type integer
	 * @default dusk.sgui.Component#ORIGIN_MIN
	 * @since 0.0.18-alpha
	 */
	this.xOrigin = dusk.sgui.Component.ORIGIN_MIN;
	/** The components y coordinate.
	 * @type integer
	 */
	this.y = 0;
	/** The origin point for the y coordinate, this describes where the y coordinate "begins".
	 * 
	 * Must be one of the `ORIGIN_*` constants.
	 * @type integer
	 * @default dusk.sgui.Component#ORIGIN_MIN
	 * @since 0.0.18-alpha
	 */
	this.xOrigin = dusk.sgui.Component.ORIGIN_MIN;
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
	 * Some components do not support setting their dimensions,
	 * 	in which case you cannot set this to anything other than 0.
	 * @type integer
	 */
	this.height = 0;
	/** The component's width, in pixels. 
	 * Some components do not support setting their dimensions,
	 * 	in which case you cannot set this to anything other than 0.
	 * @type integer
	 */
	this.width = 0;
	/** If set to a string representing a colour ("#ff0000" or "red", for example) this will draw a border
	 *  of that colour around the component. This can be used to check if width and height are set properly.
	 * @type string
	 * @default null
	 */
	this.mark = null;
	/** If set to a string representing a colour ("#ff0000" or "red", for example) this will draw a border
	 *  of that colour around the component if it is active. This should be used to provide a hint to the user as to 
	 *   what is currently selected.
	 * @type string
	 * @default null
	 * @since 0.0.18-alpha
	 */
	this.activeBorder = null;

	/** The name of the group's component that will be focused when the left key is pressed
	 *  and `{@link dusk.sgui.Component.leftDirection}` returns true.
	 * @type string
	 */
	this.leftFlow = "";
	/** The name of the group's component that will be focused when the right key is pressed
	 *  and `{@link dusk.sgui.Component.rightDirection}` returns true.
	 * @type string
	 */
	this.rightFlow = "";
	/** The name of the group's component that will be focused when the up key is pressed
	 *  and `{@link dusk.sgui.Component.upDirection}` returns true.
	 * @type string
	 */
	this.upFlow = "";
	/** The name of the group's component that will be focused when the down key is pressed
	 *  and `{@link dusk.sgui.Component.downDirection}` returns true.
	 * @type string
	 */
	this.downFlow = "";
	/** This should be set to true only in a dirPress listener.
	 *  If true, then there will be no attempt at flowing out of the component.
	 * @type boolean
	 * @protected
	 * @since 0.0.18-alpha
	 */
	this._noFlow = false;
	
	/** Fired when a key is pressed.
	 * 
	 * The event object has five properties; `key`, the keycode of the key pressed; 
	 *  `ctrl`, `shift` and `meta` are modifier keys; and `jquery`, the original JQuery event.
	 * @type dusk.EventDispatcher
	 * @since 0.0.17-alpha
	 */
	this.keyPress = new dusk.EventDispatcher("dusk.sgui.Component.keyPress", dusk.EventDispatcher.MODE_AND);
	/** Fired when a directional key (up, down, left, right) is pressed.
	 * 
	 * The event object has two properties, `dir`, one of the constants `DIR_*` indicating a direction, 
	 *  and `e` the actual keypress event.
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
	 * This is in AND mode, so that any function registered to this that returns `false`
	 *  will stop the event bubbling to the container component.
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
	
	/** The supported ways in which this component can render itself.
	 * 
	 * This is a bitmask using the `REND_*` constants.
	 * @type integer
	 * @default dusk.sgui.Component.REND_LOCATION
	 * @since 0.0.18-alpha
	 */
	this.renderSupport = dusk.sgui.Component.REND_LOCATION;
	
	/** A mapper used to map JSON properties to the properties on this object.
	 * @type dusk.Mapper
	 * @protected
	 */
	this._props = new dusk.Mapper(this);
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
	
	/** Current x location of the mouse, relative to this component.
	 * @type integer
	 * @protected
	 * @since 0.0.20-alpha
	 */
	this._mouseX = 0;
	/** Current y location of the mouse, relative to this component.
	 * @type integer
	 * @protected
	 * @since 0.0.20-alpha
	 */
	this._mouseY = 0;
	/** Whether focus should be changed to this component if the user rolls over it with the mouse, and the container
	 *  allows it.
	 * 
	 * The default value of this varies on the type, things like buttons have it as true, other things have false.
	 * @type boolean
	 * @since 0.0.20-alpha
	 */
	this.allowMouse = false;
	/** Whether clicking on this component will triger it's action.
	 * 
	 * @type boolean
	 * @since 0.0.20-alpha
	 * @default true
	 */
	this.mouseAction = true;
	/** Fired when this component is clicked on.
	 * 
	 * The event object has at least a property `button`, which is the number of the button clicked.
	 * @type dusk.EventDispatcher
	 */
	this.onClick = new dusk.EventDispatcher("dusk.sgui.Component.onClick", dusk.EventDispatcher.MODE_AND);
	
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
	
	/** Stores all the extras connected to this component. Key names are extra names, and the values are the values.
	 * @type object
	 * @private
	 * @since 0.0.18-alpha
	 */
	this._extras = {};
	
	/** The component's type. Setting this to a string will change the component to that type.
	 * @type string
	 * @since 0.0.20-alpha
	 */
	this.type = null;
	
	//Prop masks
	this._registerPropMask("x", "x");
	this._registerPropMask("xOrigin", "xOrigin");
	this._registerPropMask("y", "y");
	this._registerPropMask("yOrigin", "yOrigin");
	this._registerPropMask("width", "width");
	this._registerPropMask("height", "height");
	this._registerPropMask("alpha", "alpha");
	this._registerPropMask("visible", "visible");
	this._registerPropMask("mark", "mark");
	this._registerPropMask("activeBorder", "activeBorder");
	this._registerPropMask("upFlow", "upFlow");
	this._registerPropMask("downFlow", "downFlow");
	this._registerPropMask("leftFlow", "leftFlow");
	this._registerPropMask("rightFlow", "rightFlow");
	this._registerPropMask("enabled", "enabled");
	this._registerPropMask("deleted", "deleted");
	this._registerPropMask("name", "comName");
	this._registerPropMask("style", "style");
	this._registerPropMask("layer", "__layer");
	this._registerPropMask("extras", "__extras");
	this._registerPropMask("type", "type");
	this._registerPropMask("allowMouse", "allowMouse");
	this._registerPropMask("mouseAction", "mouseAction");
};

/** Components which support this (and all must do so) must support being drawn at arbitary locations.
 * 
 * They should use the `destX` and `destY` properties of the rendering data as the x and y coordinates to draw on.
 * @type integer
 * @value 0x01
 * @constant
 * @memberof dusk.sgui.Component
 * @since 0.0.18-alpha
 */
dusk.sgui.Component.REND_LOCATION = 0x01;

/** Components which support this must support their image being rendered starting from an arbitary point.
 * 
 * They should use the `sourceX` and `sourceY` properties of the rendering data 
 *  as the x and y coordinates of the source image.
 * @type integer
 * @value 0x02
 * @constant
 * @memberof dusk.sgui.Component
 * @since 0.0.18-alpha
 */
dusk.sgui.Component.REND_OFFSET = 0x02;

/** Components which support this must support their image being rendered with an arbitary width and height.
 * 
 * They should use the `width` and `height` properties of the rendering data 
 *  (which may be different from the component's width and hight) as the width and height to draw of the image.
 * @type integer
 * @value 0x04
 * @constant
 * @memberof dusk.sgui.Component
 * @since 0.0.18-alpha
 */
dusk.sgui.Component.REND_SLICE = 0x04;


/** The origin point of the component will be either the top or the left of its container.
 * @type integer
 * @value 0
 * @constant
 * @memberof dusk.sgui.Component
 * @since 0.0.18-alpha
 */
dusk.sgui.Component.ORIGIN_MIN = 0;

/** The origin point of the component will be either the bottom or right of its container.
 * @type integer
 * @value 1
 * @constant
 * @memberof dusk.sgui.Component
 * @since 0.0.18-alpha
 */
dusk.sgui.Component.ORIGIN_MAX = 1;

/** The origin point of the component will be the centre of its container.
 * @type integer
 * @value 2
 * @constant
 * @memberof dusk.sgui.Component
 * @since 0.0.18-alpha
 */
dusk.sgui.Component.ORIGIN_MIDDLE = 2;

/** This causes the component to handle a keypress, it should be called by ether it's parent container or SimpleGui.
 * 
 * If the component running this is a container 
 *  then it's `{@link dusk.sgui.IContainer#containerKeypress}` function will be called.
 *	If that function returns true, then this shall return true without doing anything else.
 * 
 * This function will first check the key to see if it is a direction or the action key,
 *  if it is ether the action handlers or the "directionAction"s are called. 
 *  Otherwise it looks for a keyhandler.
 *  If all of the action handlers or keyhandlers returns true, then this function will return true.
 *
 * This function returns true if either at least one keyHandler (including action and direction) returns true, 
 *  or the control flows into another component.
 *	If this returns false, then the event must not be ran by its container.
 * 
 * @param {object} e The JQuery keypress object that should be ran.
 * @return {boolean} Whether the parent container should run it's own actions.
 */
dusk.sgui.Component.prototype.doKeyPress = function (e) {
	if(dusk.utils.doesImplement(this, dusk.sgui.IContainer) && !this.containerKeypress(e)){return false;}
	
	var eventObject = {"key":e.keyCode, "shift":e.shiftKey, "ctrl":e.ctrlKey, "meta":e.metaKey, "jquery":e};
	
	this._noFlow = false;
	
	var dirReturn = true;
	if(this.keyPress.fire(eventObject)) {
		//Directions
		if(dusk.controls.checkKey("sgui_left", e.which)) {
			if((dirReturn = this.dirPress.fire({"dir":dusk.sgui.c.DIR_LEFT, "e":e})) && !this._noFlow
			&& this.leftFlow && this.container.flow(this.leftFlow)) return false;
		}else if(dusk.controls.checkKey("sgui_up", e.which)) {
			if((dirReturn = this.dirPress.fire({"dir":dusk.sgui.c.DIR_UP, "e":e})) && !this._noFlow
			&& this.upFlow && this.container.flow(this.upFlow)) return false;
		}else if(dusk.controls.checkKey("sgui_right", e.which)) {
			if((dirReturn = this.dirPress.fire({"dir":dusk.sgui.c.DIR_RIGHT, "e":e})) && !this._noFlow
			&& this.rightFlow && this.container.flow(this.rightFlow)) return false;
		}else if(dusk.controls.checkKey("sgui_down", e.which)) {
			if((dirReturn = this.dirPress.fire({"dir":dusk.sgui.c.DIR_DOWN, "e":e})) && !this._noFlow
			&& this.downFlow && this.container.flow(this.downFlow)) return false;
		}else if(dusk.controls.checkKey("sgui_action", e.which)) {
			return this.action.fire({"keyPress":e});
		}
	}
	
	return dirReturn;
};

/** Handles a mouse click. This will fire `{@link dusk.sgui.Component.onClick}`, and possibly fire the 
 *  `{@link dusk.sgui.Component.action}` handler.
 * 
 * If the component running this is a container 
 *  then it's `{@link dusk.sgui.IContainer#containerClick}` function will be called.
 *	If that function returns true, then this shall return true without doing anything else.
 * 
 * @param {object} e The click event.
 * @return {boolean} Whether the parent container should run it's own actions.
 */
dusk.sgui.Component.prototype.doClick = function (e) {
	if(dusk.utils.doesImplement(this, dusk.sgui.IContainer) && !this.containerClick(e)){return false;}
	
	if(this.onClick.fire(e)) {
		if(this.mouseAction) {
			return this.action.fire({"click":e});
		}
	}
	
	return true;
};

/** This maps a property from the JSON representation of the object (One from {@link #parseProps})
 *  to the JavaScript representation of the object.
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
	this._props.map(name, mask, depends);
};

/** Adds new dependancies to an existing property mask.
 * 
 * @param {string} name The property to add dependencies of.
 * @param {string|array} depends A string name, or array of such, of dependancies to add.
 * @protected
 * @since 0.0.17-alpha
 */
dusk.sgui.Component.prototype._addNewPropDepends = function(name, depends) {
	this._props.addDepends(name, depends);
};

/** Given an object, this function sets the properties of this object in relation to the properties of the object.
 * 
 * This is used to describe the component using JSON, for quicker efficiency.
 * 
 * The properties of the `props` object tend to match up with the names of public properties of the class
 *  (any changes will be noted in the documentation).
 * 
 * This function will loop through all the properties is `props`
 *  and set that value to the corresponding value in this object.
 * 
 * @param {object} props The object to read the properties off.
 * @see {@link dusk.sgui.Component#_registerPropMask}
 */
dusk.sgui.Component.prototype.parseProps = function(props) {
	this._props.massSet(props);
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
	if(value === undefined) return this._props.get(name);
	
	return this._props.set(name, value);
};

/** "Bundles up" the component into a simple object.
 * 
 * This loops through all the registered propHandlers and sets them on an object.
 * 	This object should be able to describe the component.
 * @return {object} A representation of this component.
 * @since 0.0.17-alpha
 */
dusk.sgui.Component.prototype.bundle = function() {
	return this._props.massGet();
};



//deleted
Object.defineProperty(dusk.sgui.Component.prototype, "deleted", {
	set: function (value) {
		if(value && !this._deleted) {
			this._deleted = true;
			this.container.deleteComponent(this.comName);
		}
	},
	
	get: function() {
		return this._deleted;
	}
});



/** Requests the component to draw itself onto the specified 2D canvas context.
 * 
 * You should use `{@link dusk.sgui.Component#_prepareDraw}` instead of overriding this.
 * 
 * @param {object} d An object describing where and how the conponent is to draw itself.
 * @param {CanvasRenderingContext2D} c The canvas context to draw onto.
 */
dusk.sgui.Component.prototype.draw = function(d, c) {
	if(!this.visible || this.alpha <= 0) return;
	
	var oldAlpha = -1;
	var alpha = d.alpha;
	if(this.alpha != c.globalAlpha && this.alpha != 1) {
		oldAlpha = c.globalAlpha;
		alpha *= this.alpha;
		c.globalAlpha = alpha;
	}
	
	this.prepareDraw.fire({"d":d, "c":c, "alpha":alpha});

	if(this.mark !== null) {
		c.strokeStyle = this.mark;
		c.strokeRect(d.destX, d.destY, d.width, d.height);
	}
	
	if(this.activeBorder !== null && this._active) {
		c.strokeStyle = this.activeBorder;
		c.strokeRect(d.destX+0.5, d.destY+0.5, d.width-1, d.height-1);
	}
	
	if(oldAlpha >= 0) c.globalAlpha = oldAlpha;
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
	if(this.container) {
		this.container.alterChildLayer(this.comName, alteration);
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
			if(path.length) return this.container.path(path);
			return this.container;
		
		case ".":
			return this;
		
		case "":
			if(!path.length) return this;
			if(this instanceof dusk.sgui.Pane) return this.path(path);
			return this.container.path(path);
		
		default:
			if(dusk.utils.doesImplement(this, dusk.sgui.IContainer)){
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
	
	if(dusk.utils.doesImplement(this, dusk.sgui.IContainer)) return this.container.fullPath() + this.comName+"/";
	
	return this.container.fullPath() + this.comName;
};


/** Adds the specified extra to this component.
 * @param {string} type The class name of the extra to add.
 * @param {string} name The name to give the extra.
 * @param {object} data Initial properties of the extra.
 * @since 0.0.18-alpha
 */
dusk.sgui.Component.prototype.addExtra = function(type, name, data) {
	this._extras[name] = new (dusk.sgui.getExtra(type))(this, name);
	this._extras[name].parseProps(data);
};

/** Removes a previously added extra from this component, if it exists.
 * @param {string} name The name of the extra to remove.
 * @return {boolean} Whether the extra exists and was removed.
 * @since 0.0.18-alpha
 */
dusk.sgui.Component.prototype.removeExtra = function(name) {
	if(name in this._extras) {
		this._extras[name].onDelete.fire();
		delete this._extras[name];
		return true;
	}
	
	return false;
};

/** Modifies an extra, if it exists.
 * 	If it does not exist, it will be attempted to be created with the type specified by the "type" property
 *  or it will fail and do nothing with a warning.
 * @param {string} name The name of the extra to modify.
 * @param {object} data The data to use to modify.
 * @since 0.0.18-alpha
 */
dusk.sgui.Component.prototype.modExtra = function(name, data) {
	if(name in this._extras) {
		this._extras[name].parseProps(data);
	}else if("type" in data) {
		this.addExtra(data.type, name, data);
	}else{
		console.warn("Tried to modify "+name+", but it does not exist and has no type.");
	}
};

/** Returns the extra with the specified name, or null.
 * @param {string} name The name of the extra to get.
 * @return {?dusk.sgui.extras.Extra} The extra.
 * @since 0.0.18-alpha
 */
dusk.sgui.Component.prototype.getExtra = function(name) {
	if(name in this._extras) return this._extras[name];
	return null;
};

/** Returns the extra with the specified type or null.
 * @param {string} type The name of the type of extra to get.
 * @return {?dusk.sgui.extras.Extra} The first extra found of that type, or null.
 * @since 0.0.18-alpha
 */
dusk.sgui.Component.prototype.getExtraByType = function(type) {
	for(var p in this._extras) {
		if(this._extras[p] instanceof dusk.sgui.getExtra(type)) return this._extras[p];
	}
	
	return null;
};

/** Returns the extra with the specified type, if it doesn't exist, it checks if the parent has it, and so on.
 * @param {string} type The name of the type of extra to get.
 * @return {?dusk.sgui.extras.Extra} The first extra found of that type, or null.
 * @since 0.0.18-alpha
 */
dusk.sgui.Component.prototype.getExtraByTypeFromParents = function(type) {
	if(this.getExtraByType(type)) return this.getExtraByType(type);
	if(this.container) return this.container.getExtraByTypeFromParents(type);
	return null;
};

/** Modifies multiple extras. The argument is an object. Keys are the name of the extra to edit/create,
 * 	and the value is either an object describing properties of the extra, or false to explictly delete the extra.
 * 
 * This may be used in the JSON representation with the property "extras".
 * 
 * @param {object} data Data to describe the extras, as described above.
 * @since 0.0.18-alpha
 */
dusk.sgui.Component.prototype.modExtras = function(data) {
	for(var p in data) {
		if(data[p]) {
			this.modExtra(p, data[p]);
		}else{
			this.removeExtra(p);
		}
	}
};
Object.defineProperty(dusk.sgui.Component.prototype, "__extras", {
	set: function(value) {this.modExtras(value);},
	
	get: function() {return {};}
});


/** Updates the locatons of the mouse for this component.
 * 
 * If this is a container, `{@link dusk.sgui.IContainer.containerUpdateMouse}` is called.
 * @param {integer} x New x coordinate.
 * @param {integer} y New y coordinate.
 * @since 0.0.20-alpha
 */
dusk.sgui.Component.prototype.updateMouse = function(x, y) {
	this._mouseX = x;
	this._mouseY = y;
	
	if(dusk.utils.doesImplement(this, dusk.sgui.IContainer)) this.containerUpdateMouse();
};

/** Returns a string representation of the component. 
 * 
 * @return {string} A string representation of this component.
 */
dusk.sgui.Component.prototype.toString = function() {return "[sgui "+dusk.sgui.getTypeName(this)+" "+this.comName+"]";};


//type
Object.defineProperty(dusk.sgui.Component.prototype, "type", {
	set: function(value) {
		if(value && value != dusk.sgui.getTypeName(this)) {
			this.deleted = true;
			
			var data = this.bundle();
			data.type = value;
			data.deleted = false;
			
			this.container.getComponent(this.comName, value).parseProps(data);
			dusk.sgui.applyStyles(this.container.getComponent(this.comName));
		}
	},
	
	get: function() {
		return dusk.sgui.getTypeName(this);
	}
});

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

/** A NullComponent bundles up as an empty object.
 * 
 * @return {object} An empty object.
 * @since 0.0.19-alpha
 */
dusk.sgui.NullCom.prototype.bundle = function() {return {};}

Object.seal(dusk.sgui.NullCom);
Object.seal(dusk.sgui.NullCom.prototype);

dusk.sgui.registerType("NullCom", dusk.sgui.NullCom);
