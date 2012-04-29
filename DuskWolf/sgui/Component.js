//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** Class: sgui.Component
 * 
 * A component is a single "thing" that exists in the Simple Gui system. Everything in the Simple GUI system must have this as a base class.
 * 
 * This class doesn't actually do anything in itself, classes that inherit from it do.
 * 	The properties for this apply to all components.
 * 
 * Supported Properties:
 * 
 * <p><code>&lt;x&gt;(x)&lt;/x&gt;</code> --
 * The x coordinate of this component, starting from the left of its container at 0.</p>
 * 
 * <p><code>&lt;y&gt;(y)&lt;/y&gt;</code> --
 * The y coordinate of this component, starting from the top of its container at 0.</p>
 * 
 * <p><code>&lt;scale-x&gt;(scale)&lt;/scale-x&gt;</code> --
 * The relative width of this object, a value of two means it's two times as wide, for example.</p>
 * 
 * <p><code>&lt;scale-y&gt;(scale)&lt;/scale-y&gt;</code> --
 * The relative height of this object, a value of two means it's two times as tall, for example.</p>
 * 
 * <p><code>&lt;height&gt;(height)&lt;/height&gt;</code> --
 * The height of the component, in pixels. This will chage the value of <code>&lt;scale-y&gt;</code>.</p>
 * 
 * <p><code>&lt;width&gt;(width)&lt;/width&gt;</code> --
 * The width of the component, in pixels. This will chage the value of <code>&lt;scale-x&gt;</code>.</p>
 * 
 * <p><code>&lt;alpha&gt;(alpha)&lt;/alpha&gt;</code> --
 * How transparent an object is, from 0 (transparent) to 1 (solid). 0.5 for half transparency, for example. An alpha of "0" doesn't stop the user from interacting with it.</p>
 * 
 * <p><code>&lt;visible&gt;(visible)&lt;/visible&gt;</code> --
 * If it's "1", then the object is displayed and the user can see it. If it's "0" it's invisible but the user can still interact with it. This has no effect on <code>&lt;alpha&gt;</code>.</p>
 * 
 * <p><code>&lt;action&gt;(code)&lt;/action&gt;</code> --
 * <code>code</code> will be ran if the action key is pressed while this button is active, good practice is to have a <code>fire</code> action here.</p>
 * 
 * <p><code>&lt;flow-up&gt;(component)&lt;/flow-up&gt;</code> --
 * The component in this one's container that will be flowed into when the up button is pressed. If it is not a valid name, "blank" is flowed into.</p>
 * 
 * <p><code>&lt;flow-down&gt;(component)&lt;/flow-down&gt;</code> --
 * The component in this one's container that will be flowed into when the down button is pressed. If it is not a valid name, "blank" is flowed into.</p>
 * 
 * <p><code>&lt;flow-left&gt;(component)&lt;/flow-left&gt;</code> --
 * The component in this one's container that will be flowed into when the left button is pressed. If it is not a valid name, "blank" is flowed into.</p>
 * 
 * <p><code>&lt;flow-right&gt;(component)&lt;/flow-right&gt;</code> --
 * The component in this one's container that will be flowed into when the right button is pressed. If it is not a valid name, "blank" is flowed into.</p>
 * 
 * <p><code>&lt;enabled&gt;(component)&lt;/enabled&gt;</code> --
 * If this is "0", then the commponent can't be flowed into.</p>
 * 
 * <p><code>&lt;delete/&gt;</code> --
 * If this property is found, then the component will be destroyed, you should probably put it at the end of all actions or something.</p>
 * 
 * <p><code>&lt;fade-in [speed='(speed)']&gt;(speed)&lt;/fade-in&gt;</code> --
 * The component's alpha will be set to 0, and increased by <code>speed</code> (default is 0.05) every frame. It stops events while it is doing this.</p>
 * 
 * <p><code>&lt;fade-out [speed='(speed)']&gt;(speed)&lt;/fade-in&gt;</code> --
 * The component's alpha will be set to 1, and decreased by <code>speed</code> (default is 0.05) every frame. It stops events while it is doing this.</p>
 * 
 * See:
 * * <mods.SimpleGui>
 * * <sgui.IContainer>
 */
	 
/** Creates a new component, note that if you want to use a "blank component", you should use a <code>NullCom</code>.
 * 
 * @param _group The group this component is in.
 * @param _events The events object.
 * @param _paneName The name of the pane this is tethered to.
 * @param _comName The name of this component.
 */
sgui.Component = function (parent, events, componentName) {
	if(parent !== undefined){
		this._container = parent;
		this._events = events;
		this.comName = componentName;
		
		this.x = 0;
		this.y = 0;
		this.scaleX = 1;
		this.scaleY = 1;
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
		
		this._fade = 0;
		this._fadeEnd = 0;

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
		
		this._fade;
		this._fadeTo;
		
		//Add the core properties
		this._registerPropMask("x", "x", true);
		this._registerPropMask("y", "y", true);
		this._registerPropMask("scale-x", "scaleX", true);
		this._registerPropMask("scale-y", "scaleY", true);
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
		this._registerPropMask("action", "action", true);
		this._registerProp("delete", function(name, value){if(value) this._container.deleteComponent(this.comName);}, null);
		this._registerProp("float", this._setFloat, null);
		this._registerProp("fade", this._setFade, null);
		
		//Add the action property handler
		this._registerActionHandler("actionProp", this._actionProp, this);
	}
};

/** The name of this component.*/
sgui.Component.prototype.className = "Component";
sgui.Component.prototype.isAContainer = false;


sgui.Component.prototype.frame = function(e) {
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
sgui.Component.prototype._registerKeyHandler = function (key, shift, ctrl, funct, scope) {
	for (var i = this._keyHandlers.length-1; i >= 0; i--) {
		if(this._keyHandlers[i][0] == key && this._keyHandlers[i][1] == shift && this._keyHandlers[i][2] == ctrl){
			duskWolf.warning(key+" on "+this.comName+" is already registered.");
			return;
		}
	}
	
	this._keyHandlers.push([key, shift, ctrl, funct, scope]);
}

/** This adds a handler that will call the function every frame, which depends on the frame rate, most likely 30fps.
 * @param name The name of the handler, this is for identifying it.
 * @param funct The function to call, it will be passed a single parameter, the Event, and should return void.
 */
sgui.Component.prototype._registerFrameHandler = function(funct) {
	this._frameHandlers.push(funct);
}

sgui.Component.prototype._clearFrameHandler = function(funct) {
	for(var i in this._frameHandlers) {
		if(this._frameHandlers[i] == funct) delete this._frameHandlers[i]
	}
}

/** This adds a handler that will call the function when the "Action button" is pressed. This is when the button should do whatever it's function was to do.
 * @param name The name of the handler, this is for identifying it.
 * @param funct The function to call, it will be passed a single parameter, the KeyboardEvent. It should return a Boolean, if true then the action will not "bubble"; the container that this component is in will not handle the event.
 */
sgui.Component.prototype._registerActionHandler = function(name, funct, scope) {
	this._actionHandlers[name] = funct;
}

sgui.Component.prototype._registerProp = function(name, onSet, onGet, depends) {
	this._propHandlers[name] = [onSet, onGet, depends];
}

sgui.Component.prototype._registerPropMask = function(name, mask, redraw) {
	this._propMasks[name] = [mask, redraw];
}

sgui.Component.prototype._actionProp = function(e) {
	if(this._action.length){
		this._events.run(this._action, "_"+this.comName);
		return true;
	}
}

/** This causes the component to handle a keypress, it should be called by ether it's parent container or SimpleGui.
 * <p>If the component running this is a container, then it's <code>containerKeypress</code> will be called first. If that function returns true, then this shall return true without doing anything else.</p>
 * <p>This function will first check the key to see if it is a direction or the action key, if it is ether the action handlers or the "directionAction"s are called. Otherwise it looks for a keyhandler. If any of the action handlers or keyhandlers returns true, then this function will return true. Direction actions always return true.</p>
 * @param e The KeyboardEvent to parse.
 * @return Whether the parent container should ignore this key. Return true when you don't want anything else to happen.
 */
sgui.Component.prototype.keypress = function (e) {
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
		case 37:if(this._leftAction() && this._leftFlow && this._container.flow(this._leftFlow)){return true};break;
		case 38:if(this._upAction() && this._upFlow && this._container.flow(this._upFlow)){return true};break;
		case 39:if(this._rightAction() && this._rightFlow && this._container.flow(this._rightFlow)){return true};break;
		case 40:if(this._downAction() && this._downFlow && this._container.flow(this._downFlow)){return true};break;
		
		//Action key
		case 32:
			var actionRet = false;
			for(var s in this._actionHandlers){
				actionRet = this._actionHandlers[s].call(this, e)?true:actionRet;
			}
			
			if(actionRet){
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
sgui.Component.prototype._leftAction = function() {return true;}
/** This is called when the right key is pressed.
 * @return Whether focus should flow to <code>rightFlow</code>.
 */
sgui.Component.prototype._rightAction = function() {return true;}
/** This is called when the up key is pressed.
 * @return Whether focus should flow to <code>upFlow</code>.
 */
sgui.Component.prototype._upAction = function() {return true;}
/** This is called when the down key is pressed.
 * @return Whether focus should flow to <code>downFlow</code>.
 */
sgui.Component.prototype._downAction = function() {return true;}

/** Registers a stuff handler. This function will be called with an XML containing a list of properties, and it's assumed that this function will parse them.
 * @param stuff The stuff handler to add, will be passed a single XML as a parameter.
 * @see #procVar
 */
sgui.Component.prototype._registerStuff = function(stuff) {
	duskWolf.log(this+" is naughty!");
	this._stuffActions.push(stuff);
}

/** This is what actually processes all the properties, it should be given an xml as an argument, that XML should contain a list of properties.
 * @param xml The properties to process.
 */
sgui.Component.prototype.parseProps = function(props, thread) {
	thread = thread?thread:this._thread;
	/*if(!this.open || this._thread == thread){
		this.open ++;*/
		this._thread = thread?thread:this._thread;
		
		for(var i = 0; i < this._stuffActions.length; i++){
			this._stuffActions[i].call(this, props);
		}
		/*this.open--;
	}else{
		duskWolf.warn(this.comName+" is already doing something in another thread, "+this._thread);
	}*/
	
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
				this._events.setVar(props[toProcess[i]].to, this.prop[toProcess[i]]);
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

/** This will process an individual property, though it's main purpose is to allow the <code>to</code> attribute to work. It takes an XML, a property name and a default value and returns the inner text, or the default if there is none.
 * 
 * <p>It will also set any <code>to</code> attributes, for example, <code>&lt;x to='ecs'&gt;100&lt;/x&gt;</code> will set the <code>ecs</code> var to 100, and return 100; <code>&lt;x to='ecs'/&gt;</code> will set <code>ecs</code> to the current x coordinate.</p>
 * 
 * @param name The name of the property you are looking for.
 * @param data The properties XML, the WHOLE properties XML, not just the property you wish to set.
 * @param def The defualt value, if <code>name</code> does not exist or the XML tag is empty, this will be returned and/or set.
 * @return The value that the property contains , of <code>def</code>
 */

sgui.Component.prototype._prop = function(name, data, def, valOnly, bookRedraw) {
	if(bookRedraw == 3) this.bookRedraw();
	if(data[name] === undefined) return def;
	if(bookRedraw == 2) this.bookRedraw();
	
	if(typeof(data[name]) == "object"){
		if(data[name].to){
			this._events.setVar(data[name].to, data[name].value?data[name].value:def);
		}
		
		if(!data[name].value && valOnly) return def;
		
		if(bookRedraw == 1) this.bookRedraw();
		
		if(valOnly){
			return data[name].value;
		}else{
			return data[name];
		}
	}else{
		if(bookRedraw == 1 && data[name] != def) this.bookRedraw();
		return data[name];
	}
}

sgui.Component.prototype.prop = function(name, value) {
	if(this._propHandlers[name] === undefined && this._propMasks[name] === undefined) {
		return null;
	}
	
	if(value !== undefined) {
		if(this._propHandlers[name] && this._propHandlers[name][0]) return this._propHandlers[name][0].call(this, name, value);
		if(this._propMasks[name] !== undefined) {
			this[this._propMasks[name][0]] = value;
			if(this._propMasks[name][1]) this.bookRedraw();
			return value;
		}
		if(!this._propHandlers[name][0]) return null;
		return ;
	}
	
	if(this._propHandlers[name] && this._propHandlers[name][1]) return  this._propHandlers[name][1].call(this, name);
	if(this._propMasks[name] !== undefined) return this[this._propMasks[name][0]];
}

sgui.Component.prototype._theme = function(value, set) {
	if(this._events.getVar("theme."+this._events.getVar("theme.current")+"."+value) === undefined && set !== undefined)
		this._events.setVar("theme."+this._events.getVar("theme.current")+"."+value, set);
	
	return this._events.getVar("theme."+this._events.getVar("theme.current")+"."+value);
}

sgui.Component.prototype._setFade = function(name, value) {
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
		this._fadeEnd = value.to;
	}else{
		this._fadeEnd = 1;
	}
	
	this._registerFrameHandler(this._fadeEffect);
};

sgui.Component.prototype._setFloat = function(name, value) {
	this._awaitNext();
	duskWolf.log(value);
	
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

sgui.Component.prototype._fadeEffect = function() {
	if((this.alpha < this._fadeEnd && this._fade > 0) || (this.alpha > this._fadeEnd && this._fade < 0)) {
		this.alpha += this._fade;
		this.bookRedraw();
	}else{
		this.alpha = this._fadeEnd;
		this.bookRedraw();
		this._fade = 0;
		this._next();
		this._clearFrameHandler(this._fadeEffect);
	}
}

sgui.Component.prototype._floatEffect = function() {
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
		this._next();
		this._clearFrameHandler(this._floatEffect);
	}
}

/** This just calls <code>Events.awaitNext()</code>, but calling this function is required for the checking if this component is open to work. 
 * @param count The number of nexts to wait for.
 * @see Events#awaitNext
 */
sgui.Component.prototype._awaitNext = function(count) {
	if(count === undefined) count = 1;
	this.open += count;
	this._events.awaitNext(this._thread, count);
}

/** This just calls <code>Events.next()</code>, but calling this function is required for the checking if this component is open to work. It also gets the thread right.
 * @see Events#awaitNext
 */
sgui.Component.prototype._next = function(count) {
	if(count === undefined) count = 1;
	this.open -= count;
	this._events.next(this._thread);
}

/** This adds a handler that will call the function when the component is added to the stage. Amusing.
 * @param funct The function to call, it will be passed a single parameter, the Event, and should return void.
 */
sgui.Component.prototype._registerDrawHandler = function(funct) {
	this._drawHandlers.push(funct);
}

sgui.Component.prototype.draw = function(c) {
	if(!this.visible) return;
	
	var state = c.save();
	if(this.x || this.y) c.translate(~~this.x, ~~this.y);
	if(this.scaleX || this.scaleY) c.scale(this.scaleX, this.scaleY);
	if(this.alpha != 1) c.globalAlpha = this.alpha;
	
	for(var i = this._drawHandlers.length-1; i >= 0; i--){
		this._drawHandlers[i].call(this, c);
	}
	
	if(this._mark !== null) {
		c.strokeStyle = this._mark;
		c.strokeRect(0, 0, this.prop("width"), this.prop("height"));
	}
	
	c.restore(state);
	this._redrawBooked = false;
}

sgui.Component.prototype.bookRedraw = function() {
	if(this._redrawBooked || !this._container) return;
	
	this._redrawBooked = true;
	this._container.bookRedraw();
};

sgui.Component.prototype.path = function(path) {
	if(!path){duskWolf.error("path is undefined.");return null;}
	
	if(path.indexOf("/") !== -1){
		var first = path.split("/", 1)[0];
		var second = path.substr(first.length+1);
	}else{
		var first = path;
		var second = "";
	}
	
	switch(first) {
		case "..":
			return this._container.path(second);
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
				duskWolf.warn(path + " from " + this.comName + " was not found.");
			}
	}
	
	return null;
};

/** This should be called when the component looses focus. */
sgui.Component.prototype.onLooseFocus = function() {this._focused = false;this.bookRedraw();}
/** This should be called when the component gets focus. */
sgui.Component.prototype.onGetFocus = function() {this._focused = true;this.bookRedraw();}

/** This should be called when the component is no longer the active component. */
sgui.Component.prototype.onDeactive = function() {this._active = false;this.bookRedraw();}
/** This should be called when the component becomes the active component. */
sgui.Component.prototype.onActive = function() {this._active = true;this.bookRedraw();}

sgui.Component.prototype.toString = function() {return "[sgui "+this.className+" "+this.comName+"]";};

//-----

sgui.NullCom = function(parent, events, comName) {
	sgui.Component.call(this, parent, events, comName);
	this.prop("visible", false);
};
sgui.NullCom.prototype = new sgui.Component();
sgui.NullCom.constructor = sgui.NullCom;

sgui.NullCom.prototype.className = "NullCom";
