//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

__import__("mods/__init__.js");

/** Class: Events
 * 
 * This is the heart of the entire system! It manages the event stack and carries out events.
 * 
 * Definitions:
 * 
 * Action 			- A single thing to do. Each module is expected to add some. Generally the loop goes through the stack, and each "action" is evaluated and run. An action is just a simple object.
 * Function 		- A group of actions, when it is ran or "called", it runs all it's actions in order (top to bottom). They can also accept arguments.
 * Listener 		- A listener listens for something to happen. Other parts of the system will 'fire' things, such as when the system starts or something.
 * Event 			- This is what the listener listens for, it is fired (Ether by code or internally), and the listener responds to it with it's own function.
 * Var, Variable 	- A value that can be changed, see the section below for details.
 * 
 * Running Actions:
 * 
 * To actually run an action, you need to call <Events.run> with the array of actions, and the thread you want it to run in.
 * 
 * To register a new action from a module, call <Events.registerAction> from your module's <IModule.addActions> call with a function and scope.
 * If you want to wait for something to happen (as in, say you want to wait for user input, or a file to load), you should call <Events.awaitNext>, which reterns the current thread that you are waiting in.
 * When you want to start running again, call <Events.next> with the thread to continue in.
 * 
 * Listeners:
 * 
 * Listeners listen for something to happen, and then act on it when or if it does happen!
 * Listeners are defined by using {"a":"listen", "event":"...", "actions":[...], ("name":"...")}, and they can be fired by using {"a":"fire", "event":"..."}.
 * There can also be a number of values fired and listened for; if the listener object had the property "foo":"bar", then the fire action must also have "foo":"bar", or the listener would not be called.
 * You can also use "foo":"!bar" on the listener to say that if foo is bar, then the listener should NOT run.
 * There is also a name property, that lets you identify listeners uniquely. You cannot set a new listener when one already exists with the same name.
 * 
 * Conditions:
 * 
 * Some actions, like if and while, also have conditions, conditions should be a string made of one of the characters below, the condition is then broken down until it reaches true or false.
 * 
 * Note that whitespace is removed, so the condition "This String == ThisString" will be true.
 * 
 * > (n)
 * (false) and (true) will be broken down to false and true, respectivley, this allows you to "group conditions" so that they don't interfere.
 * 
 * > n = m
 * Is true if and only if n is equal to m, for example, 1 = 1 would be true, but 1 = 2 would be false.
 * 
 * > n != m
 * Is true if and only if n is not equal to m, like "=", but opposite.
 * 
 * > n < m, n > m
 * Is true if and only if n is less than m for the former, and n is greater than m for the latter, 1 < 2 becomes true, but 2 < 1 becomes false.
 * 
 * > n <= m, n >= m
 * Same as "<" and ">", but is true if they are equal as well.
 * 
 * > n && m
 * Is true if and only if both n and m are true.
 * 
 * > n || m
 * Is true if at least n or m is true.
 * 
 * > n + m, n - m, n * m, n / m, n % m
 * 	Performs the expected operations (add, subtract, multiply, divide, modulo), and becomes the result. 1 + 1 = 2 would be true, for example.
 * 
 * Variables:
 * 
 * Variables are set using the "var" action. variable names should include only case-insensitive alphanumeric characters and the chars "-_", any others may not work as intended. Note that the replacing is only done with basic strings, if you, say, put an "&" in the value of a variable it would be replaced in conditions, possibly causing trouble.
 * 
 * Variables can be referenced (in any property, any occurences of these are replaced by their equivilents below.)
 * 
 * > $name;
 * This is replaced by the variable "name". Simple, huh.
 * 
 * > $na$l;e;
 * Yes, this is possible, firstly $l; is replaced by whatever the var "l" is, and then the result is replaced. For example, if $l; was "m", then the whole thing there would be replaced by the value for "name".
 * 
 * > $-name;
 * Name, which resolve to a number, is inverted, if the var "name" was 4, for example, this would be replaced with -4.
 * 
 * Hashfunctions:
 * 
 * Hashfunctions work similar to variables, except that they call functions instead of being static values. They are provided by modules using <Events.registerHashFunc> in a similar way to actions.
 * 	The syntax for calling them is #NAME(arg1, arg2); The names are not case sensitive, and there can be any number of arguments.
 * 
 * Threads:
 * 
 * Threads (which are not done by the CPU) allow you to do multiple things at once, for example, you can animate a background while still having the player move.
 *  Basically, each thread maintains it's own list of actions it has to run, and an <Events.awaitNext> call will only cause execution on the current thread to stop.
 *  In the actions thing, you can use the "thread" action to switch threads.
 *  You can get the current thread by reading <Events.thread> of this, which will not work if you cave called <Events.awaitNext>.
 * 
 * Thread names starting with a "_" are system or internal threads, you should not use a thread name with an underscore at the start.
 * 
 * Modules:
 * 
 * Modules are classes that implement <mods.IModule> and generally let you DO something usefull, rather than simple printing of vars...
 *  Generally, a module calls <mods.IModule.addAction> with details it needs, and when that action is found when running code the function registered is called.
 * 
 * Built-in Actions:
 * 
 * > {"a":"function", "name":"...", "actions":[...]}
 * This defines the function given by name, which will run actions when called. It can be called with the call action.
 * 
 * > {"a":"call", "name":"...", ("thread":"...")}
 * Calls the function with the name given by name, once the code is finished, it resumes from the next action after this. If thread is specified, it is ran in that thread.
 * 
 * > {"a":"if", "cond":"...", ("then":[...],) ("else":[...])}
 * Evaluates the condition using the rules above, if it is true, then the "then" array is ran, else the "else" array is ran instead. Simple.
 * 
 * > {"a":"ifset", "value":"...", ("then":[...],) ("else":[...])}
 * [DEPRECIATED?] Runs the actions specified by "then" if the value string is not empty, otherwise it runs "else". This can be used to check if vars are defined, "$1;$2;" will run the "then" actions if ether one of the vars is not a blank string, and if they are both unset, then it will run the "else" actions.
 * 
 * > {"a":"while", "cond":"...", "actions":[...]}
 * It keeps repeating the actions if the condition is true.
 * 
 * > {"a":"listen", "event":"...", "actions":[...], ("name":"...",) ("prop1":"...", ("prop2":"...", ...))}
 * This creates a listener, making it listen for the event specified, which will run actions when it recieves it. See the section on listeners above.
 * The name property will not be actually used on the listener, but is used for identifying it, say, for deleting it.
 * 
 * > {"a":"fire", "event":"...", ("prop1":"...", ("prop2":"...", ...))}
 * Fires the specified event, which will trigger the listener which all the properties match, see the section above for details.
 * 
 * > {"a":"unlisten", ("name":"...",) ("event":"...",) ("prop1":"...", ("prop2":"...", ...))}
 * Deletes the listener that would be fired if the rules for "listen" were true. Note that the event property is optional.
 * 
 * > {"a":"var", "name":"...", "value":{...}, ["inherit":"..."]}
 * Sets the var specified with the value specified. If inherit is specified, then the variable, if an object, will "inherit" the properties of the specified var.
 * 
 * > {"a":"thread", "name":"...", "actions":[...]}
 * The actions specified will now run in that thread. The current thread will continue going to the next line.
 * 
 * > {"a":"delvar", "name":"..."}
 * Deletes the variable named, this will free up memory or something.
 * 
 * System Vars:
 * 
 * sys.game.ver 		- The version of the game, same as DuskWolf.ver.
 * sys.game.verid 		- The version id of the game, same as DuskWolf.verId.
 * sys.game.name 		- The name of the game, same as DuskWolf.gameName.
 * sys.game.author 		- The author of the game, same as DuskWolf.author.
 * sys.game.frameRate 	- The frame rate, in frames per second. This is usually 30. Setting this has no affect on the frame rate.
 * 
 * Built-in Events:
 * 
 * > {"a":"fire", "event":"sys-event-frame"}
 * Fired every frame, it will be fired about <DuskWolf.frameRate> times a second.
 * 	Note that on slow computers or large drawings this may be less than that.
 * 
 * > {"a":"fire", "ver":"...", "ver-id":"...", "gameName":"...", "event":"sys-event-load"}
 * Fired once, to signal that the game should start loading and processing any information it needs, like defining variables.
 * 	The properties are the same as the ones in <DuskWolf>.
 * 
 * > {"a":"fire", "ver":"...", "ver-id":"...", "gameName":"...", "event":"sys-event-start"}
 * Fired once, to signal that the game should start running, you should listen for this rather than just dumping code in the main array so that other things are loaded.
 * 	The properties are the same as the ones in <DuskWolf>.
 * 
 * Built-in HashFunctions:
 * 
 * > #IF(cond, then, else);
 * 	If the condition is true, then "then" is returned, else "else" is returned.
 * 
 * > #=(cond);
 * 	This evaluates a condition, but does not return true or false, this lets you do things like #=(1+1) to get two.
 * 
 * See:
 * * <mods.IModule>
 */

/** Function: Events
 * 
 * Creates a new Events system thing, initiates all the defualt actions and goes through all the modules, initing them.
 * 
 * Params:
 * 	game	- [<Game>] The game object this is attached to.
 */
window.Events = function(game) {
	/*- Variable: _game
	 * [<Game>] A link to the main game this is running for.
	 */
	this._game = game;
	
	/*- Variable: _actions
	 * [object] A list of every action, each action is an array in the form [function to be called, scope to call function in]. You should add actions using <addAction>, rather than adding it to this object directly.
	 */
	this._actions = {};
	/*- Variable: _hashFuncs
	 * [object] A list of every hashfunction, it is an array in the form [function to be called, scope to call function in]. You should add actions using <addHashFunct>, rather than adding it to this object directly.
	 */
	this._hashFuncts = {};
	/*- Variable: _functions
	 * [object] A list of all the functions assigned, in the form of an array of actions. Generally, you shouldn't need to create functions outside the JSON files, so you can't do it.
	 */
	this._functions = {};
	/*- Variable: _listeners
	 * [array] A list of all the listeners in use, this is an array of the action that set it, whith all it's properties.
	 */
	this._listeners = [];
	/*- Variable: _vars
	 * [object] This is all the variables! You should set/retreive these using <getVar> and <setVar>, and the like.
	 */
	this._vars = {};
	/*- Variable: _threads
	 * [object] This is all the threads that have been created. Each thread is an object with a "buffer" property, a "nexts" property and an "actions" property.
	 * 
	 * Nexts is the number of times <awaitNext> has been called, and is the number of times we have to call <next> for the program to continue.
	 * 
	 * Actions is the current list of actions that the engine is slowly working it's way through. Buffer is a "temprary storage area" for actions that should be ran next, and is inserted into "actions" before any more actions are ran.
	 * 
	 * The buffer is required so that the order of actions is intuitive, <run> calls that were called first should be ran first.
	 */
	this._threads = {};
	/*- Variable: _frameHandlers
	 * [object] This is all the frame handlers, they are arrays in the form [function, scope].
	 */
	this._frameHandlers = {};
	/*- Variable: _keyHandlers
	 * [object] The list of keyhandlers, they are arrays of the form [function, scope].
	 */
	this._keyHandlers = {};
	/*- Variable: _keyUpHandlers
	 * [object] The list of keyuphandlers, they are arrays of the form [function, scope].
	 */
	this._keyUpHandlers = {};
	/*- Variable: _modsInited
	 * [array] This is an array of all the mods that have been initiated.
	 */
	this._modsInited = {};
	
	/*- Variable: _ops
	 * [array] This is an array of all the operators that are supported in conditions.
	 */
	this._ops = ["*", "/", "+", "-", "<", ">", "<=", ">=", "=", "!=", "&&", "||"];
	
	/*- Variable: _opsReg
	 * [array] This is an array of all the regular expressions that capture ops, generated here to save time.
	 */
	this._opsReg = [];
	
	for(var o = 0; o < this._ops.length; o ++){
		this._opsReg[o] = RegExp("([^"+this._regEscape(this._ops.join(""))+"]+)\\s*("+this._regEscape(this._ops[o])+")\\s*([^"+this._regEscape(this._ops.join(""))+"]+)", "i");
	}
	
	/** Variable: thread
	 * [string] The currently running thread. Assuming you have not called <awaitNext>, you can read this to get your current thread. Setting it to anything will most likely break something.
	 */
	this.thread = "";
	
	//Set some vars
	this.setVar("sys.game.ver", duskWolf.ver);
	this.setVar("sys.game.verid", duskWolf.verId);
	this.setVar("sys.game.name", duskWolf.gameName);
	this.setVar("sys.game.author", duskWolf.author);
	this.setVar("sys.game.frameRate", duskWolf.frameRate);
	
	//Import and init modules
	if("mods" in data.root) window.modsAvalable = data.root.mods;
	
	//Import modules
	var ims = ["mods/IModule.js"];

	for(var i = window.modsAvalable.length-1; i >= 0; i--) {
		ims[ims.length] = "mods/"+window.modsAvalable[i]+".js";
	}
	
	__import__(ims);
	
	for(var a = modsAvalable.length-1; a >= 0; a--){
		var name = modsAvalable[a];
		if(name != "IModule"){
			if(typeof(mods[name]) != "function") {
				duskWolf.warn("module "+name+" failed to load.");
			} else
				this._modsInited[name] = new mods[name](this);
		}
	}
	
	//Register actions
	this.registerAction("comment", function(what){}, this, [["", false, "STR"]]);
	this.registerAction("function", this._addFunction, this, [["name", true, "STR"], ["actions", true, "DWC"]]);
	this.registerAction("listen", this._addListener, this, [["event", true, "STR"], ["actions", true, "DWC"], ["name", false, "STR"]]);
	this.registerAction("if", this._iffy, this, [["cond", true, "STR"], ["then", false, "DWC"], ["else", false, "DWC"]]);
	this.registerAction("ifset", this._ifset, this);
	this.registerAction("while", this._whiley, this, [["cond", true, "STR"], ["actions", true, "DWC"]]);
	this.registerAction("call", this._callFunction, this, [["name", true, "STR"], ["thread", false, "STR"]]);
	this.registerAction("fire", this._fire, this, [["event", true, "STR"]]);
	this.registerAction("unlisten", this._unlisten, this, [["name", false, "STR"], ["event", false, "STR"]]);
	this.registerAction("var", this._setVarInternal, this, [["name", true, "STR"], ["value", true, "OBJ"], ["inherit", false, "STR"]]);
	this.registerAction("delvar", this._delVarInternal, this, [["name", true, "STR"]]);
	this.registerAction("thread", this._threadTo, this, [["name", true, "STR"], ["actions", true, "DWC"]]);
	this.registerAction("vardump", function(what){duskWolf.info(this._vars);}, this, []);
	
	this.registerHashFunct("IF", this._hiffy, this);
	this.registerHashFunct("=", this._rawCond, this);
	
	for(var b in this._modsInited){
		this._modsInited[b].addActions();
	}
	
	//Load all files
	if(!("files" in data.root)) {duskWolf.error("Root json does not specify a list of files..."); return;}
	for(var i = data.root.files.length-1; i>= 0; i--) {
		if(data.grabJson(data.root.files[i]), true) {
			this.run(data.grabJson(data.root.files[i], true), "_init");
		}
	}
};

/** Function: everyFrame
 * 
 * This function is called every frame by the game object, unless you didn't create this from a game object...
 * 
 * It will run any active actions waiting to be ran, fire all the frameHandlers and fires the event "sys-event-frame" on the thread "_frame".
 * 
 * See:
 * * <DuskWolf.frameRate>
 * * <Events.registerFrameHandler>
 */
Events.prototype.everyFrame = function() {
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
}

/** Function: keypress
 * 
 * This is called by game if a key is pressed, for obvious reasons, if you don't have a game instance this won't be called.
 * 
 * It loops through all the keyHandlers, and runs them.
 * 
 * Params:
 * 	e		- [object] The event that was fired, it is a JQuery keydown event.
 * 
 * See:
 * * <Events.registerKeyHandler>
 */
Events.prototype.keypress = function(e) {
	for(var h in this._keyHandlers){
		this._keyHandlers[h][0].call(this._keyHandlers[h][1], e);
	}
}

/** Function: keyup
 * 
 * This is called by game if a key is released, after being pressed.
 * 
 * It loops through all the keyUpHandlers, and runs them.
 * 
 * Params:
 * 	e		- [object] The event that was fired, it is a JQuery keyup event.
 * 
 * See:
 * * <Events.registerKeyUpHandler>
 */
Events.prototype.keyup = function(e) {
	for(var h in this._keyUpHandlers){
		this._keyUpHandlers[h][0].call(this._keyUpHandlers[h][1], e);
	}
}

/** Function: run
 * 
 * This is the function you call to run actions!
 * 	It is given an array of actions, the actions to run, and a thread to run them on.
 * 
 * You cannot run a single command object with this, you must specify an array with the single action in it.
 * 
 * Params:
 * 	what	- [string/array] The actions to run, if it is a string, it will be put through JSON.parse first.
 * 	thread	- [string] The thread to run it on. If this is undefined, the thread "main" is assumed.
 */
Events.prototype.run = function(what, thread) {
	if(!thread) thread = "main";
	
	if(typeof(what) == "string") what = JSON.parse(what);
	
	//Add all the commands to the buffer to be added before running any more commands
	for(var i = 0; i < what.length; i++){
		this._getThread(thread, true).buffer[this._getThread(thread, true).buffer.length] = what[i];
	}
}

/** Function: next
 * 
 * [boolean] This performs an action, it takes the next action on the specified thread (if it exists) and runs it.
 * 
 * This is called in two places, firstly in the frame loop, where it is called every frame in a while loop until all actions are depleted.
 * 	It is also called by the programmer, you, who calls it so that the next action is ran.
 * 	Note that you don't need to call this when you have finished your command actions, the frame loop should do it.
 * 
 * If the thread is waiting on any nexts (From <Events.awaitNext>), then the normal frame loop will not run any actions, you will have to call this function yourself, manually.
 * 
 * Params:
 * 	t			- [string] The thread on which the next action will be ran.
 * 	decrement	- [boolean] Whether the nexts on the thread should be decremented before running the command.
 * 					If this is false, and there are nexts waiting on the thread no actions will be ran.
 * 					It defaults to true.
 * 
 * Returns:
 *	Whether any actions were ran, if this returns false you should not call it again immediatly because nothing'll happen.
 */
Events.prototype.next = function(t, decrement) {
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
	var current = this._clone(this._getThread(t).stack.pop());
	
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
	
	duskWolf.error("Unknown action \""+current.a+"\".");
	duskWolf.error(current);
	return true;
}

/*- Function: _clone
 * 
 * [object] This copies a simple object. This won't work on more complicated objects with prototypes and such.
 * 
 * It just loops through them and copies all the values to another object, which is returned.
 * 
 * Params:
 * 	o		- [object] The source object to copy.
 * 
 * Returns:
 *	An object with the same properties of the source one.
 */
Events.prototype._clone = function(o) {
	if(o == null || typeof(o) != 'object') return o;

	var tmp = o.constructor(); 
	for(var p in o) tmp[p] = this._clone(o[p]);

	return tmp;
};

/** Function: awaitNext
 * 
 * [string] This increments the "nexts" value on the specified thread. This means that for each time you call awaitNext you must also call <next>.
 * 
 * Until you call all the required nexts, this thread won't do anything, so you can use this to do animation or something.
 * 
 * Params:
 * 	t		- [string] The thread to wait on. If undefined the current thread will be used.
 * 	count	- [number] The number of nexts to wait on, defaults to 1 if not given.
 * 
 * Returns:
 *	The thread that has been asked to wait. This will be equal to the t param.
 */
Events.prototype.awaitNext = function(t, count) {
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
Events.prototype.replaceVar = function(data, children) {
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
Events.prototype.hashFunction = function(name, args) {
	if(!this._hashFuncts[name.toLowerCase()]){
		duskWolf.warn("No hashfunction named #"+name+".");
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
Events.prototype.registerAction = function(name, funct, scope, langDef) {
	dwc.addLangDef(name, langDef);
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
Events.prototype.registerHashFunct = function(name, funct, scope) {
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
Events.prototype.registerFrameHandler = function(name, funct, scope) {
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
Events.prototype.registerKeyHandler = function(name, funct, scope) {
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
Events.prototype.registerKeyUpHandler = function(name, funct, scope) {
	this._keyUpHandlers[name] = [funct, scope];
};

/** Function: getMod
 * 
 * [<mods.IModule>] This gets a module, if it exists, returns null otherwise.
 * 
 * Params:
 * 	name		- [string] The name of the module to get.
 * 
 * Returns:
 *	A module with that name.
 */
Events.prototype.getMod = function(name) {
	if(name in this._modsInited) {
		return this._modsInited[name];
	}
	
	return null;
};

/*- Function: _addFunction
 * 
 * Used internally to do the action "function", you should use the <run> function instead of calling this directly.
 * 
 * Params:
 * 	data		- [object] The action to use, it should be a normal "function" action object.
 */
Events.prototype._addFunction = function(data) {
	if(!data.name) {duskWolf.error("No name for this function!");return;}
	if(!data.actions) {duskWolf.error("Error defining "+data.name+", no actions.");return;}
	
	this._functions[data.name] = data.actions;
};

/*- Function: _callFunction
 * 
 * Used internally to do the action "call", you should use the <run> function instead of calling this directly.
 * 
 * Params:
 * 	data		- [object] The action to use, it should be a normal "call" action object.
 */
Events.prototype._callFunction = function(a) {
	if(!a.name) {duskWolf.error("No name for this function!");return;}
	
	if(this._functions[a.name]){
		this.run(this._functions[a.name], a.thread?a.thread:this.thread);
	} else duskWolf.error("Function "+a.name+" does not exist!");
};

/*- Function: _threadTo
 * 
 * Used internally to do the action "thread", you should use the <run> function instead of calling this directly.
 * 
 * Params:
 * 	data		- [object] The action to use, it should be a normal "thread" action object.
 */
Events.prototype._threadTo = function(data) {
	if(!data.name) {duskWolf.error("No thread name!");return;}
	if(!data.actions) {duskWolf.error("Threading to "+data.name+", no actions.");return;}
	
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
Events.prototype._getThread = function(name, create) {
	if(this._threads[name]){
		return this._threads[name];
	}else if(create){
		this._threads[name] = {}
		this._threads[name].stack = [];
		this._threads[name].buffer = [];
		this._threads[name].nexts = 0;
		return this._threads[name];
	}
	
	duskWolf.error("Thread "+name+" does not exist!");
	return null;
};

/*- Function: _addListener
 * 
 * Used internally to do the action "listen", you should use the <run> function instead of calling this directly.
 * 
 * Params:
 * 	a			- [object] The action to use, it should be a normal "listen" action object.
 */
Events.prototype._addListener = function(a) {
	if(!a.event){duskWolf.error("This listener won't listen to anything!");return;}
	
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
Events.prototype._unlisten = function(data) {
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
Events.prototype._fire = function(data) {
	if(!data.event){duskWolf.error("This won't fire anything!");return;}
	
	for(var l = this._listeners.length-1; l >= 0; l--){
		if(this._listeners[l] && this._listeners[l].event == data.event){
			var fail = false;
			for(var p in this._listeners[l]){
				if((["name", "actions", "event", "__proto__", "a"]).indexOf(p) == -1 && this._listeners[l][p] && ((this._listeners[l][p] != data[p] && this._listeners[l][p][0] != "!") || ("!"+this._listeners[l][p] == data[p] && this._listeners[l][p][0] == "!"))){
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
Events.prototype._iffy = function(what) {
	if(what.cond === undefined){duskWolf.error("No condition for if.");return;}
	
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
Events.prototype._hiffy = function(name, args) {
	if(args[0] === undefined){duskWolf.error("No condition for #IF.");return;}
	
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
Events.prototype._rawCond = function(name, args) {
	return this.cond(args[0]);
};

/*- Function: _ifSet
 * 
 * Used internally to do the action "ifSet", you should use the <run> function instead of calling this directly.
 * 
 * Params:
 * 	data		- [object] The action to use, it should be a normal "ifSet" action object.
 */
Events.prototype._ifSet = function(what) {
	if(!("value" in what)){duskWolf.error("No value for ifset.");return;}
	
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
Events.prototype._whiley = function(what) {
	if(!what.cond){duskWolf.error("No condition for while.");return;}
	if(!what.actions){duskWolf.error("Nothing for while to loop through.");return;}
	
	if(this.cond(this.parseVar(what.cond))){
		var funId = (new Date()).getTime();
		what.actions[what.actions.length] = {"a":"if", "cond":what.cond, "then":[{"a":"call", "name":"_while_"+funId}]};
		this.run([{"a":"function", "name":"_while_"+funId, "actions":what.actions}, {"a":"call", "name":"_while_"+funId}], this.thread);
	}
};

/*- Function: _isJson
 * 
 * [boolean] This takes a string, checks if it is a string in JSON notation.
 * 
 * Params:
 * 	str			- [string] The string to check.
 * 
 * Returns:
 *	Whether the object can be parsed as json.
 */ 
Events.prototype._isJson = function(str) {
	return /^[\],:{}\s]*$/.test(String(str).replace(/\\["\\\/bfnrtu]/g, '@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').replace(/(?:^|:|,)(?:\s*\[)+/g, ''));
}

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
Events.prototype._regEscape = function(str) {
	return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
	
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
Events.prototype.parseVar = function(str, asStr) {
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
			str = str.replace(ex[0], this.hashFunction(ex[1], ex[2].split(",")));
		}
	}
	
	//Check if it is JSON
	if(!asStr && this._isJson(str)) {
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
Events.prototype.cond = function(cond, asStr) {
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
	
	if(!asStr && this._isJson(cond)) {
		return JSON.parse(cond);
	} else {
		return cond;
	}
};

Events.prototype._doOp = function(lhs, rhs, op) {
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
Events.prototype._setVarInternal = function(a) {
	if(a.name === undefined) {duskWolf.error("No name given for var."); return;}
	if(a.value === undefined) {duskWolf.error("No value given for "+a.name+"."); return;}
	
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
Events.prototype.setVar = function(name, value, inherit) {
	name = String(name);
	if(name.indexOf(",") != -1) duskWolf.warning("setVar", "A variable name with a comma in it may cause problems.");
	
	name = name.toLowerCase();
	var fragments = name.split(".");
	var obj = this._vars;
	if(fragments.length > 1){
		for(var point = 0; point < fragments.length-1; point ++) {
			if(obj[fragments[point]] === undefined) obj[fragments[point]] = {};
			obj = obj[fragments[point]];
		}
	}
	
	if(inherit !== undefined) {
		obj[fragments[fragments.length-1]] = this._clone(this.getVar(inherit));
		for(var p in value){
			obj[fragments[fragments.length-1]][p] = value[p];
		}
		
		return value;
	}
	
	obj[fragments[fragments.length-1]] = value;
	
	return value;
};

/** Function: setVars
 * 
 * This sets multiple variables at once! Just supply it with an array of [key, value] pairs and away you go!
 * 
 * Params:
 * 	list		- [array] The vars and values to set, an array of arrays in the form [name, value].
 * 
 * See:
 * 	* <setVar>
 */
Events.prototype.setVars = function(list) {
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
Events.prototype.getVar = function(name) {
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
 *	An array of [key, value] pairs. You should be able to call <setVars> on them to set the variables back.
 * 
 * See:
 * 	* <getVar>
 */
Events.prototype.getVars = function(expr) {
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
Events.prototype._delVarInternal = function(a) {
	if(!a.name) {duskWolf.error("No name given for var."); return;}
	
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
Events.prototype.delVar = function(name) {
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
