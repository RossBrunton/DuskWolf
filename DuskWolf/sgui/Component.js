//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details

/** Class: sgui.Component
 * 
 * A component is a single "thing" that exists in the Simple Gui system. Everything in the Simple GUI system must have this as a base class.
 * 
 * This class doesn't actually do anything in itself,
 * 
 * Components can be "active", a component which is active will receive keyboard events, and should act like the user is looking at it.
 * 	When a component becomes active, it's <onActive> method is called, when it looses it, <onDeactive> is called.
 * 	For a component to be active, all it's parent groups must be too.
 * 
 * Components can also be "focused", focused components will be made active when the container it is in becomes active.
 * 	Focus is generally changed by the arrow keys (only active components can handle key events, remember).
 * 	If a direcftion key is pressed, a function like <upAction> returns true, and a variable like <upFlow> is not empty, focus changes the element named <upFlow> in this one's container.
 * 	You can also call the <_container.focus> method of your container, but don't expect to become active.
 * 
 * Components handle some things, like an action or frame, to do this they must register them, using functions like <_registerFrameHandler> and <_registerAction> with the function they wish to be run when that thing occurs.
 * 
 * Handleable Things:
 * Frame		- Called every frame at the frame rate. Will be called <DuskWolf.frameRate> times a second, unless the computer is lagging.
 * Key			- Called when a key is pressed while the component is active, can be passed a number of arguments saying what key to be pressed, and whether shift or ctrl is required.
 * Action		- Called when the "action key" is pressed while this component is active.
 * 
 * A special type of handler is the Stuff handler, the function is given a JSON object containing properties (like the ones below), and should use it to process them.
 * 	This is used for the component to change it's look and behaviours and such via JSON.
 * 	Containers typically send the Stuff relating to a specific component (by using the "children" array, or "child" property, for example) to that component for processing.
 * 
 * <p>Note that most properties support a <code>to</code> attribute (Which is not listed to make it easier to read), this attribute is the name of a var, and stores the value of the property in it.</p>
 * 
 * <p><b>This component (and thus, all of them) have the following properties:</b></p>
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
 * @see Group
 * @see modules.SimpleGui
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

		this._fade = 0;
		this._fadeEnd = 0;

		this._action = [];

		/** Whether the component can become focused, if false it cannot be flowed into. */
		this.enabled = true;
		/** Whether the component can loose focus, if false it can't be flowed out of. */
		this.locked = false;

		/**The thread this component is currently running in. Note that this is not cleared if the component is not waiting. */
		this._thread = "";
		this.open = 0;
		
		//Add the core stuff
		this._registerStuff(this._coreStuff);

		//Add the action property handler
		this._registerActionHandler("actionProp", this._actionProp, this);
	}
};

/** The name of this component.*/
sgui.Component.prototype.className = "Component";
sgui.Component.prototype.isAContainer = false;


sgui.Component.prototype.frame = function(e) {
	for(var a = this._frameHandlers.length-1; a >= 0; a--){
		this._frameHandlers[a].call(this, e);
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

/** This adds a handler that will call the function when the "Action button" is pressed. This is when the button should do whatever it's function was to do.
 * @param name The name of the handler, this is for identifying it.
 * @param funct The function to call, it will be passed a single parameter, the KeyboardEvent. It should return a Boolean, if true then the action will not "bubble"; the container that this component is in will not handle the event.
 */
sgui.Component.prototype._registerActionHandler = function (name, funct, scope) {
	this._actionHandlers[name] = funct;
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
		if(this._keyHandlers[y][0] < 0 && this._keyHandlers[y][1] == e.shiftKey && this._keyHandlers[y][2] == e.ctrlKey){
			if(this._keyHandlers[y][3].call(this, e)){
				return true;
			}
		}
	}
	
	for (var z = this._keyHandlers.length-1; z >= 0; z--) {
		if (this._keyHandlers[z][0] < 0 && this._keyHandlers[z][1] == false && this._keyHandlers[z][2] == e.ctrlKey) {
			if (this._keyHandlers[z][3].call(this, e)) {
				return true;
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
	this._stuffActions.push(stuff);
}

/** This is what actually processes all the properties, it should be given an xml as an argument, that XML should contain a list of properties.
 * @param xml The properties to process.
 */
sgui.Component.prototype.doStuff = function(data, thread) {
	thread = thread?thread:this._thread;
	
	if(!this.open || this._thread == thread){
		this.open ++;
		this._thread = thread?thread:this._thread;
		
		for(var i = 0; i < this._stuffActions.length; i++){
			this._stuffActions[i].call(this, data);
		}
		this.open--;
	}else{
		duskWolf.warn(this.comName+" is already doing something in another thread.");
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

sgui.Component.prototype._theme = function(value) {
	return this._events.getVar("theme-"+this._events.getVar("theme")+"-"+value);
}

sgui.Component.prototype._coreStuff = function(data) {
	//Location
	this.x = this._prop("x", data, this.x, true, 1);
	this.y = this._prop("y", data, this.y, true, 1);
	
	//Size
	this.scaleX = this._prop("scale-x", data, this.scaleX, true, 1);
	this.scaleY = this._prop("scale-y", data, this.scaleY, true, 1);
	
	this.setHeight(this._prop("height", data, this.getHeight(), true, 1));
	this.setWidth(this._prop("width", data, this.getWidth(), true, 1));
	
	//Visibility
	this.alpha = this._prop("alpha", data, this.alpha, true, 1);
	this.visible = this._prop("visible", data, this.visible, true, 1);
	
	//Mark
	this._mark = this._prop("mark", data, this._mark, true, 1);
	
	//Flowing
	this.upFlow = this._prop("flow-up", data, this.upFlow, true);
	this.downFlow = this._prop("flow-down", data, this.downFlow, true);
	this.leftFlow = this._prop("flow-left", data, this.leftFlow, true);
	this.rightFlow = this._prop("flow-right", data, this.rightFlow, true);
	this.enabled = this._prop("enabled", data, this.enabled, true);
	
	//Delete it
	if(this._prop("delete", data, "0", true, 1) == "1"){
		this._container.deleteComponent(this.comName);
	}
	
	//Action
	this._action = this._prop("action", data, this._action);
	
	//Fading
	if("fade" in data) {
		this._awaitNext();
		
		if(typeof(data.fade) == "object" && "from" in data.fade) {
			this._alpha = Number(data.fade.from);
		}else{
			this._alpha = 0;
		}
		
		if(typeof(data.fade) == "object" && data["fade"].speed) {
			this._fade = Number(data["fade"].speed);
		}else{
			this._fade = Number(this._prop("fade", data, 0.05, true));
		}
		
		if(typeof(data.fade) == "object" && data["fade"].to) {
			this._fadeEnd = Number(data.fade.to);
		}else{
			this._fadeEnd = 1;
		}
		
		this._registerFrameHandler(this._fadeEffect);
	}
}

sgui.Component.prototype._fadeEffect = function() {
	if(this._fade == 0) return;
	
	if((this._alpha < this._fadeEnd && this._fade > 0) || (this._alpha > this._fadeEnd && this._fade < 0)) {
		this._alpha += this._fade;
		this.bookRedraw();
	}else{
		this._alpha = this._fadeEnd;
		this.bookRedraw();
		this._fade = 0;
		this._next();
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
	
	state = c.save();
	if(this.x || this.y) c.translate(this.x, this.y);
	if(this.scaleX || this.scaleY) c.scale(this.scaleX, this.scaleY);
	if(this.alpha != 1) c.globalAlpha = this.alpha;
	
	for(var i = this._drawHandlers.length-1; i >= 0; i--){
		this._drawHandlers[i].call(this, c);
	}
	
	if(this._mark !== null) {
		c.strokeStyle = this._mark;
		
		c.strokeRect(0, 0, this.getWidth(), this.getHeight());
	}
	
	c.restore(state);
	this._redrawBooked = false;
}

sgui.Component.prototype.bookRedraw = function() {
	if(this._redrawBooked || !this._container) return;
	
	this._redrawBooked = true;
	this._container.bookRedraw();
}

sgui.Component.prototype.mark = function(colour) {
	if(colour === undefined) colour = "#ff0000";
	
	this._mark = colour;
};

sgui.Component.prototype.unmark = function() {
	this._mark = null;
};

/** This should be called when the component looses focus. */
sgui.Component.prototype.onLooseFocus = function() {}
/** This should be called when the component gets focus. */
sgui.Component.prototype.onGetFocus = function() {}

/** This should be called when the component is no longer the active component. */
sgui.Component.prototype.onDeactive = function() {}
/** This should be called when the component becomes the active component. */
sgui.Component.prototype.onActive = function() {}

/** This returns the width of the component, in pixels, you can override this if you want to lie about the width or something.
 * @return The component's height.
 */
sgui.Component.prototype.getWidth = function() {return Number(this._width);}
/** This returns the height of the component, in pixels, you can override this if you want to lie about the height or something.
 * @return The component's height.
 */
sgui.Component.prototype.getHeight = function() {return Number(this._height);}

/** This should set the width of the component, override it if you want to do any fancy stuff.
 * @param value The new width, in pixels.
 */
sgui.Component.prototype.setHeight = function(value) {this._height = Number(value);}
/** This should set the height of the component, override it if you want to do any fancy stuff.
 * @param value The new height, in pixels.
 */
sgui.Component.prototype.setWidth = function(value) {this._width = Number(value);}

sgui.Component.prototype.toString = function() {return "[sgui "+this.className+" "+this.comName+"]";};

//-----

sgui.NullCom = function(parent, events, comName) {
	sgui.Component.call(this, parent, events, comName);
	this.visible = false;
};
sgui.NullCom.prototype = new sgui.Component();
sgui.NullCom.constructor = sgui.NullCom;

sgui.NullCom.prototype.className = "NullCom";
