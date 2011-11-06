//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details

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
		
		this._x = 0;
		this._y = 0;
		this._scaleX = 1;
		this._scaleY = 1;
		this._visible = true;
		this._height = 0;
		this._width = 0;
		
		this._redrawBooked = false;

		/** The name of the group's component that will be focused when the left key is pressed and <code>leftDirection</code> returns true.*/
		this._leftFlow = "";
		/** The name of the group's component that will be focused when the right key is pressed and <code>rightDirection</code> returns true.*/
		this._rightFlow = "";
		/** The name of the group's component that will be focused when the up key is pressed and <code>upDirection</code> returns true.*/
		this._upFlow = "";
		/** The name of the group's component that will be focused when the down key is pressed and <code>downDirection</code> returns true.*/
		this._downFlow = "";

		this._stuffActions = [];
		this._keyHandlers = [];
		this._actionHandlers = [];
		//private var oEFHandlers:Vector.<Array>;
		this._drawHandlers = [];

		//private var fade:Number;

		this._action = [];
		
		this._c = null;

		/** Whether the component can become focused, if false it cannot be flowed into. */
		this.enabled = true;
		/** Whether the component can loose focus, if false it can't be flowed out of. */
		this.locked = false;

		/**The thread this component is currently running in. Note that this is not cleared if the component is not waiting. */
		this._thread = "";
		this._open = 0;
		
		//Add the core stuff
		this._registerStuff(this._coreStuff);

		//Add the action property handler
		this._registerActionHandler("actionProp", this._actionProp, this);

		this._c = $("#"+duskWolf.canvas)[0].getContext("2d");
	}
};

/** The name of this component.*/
sgui.Component.prototype.className = "Component";
sgui.Component.prototype.isAContainer = false;


/*private function onEnterFrame(e:Event):void {
	for(var a:int = oEFHandlers.length-1; a >= 0; a--){
		oEFHandlers[a][1](e);
	}
}*/

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
/*protected function registerOEFHandler(name, funct, scope) {
	this.frameHandlers[name] = funct;
}*/

/** This adds a handler that will call the function when the "Action button" is pressed. This is when the button should do whatever it's function was to do.
 * @param name The name of the handler, this is for identifying it.
 * @param funct The function to call, it will be passed a single parameter, the KeyboardEvent. It should return a Boolean, if true then the action will not "bubble"; the container that this component is in will not handle the event.
 */
sgui.Component.prototype._registerActionHandler = function (name, funct, scope) {
	this._actionHandlers[name] =  [funct, scope];
}

sgui.Component.prototype._actionProp = function (e) {
	if(this._action){
		events.run(this._XML, this._thread);
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
			if(this._keyHandlers[y][3].call(this._keyHandlers[y][4], e)){
				return true;
			}
		}
	}
	
	for (var z = this._keyHandlers.length-1; z >= 0; z--) {
		if (this._keyHandlers[z][0] < 0 && this._keyHandlers[z][1] == false && this._keyHandlers[z][2] == e.ctrlKey) {
			if (this._keyHandlers[z][3].call(this._keyHandlers[z][4], e)) {
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
			var actionRet;
			for(var s in this._actionHandlers){
				this._actionHandlers[s][1].__scoper = this._actionHandlers[s][0];
				actionRet = this._actionHandlers[s][1].__scoper(e)?true:actionRet;
			}
			
			if(actionRet){
				return true;
			}
		
		default:
			for(var a = this._keyHandlers.length-1; a >= 0; a--){
				if(this._keyHandlers[a][0] == e.which && this._keyHandlers[a][1] == e.shiftKey && this._keyHandlers[a][2] == e.ctrlKey){
					return this._keyHandlers[a][3].call(this._keyHandlers[a][4], e);
				}
			}
			
			for(var b = this._keyHandlers.length-1; b >= 0; b--){
				if(this._keyHandlers[b][0] == e.which && this._keyHandlers[b][1] == false && this._keyHandlers[b][2] == e.ctrlKey){
					return this._keyHandlers[b][3].call(this._keyHandlers[b][4], e);
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
	this._thread = thread?thread:this._thread;
	if(!this._open){
		this._open ++;
		for(var i = this._stuffActions.length-1; i >= 0; i--){
			this._stuffActions[i].call(this, data);
		}
		this._open--;
	}else{
		duskWolf.warn(comName+": Already doing something in another thread.");
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
 
//Can ether be in the form "prop:{"value":20, "to":"test"}" or just "prop:20", handle each one
sgui.Component.prototype._prop = function(name, data, def, valOnly, bookRedraw) {
	if(bookRedraw == 3) this.bookRedraw();
	if(!data[name]) return def;
	if(bookRedraw == 2) this.bookRedraw();
	
	if(typeof(data[name]) == "object"){
		if(data[name].to){
			this._events.setVar(data[name].to, data[name].value?data[name].value:def);
		}
		
		if(!data[name].value && valOnly) return String(def);
		
		if(bookRedraw == 1) this.bookRedraw();
		
		if(valOnly){
			return String(data[name].value);
		}else{
			return data[name];
		}
	}else{
		if(bookRedraw == 1 && data[name] != def) this.bookRedraw();
		if(valOnly){
			return String(data[name]);
		}else{
			return data[name];
		}
	}
}

sgui.Component.prototype._coreStuff = function(data) {
	//Location
	this._x = this._prop("x", data, this._x, true, 1);
	this._y = this._prop("y", data, this._y, true, 1);
	
	//Size
	this._scaleX = this._prop("scale-x", data, this._scaleX, true, 1);
	this._scaleY = this._prop("scale-y", data, this._scaleY, true, 1);
	
	this.setHeight(this._prop("height", data, this.getHeight(), true, 1));
	this.setWidth(this._prop("width", data, this.getWidth(), true, 1));
	
	//Visibility
	//alpha = Number(procVar("alpha", data, alpha));*/
	this._visible = this._prop("visible", data, this._visible?"1":"0", true, 1)=="1";
	
	//Flowing
	this._upFlow = this._prop("flow-up", data, this._upFlow, true);
	this._downFlow = this._prop("flow-down", data, this._downFlow, true);
	this._leftFlow = this._prop("flow-left", data, this._leftFlow, true);
	this._rightFlow = this._prop("flow-right", data, this._rightFlow, true);
	this._enabled = this._prop("enabled", data, this._enabled?"1":"0", true)=="1";
	
	//Delete it
	if(this._prop("delete", data, "0", true, 1) == "1"){
		this._container.deleteComponent(this.comName);
	}
	
	//Action
	this._action = this._prop("action", data, this._action, true);
	/*
	//Fading
	if(data.child("fade-in").length()){
		awaitNext();
		alpha = 0;
		
		if(data.child("fade-in").attribute("speed").length()){
			fade = Number(data.child("fade-in").attribute("speed").toString());
		}else{
			fade = 0.05;
		}
		
		registerOEFHandler("fade", fadeEffect);
	}
	
	if(data.child("fade-out").length()){
		awaitNext();
		alpha = 1;
		
		if(data.child("fade-out").attribute("speed").length()){
			fade = -Number(data.child("fade-out").attribute("speed").toString());
		}else{
			fade = -0.05;
		}
		
		registerOEFHandler("fade", fadeEffect);
	}*/
}

/*private function fadeEffect(e:Event):void {
	if((alpha < 1 && fade > 0) || (alpha > 0 && fade < 0)){
		alpha += fade;
	}else{
		alpha = (fade >= 0)?1:0;
		next();
	}
}*/

/** This just calls <code>Events.awaitNext()</code>, but calling this function is required for the checking if this component is open to work. 
 * @param count The number of nexts to wait for.
 * @see Events#awaitNext
 */
sgui.Component.prototype._awaitNext = function(count) {
	if(count === undefined) count = 1;
	this._open += count;
	this._events.awaitNext(thread, count);
}

/** This just calls <code>Events.next()</code>, but calling this function is required for the checking if this component is open to work. It also gets the thread right.
 * @see Events#awaitNext
 */
sgui.Component.prototype._next = function(count) {
	if(count === undefined) count = 1;
	this._open -= count;
	this._events.next(thread);
}

/** This adds a handler that will call the function when the component is added to the stage. Amusing.
 * @param funct The function to call, it will be passed a single parameter, the Event, and should return void.
 */
sgui.Component.prototype._registerDrawHandler = function(funct) {
	this._drawHandlers.push(funct);
}

sgui.Component.prototype.draw = function(c) {
	if(!this._visible) return;
	
	state = c.save();
	if(this._x || this._y) c.translate(this._x, this._y);
	if(this._scaleX || this._scaleY) c.scale(this._scaleX, this._scaleY);
	
	for(var i = this._drawHandlers.length-1; i >= 0; i--){
		this._drawHandlers[i].call(this, c);
	}
	
	c.restore(state);
	this._redrawBooked = false;
}

sgui.Component.prototype.bookRedraw = function() {
	if(this._redrawBooked) return;
	
	this._redrawBooked = true;
	this._container.bookRedraw();
}

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
sgui.Component.prototype.getWidth = function() {return this._width;}
/** This returns the height of the component, in pixels, you can override this if you want to lie about the height or something.
 * @return The component's height.
 */
sgui.Component.prototype.getHeight = function() {return this._height;}

/** This should set the width of the component, override it if you want to do any fancy stuff.
 * @param value The new width, in pixels.
 */
sgui.Component.prototype.setHeight = function(value) {this._height = value;}
/** This should set the height of the component, override it if you want to do any fancy stuff.
 * @param value The new height, in pixels.
 */
sgui.Component.prototype.setWidth = function(value) {this._width = value;}

sgui.Component.prototype.toString = function() {return "[sgui "+this.className+" "+this.comName+"]";};

//-----

sgui.NullCom = function(parent, events, comName) {
	sgui.Component.call(this, parent, events, comName);
	this._visible = false;
};
sgui.NullCom.prototype = new sgui.Component();
sgui.NullCom.constructor = sgui.NullCom;

sgui.NullCom.prototype.className = "NullCom";
