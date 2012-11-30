//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.require("dusk.dwc");
dusk.load.require("dusk.errors");
dusk.load.require("dusk.utils");

dusk.load.provide("dusk.actions");

/** @namespace dusk.mods
 * 
 * @description Contains modules that add functionality to the engine. Each namespace in here is expected to add something to the engine when it is imported.
 */

/** @namespace dusk.actions
 * 
 * @description This is the heart of the entire system! It manages the event stack and carries out events.
 * 
 * Use this namespace to add and run actions.
 */

/** This initiates all the variables and adds all the defualt stuff. You must call this before using this namespace. */
dusk.actions.init = function() {
	/** A list of every action, each action is an array in the form `[function to be called, scope to call function in]`.
	 * 
	 * @type object
	 * @private
	 */
	dusk.actions._actions = {};
	/** A list of every hashfunction, each function is an array in the form `[function to be called, scope to call function in]`.
	 * 
	 * @type object
	 * @private
	 */
	dusk.actions._hashFuncts = {};
	
	/** A list of every function defined by the `function` action, each one is an array of actions.
	 * 
	 * @type object
	 * @private
	 */
	dusk.actions._functions = {};
	/** A list of all the listeners set, these are the actual action objects themselves.
	 * 
	 * @type array
	 * @private
	 */
	dusk.actions._listeners = [];
	
	/** This is all the variables in the engine, each variable is a property on this object.
	 * 
	 * @type object
	 * @private
	 */
	dusk.actions._vars = {};
	
	/** This is an object containing all the threads that have been created. Each thread is an object with a `buffer` property, a `nexts` property and an `actions` property.
	 * 
	 * `nexts` is the number of times `{@link dusk.actions.awaitNext}` has been called for the thread, and is the number of times `{@link dusk.actions.next}` has to be called for the program to continue.
	 * 
	 * `actions` is the current list of actions that the engine is slowly working it's way through.
	 * `buffer` is a "temprary storage area" for actions that should be ran next, and is inserted into `actions` before any more actions are ran.
	 * 
	 * The buffer is required so that the order of actions is intuitive, `{@link dusk.actions.run}` calls that were called first should be ran first.
	 * 
	 * @type object
	 * @private
	 */
	dusk.actions._threads = {};
	
	/** This is all the frame handlers, they are arrays in the form `[function, scope]`, the key is the name of the handler.
	 * 
	 * @type object
	 * @private
	 */
	dusk.actions._frameHandlers = {};
	/** This is all the key handlers, they are arrays in the form `[function, scope]`, the key is the name of the handler.
	 * 
	 * @type object
	 * @private
	 */
	dusk.actions._keyHandlers = {};
	/** This is all the keyup (when the key is released) handlers, they are arrays in the form `[function, scope]`, the key is the name of the handler.
	 * 
	 * @type object
	 * @private
	 */
	dusk.actions._keyUpHandlers = {};
	/** This is all the start handlers, which are called when the engine is about to start, they are arrays in the form `[function, scope]`, the key is the name of the handler.
	 * 
	 * @type array
	 * @private
	 */
	dusk.actions._startHandlers = [];
	
	/** This is the number of files specified in root.json that are currently being downloaded. A value of -1 means that they aren't being downloaded yet, and 0 means they are all downloaded and ran.
	 * 
	 * @type number
	 * @default -1
	 */
	dusk.actions.waitingFor = -1;
	
	/** If true, then the events system is running, if false then it isn't.
	 * 
	 * @type boolean
	 */
	dusk.actions.started = false;
	
	/** An array of all the operators supported in the condition evaluation.
	 * 
	 * @type array
	 * @private
	 */
	dusk.actions._ops = ["*", "/", "+", "-", "<", ">", "<=", ">=", "=", "!=", "&&", "||"];
	
	/** An array of all the regular expressions that match the operators `{@link dusk.actions._ops}`.
	 * They are generated on initiation to save time.
	 * 
	 * @type array
	 * @private
	 */
	dusk.actions._opsReg = [];
	
	for(var o = 0; o < dusk.actions._ops.length; o ++){
		dusk.actions._opsReg[o] = RegExp("([^"+dusk.actions._regEscape(dusk.actions._ops.join(""))+"]+)\\s*("+dusk.actions._regEscape(dusk.actions._ops[o])+")\\s*([^"+dusk.actions._regEscape(dusk.actions._ops.join(""))+"]+)", "i");
	}
	
	/** The currently running thread.
	 * Assuming `{@link dusk.actions.awaitNext}` has not been called, this will be the current thread for the current action. Setting it to anything else will most likely break something.
	 * 
	 * @type string
	 */
	dusk.actions.thread = "";
	
	//Set some vars
	dusk.actions.setVar("sys.game.ver", dusk.ver);
	dusk.actions.setVar("sys.game.frameRate", dusk.frameRate);
	
	//Register actions
	dusk.actions.registerAction("comment", function(what){}, dusk.actions, [["", false, "STR"]]);
	dusk.actions.registerAction("function", dusk.actions._addFunction, dusk.actions, [["name", true, "STR"], ["actions", true, "DWC"]]);
	dusk.actions.registerAction("listen", dusk.actions._addListener, dusk.actions, [["event", true, "STR"], ["name", false, "STR"], ["actions", true, "DWC"]]);
	dusk.actions.registerAction("if", dusk.actions._iffy, dusk.actions, [["cond", true, "STR"], ["then", false, "DWC"], ["else", false, "DWC"]]);
	dusk.actions.registerAction("ifset", dusk.actions._ifset, dusk.actions);
	dusk.actions.registerAction("while", dusk.actions._whiley, dusk.actions, [["cond", true, "STR"], ["actions", true, "DWC"]]);
	dusk.actions.registerAction("call", dusk.actions._callFunction, dusk.actions, [["name", true, "STR"], ["thread", false, "STR"]]);
	dusk.actions.registerAction("fire", dusk.actions._fire, dusk.actions, [["event", true, "STR"]]);
	dusk.actions.registerAction("unlisten", dusk.actions._unlisten, dusk.actions, [["name", false, "STR"], ["event", false, "STR"]]);
	dusk.actions.registerAction("var", dusk.actions._setVarInternal, dusk.actions, [["name", true, "STR"], ["value", true, "OBJ"], ["inherit", false, "STR"]]);
	dusk.actions.registerAction("delvar", dusk.actions._delVarInternal, dusk.actions, [["name", true, "STR"]]);
	dusk.actions.registerAction("thread", dusk.actions._threadTo, dusk.actions, [["name", true, "STR"], ["actions", true, "DWC"]]);
	dusk.actions.registerAction("vardump", function(what){console.log(dusk.actions._vars);}, dusk.actions, []);
	
	dusk.actions.registerHashFunct("IF", dusk.actions._hiffy, dusk.actions);
	dusk.actions.registerHashFunct("=", dusk.actions._rawCond, dusk.actions);
};

/** This initiates the events system, firing the start handlers and starting downloading the files specified by `root.json`.
 * 
 * @see {@link events.registerStartHandler}
 */
dusk.actions.startGame = function() {
	if(dusk.actions.started) return;
	dusk.actions.started = true;
	
	//Start handlers
	for(var i = 0; i < this._startHandlers.length; i++){
		this._startHandlers[i][0].call(this._startHandlers[i][1]);
	}
	
	//Load all files
	dusk.actions.waitingFor = dusk.data.root.files.length;
	for(var i = dusk.data.root.files.length-1; i>= 0; i--) {
		dusk.data.download(dusk.data.root.files[i], "text", function(d, s) {
			dusk.actions.run(dusk.utils.jsonParse(d, true), "_init");
			dusk.actions.waitingFor --;
		});
	}
};

/** This function is called every frame by the game namespace.
 * 
 * It will run any active actions waiting to be ran, fire all the frameHandlers and fires the event `sys-event-frame` on the thread `_frame`.
 * 
 * @see {@link dusk.frameRate}
 * @see {@link events.registerFrameHandler}
 */
dusk.actions.everyFrame = function() {
	//Fire event
	if(this.getVar("sys.started")){
		this.run([{"a":"fire", "event":"sys-event-frame"}], "_frame");
	}
	
	//Frame handlers
	for(var h in this._frameHandlers){
		this._frameHandlers[h][0].call(this._frameHandlers[h][1]);
	}
	
	//Keep running actions untill we have to stop
	var doneSomething;
	for(var x = 200; x > 0; x--){
		doneSomething = false;
		for(var t in this._threads){
			doneSomething = this.next(t, false)?true:doneSomething;
		}
		
		if(!doneSomething) break;
	}
};

/** This is called by `{@link dusk.game}` if a key is pressed.
 * 
 * It loops through all the keyHandlers, and runs them.
 * 
 * @param {object} e A JQuery keyhandler event.
 * @see {@link dusk.actions.registerKeyHandler}
 */
dusk.actions.keypress = function(e) {
	for(var h in this._keyHandlers){
		this._keyHandlers[h][0].call(this._keyHandlers[h][1], e);
	}
};

/** This is called by `{@link dusk.game}` if a key that was previously pressed is release.
 * 
 * It loops through all the keyUpHandlers, and runs them.
 * 
 * @param {object} e A JQuery keyhandler event.
 * @see {@link dusk.actions.registerKeyUpHandler} 
 */
dusk.actions.keyup = function(e) {
	for(var h in this._keyUpHandlers){
		this._keyUpHandlers[h][0].call(this._keyUpHandlers[h][1], e);
	}
};

/** This will run the actions specified on the thread specified.
 * 
 * You cannot run a single action with this, you must insert the object in an array.
 * 
 * @param {array} what The actions to run.
 * @param {string=""} thread The thread to run the actions on. If this is undefined, the thread `"main"` is used.
 */
dusk.actions.run = function(what, thread) {
	if(!thread) thread = "main";
	
	//if(typeof what == "string") what = JSON.parse(what);
	
	//Add all the commands to the buffer to be added before running any more commands
	for(var i = 0; i < what.length; i++){
		this._getThread(thread, true).buffer[this._getThread(thread, true).buffer.length] = what[i];
	}
};

/** This performs an action, it takes the next action on the specified thread (if it exists) and runs it.
 * 
 * This is called in two places, firstly in the frame loop, where a number of actions are ran each frame until all actions are depleted.
 * 	It is also called by code in modules to continue after {@link dusk.actions.awaitNext} has been called.
 * 	Each call will run a single action.
 * 
 * If the thread is waiting on any nexts (From {@link dusk.actions.awaitNext}), then the normal frame loop will not run any actions.
 * 
 * @param {string} t The thread on which the next action will be ran.
 * @param {boolean=true} decrement Whether the `nexts` on the thread should be decremented before running the command.
 * 	 If this is false, and there are `nexts` waiting on the thread no actions will be ran.
 *   If it is true (the default), then the number of `nexts` will be decreased by one, and then if it is zero, the next action ran.
 * 
 * @return {boolean} Whether any actions were ran, if this returns false calling it again immediately after will not do anything.
 */
dusk.actions.next = function(t, decrement) {
	if(decrement === undefined) decrement = true;
	//Check if we are waiting for any nexts
	
	if(decrement){
		this._getThread(t).nexts --;
	}
	
	if(this._getThread(t).nexts > 0){
		return false;
	}
	this._getThread(t).nexts = 0;
	
	//Feed the buffer into the stack
	for(var b = this._getThread(t).buffer.length-1; b >= 0; b--){
		this._getThread(t).stack[this._getThread(t).stack.length] = this._getThread(t).buffer[b];
	}
	
	this._getThread(t).buffer = [];
	
	//If the stack is empty, there is nothing to do, so we wait for input
	if(this._getThread(t).stack.length == 0){
		return false;
	}
	
	//Get the last one from the stack and remove it
	var current = this._getThread(t).stack.pop();
	
	if(typeof(current) == "string") return true;
	
	//Escape vars
	if(current.a != "while"){
		current = this.replaceVar(current);
	}
	
	if(this._actions[current.a]){
		this.thread = t;
		this._actions[current.a][0].call(this._actions[current.a][1], current);
		return true;
	}
	
	console.error("Unknown action \""+current.a+"\".");
	console.log(current);
	return true;
};

/** This increments the `nexts` value on the specified thread. This means that for each time you call this you must also call `{@link dusk.actions.next}`.
 * 
 * Until you call all the required nexts, the thread won't do any more action, so you can use this to do animation or downloads, say.
 * 
 * @param {string=} t The thread to wait on. If undefined the current thread will be used.
 * @param {number=} count The number of nexts to wait on, defaults to 1 if not given.
 * @return The thread that has been asked to wait. This will be equal to the `t` param. This must be the the argument used when calling `{@link dusk.actions.next}`.
 */
dusk.actions.awaitNext = function(t, count) {
	if(t === undefined) t = this.thread;
	if(count === undefined) count = 1;
	
	this._getThread(t).nexts += count;
	return t;
};

/** Function: replaceVar
 * 
 * [object] This takes an object (such as an action), and replaces all of the properties containing vars with their correct values.
 * 	It will only replace properties that are strings, and won't touch the names of them.
 * 
 * You can also have it replace the vars of all the children of any arrays it finds, if you like...
 * 
 * Params:
 * 	data		- [object] The data that should have the properties evaluated.
 * 	children	- [boolean] If true then this function will be called with all the children of any arrays it finds in the data.
 * 
 * Returns:
 *	The data with all the properties evaluated and replaced.
 */
dusk.actions.replaceVar = function(data, children) {
	for(var p in data){
		if(typeof(data[p]) == "string"){
			data[p] = this.parseVar(data[p]);
		}else if(children && typeof(data[p]) == "array"){
			for(var i = data[p].length-1; i >= 0; i--){
				data[p][i] = this.replaceVar(data[p][i], false);
			}
		}
	}
	
	return data;
};

/** Function: hashFunction
 * 
 * [string] This does a hashFunction, and returns the value that it would return.
 * 
 * Params:
 * 	name		- [string] The name of the hashfunction to call.
 * 	args		- [string, string, ...] The arguments to the hashfunction.
 * 
 * Returns:
 *	The return value of the hashfunction.
 */
dusk.actions.hashFunction = function(name, args) {
	if(!this._hashFuncts[name.toLowerCase()]){
		console.warn("No hashfunction named #"+name+".");
		return "";
	};
	
	return this._hashFuncts[name.toLowerCase()][0].call(this._hashFuncts[name.toLowerCase()][1], name, args);
};

/** Function: registerAction
 * 
 * This registers a new action, when the action encountered, the function supplied is ran in the specified scope.
 * 	The scope would most likely be "this" from wherever you are calling it.
 * 	The function will be passed the whole action as a parameter.
 * 
 * Params:
 * 	name		- [string] The name of the action to listen for, this should be the one the action has the "a" property set to.
 * 	funct		- [function([object]){[undefined]}] The function to be called to run the action. Said action will be passed as a parameter.
 * 	scope		- [object] The scope that the function will be ran in.
 * 	langDef		- [array] A definition of the action for DWC, see the guide somewhere.
 */
dusk.actions.registerAction = function(name, funct, scope, langDef) {
	dusk.dwc.addLangDef(name, langDef);
	this._actions[name] = [funct, scope];
};

/** Function: registerHashFunct
 * 
 * This registers a new hashfunction, and the Javascript function to run said action.
 * 	The scope would most likely be "this", and is the scope in which the function will be ran.
 * 	The function will be passed an array of the params, which will all be strings.
 * 
 * Params:
 * 	name		- [string] The name of the function, for example the hashfunction with the name EXP would be called via #EXP(1, 2);
 * 	funct		- [function([string], [string, string, ...]){[string]}] The function to be called to do the hashfunction, the first argument is the name, the second an array of params. This should return the value to replace with.
 * 	scope		- [object] The scope that the function will be ran in.
 */
dusk.actions.registerHashFunct = function(name, funct, scope) {
	this._hashFuncts[name.toLowerCase()] = [funct, scope];
};

/** Function: registerFrameHandler
 * 
 * This registers a function to be called every frame. The function specified will be called (in the specified scope) <DuskWolf.frameRate> frames a second.
 * 
 * Params:
 * 	name		- [string] The name of the frameHandler.
 * 	funct		- [function(){[undefined]}] The function to be called every frame.
 * 	scope		- [object] The scope in which to run the function, generally this object will be "this" inside the function.
 */
dusk.actions.registerFrameHandler = function(name, funct, scope) {
	this._frameHandlers[name] = [funct, scope];
};

/** Function: registerKeyHandler
 * 
 * This registers a function that will be called when a key (any key) is pressed. Note that the initiation process should disable scrolling for arrow keys and all that.
 * 
 * Params:
 * 	name		- [string] The name of the handler.
 * 	funct		- [function([object]){[undefined]}] The function to be called, it is called with a JQuery keypress object.
 * 	scope		- [object] The scope to run the object in.
 */
dusk.actions.registerKeyHandler = function(name, funct, scope) {
	this._keyHandlers[name] = [funct, scope];
};

/** Function: registerKeyUpHandler
 * 
 * This registers a function that will be called when a key (any key) is released after being pressed.
 * 
 * Params:
 * 	name		- [string] The name of the handler.
 * 	funct		- [function([object]){[undefined]}] The function to be called, it is called with a JQuery keypress object.
 * 	scope		- [object] The scope to run the object in.
 */
dusk.actions.registerKeyUpHandler = function(name, funct, scope) {
	this._keyUpHandlers[name] = [funct, scope];
};

/** Function: registerStartHandler
 * 
 * This registers a function that will be called when the game starts, this allows you to use the DOM.
 * 
 * Params:
 * 	name		- [string] The name of the handler.
 * 	funct		- [function([object]){[undefined]}] The function to be called, it is called with a JQuery keypress object.
 * 	scope		- [object] The scope to run the object in.
 */
dusk.actions.registerStartHandler = function(funct, scope) {
	this._startHandlers[this._startHandlers.length] = [funct, scope];
};

/*- Function: _addFunction
 * 
 * Used internally to do the action "function", you should use the <run> function instead of calling this directly.
 * 
 * Params:
 * 	data		- [object] The action to use, it should be a normal "function" action object.
 */
dusk.actions._addFunction = function(data) {
	if(!data.name) {throw new dusk.errors.PropertyMissing(data.a, "name");}
	if(!data.actions) {throw new dusk.errors.PropertyMissing(data.a, "actions");}
	
	this._functions[data.name] = data.actions;
};

/*- Function: _callFunction
 * 
 * Used internally to do the action "call", you should use the <run> function instead of calling this directly.
 * 
 * Params:
 * 	data		- [object] The action to use, it should be a normal "call" action object.
 */
dusk.actions._callFunction = function(a) {
	if(!a.name) {throw new dusk.errors.PropertyMissing(a.a, "name");}
	
	if(this._functions[a.name]){
		this.run(this._functions[a.name], a.thread?a.thread:this.thread);
	} else console.warn("Function "+a.name+" does not exist!");
};

/*- Function: _threadTo
 * 
 * Used internally to do the action "thread", you should use the <run> function instead of calling this directly.
 * 
 * Params:
 * 	data		- [object] The action to use, it should be a normal "thread" action object.
 */
dusk.actions._threadTo = function(data) {
	if(!data.name) {throw new dusk.errors.PropertyMissing(data.a, "name");}
	if(!data.actions) {throw new dusk.errors.PropertyMissing(data.a, "actions");}
	
	this.run(data.actions, data.name);
};

/*- Function: _getThread
 * 
 * [object] This gets a thread. It can also create a new thread if it does not exist yet.
 * 
 * Params:
 * 	name		- [string] The name of the thread to find or create.
 * 	create		- [boolean] Whether to create a new thread if it doesn't exist. Defaults to false.
 * 
 * Returns:
 *	A "thread", see <_threads> for information on properties. If the thread doesn't exist and create is false, it returns null.
 */
dusk.actions._getThread = function(name, create) {
	if(this._threads[name]){
		return this._threads[name];
	}else if(create){
		this._threads[name] = {};
		this._threads[name].stack = [];
		this._threads[name].buffer = [];
		this._threads[name].nexts = 0;
		return this._threads[name];
	}
	
	throw new Error("Thread "+name+" does not exist!");
};

/*- Function: _addListener
 * 
 * Used internally to do the action "listen", you should use the <run> function instead of calling this directly.
 * 
 * Params:
 * 	a			- [object] The action to use, it should be a normal "listen" action object.
 */
dusk.actions._addListener = function(a) {
	if(!a.event){throw new dusk.errors.PropertyMissing(a.a, "event");}
	
	if(a.name) {
		for(var p in this._listeners) {
			if(this._listeners[p].name && this._listeners[p].name == a.name) {
				return;
			}
		}
	}
	
	this._listeners[this._listeners.length] = a;
};

/*- Function: _unlisten
 * 
 * Used internally to do the action "unlisten", you should use the <run> function instead of calling this directly.
 * 
 * Params:
 * 	data		- [object] The action to use, it should be a normal "unlisten" action object.
 */
dusk.actions._unlisten = function(data) {
	for(var l = this._listeners.length-1; l >= 0; l--){
		if(this._listeners[l] && this._listeners[l].event == data.event){
			var fail = false;
			for(var p in this._listeners[l]){
				if((["actions", "event", "__proto__", "a"]).indexOf(p) == -1 && data[p] && ((this._listeners[l][p] != data[p] && this._listeners[l][p][0] != "!") || ("!"+this._listeners[l][p] == data[p] && this._listeners[l][p][0] == "!"))){
					fail = true;
					break;
				}
			}
			
			if(!fail){
				delete this._listeners[l];
			}
			
		}
	}
};

/*- Function: _fire
 * 
 * Used internally to do the action "fire", you should use the <run> function instead of calling this directly.
 * 
 * Params:
 * 	data		- [object] The action to use, it should be a normal "fire" action object.
 */
dusk.actions._fire = function(data) {
	if(!data.event){throw new dusk.errors.PropertyMissing(data.a, "event");}
	
	for(var l = this._listeners.length-1; l >= 0; l--){
		if(this._listeners[l] && this._listeners[l].event == data.event){
			var fail = false;
			for(var p in this._listeners[l]){
				if((["name", "actions", "event", "__proto__", "a"]).indexOf(p) == -1 && this._listeners[l][p] !== null && ((this._listeners[l][p] != data[p] && this._listeners[l][p][0] != "!") || ("!"+this._listeners[l][p] == data[p] && this._listeners[l][p][0] == "!"))){
					fail = true;
					break;
				}
			}
			
			if(!fail){
				this.run(this._listeners[l].actions, this.thread);
			}
			
		}
	}
};

/*- Function: _iffy
 * 
 * Used internally to do the action "if", you should use the <run> function instead of calling this directly.
 * 
 * Params:
 * 	data		- [object] The action to use, it should be a normal "if" action object.
 */
dusk.actions._iffy = function(what) {
	if(what.cond === undefined){throw new dusk.errors.PropertyMissing(what.a, "cond");}
	
	if(this.cond(what.cond)) {
		if(what.then !== undefined) this.run(what.then, this.thread);
	}else if(what["else"] !== undefined) this.run(what["else"], this.thread);
};

/*- Function: _hiffy
 * 
 * [string] Used internally to do the hashfunction "IF".
 * 	You should use the standard ways of running hashfunctions, rather than calling this directly.
 * 
 * Params:
 * 	name		- [string] The string name of the hashfunct.
 * 	args		- [Array] An array of arguments.
 * 
 * Returns:
 *	The output of the hashfunct.
 */
dusk.actions._hiffy = function(name, args) {
	if(args[0] === undefined){throw new dusk.errors.ArgLengthWrong(name, args.length, 1);}
	
	if(this.cond(args[0])) {
		if(args[1] !== undefined) return args[1];
	}else if(args[2] !== undefined) return args[2];
	
	return "";
};

/*- Function: _rawCond
 * 
 * [string] Used internally to do the hashfunction "=".
 * 	You should use the standard ways of running hashfunctions, rather than calling this directly.
 * 
 * Params:
 * 	name		- [string] The string name of the hashfunct.
 * 	args		- [Array] An array of arguments.
 * 
 * Returns:
 *	The output of the hashfunct.
 */
dusk.actions._rawCond = function(name, args) {
	return this.cond(args[0]);
};

/*- Function: _ifSet
 * 
 * Used internally to do the action "ifSet", you should use the <run> function instead of calling this directly.
 * 
 * Params:
 * 	data		- [object] The action to use, it should be a normal "ifSet" action object.
 */
dusk.actions._ifSet = function(what) {
	if(!("value" in what)){throw new dusk.errors.PropertyMissing(what.a, "value");}
	
	if(!what.value) {
		if("then" in what) this.run(what.then, this.thread);
	}else if("else" in what) {
		this.run(what["else"], this.thread);
	}
};

/*- Function: _whiley
 * 
 * Used internally to do the action "while", you should use the <run> function instead of calling this directly.
 * 
 * Params:
 * 	data		- [object] The action to use, it should be a normal "while" action object.
 */
dusk.actions._whiley = function(what) {
	if(!what.cond){throw new dusk.errors.PropertyMissing(what.a, "cond");}
	if(!what.actions){throw new dusk.errors.PropertyMissing(what.a, "actions");}
	
	if(this.cond(this.parseVar(what.cond))){
		var funId = (new Date()).getTime();
		what.actions[what.actions.length] = {"a":"if", "cond":what.cond, "then":[{"a":"call", "name":"_while_"+funId}]};
		this.run([{"a":"function", "name":"_while_"+funId, "actions":what.actions}, {"a":"call", "name":"_while_"+funId}], this.thread);
	}
};

/*- Function: _regEscape
 * 
 * [string] This takes a string, and replaces any regexp chars that are needed. It's like \Q...\E.
 * 
 * Params:
 * 	str			- [string] The string to escape.
 * 
 * Returns:
 *	The string suitable for regexp.
 */ 
dusk.actions._regEscape = function(str) {
	return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};
	
/** Function: parseVar
 * 
 * [string/number] This takes a string, and replaces all the vars it can find with their values, see the section at the top of the page about them.
 * 
 * It will only break down 20 times until it gives up.
 * 
 * Params:
 * 	data		- [string] The string to replace the vars in.
 * 	rec			- [number] Used internally, the function tracks how many times it has checked by incrementing this each time.
 * 
 * Returns:
 *	A fully parsed string, where all the variables are replaced. If when broken down the string can be a number, then it is returned as one.
 */ 
dusk.actions.parseVar = function(str, asStr) {
	str = String(str);
	
	var ex = null;
	var done = true;
	while(done) {
		done = false;
		
		while(ex = /\$([-\.a-zA-Z0-9]+);?/gi.exec(str)){
			done = true;
			str = str.replace(ex[0], this.getVar(ex[1]));
		}
		
		while(ex = /\$-([-\.a-zA-Z0-9]+);?/gi.exec(str)){
			done = true;
			str = str.replace(ex[0], -1*this.getVar(ex[1]));
		}
		
		while(ex = /#([^#\(]+)\(([^;#\$]+)\);?/gi.exec(str)){
			done = true;
			str = str.replace(ex[0], this.hashFunction(ex[1], ex[2].split(/\,\s*/)));
		}
	}
	
	//Check if it is JSON
	if(!asStr && str && dusk.utils.isJson(str)) {
		return JSON.parse(str);
	} else {
		return str;
	}
};

/** Function: cond
 * 
 * [boolean] This is used in the likes of "while" and "if", give it a string and it will evaluate it, breaking it down into ether true or false. See the section on "Conditions" in the class description.
 * 
 * Params:
 * 	cond		- [string] The string to evaluate.
 * 
 * Returns:
 *	Either true or false, if the condition breaks down to "true" then true, "false" then false.
 */
dusk.actions.cond = function(cond, asStr) {
	cond = String(cond);
	var ex;
	
	while(ex = /\((.*?)\)/.exec(cond)){
		cond = cond.replace(ex[0], this.cond(ex[1], true));
	}
	
	for(var o = 0; o < this._ops.length; o ++){
		while(ex = this._opsReg[o].exec(cond)){
			cond = cond.replace(ex[0], this._doOp(ex[1], ex[3], ex[2]));
		}
	}
	
	if(!asStr && dusk.utils.isJson(cond)) {
		return JSON.parse(cond);
	} else {
		return cond;
	}
};

dusk.actions._doOp = function(lhs, rhs, op) {
	lhs = this.cond(lhs);
	if(rhs) rhs = this.cond(rhs);
	
	switch(op){
		case "+": return lhs+rhs;
		case "-": return lhs-rhs;
		case "*": return lhs*rhs;
		case "/": return lhs/rhs;
		
		case "=": return lhs==rhs;
		case "!=": return lhs!=rhs;
		
		case "<": return lhs<rhs;
		case ">": return lhs>rhs;
		
		case ">=": return lhs>=rhs;
		case "<=": return lhs>=rhs;
		
		case "&&": return Boolean(lhs)&&Boolean(rhs);
		case "||": return Boolean(lhs)||Boolean(rhs);
	}
};

/*- Function: _setVarInternal
 * 
 * Used internally to do the action "var", you should use the public function <setVar> to do this, rather than this.
 * 
 * Params:
 * 	data		- [object] The action to use, it should be a normal "var" action object.
 * 
 * See:
 * 	* <setVar>
 */
dusk.actions._setVarInternal = function(a) {
	if(a.name === undefined) {throw new dusk.errors.PropertyMissing(a.a, "name");}
	if(a.value === undefined) {throw new dusk.errors.PropertyMissing(a.a, "value");}
	
	this.setVar(a.name, a.value, a.inherit);
};

/** Function: setVar
 * 
 * [*] This sets the value of a variable. It is recommended to use this, rather than running actions. Variables are described in the class description.
 * 
 * Params:
 * 	name		- [string] The name of the var to set, should only use alphanumeric characters, "-", "." and "_".
 *	value		- [any] The value to set the named var to. It can be any type.
 * 	inherit		- [string] The name of any existing var. If present, then that var will be set to the "name", and then the properties of values (which should be an object) will be set so that those properties still exist.
 * 
 * Returns:
 *	The value that was set, same as the param "value".
 * 
 * See:
 * 	* <setVars>
 * 	* <getVar>
 */
dusk.actions.setVar = function(name, value, inherit) {
	name = String(name);
	if(name.indexOf(",") !== -1) console.warn("A variable name with a comma in it may cause problems, tried to set "+name);
	
	name = name.toLowerCase();
	var fragments = name.split(".");
	var obj = this._vars;
	if(fragments.length > 1){
		for(var point = 0; point < fragments.length-1; point ++) {
			if(obj[fragments[point]] === undefined) obj[fragments[point]] = {};
			obj = obj[fragments[point]];
		}
	}
	
	obj[fragments[fragments.length-1]] = value;
	
	if(inherit !== undefined) {
		dusk.actions.setVar(name, dusk.utils.merge(dusk.actions.getVar(inherit), dusk.actions.getVar(name)));
	}
	
	return value;
};

/** Function: setVars
 * 
 * This sets multiple variables at once! Just supply it with an array of [key, value] pbehavers and away you go!
 * 
 * Params:
 * 	list		- [array] The vars and values to set, an array of arrays in the form [name, value].
 * 
 * See:
 * 	* <setVar>
 */
dusk.actions.setVars = function(list) {
	for(var i = list.length-1; i>= 0; i--){
		this.setVar(list[i][0], list[i][1]);
	}
};

/** Function: getVar
 * 
 * [*]This returns the value of a variable, and is the only way to get a variable. If the variable is undefined, undefined is returned.
 * 
 * Params:
 * 	name		- [string] The name of the var to retrieve.
 * 
 * Returns:
 *	The value of the variable, or an empty string if the variable is undefined.
 * 
 * See:
 * 	* <setVar>
 * 	* <getVars>
 */
dusk.actions.getVar = function(name) {
	name = name.toLowerCase();
	
	var fragments = name.split(".");
	var obj = this._vars;
	if(fragments.length > 1){
		for(var point = 0; point < fragments.length-1; point ++) {
			if(obj[fragments[point]] === undefined) {
				return undefined;
			}
			obj = obj[fragments[point]];
		}
	}
	
	if(obj[fragments[fragments.length-1]] !== undefined){
		return obj[fragments[fragments.length-1]];
	}
	
	return undefined;
};

/** Function: getVars
 * 
 * [array] This returns the value of all variables matching a regexp.
 * 
 * Params:
 * 	expr		- [regexp] The regexp to check.
 * 
 * Returns:
 *	An array of [key, value] pbehavers. You should be able to call <setVars> on them to set the variables back.
 * 
 * See:
 * 	* <getVar>
 */
dusk.actions.getVars = function(expr) {
	var ret = [];
	for(var p in this._vars){
		if(expr.test(p)){
			ret[ret.length] = [p, this._vars[p]];
		}
	}
	
	return ret;
};

/*- Function: _delVarInternal
 * 
 * Used internally to do the action "delvar", you should use the public function <delVar> to do this, rather than this.
 * 
 * Params:
 * 	data		- [object] The action to use, it should be a normal "delvar" action object.
 * 
 * See:
 * 	* <delVar>
 */
dusk.actions._delVarInternal = function(a) {
	if(!a.name) {throw new dusk.errors.PropertyMissing(a.a, "name");}
	
	this.delVar(a.name);
};

/** Function: delVar
 * 
 * This deletes a variable, probably freeing up memory, probably speeding up var lookup times, probably fuelling your inner force that says that everything must be organised.
 * 
 * Params:
 * 	name		- [string] The name of the var to delete.
 * 
 * See:
 * 	* <setVar>
 * 	* <getVar>
 */
dusk.actions.delVar = function(name) {
	name = name.toLowerCase();
	
	var fragments = name.split(".");
	var obj = this._vars;
	if(fragments.length > 1){
		for(var point = 0; point < fragments.length-1; point ++) {
			if(obj[fragments[point]] === undefined) {
				return undefined;
			}
			obj = obj[fragments[point]];
		}
	}
	
	if(obj[fragments[fragments.length-1]] !== undefined){
		delete obj[fragments[fragments.length-1]];
	}
	
	return undefined;
};
