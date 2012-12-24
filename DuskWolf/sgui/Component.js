//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

window.sgui = {};

dusk.load.provide("dusk.sgui.Component");
dusk.load.provide("dusk.sgui.NullCom");

/** Creates a new component. This should not be used to get an "empty component", you should use a {@link dusk.sgui.NullCom} for that.
 * 
 * @param {?dusk.sgui.Component} parent The container that this component is in.
 * @param {string} componentName The name of the component.
 * 
 * @class dusk.sgui.Component
 * 
 * @classdesc A component is a single "thing" that exists in the SimpleGui system. Everything in the Simple GUI system must have this (or a subclass of this) as a base class.
 * 
 * This class doesn't actually display anything itself, classes that inherit from it do.
 * 	The properties for this apply to all components.
 * 
 * @see {@link dusk.mods.simpleGui}
 */

/*
 * Supported Properties:
 * 
 * > x:123
 *	The x coordinate of this component, starting from the left of its container at 0.
 * 
 * > y:123
 *	The y coordinate of this component, starting from the top of its container at 0.
 * 
 * > width:123
 * 	The width of the component, in pixels.
 * 
 * > height:123
 * 	The height of the component, in pixels.
 * 
 * > alpha:123
 * 	How transparent the object is, in the range 0 (fully transparent) to 1 (opaque).
 * 
 * > visible:true
 * 	If this is false, the object will not be drawn on to the canvas.
 * 
 * > action:[...]
 * 	When the action button is pressed when this component is active, the actions here is ran.
 * 
 * > flow-up:"..."
 *	The component in this one's container that will be flowed into when the up button is pressed. If it is not a valid component, "blank" is flowed into.
 * 
 * > flow-up:"..."
 *	The component in this one's container that will be flowed into when the down button is pressed. If it is not a valid component, "blank" is flowed into.
 * 
 * > flow-up:"..."
 *	The component in this one's container that will be flowed into when the left button is pressed. If it is not a valid component, "blank" is flowed into.
 * 
 * > flow-up:"..."
 *	The component in this one's container that will be flowed into when the right button is pressed. If it is not a valid component, "blank" is flowed into.
 * 
 * > enabled:true
 *	If true, then the component can be flowed into, if not then the attempt to flow will fail.
 * 
 * > delete:true
 *	If true, then the component will be erased from it's container.
 * 
 * > fade:{("from":123,) ("speed":123,) ("end":123)}
 *	This creates a fade effect, which will change the alpha from the "from" value to the "end" value at "speed" alpha units per second. The defaults for "from", "speed" and "end" are 0, 1 and 0.05 respectively. 
 * 
 * > float:{("for":123,) ("speed":123,) ("dir":"...")}
 *	This creates a float effect. For "for" frames the component will move in direction "dir" (either "u", "d", "l" or "r" for the four main directions) "speed" pixels. The defaults for "for", "speed" and "dir" are 10, 5 and "u" respectively.
 */
dusk.sgui.Component = function (parent, componentName) {
	if(parent !== undefined){
		/** The parent container that this component is inside.
		 * @type ?dusk.sgui.Component
		 * @memberof dusk.sgui.Component
		 * @private
		 */
		this._container = parent;
		/** This components name.
		 * @type string
		 * @memberof dusk.sgui.Component
		 */
		this.comName = componentName;
		
		/** The components x coordinate.
		 * @type number
		 * @memberof dusk.sgui.Component
		 */
		this.x = 0;
		/** The components y coordinate.
		 * @type number
		 * @memberof dusk.sgui.Component
		 */
		this.y = 0;
		/** Whether the component will draw. If false, the component will not render.
		 * @type boolean
		 * @default true
		 * @memberof dusk.sgui.Component
		 */
		this.visible = true;
		/** The component's transparency. A number between 0 and 1, where 0 is fully transparent, and 1 is fully opaque. 
		 * @type number
		 * @default 1
		 * @memberof dusk.sgui.Component
		 */
		this.alpha = 1;
		/** The component's height, in pixels. 
		 * @type number
		 * @memberof dusk.sgui.Component
		 */
		this.height = 0;
		/** The component's width, in pixels. 
		 * @type number
		 * @memberof dusk.sgui.Component
		 */
		this.width = 0;
		/** If set to a string representing a colour ("#ff0000" or "red", for example) will draw a border of that colour around the component. This can be used to check if width and height are set properly.
		 * @type string
		 * @default null
		 * @memberof dusk.sgui.Component
		 */
		this.mark = null;
		
		/** If true, then the component will be "updated" for rendering.
		 * @type boolean
		 * @private
		 * @memberof dusk.sgui.Component
		 */
		this._redrawBooked = false;
		
		this.cache = false;
		this._cacheCanvas = dusk.utils.createCanvas(0, 0);

		/** The name of the group's component that will be focused when the left key is pressed and `{@link dusk.sgui.Component.leftDirection}` returns true.
		 * @type string
		 * @memberof dusk.sgui.Component
		 */
		this.leftFlow = "";
		/** The name of the group's component that will be focused when the right key is pressed and `{@link dusk.sgui.Component.rightDirection}` returns true.
		 * @type string
		 * @type string
		 * @memberof dusk.sgui.Component
		 */
		this.rightFlow = "";
		/** The name of the group's component that will be focused when the up key is pressed and `{@link dusk.sgui.Component.upDirection}` returns true.
		 * @type string
		 * @memberof dusk.sgui.Component
		 */
		this.upFlow = "";
		/** The name of the group's component that will be focused when the down key is pressed and `{@link dusk.sgui.Component.downDirection}` returns true.
		 * @type string
		 * @memberof dusk.sgui.Component
		 */
		this.downFlow = "";
		
		
		/** All the keyHandlers, each one is an array like `[key, shift, ctrl, funct, scope]`.
		 * 
		 * `key` is the keycode; `shift` and `ctrl` are modifier keys; `funct` is the function to call and `scope` is the scope in which to call the function.
		 * @type array
		 * @private
		 * @memberof dusk.sgui.Component
		 */
		this._keyHandlers = [];
		/** All the frameHandlers, each one is a function to be called each frame.
		 * @type array
		 * @private
		 * @memberof dusk.sgui.Component
		 */
		this._frameHandlers = [];
		/** All the actionHandlers, each one is a function mapped to the key of it's name.
		 * @type object
		 * @private
		 * @memberof dusk.sgui.Component
		 */
		this._actionHandlers = {};
		/** All the drawHandlers, each one is a function to be called with the canvas when rendering.
		 * @type array
		 * @private
		 * @memberof dusk.sgui.Component
		 */
		this._drawHandlers = [];
		/** A mapping of action object properties to real one. The key name is the action property name, and is an array in the form `[mask, redraw, depends]`.
		 * 
		 * `mask` is the actual property name that will be set/read, `redraw` is a boolean indecating that setting the variable books a redraw, and `depends` is an array of all the properties in the object that must be ran before this.
		 * @type object
		 * @private
		 * @memberof dusk.sgui.Component
		 */
		this._propMasks = {};
		

		/** Whether the component can become focused, if false it cannot be flowed into. 
		 * @type boolean
		 * @default true
		 * @memberof dusk.sgui.Component
		 */
		this.enabled = true;
		/** Whether the component can loose focus, if true it can't be flowed out of. 
		 * @type boolean
		 * @default false
		 * @memberof dusk.sgui.Component
		 */
		this.locked = false;
		
		/** Whether this component is focused or not.
		 * @type boolean
		 * @default false
		 * @protected
		 * @memberof dusk.sgui.Component
		 */
		this._focused = false;
		/** Whether this component is currently the active one.
		 * @type boolean
		 * @default false
		 * @protected
		 * @memberof dusk.sgui.Component
		 */
		this._active = false;

		/** The thread this component is currently running in. Note that this is not cleared if the component is not waiting. 
		 * @type string
		 * @memberof dusk.sgui.Component
		 * @protected
		 */
		this._thread = "";
		/** The number of times `{@link dusk.sgui.Component.awaitNext}` has been called, the number of "nexts" waited on.
		 * @type number
		 * @private
		 * @memberof dusk.sgui.Component
		 */
		this._open = 0;
		
		/** The speed of the currently running float effect. The component will move this number of frames every second.
		 * @type number
		 * @private
		 * @memberof dusk.sgui.Component
		 */
		this._floatSpeed = 0;
		/** The number of frames left on the component's float effect.
		 * @type number
		 * @private
		 * @memberof dusk.sgui.Component
		 */
		this._floatTime = 0;
		/** The direction of the current fade effect. Either "u", "d", "l" or "r".
		 * @type string
		 * @private
		 * @memberof dusk.sgui.Component
		 */
		this._floatDir = "u";
		
		/** The fade effect's speed, this is added to the component's alpha every frame untill `{@link dusk.sgui.Component.fadeEnd}` is reached.
		 * @type number
		 * @private
		 * @memberof dusk.sgui.Component
		 */
		this._fade = 0;
		/** The final value that the fade effect will reach.
		 * @type number
		 * @private
		 * @memberof dusk.sgui.Component
		 */
		this._fadeEnd = 0;
		
		//Add the core properties
		this._registerPropMask("x", "x", true);
		this._registerPropMask("y", "y", true);
		this._registerPropMask("width", "width", true);
		this._registerPropMask("height", "height", true);
		this._registerPropMask("alpha", "alpha", true);
		this._registerPropMask("visible", "visible", true);
		this._registerPropMask("mark", "mark", true);
		this._registerPropMask("flow-up", "upFlow", true);
		this._registerPropMask("flow-down", "downFlow", true);
		this._registerPropMask("flow-left", "leftFlow", true);
		this._registerPropMask("flow-right", "rightFlow", true);
		this._registerPropMask("enabled", "enabled", true);
		this._registerPropMask("action", "action", true);
		this._registerPropMask("fade", "fade", true);
		this._registerPropMask("float", "foat", true);
		this._registerPropMask("delete", "delete", true);
	}
};

/** The name of this component.
 * @type string
 * @static
 * @memberof dusk.sgui.Component
 * 
 */
dusk.sgui.Component.prototype.className = "Component";
/** Whether this compontent is a container. If true, then it MUST implement the interface IContainer.
 * @type boolean
 * @default false
 * @static
 * @memberof dusk.sgui.Component
 */
dusk.sgui.Component.prototype.isAContainer = false;


/** This adds a handler that will call the function once every frame.
 * @param {function()} funct The function to call, it will be passed no parameters.
 * @protected
 * @see {@link _clearFrameHandler}
 * @memberof dusk.sgui.Component
 */
dusk.sgui.Component.prototype._registerFrameHandler = function(funct) {
	this._frameHandlers.push(funct);
};

/** This removes a frame handler that has been set with `{@link _registerFrameHandler}`.
 * @param {function()} funct The function to remove.
 * 	This must be the same function used in the call to {@link _registerFrameHandler}.
 * @protected
 * @memberof dusk.sgui.Component
 */
dusk.sgui.Component.prototype._clearFrameHandler = function(funct) {
	for(var i in this._frameHandlers) {
		if(this._frameHandlers[i] == funct) delete this._frameHandlers[i];
	}
};

/** This function should be called every frame by {@link dusk.mods.simpleGui}. It calls all of this component's frame handlers once.
 * @memberof dusk.sgui.Component
 */
dusk.sgui.Component.prototype.frame = function() {
	for(var a = this._frameHandlers.length-1; a >= 0; a--){
		if(this._frameHandlers[a]) this._frameHandlers[a].call(this);
	}
};


/** 
 * This registers a handler to respond to a keypress.
 * 	Only one key can have a handler, though SHIFT and CTRL modifiers on that same key can have different (or no) handlers.
 * 
 * If there is no event for a key which has shift set to true, but there is one where shift is set to false that one will be called.
 * 	You can also set the keycode to be -1, and it will handle all keys.
 * 
 * @param {number} key The keycode to respond to, it should be a JavaScript keycode.
 * @param {boolean} shift Whether the shift key must be held down to trigger the handler.
 * @param {boolean} ctrl Whether the ctrl key must be held down as well.
 * @param {function(object):boolean} funct The function to call, it is given a single param, a JQuery keyboard event.
 * 	It must also return a Boolean, if true then the keypress will not be processed by it's parent container.
 * @protected
 */
dusk.sgui.Component.prototype._registerKeyHandler = function (key, shift, ctrl, funct, scope) {
	for (var i = this._keyHandlers.length-1; i >= 0; i--) {
		if(this._keyHandlers[i][0] == key && this._keyHandlers[i][1] == shift && this._keyHandlers[i][2] == ctrl){
			console.warn(key+" on "+this.comName+" is already registered.");
			return;
		}
	}
	
	this._keyHandlers.push([key, shift, ctrl, funct, scope]);
};

/** This adds a handler that will call the function when the "Action button" is pressed.
 * 	This is, by default the space bar, but it is the "main button" on the keyboard.
 * 	Pressing it should do whatever the selected thing should do, for a button it would do whatever the main function of a button is, for example.
 * 
 * @param {string} name The name of the handler, this is for identifying it.
 * @param {function(Object):boolean} funct The function to call, it will be passed a single parameter, a JQuery keyboard event.
 * 	It should return a boolean, if true then the action will not "bubble"; the container that this component is in will not handle the event.
 * @protected
 */
dusk.sgui.Component.prototype._registerActionHandler = function(name, funct, scope) {
	this._actionHandlers[name] = funct;
};

/** This causes the component to handle a keypress, it should be called by ether it's parent container or SimpleGui.
 * 
 * If the component running this is a container, then it's `{@link dusk.sgui.Component.containerKeypress}` function will be called.
 *	If that function returns true, then this shall return true without doing anything else.
 * 
 * This function will first check the key to see if it is a direction or the action key, if it is ether the action handlers or the "directionAction"s are called. Otherwise it looks for a keyhandler. If any of the action handlers or keyhandlers returns true, then this function will return true.
 *
 * This function returns true if either at least one keyHandler (including action and direction) returns true, or the control flows into another component.
 *	If this returns true, then the event must not be ran by it's container.
 * 
 * @param {object} e The JQuery keypress object that should be ran.
 * @return {boolean} Whether the parent container should run it's own actions.
 * 
 * @see {@link dusk.sgui.Component._registerKeyHandler}
 * @see {@link dusk.sgui.Component._registerActionHandler}
 * @see {@link dusk.sgui.Component._leftAction}
 * @see {@link dusk.sgui.Component._rightAction}
 * @see {@link dusk.sgui.Component._upAction}
 * @see {@link dusk.sgui.Component._downAction}
 */
dusk.sgui.Component.prototype.keypress = function (e) {
	if(this.isAContainer && this.containerKeypress(e)){return true;}
	
	for(var y = this._keyHandlers.length-1; y >= 0; y--){
		if(this._keyHandlers[y][0] < 0 && this._keyHandlers[y][1] == e.shiftKey  && this._keyHandlers[y][2] == e.ctrlKey){
			if(this._keyHandlers[y][3].call(this, e)){
				return true;
			}
		}
	}
	
	if(e.shiftKey){
		for (var z = this._keyHandlers.length-1; z >= 0; z--) {
			if (this._keyHandlers[z][0] < 0 && this._keyHandlers[z][1] == false && this._keyHandlers[z][2] == e.ctrlKey) {
				if (this._keyHandlers[z][3].call(this, e)) {
					return true;
				}
			}
		}
	}
	
	switch(e.which){
		//Directions
		case 37:if(this._leftAction(e) && this.leftFlow && this._container.flow(this.leftFlow)){return true;};break;
		case 38:if(this._upAction(e) && this.upFlow && this._container.flow(this.upFlow)){return true;};break;
		case 39:if(this._rightAction(e) && this.rightFlow && this._container.flow(this.rightFlow)){return true;};break;
		case 40:if(this._downAction(e) && this.downFlow && this._container.flow(this.downFlow)){return true;};break;
		
		//Action key
		case 32:
			if(this._doAction(e)){
				return true;
			}
		
		default:
			for(var a = this._keyHandlers.length-1; a >= 0; a--){
				if(this._keyHandlers[a][0] == e.which && this._keyHandlers[a][1] == e.shiftKey && this._keyHandlers[a][2] == e.ctrlKey){
					return this._keyHandlers[a][3].call(this, e);
				}
			}
			
			for(var b = this._keyHandlers.length-1; b >= 0; b--){
				if(this._keyHandlers[b][0] == e.which && this._keyHandlers[b][1] == false && this._keyHandlers[b][2] == e.ctrlKey){
					return this._keyHandlers[b][3].call(this, e);
				}
			}
	}
	
	return false;
};

/** This is called when the "action key" is pressed.
 * @param {object} e The JQuery keypress event.
 * @return {boolean} Whether the event should bubble up.
 * @protected
 */
dusk.sgui.Component.prototype._doAction = function(e) {
	var actionRet = false;
	for(var s in this._actionHandlers){
		actionRet = this._actionHandlers[s].call(this, e)?true:actionRet;
	}
	
	if(actionRet){
		return true;
	}
};

/** This is called when the left key is pressed.
 * @param {object} e The JQuery keypress event.
 * @return {boolean} Whether focus should flow to {@link dusk.sgui.Component.leftFlow}.
 * @protected
 */
dusk.sgui.Component.prototype._leftAction = function(e) {return true;};
/** This is called when the right key is pressed.
 * @param {object} e The JQuery keypress event.
 * @return {boolean} Whether focus should flow to {@link dusk.sgui.Component.rightFlow}.
 * @protected
 */
dusk.sgui.Component.prototype._rightAction = function(e) {return true;};
/** This is called when the up key is pressed.
 * @param {object} e The JQuery keypress event.
 * @return {boolean} Whether focus should flow to {@link dusk.sgui.Component.upFlow}.
 * @protected
 */
dusk.sgui.Component.prototype._upAction = function(e) {return true;};
/** This is called when the down key is pressed.
 * @param {object} e The JQuery keypress event.
 * @return {boolean} Whether focus should flow to {@link dusk.sgui.Component.downFlow}.
 * @protected
 */
dusk.sgui.Component.prototype._downAction = function(e) {return true;};


/** This maps a property from the JSON representation of the object (One from {@link parseProps}) to the JavaScript representation of the object.
 * 	If the property `name` exists in the JSON properties, then `mask` will be assigned it's value.
 * 
 * @param {string} name The name in the JSON representation.
 * @param {string} mask The property name that that name shall be mapped to.
 * @param {boolean} redraw If true, then whenever this property has been assigned, it will redraw the component after the assignment.
 * @param {?array.<string>} depends An array of "dependencies" of the property.
 * 	All the properties in this array will be set (if they exist in the JSON) beforet this one.
 * @protected
 */
dusk.sgui.Component.prototype._registerPropMask = function(name, mask, redraw, depends) {
	this._propMasks[name] = [mask, redraw, depends];
};

/** Given an object, this function sets the properties of this object in relation to the properties of the object.
 * 
 * This is how the actions system manages the SimpleGui system; by setting properties in JSON which will be interpreted.
 * 
 * If any property is an object which has a `to` property, then the current value of the property will be stored in the variable `to`.
 * 	If the property also has a `value` property, then that will be set to the property.
 * 
 * @param {object} props The object to read the properties off.
 * @param {?thread} thread The thread the actions system is running this on; null if no thread is using it.
 * @see {dusk.sgui.Component._registerPropMask}
 * @see {dusk.sgui.Component.prop}
 */
dusk.sgui.Component.prototype.parseProps = function(props, thread) {
	if(thread) this._thread = thread;
	
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
			
			//Check for "to" propety and handle it
			if(props[toProcess[i]] && props[toProcess[i]].to !== undefined) {
				dusk.actions.setVar(props[toProcess[i]].to, this.prop(toProcess[i]));
				if(props[toProcess[i]].value !== undefined) {
					this.prop(toProcess[i], props[toProcess[i]].value);
				}
			} else {
				this.prop(toProcess[i], props[toProcess[i]]);
			}
			
			toProcess.splice(i, 1);
		}
	}
};

/** Returns or sets a single property of the component using the name specified by {dusk.sgui.Component._registerPropMask}.
 * 	A full list of properties that can be set can be found on the wiki.
 * 
 * If value is omitted, no value will be set.
 * 
 * @param {string} name The property to set.
 * @param {?object} value The new value to set for the object.
 * @return {?object} The (new) value of the object, or null if no property by that name can be handled.
 * @see {dusk.sgui.Component.parseProps}
 */
dusk.sgui.Component.prototype.prop = function(name, value) {
	if(this._propMasks[name] !== undefined) {
		if(value === undefined) {
			return this[this._propMasks[name][0]];
		}else{
			this[this._propMasks[name][0]] = value;
			if(this._propMasks[name][1]) this.bookRedraw();
			return value;
		}
	}
	
	return null;
};

/** Returns or sets a property for the theme.
 * 	A theme is a collection of variables that serve as the "default" value for some properties of components.
 * 
 * @param {string} name The property to set.
 * @param {?object} value The new value to set for the object.
 * @return {?object} The (new) value of the object, or null if no property by that name can be handled.
 * @see {dusk.sgui.Component.parseProps}
 */
dusk.sgui.Component.prototype._theme = function(value, set) {
	if(!dusk.mods.simpleGui.getThemeKey(value)) dusk.mods.simpleGui.setThemeKey(value, set);
	
	return dusk.mods.simpleGui.getThemeKey(value);
};


/*dusk.sgui.Component.prototype.__defineSetter__("fade", function s_fade(value) {
	this._awaitNext();
	
	if("from" in value) {
		this.prop("alpha", value.from);
	}else{
		this.prop("alpha", 0);
	}
	
	if("speed" in value) {
		this._fade = Number(value.speed);
	}else{
		this._fade = Number(0.05);
	}
	
	if("end" in value) {
		this._fadeEnd = value.end;
	}else{
		this._fadeEnd = 1;
	}
	
	this._registerFrameHandler(this._fadeEffect);
});

/** @name float
 * 
 * Test!
 * /
dusk.sgui.Component.prototype.__defineSetter__("float", function s_float(value) {
	this._awaitNext();
	
	if("for" in value) {
		this._floatTime = value["for"];
	}else{
		this._floatTime = 10;
	}
	
	if("speed" in value) {
		this._floatSpeed = value.speed;
	}else{
		this._floatSpeed = 5;
	}
	
	if("dir" in value) {
		this._floatDir = value.dir;
	}else{
		this._floatDir = "u";
	}
	
	this._registerFrameHandler(this._floatEffect);
});

dusk.sgui.Component.prototype._fadeEffect = function() {
	if((this.alpha < this._fadeEnd && this._fade > 0) || (this.alpha > this._fadeEnd && this._fade < 0)) {
		this.alpha += this._fade;
		this.bookRedraw();
	}else{
		this.alpha = this._fadeEnd;
		this.bookRedraw();
		this._fade = 0;
		this._clearFrameHandler(this._fadeEffect);
		this._next();
	}
};

dusk.sgui.Component.prototype._floatEffect = function() {
	this._floatTime--;
	
	switch(this._floatDir){
		case "d": this.y += this._floatSpeed;break;
		case "l": this.x -= this._floatSpeed;break;
		case "r": this.x += this._floatSpeed;break;
		default:
		case "u": this.y -= this._floatSpeed;break;
	}
	
	this.bookRedraw();
	
	if(this._floatTime == 0) {
		this._clearFrameHandler(this._floatEffect);
		this._next();
	}
};*/


/** This deletes the component. It can be envoked in one of two ways:
 * 
 * Firstly, by assigning it any non false value, and secondly by calling it as if it were a function.
 * 
 * This will tell the parent component to remove the child, however it will not remove any other references to it.
 * 
 * @type function
 * @name delete
 * @memberof dusk.sgui.Component
 */
dusk.sgui.Component.prototype.__defineSetter__("delete", function s_delete(value) {
	if(value) this._container.deleteComponent(this.comName);
});

dusk.sgui.Component.prototype.__defineGetter__("delete", function g_delete() {return function(){this["delete"] = true;};});


/** This will register the function to a listener that fires when the component tries to draw stuff.
 * 
 * It is expected that the function registered will draw the component to the stage.
 * 
 * @param {function(CanvasRenderingContext2D):undefined} funct The function to call, it will be passed a single argument; the canvas to draw the component onto.
 * @protected
 */
dusk.sgui.Component.prototype._registerDrawHandler = function(funct) {
	this._drawHandlers.push(funct);
};

/** Requests the component to draw itself onto the specified 2D canvas context.
 * 
 * The canvas' state will be restored to what it was as an argument when this function is finished, so no changes will persist out of the function.
 * 
 * @param {CanvasRenderingContext2D} c The canvas context to draw onto.
 */
dusk.sgui.Component.prototype.draw = function(c) {
	if(!this.visible) return;

	var state = c.save();
	if(this.x || this.y) c.translate(~~this.x, ~~this.y);
	if(this.alpha != 1) c.globalAlpha = this.alpha;

	for(var i = 0; i < this._drawHandlers.length; i++){
		this._drawHandlers[i].call(this, c);
	}

	if(this.mark !== null) {
		c.strokeStyle = this.mark;
		c.strokeRect(0, 0, this.prop("width"), this.prop("height"));
	}

	c.restore(state);
	this._redrawBooked = false;
	/*
	if(!this.visible) return null;
	if(!this._redrawBooked) return this._cacheCanvas;
	
	if(this._cacheCanvas.width != this.width) this._cacheCanvas.width = this.width;
	if(this._cacheCanvas.height != this.height)this._cacheCanvas.height = this.height;
	var ctx = this._cacheCanvas.getContext("2d");
	ctx.clearRect(0, 0, this.width, this.height);
	
	//if(this.x || this.y) c.translate(~~this.x, ~~this.y);
	if(this.alpha != 1) ctx.globalAlpha = this.alpha;
	
	for(var i = 0; i < this._drawHandlers.length; i++){
		this._drawHandlers[i].call(this, ctx);
	}
	
	if(this.mark !== null) {
		ctx.strokeStyle = this.mark;
		ctx.strokeRect(0, 0, this.width, this.height);
	}
	
	this._redrawBooked = false;
	return this._cacheCanvas;*/
};

/** Called when the component's apperance has changed.
 * 
 * If this is not called after making any changes, then the component's apperence may not update.
 */
dusk.sgui.Component.prototype.bookRedraw = function() {
	if(this._redrawBooked || !this._container) return;
	
	this._redrawBooked = true;
	this._container.bookRedraw();
};


/** Resolves a path relative to the current component.
 * 
 * See `{@link dusk.mods.simpleGui}` for a description on how paths work.
 * 
 * @param {string} path The path to resolve.
 * @return {dusk.sgui.Component} The component the path is a path to.
 */
dusk.sgui.Component.prototype.path = function(path) {
	if(!path){throw new Error("Path is undefined or empty.");}
	
	var first = "";
	var second = "";
	if(path.indexOf("/") !== -1){
		first = path.split("/", 1)[0];
		second = path.substr(first.length+1);
	}else{
		first = path;
	}
	
	switch(first) {
		case "..":
			if(second) return this._container.path(second);
			return this._container;
		
		case ".":
			return this;
		
		case "":
			if(this.className == "Pane") 
				return this.path(second);
			else
				return this._container.path(second);
		
		default:
			if(this.isAContainer){
				if(!second) return this.getComponent(first);
				else return this.getComponent(first).path(second);
			}else{
				throw new Error(path + " from " + this.comName + " was not found.");
			}
	}
};

/** This is called when the component looses focus, and may be overriden. */
dusk.sgui.Component.prototype.onLooseFocus = function() {this._focused = false;this.bookRedraw();};
/** This is called when the component gains focus, and may be overriden. */
dusk.sgui.Component.prototype.onGetFocus = function() {this._focused = true;this.bookRedraw();};

/** This is called when the component is no longer active, and may be overriden. */
dusk.sgui.Component.prototype.onDeactive = function() {this._active = false;this.bookRedraw();};
/** This is called when the component becomes longer active, and may be overriden. */
dusk.sgui.Component.prototype.onActive = function() {this._active = true;this.bookRedraw();};

/** Returns a string representation of the component. */
dusk.sgui.Component.prototype.toString = function() {return "[sgui "+this.className+" "+this.comName+"]";};

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
