//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

load.provide("dusk.sgui.Component", (function() {
	var utils = load.require("dusk.utils");
	var EventDispatcher = load.require("dusk.utils.EventDispatcher");
	var controls = load.require("dusk.input.controls");
	var sgui = load.require("dusk.sgui");
	var Mapper = load.require("dusk.utils.Mapper");
	var MouseAugment = load.require("dusk.sgui.MouseAugment");
	var Pool = load.require("dusk.utils.Pool");
	var Group = load.suggest("dusk.sgui.Group", function(p) {Group = p});
	var c = load.require("dusk.sgui.c");
	var Root = load.suggest("dusk.sgui.Root", function(p) {Root = p});
	var interaction = load.require("dusk.input.interaction");
	
	/** A component is a single "thing" that exists in the SimpleGui system. Everything in the Simple GUI system that
	 *  wants to be displayed should have this in its prototype chain.
	 * 
	 * This class doesn't actually display anything itself, classes that inherit from it do. The properties for this
	 *  apply to all components.
	 * 
	 * More information about how this class works is in the documentation for `dusk.sgui`.
	 * 
	 * @param {?dusk.sgui.Group} parent The container that this component is in.
	 * @param {string} componentName The name of the component.
	 * @see {@link dusk.sgui}
	 * @constructor
	 */
	var Component = function (parent, componentName) {
		/** The parent container that this component is inside.
		 * @type ?dusk.sgui.Component
		 */
		this.container = parent===undefined?null:parent;
		/** This component's name.
		 * @type string
		 */
		this.name = componentName;
		
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
		
		/** The display mode of the component in the horizontal direction.
		 * 
		 * Must be one of "fixed" or "expand".
		 * @type string
		 * @default "fixed"
		 * @since 0.0.21-alpha
		 */
		this.xDisplay = "fixed";
		/** The display mode of the component in the vertical direction.
		 * 
		 * Must be one of "fixed" or "expand".
		 * @type string
		 * @default "fixed"
		 * @since 0.0.21-alpha
		 */
		this.yDisplay = "fixed";
		
		/** The components x coordinate when the display mode is "fixed".
		 * @type integer
		 */
		this.x = 0;
		/** The origin point for the x coordinate, this describes where the x coordinate "begins".
		 * 
		 * Must be one of "left", "middle" or "right".
		 * @type string
		 * @default "left"
		 * @since 0.0.18-alpha
		 */
		this.xOrigin = "left";
		/** The components y coordinate when the display mode is "fixed".
		 * @type integer
		 */
		this.y = 0;
		/** The origin point for the y coordinate, this describes where the y coordinate "begins".
		 * 
		 * Must be one of "top", "middle" or "bottom".
		 * @type string
		 * @default "top"
		 * @since 0.0.18-alpha
		 */
		this.yOrigin = "top";
		
		/** The component's height, in pixels if the display mode is "fixed".
		 * 
		 * Some components do not support setting their dimensions,	in which case you cannot set this to anything other
		 *  than 0.
		 * @type integer
		 */
		this.height = 0;
		/** The component's width, in pixels, if the display mode is "fixed". 
		 * Some components do not support setting their dimensions, in which case you cannot set this to anything other
		 *  than 0.
		 * @type integer
		 */
		this.width = 0;
		/** When the display is "expand", this is empty space around the top, right, bottom and left side.
		 * @type array
		 * @since 0.0.21-alpha
		 */
		this.margins = [0, 0, 0, 0];
		
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
		
		/** Fired when a directional key (up, down, left, right) is pressed.
		 * 
		 * The event object has two properties, `dir`, one of the constants `DIR_*` indicating a direction, 
		 *  and `e` the actual keypress event.
		 * 
		 * For the component to flow to the relevent flow location, all listeners registered must return true.
		 * @type dusk.utils.EventDispatcher
		 * @since 0.0.17-alpha
		 */
		this.dirPress = new EventDispatcher(
			"dusk.sgui.Component.dirPress", EventDispatcher.FILTER_MULTI
		);
		/** Fired when an interaction event is fired.
		 * 
		 * All listeners must return true if you want it to bubble up to its parent.
		 * @type dusk.utils.EventDispatcher
		 * @since 0.0.21-alpha
		 */
		this.onInteract = new EventDispatcher("dusk.sgui.Component.onInteract");
		/** Fired when a control event is fired.
		 * 
		 * All listeners must return true if you want it to bubble up to its parent.
		 * @type dusk.utils.EventDispatcher
		 * @since 0.0.21-alpha
		 */
		this.onControl = new EventDispatcher("dusk.sgui.Component.onControl", EventDispatcher.FILTER_ISIN);
		/** An event dispatcher that is fired once per frame.
		 * 
		 * The event object has no properties.
		 * @type dusk.utils.EventDispatcher
		 * @since 0.0.17-alpha
		 */
		this.frame = new EventDispatcher("dusk.sgui.Component.frame");
		/** An event dispatcher that is fired when the action control `"sgui_action"` is pressed.
		 * 	By default, this is the "space" key, and should be the key that would press a button, or so.
		 * 
		 * This is in AND mode, so that any function registered to this that returns `false`
		 *  will stop the event bubbling to the container component.
		 * 
		 * This has a single event object, `component`, which is the component that fired this event.
		 * @type dusk.utils.EventDispatcher
		 * @since 0.0.17-alpha
		 */
		this.action = new EventDispatcher("dusk.sgui.Component.action");
		/** An event dispatcher that is fired when the action control `"sgui_cancel"` is pressed.
		 * 	By default, this is the "esc" key, and should be the key that would cancel a selection.
		 * 
		 * This is in AND mode, so that any function registered to this that returns `false`
		 *  will stop the event bubbling to the container component.
		 * 
		 * This has a single event object, `component`, which is the component that fired this event.
		 * @type dusk.utils.EventDispatcher
		 * @since 0.0.21-alpha
		 */
		this.cancel = new EventDispatcher("dusk.sgui.Component.cancel");
		/** Fired as part of the drawing proccess.
		 * 
		 * The event object is a 2D canvas rendering context, which is expected to be drawn on.
		 * @type dusk.utils.EventDispatcher
		 * @since 0.0.17-alpha
		 */
		this.prepareDraw = new EventDispatcher("dusk.sgui.Component.prepareDraw");
		
		/** A mapper used to map JSON properties to the properties on this object.
		 * @type dusk.utils.Mapper
		 * @protected
		 */
		this._mapper = new Mapper(this);
		/** An event dispatcher which fires when the element is deleted.
		 * 
		 * The event object has a single property named `component`, which is this.
		 * 
		 * @type dusk.utils.EventDispatcher
		 * @since 0.0.15-alpha
		 */
		this.onDelete = new EventDispatcher("dusk.sgui.Component.onDelete");
		
		/** An event dispatcher that fires when an augment is added to this component.
		 * 
		 * The event object has a single property named `augment` which is the name of the augment added. At the moment
		 *  only `"mouse"` can be added.
		 * 
		 * @type dusk.utils.EventDispatcher
		 * @since 0.0.21-alpha
		 */
		this.augment = new EventDispatcher("dusk.sgui.Component.augment");
		
		/** The component's "style", or an array of such values. Used for styling.
		 * @type string|array
		 * @default ""
		 */
		this.style = "";
		
		/** The mouse augment, for use if the mouse is enabled. This may be null if there is no mouse augment enabled on
		 *  this component. Use `{@link dusk.sgui.Component#ensureMouse}` to add a mouse augment.
		 * @type ?dusk.sgui.MouseAugment
		 * @since 0.0.21-alpha
		 */
		this.mouse = null;
		
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
		 */
		this.focused = false;
		/** Whether this component is currently the active one.
		 * @type boolean
		 * @default false
		 */
		this.active = false;
		/** Fired whenever this component becomes focused, or looses focus.
		 * 
		 * The event object has a single property, `focus`, which is true if and only if the component is now focused.
		 * @type dusk.utils.EventDispatcher
		 */
		this.onFocusChange = new EventDispatcher("dusk.sgui.Component.onFocusChange");
		this.onFocusChange.listen((function(e){this.focused = e.focus;}).bind(this));
		/** Fired whenever this component becomes active, or stops being active.
		 * 
		 * The event object has a single property, `active`, which is true if and only if the component is now active.
		 * @type dusk.utils.EventDispatcher
		 */
		this.onActiveChange = new EventDispatcher("dusk.sgui.Component.onActiveChange");
		this.onActiveChange.listen((function(e){this.active = e.active;}).bind(this));
		
		/** If this component becomes focused, then the components specified by these paths will also become focused.
		 * 
		 * @type array
		 * @since 0.0.21-alpha
		 */
		this.alsoFocus = [];
		this.onFocusChange.listen((function(e){
			if(this.alsoFocus) {
				for(var i = this.alsoFocus.length-1; i >= 0; i --) {
					if(this.path(this.alsoFocus[i]) && this.path(this.alsoFocus[i]).container) {
						this.path(this.alsoFocus[i]).container.flow(this.path(this.alsoFocus[i]).name);
					}
				}
			}
		}).bind(this), true);
		
		/** If this component's action fires, then the components specified by these paths will become focused.
		 * 
		 * If any components are focused due to this, then the action event isn't bubbled to the container.
		 * 
		 * @type array
		 * @since 0.0.21-alpha
		 */
		this.actionFocus = [];
		this.action.listen((function(e){
			var toReturn = true;
			if(this.actionFocus) {
				for(var i = this.actionFocus.length-1; i >= 0; i --) {
					if(this.path(this.actionFocus[i]) && this.path(this.actionFocus[i]).container) {
						this.path(this.actionFocus[i]).container.flow(this.path(this.actionFocus[i]).name);
						toReturn = false;
					}
				}
			}
			return toReturn;
		}).bind(this));
		
		/** If the component is deleted from its group.
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
		
		//Mouse digging
		if(this.container && this.container.mouse && this.container.mouse.childrenAllow) {
			this.ensureMouse();
			this.mouse.childrenAllow = true;
			this.mouse.focus = true;
		}
		
		//Prop masks
		this._mapper.map("xDisplay", "xDisplay");
		this._mapper.map("yDisplay", "yDisplay");
		this._mapper.map("margins", "margins");
		this._mapper.map("x", "x");
		this._mapper.map("xOrigin", "xOrigin");
		this._mapper.map("y", "y");
		this._mapper.map("yOrigin", "yOrigin");
		this._mapper.map("width", "width");
		this._mapper.map("height", "height");
		this._mapper.map("alpha", "alpha");
		this._mapper.map("visible", "visible");
		this._mapper.map("mark", "mark");
		this._mapper.map("activeBorder", "activeBorder");
		this._mapper.map("upFlow", "upFlow");
		this._mapper.map("downFlow", "downFlow");
		this._mapper.map("leftFlow", "leftFlow");
		this._mapper.map("rightFlow", "rightFlow");
		this._mapper.map("enabled", "enabled");
		this._mapper.map("deleted", "deleted");
		this._mapper.map("name", "name");
		this._mapper.map("style", "style");
		this._mapper.map("layer", "__layer");
		this._mapper.map("extras", "__extras");
		this._mapper.map("type", "type");
		this._mapper.map("mouse", "__mouse");
		this._mapper.map("allowMouse", "mouse.allow", ["mouse"]);
		this._mapper.map("mouse.allow", "mouse.allow", ["mouse"]);
		this._mapper.map("mouseAction", "mouse.action", ["mouse"]);
		this._mapper.map("mouse.action", "mouse.action", ["mouse"]);
		this._mapper.map("clickPierce", "mouse.clickPierce", ["mouse"]);
		this._mapper.map("mouse.clickPierce", "mouse.clickPierce", ["mouse"]);
		this._mapper.map("alsoFocus", "alsoFocus");
		this._mapper.map("actionFocus", "actionFocus");
	};
	
	
	/** This causes the component to handle an interaction, it should be called by either its parent container or
	 *  SimpleGui.
	 * 
	 * This function will first check the interaction to see if it is bound to the direction or the action control, if
	 *  it is ether the action handlers or the "directionAction"s are called. Otherwise it looks for a keyhandler. If
	 *  all of the action handlers or keyhandlers returns true, then this function will return true.
	 * 
	 * This function returns true if either at least one keyHandler (including action and direction) returns true, or 
	 *  the control flows into another component. If this returns false, then the event must not be ran by its 
	 *  container.
	 * 
	 * @param {object} e The interaction event.
	 * @param {boolean} nofire If true then the event listeners for interactions, dir presses, action and cancel won't
	 *  be fired and this returns false.
	 * @return {boolean} Whether the parent container should run its own actions.
	 */
	Component.prototype.interact = function(e, nofire) {
		this._noFlow = false;
		
		// If it is a mouse move, update the coordinates
		if(this.mouse && e.type == interaction.MOUSE_MOVE) {
			var destX = 0;
			var destY = 0;
			
			var destXAdder = 0;
			var destYAdder = 0;
			
			if(this.container) {
				destX = this.container.mouse.x;
				destY = this.container.mouse.y;
				
				if(this.xOrigin == "right") destXAdder = this.container.width - this.width;
				if(this.xOrigin == "middle") destXAdder = (this.container.width - this.width)>>1;
				
				if(this.yOrigin == "bottom") destYAdder = this.container.height - this.height;
				if(this.yOrigin == "middle") destYAdder = (this.container.height - this.height)>>1;
				
				destX += -this.x + this.container.xOffset - destXAdder;
				destY += -this.y + this.container.yOffset - destYAdder;
			}else{
				destX = e.x;
				destY = e.y;
				
				if(this.xOrigin == "right") destXAdder = sgui.width - this.width;
				if(this.xOrigin == "middle") destXAdder = (sgui.width - this.width)>>1;
				
				if(this.yOrigin == "bottom") destYAdder = sgui.height - this.height;
				if(this.yOrigin == "middle") destYAdder = (sgui.height - this.height)>>1;
				
				destX += -this.x - destXAdder;
				destY += -this.y - destYAdder;
			}
			
			this.mouse.update(destX, destY);
		}
		
		if(nofire) return false;
		
		var dirReturn = this.onInteract.fireAnd(e, e.filter);
		
		if(dirReturn) {
			// Directions
			var cons = controls.interactionControl(e);
			if(cons.indexOf("sgui_left") !== -1) {
				if((dirReturn = this.dirPress.fireAnd({"dir":c.DIR_LEFT, "e":e}, c.DIR_LEFT)) && !this._noFlow
				&& this.leftFlow && this.container.flow(this.leftFlow)) return false;
			
			}else if(cons.indexOf("sgui_up") !== -1) {
				if((dirReturn = this.dirPress.fireAnd({"dir":c.DIR_UP, "e":e}, c.DIR_UP)) && !this._noFlow
				&& this.upFlow && this.container.flow(this.upFlow)) return false;
			
			}else if(cons.indexOf("sgui_right") !== -1) {
				if((dirReturn = this.dirPress.fireAnd({"dir":c.DIR_RIGHT, "e":e}, c.DIR_RIGHT)) && !this._noFlow
				&& this.rightFlow && this.container.flow(this.rightFlow)) return false;
			
			}else if(cons.indexOf("sgui_down") !== -1) {
				if((dirReturn = this.dirPress.fireAnd({"dir":c.DIR_DOWN, "e":e}, c.DIR_DOWN)) && !this._noFlow
				&& this.downFlow && this.container.flow(this.downFlow)) return false;
			
			}else if(cons.indexOf("sgui_action") !== -1) {
				return this.action.fireAnd({"keyPress":e, "component":this});
			}else if(cons.indexOf("sgui_cancel") !== -1) {
				return this.cancel.fireAnd({"keyPress":e, "component":this});
			}
		}
		
		return dirReturn;
	};
	
	/** This causes the component to handle a control event, it should be called by either its parent container or
	 *  SimpleGui.
	 * 
	 * This function returns true if either at least one keyHandler (including action and direction) returns true, or 
	 *  the control flows into another component. If this returns false, then the event must not be ran by its 
	 *  container.
	 * 
	 * @param {object} e An interaction event.
	 * @param {array} controls The controls that match this event.
	 * @return {boolean} Whether the parent container should run its own actions.
	 */
	Component.prototype.control = function(e, controls) {
		var dirReturn = this.onControl.fireAnd(e, controls);
		
		return dirReturn;
	};
	
	
	/** If there is no mouse augment on this component, adds one, otherwise does nothing.
	 * 
	 *  This will call the same function on it's container, if it has one, as well.
	 * @return {dusk.sgui.MouseAugment} The added or existing mouse augment.
	 * @since 0.0.21-alpha
	 */
	Component.prototype.ensureMouse = function() {
		if(this.container)
			this.container.ensureMouse();
		
		if(!this.mouse) {
			this.mouse = new MouseAugment(this);
			this.augment.fire({"augment":"mouse"}, "mouse");
		}
		
		return this.mouse;
	};
	Object.defineProperty(Component.prototype, "__mouse", {
		set: function(value) {if(value) this.ensureMouse()},
		
		get: function() {return this.mouse != null;}
	});
	
	/** Given an object, this function sets the properties of this object in relation to the properties of the object.
	 * 
	 * This is used to describe the component using JSON.
	 * 
	 * The properties of the `props` object tend to match up with the names of public properties of the class
	 *  (any changes will be noted in the documentation).
	 * 
	 * This function will loop through all the properties is `props`
	 *  and set that value to the corresponding value in this object.
	 * 
	 * @param {object} props The object to read the properties from.
	 */
	Component.prototype.update = function(props) {
		this._mapper.massSet(props);
	};
	
	/** Returns or sets a single property of the component.
	 *	See `{@link dusk.sgui.Component#update}` for details on how properties work.
	 * 
	 * If value is omitted, no value will be set.
	 * 
	 * @param {string} name The property to set.
	 * @param {?*} value The new value to set for the object.
	 * @return {?*} The (new) value of the object, or null if no property by that name can be handled.
	 * @see {dusk.sgui.Component#update}
	 */
	Component.prototype.prop = function(name, value) {
		if(value === undefined) return this._mapper.get(name);
		
		return this._mapper.set(name, value);
	};
	
	/** "Bundles up" the component into a simple object.
	 * 
	 * This loops through all the registered propHandlers and sets them on an object.
	 * 	This object should be able to describe the component.
	 * @return {object} A representation of this component.
	 * @since 0.0.17-alpha
	 */
	Component.prototype.bundle = function() {
		return this._mapper.massGet();
	};
	
	
	//deleted
	Object.defineProperty(Component.prototype, "deleted", {
		set: function (value) {
			if(value && !this._deleted) {
				this._deleted = true;
				this.container.deleteComponent(this.name);
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
	Component.prototype.draw = function(d, c) {
		if(!this.visible || this.alpha <= 0) return;
		
		var oldAlpha = -1;
		var alpha = d.alpha;
		if(this.alpha != c.globalAlpha && this.alpha != 1) {
			oldAlpha = c.globalAlpha;
			alpha *= this.alpha;
			c.globalAlpha = alpha;
		}
		
		var event = _prepareDrawPool.alloc();
		event.d = d;
		event.c = c;
		event.alpha = alpha;
		this.prepareDraw.fire(event);
		_prepareDrawPool.free(event);

		if(this.mark !== null) {
			c.strokeStyle = this.mark;
			c.strokeRect(d.dest.x, d.dest.y, d.dest.width, d.dest.height);
		}
		
		if(this.activeBorder !== null && this.active) {
			c.strokeStyle = this.activeBorder;
			c.strokeRect(d.dest.x+0.5, d.dest.y+0.5, d.dest.width-1, d.dest.height-1);
		}
		
		if(oldAlpha >= 0) c.globalAlpha = oldAlpha;
	};
	
	/** Alters the layer this is on.
	 *	This calls `{@link dusk.sgui.Group#alterChildLayer}` of its container.
	 * 
	 * This can be set in the JSON representation using the property `"layer"`
	 * 
	 * @param {string} alteration An alteration to make to the layer this component is on.
	 * @since 0.0.17-alpha
	 */
	Component.prototype.alterLayer = function(alteration) {
		if(this.container) {
			this.container.alterChildLayer(this.name, alteration);
		}
	};
	Object.defineProperty(Component.prototype, "__layer", {
		set: function(value) {this.alterLayer(value);},
		
		get: function() {return "";}
	});
	
	
	/** Resolves a path relative to the current component, or null, if it doesn't exist.
	 * 
	 * See `{@link dusk.sgui}` for a description on how paths work.
	 * 
	 * @param {string|array} path The path to resolve.
	 * @return {?dusk.sgui.Component} The component the path is a path to.
	 */
	Component.prototype.path = function(path) {
		if(!path){
			console.warn("Path '"+path+"' is undefined or empty.");
			return null;
		}
		
		if(path.indexOf(":") !== -1) return sgui.path(path);
		
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
				if(Root && this instanceof Root) return this.path(path);
				return this.container.path(path);
			
			default:
				if(Group && this instanceof Group){
					if(!path.length) return this.getComponent(p);
					if(this.getComponent(p)) {
						return this.getComponent(p).path(path);
					}else{
						return null;
					}
				}
				
				console.warn(path + " from " + this.name + " was not found.");
				return null;
		}
	};
	
	/** Returns the full path of this component.
	 * 
	 * This should be able to be given to `{@link dusk.sgui.path}` and will point to this component.
	 * @return {string} A full path to this component.
	 * @since 0.0.17-alpha
	 */
	Component.prototype.fullPath = function() {
		return this.container.fullPath() + "/" + this.name;
	};
	
	
	/** Adds the specified extra to this component.
	 * @param {string} type The class name of the extra to add.
	 * @param {string} name The name to give the extra.
	 * @param {object} data Initial properties of the extra.
	 * @since 0.0.18-alpha
	 */
	Component.prototype.addExtra = function(type, name, data) {
		this._extras[name] = new (sgui.getExtra(type))(this, name);
		this._extras[name].update(data);
	};
	
	/** Removes a previously added extra from this component, if it exists.
	 * @param {string} name The name of the extra to remove.
	 * @return {boolean} Whether the extra exists and was removed.
	 * @since 0.0.18-alpha
	 */
	Component.prototype.removeExtra = function(name) {
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
	Component.prototype.modExtra = function(name, data) {
		if(name in this._extras) {
			this._extras[name].update(data);
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
	Component.prototype.getExtra = function(name) {
		if(name in this._extras) return this._extras[name];
		return null;
	};
	
	/** Returns the extra with the specified type or null.
	 * @param {string} type The name of the type of extra to get.
	 * @return {?dusk.sgui.extras.Extra} The first extra found of that type, or null.
	 * @since 0.0.18-alpha
	 */
	Component.prototype.getExtraByType = function(type) {
		for(var p in this._extras) {
			if(this._extras[p] instanceof sgui.getExtra(type)) return this._extras[p];
		}
		
		return null;
	};
	
	/** Returns the extra with the specified type, if it doesn't exist, it checks if the parent has it, and so on.
	 * @param {string} type The name of the type of extra to get.
	 * @return {?dusk.sgui.extras.Extra} The first extra found of that type, or null.
	 * @since 0.0.18-alpha
	 */
	Component.prototype.getExtraByTypeFromParents = function(type) {
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
	Component.prototype.modExtras = function(data) {
		for(var p in data) {
			if(data[p]) {
				this.modExtra(p, data[p]);
			}else{
				this.removeExtra(p);
			}
		}
	};
	Object.defineProperty(Component.prototype, "__extras", {
		set: function(value) {this.modExtras(value);},
		
		get: function() {return {};}
	});
	
	/** Makes this component the active one, by making all its parents make it active.
	 * @param {?dusk.sgui.Component} child A child that wants to be made active.
	 * @since 0.0.21-alpha
	 */
	Component.prototype.becomeActive = function(child) {
		if("flow" in this && child) this.flow(child.name);
		
		this.container.becomeActive(this);
	};
	
	/** Returns a string representation of the component. 
	 * 
	 * @return {string} A string representation of this component.
	 */
	Component.prototype.toString = function() {
		return "[sgui "+sgui.getTypeName(this)+" "+this.name+"]";
	};
	
	
	//type
	Object.defineProperty(Component.prototype, "type", {
		set: function(value) {
			if(value && value != sgui.getTypeName(this)) {
				this.deleted = true;
				
				var data = this.bundle();
				data.type = value;
				data.deleted = false;
				
				this.container.getComponent(this.name, value).update(data);
				sgui.applyStyles(this.container.getComponent(this.name));
			}
		},
		
		get: function() {
			return sgui.getTypeName(this);
		}
	});
	
	/** Pool of event objects for `{@link dusk.sgui.Component#prepareDraw}`.
	 * @type dusk.utils.Pool<Object>
	 * @private
	 * @since 0.0.21-alpha
	 */
	var _prepareDrawPool = new Pool(Object);
	
	return Component;
})());

load.provide("dusk.sgui.NullCom", (function() {
	var Component = load.require("dusk.sgui.Component");
	var sgui = load.require("dusk.sgui");
	
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
	var NullCom = function(parent, name) {
		Component.call(this, parent, name);
		this.visible = false;
	};
	NullCom.prototype = Object.create(Component.prototype);
	
	/** A NullComponent bundles up as an empty object.
	 * 
	 * @return {object} An empty object.
	 * @since 0.0.19-alpha
	 */
	NullCom.prototype.bundle = function() {return {};}
	
	sgui.registerType("NullCom", NullCom);
	
	return NullCom;
})());
