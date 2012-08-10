//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

window.sgui = {};

goog.provide("dusk.sgui.Component");
goog.provide("dusk.sgui.NullCom");

/** Class: sgui.Component
 * 
 * A component is a single "thing" that exists in the Simple Gui system. Everything in the Simple GUI system must have this (or a subclass of this) as a base class.
 * 
 * This class doesn't actually display anything itself, classes that inherit from it do.
 * 	The properties for this apply to all components.
 * 
 * See <mods.SimpleGui> for an overview of the sgui system.
 * 
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
 * 
 * See:
 * * <sgui.IContainer>
 */

/** Creates a new component, note that if you want to use a "blank component", you should use a <code>NullCom</code>.
 * 
 * @param _group The group this component is in.
 * @param _events The events object.
 * @param _paneName The name of the pane this is tethered to.
 * @param _comName The name of this component.
 */
dusk.sgui.Component = function (parent, componentName) {
	if(parent !== undefined){
		/*- Variable: _container
		 * [<sgui.Container>] The container that this component is inside.
		 */
		this._container = parent;
		this.comName = componentName;
		
		this.x = 0;
		this.y = 0;
		this.visible = true;
		this.alpha = 1;
		this._height = 0;
		this._width = 0;
		this._mark = null;
		
		this._redrawBooked = false;
		
		this.cache = false;
		this._cacheCanvas = null;

		/** The name of the group's component that will be focused when the left key is pressed and <code>leftDirection</code> returns true.*/
		this.leftFlow = "";
		/** The name of the group's component that will be focused when the right key is pressed and <code>rightDirection</code> returns true.*/
		this.rightFlow = "";
		/** The name of the group's component that will be focused when the up key is pressed and <code>upDirection</code> returns true.*/
		this.upFlow = "";
		/** The name of the group's component that will be focused when the down key is pressed and <code>downDirection</code> returns true.*/
		this.downFlow = "";

		this._stuffActions = [];
		this._keyHandlers = [];
		this._frameHandlers = [];
		this._actionHandlers = [];
		this._drawHandlers = [];
		this._propHandlers = {};
		this._propMasks = {};

		this._action = [];

		/** Whether the component can become focused, if false it cannot be flowed into. */
		this.enabled = true;
		/** Whether the component can loose focus, if false it can't be flowed out of. */
		this.locked = false;
		
		this._focused = false;
		this._active = false;

		/**The thread this component is currently running in. Note that this is not cleared if the component is not waiting. */
		this._thread = "";
		this.open = 0;
		
		this._floatSpeed = 0;
		this._floatTime = 0;
		this._floatDir = "u";
		
		this._fade = 0;
		this._fadeEnd = 0;
		
		//Add the core properties
		this._registerPropMask("x", "x", true);
		this._registerPropMask("y", "y", true);
		this._registerPropMask("width", "_width", true);
		this._registerPropMask("height", "_height", true);
		this._registerPropMask("alpha", "alpha", true);
		this._registerPropMask("visible", "visible", true);
		this._registerPropMask("mark", "_mark", true);
		this._registerPropMask("flow-up", "_upFlow", true);
		this._registerPropMask("flow-down", "_downFlow", true);
		this._registerPropMask("flow-left", "_leftFlow", true);
		this._registerPropMask("flow-right", "_rightFlow", true);
		this._registerPropMask("enabled", "enabled", true);
		this._registerPropMask("action", "_action", true);
		this._registerProp("delete", function(name, value){if(value) this._container.deleteComponent(this.comName);}, null);
		this._registerProp("float", this._setFloat, null);
		this._registerProp("fade", this._setFade, null);
		
		//Add the action property handler
		this._registerActionHandler("actionProp", this._actionProp, this);
	}
};

/** The name of this component.*/
dusk.sgui.Component.prototype.className = "Component";
dusk.sgui.Component.prototype.isAContainer = false;


dusk.sgui.Component.prototype.frame = function(e) {
	for(var a = this._frameHandlers.length-1; a >= 0; a--){
		if(this._frameHandlers[a]) this._frameHandlers[a].call(this, e);
	}
}

/** This registers a handler to respond to a keypress. Only one key can have a handler, though SHIFT and CTRL modifiers on that same key can have different (or no) handlers.
 * <p>If there is no event for a key which has shift set to true, but there is one where shift is set to false that one will be called. You can also set the keycode to be -1, and it will handle all keys.</p>
 * @param key The keycode to respond to, it should be one of flash's keycodes.
 * @param shift Whether the shift key must be held down to trigger the handler, see the note above as well.
 * @param ctrl Whether the ctrl key must be held down as well, note that Flash probably reserves some of these for itself, maybe.
 * @param funct The function to call, it is given a single param, the Keyboard event. It must also return a Boolean, if true then the keypress will not be processed by it's parent container. Return true if you have done something of interest, and do not want your parents to continue to do anything.
 */
dusk.sgui.Component.prototype._registerKeyHandler = function (key, shift, ctrl, funct, scope) {
	for (var i = this._keyHandlers.length-1; i >= 0; i--) {
		if(this._keyHandlers[i][0] == key && this._keyHandlers[i][1] == shift && this._keyHandlers[i][2] == ctrl){
			console.warn(key+" on "+this.comName+" is already registered.");
			return;
		}
	}
	
	this._keyHandlers.push([key, shift, ctrl, funct, scope]);
}

/** This adds a handler that will call the function every frame, which depends on the frame rate, most likely 30fps.
 * @param name The name of the handler, this is for identifying it.
 * @param funct The function to call, it will be passed a single parameter, the Event, and should return void.
 */
dusk.sgui.Component.prototype._registerFrameHandler = function(funct) {
	this._frameHandlers.push(funct);
}

dusk.sgui.Component.prototype._clearFrameHandler = function(funct) {
	for(var i in this._frameHandlers) {
		if(this._frameHandlers[i] == funct) delete this._frameHandlers[i];
	}
}

/** This adds a handler that will call the function when the "Action button" is pressed. This is when the button should do whatever it's function was to do.
 * @param name The name of the handler, this is for identifying it.
 * @param funct The function to call, it will be passed a single parameter, the KeyboardEvent. It should return a Boolean, if true then the action will not "bubble"; the container that this component is in will not handle the event.
 */
dusk.sgui.Component.prototype._registerActionHandler = function(name, funct, scope) {
	this._actionHandlers[name] = funct;
}

dusk.sgui.Component.prototype._registerProp = function(name, onSet, onGet, depends) {
	if(this._propMasks[name] !== undefined) {
		delete this._propMasks[name];
	}
	this._propHandlers[name] = [onSet, onGet, depends];
}

dusk.sgui.Component.prototype._registerPropMask = function(name, mask, redraw) {
	this._propMasks[name] = [mask, redraw];
}

dusk.sgui.Component.prototype._actionProp = function(e) {
	if(this._action.length){
		dusk.events.run(this._action, "_"+this.comName);
		return true;
	}
}

dusk.sgui.Component.prototype._doAction = function(e) {
	var actionRet = false;
	for(var s in this._actionHandlers){
		actionRet = this._actionHandlers[s].call(this, e)?true:actionRet;
	}
	
	if(actionRet){
		return true;
	}
}

/** This causes the component to handle a keypress, it should be called by ether it's parent container or SimpleGui.
 * <p>If the component running this is a container, then it's <code>containerKeypress</code> will be called first. If that function returns true, then this shall return true without doing anything else.</p>
 * <p>This function will first check the key to see if it is a direction or the action key, if it is ether the action handlers or the "directionAction"s are called. Otherwise it looks for a keyhandler. If any of the action handlers or keyhandlers returns true, then this function will return true. Direction actions always return true.</p>
 * @param e The KeyboardEvent to parse.
 * @return Whether the parent container should ignore this key. Return true when you don't want anything else to happen.
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
		case 37:if(this._leftAction(e) && this._leftFlow && this._container.flow(this._leftFlow)){return true};break;
		case 38:if(this._upAction(e) && this._upFlow && this._container.flow(this._upFlow)){return true};break;
		case 39:if(this._rightAction(e) && this._rightFlow && this._container.flow(this._rightFlow)){return true};break;
		case 40:if(this._downAction(e) && this._downFlow && this._container.flow(this._downFlow)){return true};break;
		
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

/** This is called when the left key is pressed.
 * @return Whether focus should flow to <code>leftFlow</code>.
 */
dusk.sgui.Component.prototype._leftAction = function(e) {return true;}
/** This is called when the right key is pressed.
 * @return Whether focus should flow to <code>rightFlow</code>.
 */
dusk.sgui.Component.prototype._rightAction = function(e) {return true;}
/** This is called when the up key is pressed.
 * @return Whether focus should flow to <code>upFlow</code>.
 */
dusk.sgui.Component.prototype._upAction = function(e) {return true;}
/** This is called when the down key is pressed.
 * @return Whether focus should flow to <code>downFlow</code>.
 */
dusk.sgui.Component.prototype._downAction = function(e) {return true;}

/** This is what actually processes all the properties, it should be given an xml as an argument, that XML should contain a list of properties.
 * @param xml The properties to process.
 */
dusk.sgui.Component.prototype.parseProps = function(props, thread) {
	if(thread) this._thread = thread;
	
	var toProcess = [];
	for(var p in props) {
		toProcess[toProcess.length] = p;
	}
	
	//Dependancies system
	while(toProcess.length) {
		for(var i = toProcess.length-1; i >= 0; i--) {
			if(this._propHandlers[toProcess[i]] && this._propHandlers[toProcess[i]][2]) {
				for(var j = this._propHandlers[toProcess[i]][2].length-1; j >= 0; j--) {
					if(toProcess.indexOf(this._propHandlers[toProcess[i]][2][j]) !== -1) {
						j = -2;
					}
				}
				
				if(j < -1) continue;
			}
			
			if(props[toProcess[i]] && props[toProcess[i]].to !== undefined) {
				dusk.events.setVar(props[toProcess[i]].to, this.prop[toProcess[i]]);
				if(props[toProcess[i]].value !== undefined) {
					this.prop(toProcess[i], props[toProcess[i]].value);
				}
			} else {
				this.prop(toProcess[i], props[toProcess[i]]);
			}
			
			toProcess.splice(i, 1);
		}
	}
}

dusk.sgui.Component.prototype.prop = function(name, value) {
	if(this._propMasks[name] !== undefined) {
		if(value === undefined) {
			return this[this._propMasks[name][0]];
		}else{
			this[this._propMasks[name][0]] = value;
			if(this._propMasks[name][1]) this.bookRedraw();
			return value;
		}
	} else if(this._propHandlers[name] !== undefined) {
		if(value !== undefined) {
			return this._propHandlers[name][0].call(this, name, value);
		} else {
			return this._propHandlers[name][1].call(this, name);
		}
	}
	
	return null;
};

dusk.sgui.Component.prototype._theme = function(value, set) {
	if(dusk.events.getVar("theme."+dusk.events.getVar("theme.current")+"."+value) === undefined && set !== undefined)
		dusk.events.setVar("theme."+dusk.events.getVar("theme.current")+"."+value, set);
	
	return dusk.events.getVar("theme."+dusk.events.getVar("theme.current")+"."+value);
}

dusk.sgui.Component.prototype._setFade = function(name, value) {
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
};

dusk.sgui.Component.prototype._setFloat = function(name, value) {
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
}

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
}

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
}

/** This just calls <code>Events.awaitNext()</code>, but calling this function is required for the checking if this component is open to work. 
 * @param count The number of nexts to wait for.
 * @see Events#awaitNext
 */
dusk.sgui.Component.prototype._awaitNext = function(count) {
	if(count === undefined) count = 1;
	this.open += count;
	dusk.events.awaitNext(this._thread, count);
}

/** This just calls <code>Events.next()</code>, but calling this function is required for the checking if this component is open to work. It also gets the thread right.
 * @see Events#awaitNext
 */
dusk.sgui.Component.prototype._next = function(count) {
	if(count === undefined) count = 1;
	this.open -= count;
	dusk.events.next(this._thread);
}

/** This adds a handler that will call the function when the component is added to the stage. Amusing.
 * @param funct The function to call, it will be passed a single parameter, the Event, and should return void.
 */
dusk.sgui.Component.prototype._registerDrawHandler = function(funct) {
	this._drawHandlers.push(funct);
}

dusk.sgui.Component.prototype.draw = function(c) {
	if(!this.visible) return;
	
	var state = c.save();
	if(this.x || this.y) c.translate(~~this.x, ~~this.y);
	if(this.alpha != 1) c.globalAlpha = this.alpha;
	
	for(var i = 0; i < this._drawHandlers.length; i++){
		this._drawHandlers[i].call(this, c);
	}
	
	if(this._mark !== null) {
		c.strokeStyle = this._mark;
		c.strokeRect(0, 0, this.prop("width"), this.prop("height"));
	}
	
	c.restore(state);
	this._redrawBooked = false;
}

dusk.sgui.Component.prototype.bookRedraw = function() {
	if(this._redrawBooked || !this._container) return;
	
	this._redrawBooked = true;
	this._container.bookRedraw();
};

dusk.sgui.Component.prototype.path = function(path) {
	if(!path){throw new Error("Path is undefined or empty.");}
	
	if(path.indexOf("/") !== -1){
		var first = path.split("/", 1)[0];
		var second = path.substr(first.length+1);
	}else{
		var first = path;
		var second = "";
	}
	
	switch(first) {
		case "..":
			if(second) return this._container.path(second);
			return this._container;
			break;
		
		case "":
			if(this.className == "Pane") 
				return this.path(second);
			else
				return this._container.path(second);
			
			break;
		
		default:
			if(this.isAContainer){
				if(!second) return this.getComponent(first);
				else return this.getComponent(first).path(second);
			}else{
				throw new Error(path + " from " + this.comName + " was not found.");
			}
	}
};

/** This should be called when the component looses focus. */
dusk.sgui.Component.prototype.onLooseFocus = function() {this._focused = false;this.bookRedraw();}
/** This should be called when the component gets focus. */
dusk.sgui.Component.prototype.onGetFocus = function() {this._focused = true;this.bookRedraw();}

/** This should be called when the component is no longer the active component. */
dusk.sgui.Component.prototype.onDeactive = function() {this._active = false;this.bookRedraw();}
/** This should be called when the component becomes the active component. */
dusk.sgui.Component.prototype.onActive = function() {this._active = true;this.bookRedraw();}

dusk.sgui.Component.prototype.toString = function() {return "[sgui "+this.className+" "+this.comName+"]";};

//-----

/** Class: dusk.sgui.NullCom
 * 
 * This is a component that does nothing.
 */
dusk.sgui.NullCom = function(parent, comName) {
	dusk.sgui.Component.call(this, parent, comName);
	this.prop("visible", false);
};
dusk.sgui.NullCom.prototype = new dusk.sgui.Component();
dusk.sgui.NullCom.constructor = dusk.sgui.NullCom;

dusk.sgui.NullCom.prototype.className = "NullCom";
