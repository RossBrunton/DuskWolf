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
 * If you want to wait for something to happen (as in, say you want to wait for user input, or a file to load), you should call <Events._awaitNext>, which reterns the current thread that you are waiting in.
 * When you want to start running again, call <Events.next> with the thread to continue in.
 * 
 * Listeners:
 * 
 * Listeners listen for something to happen, and then act on it when or if it does happen!
 * Listeners are defined by using {"a":"listen", "event":"...", "actions":[...]}, and they can be fired by using {"a":"fire", "event":"..."}.
 * There can also be a number of values fired and listened for; if the listener object had the property "foo":"bar", then the fire action must also have "foo":"bar", or the listener would not be called.
 * You can also use "foo":"!bar" on the listener to say that if foo is bar, then the listener should NOT run.
 * 
 * Conditions:
 * 
 * Some actions, like if and while, also have conditions, conditions should be a string made of one of the characters below, the condition is then broken down until it reaches 1 (true) or 0 (false).
 * 
 * Note that whitespace is removed, so the condition "This String == ThisString" will become 1.
 * 
 * > (n)
 * (0) and (1) will be broken down to 0 and 1, respectivley, this allows you to "group conditions" so that they don't interfere.
 * 
 * > n == m
 * Breaks down to 1 if and only if n is equal to m, for example, 1 == 1 would become 1, but 1 == 2 would become 0.
 * 
 * > n != m
 * Breaks down to 1 if and only if n is not equal to m, like "==", but opposite.
 * 
 * > n < m, n > m
 * Breaks down to 1 if and only if n is less than m for the former, and n is greater than m for the latter, 1 < 2 becomes 1, but 2 < 1 becomes 0.
 * 
 * > n <= m, n >= m
 * Same as "<" and ">", but breaks down to 1 if they are equal as well.
 * 
 * > !n
 * Inverts n, !0 becomes 1, and !1 becomes 0.
 * 
 * > n & m
 * Breaks down to 1 if and only if both n and m are 1.
 * 
 * > n | m
 * Breaks down to 1 if at least n or m is 1.
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
 * > ${$a;, $b;, 2}
 * The values are added together, in this case the values for a, b and the number 2 are added together. Anything in there which is not a number is ignored.
 * 
 * > ${{$a;, $b;, 2}}
 * Like the above, but they are multiplied together instead of added.
 * 
 * > $-name;
 * Name, which should be a number, is inverted, if the var name was 4, for example, this would be replaced with -4.
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
 * The root JSON File:
 * 
 * When DuskWolf starts, it loads a file (or fails if the file can't be found) named root.json from the folder specified by <DuskWolf.gameDir>, this file contains configuration files and such like for the game.
 *  It should be an oject with the following properties:
 * 
 * > "files":[...]
 * An array of filenames, these files will be retrieved, and all the actions ran inside them ran. They are relative to <DuskWolf.gameDir>.
 * 
 * > "mods":[...]
 * An array of modules to import (they are strings), these are the only modules imported.
 * 
 * Built-in Actions:
 * 
 * > {"a":"function", "name":"...", "actions"=[...]}
 * This defines the function given by name, which will run actions when called. It can be called with the call action.
 * 
 * > {"a":"call", "name":"..."}
 * Calls the function with the name given by name, once the code is finished, it resumes from the next action after this.
 * 
 * > {"a":"if", "cond":"...", ("then":[...],) ("else":[...])}
 * Evaluates the condition using the rules above, if it is true, then the "then" array is ran, else the "else" array is ran instead. Simple.
 * 
 * > {"a":"ifset", "value":"...", ("then":[...],) ("else":[...])}
 * Runs the actions specified by "then" if the value string is not empty, otherwise it runs "else". This can be used to check if vars are defined, "$1;$2;" will run the "then" actions if ether one of the vars is not a blank string, and if they are both unset, then it will run the "else" actions.
 * 
 * > {"a":"while", "cond":"...", "actions":[...]}
 * It keeps repeating the actions if the condition is true.
 * 
 * > {"a":"listen", "event":"...", ("name":"...",) ("prop1":"...", ("attr2":"...", ...)), "actions":[...]}
 * This creates a listener, making it listen for the event specified, which will run actions when it recieves it. See the section on listeners above.
 * The name property will not be actually used on the listener, but is used for identifying it, say, for deleting it.
 * 
 * > {"a":"fire", "event":"...", ("prop1":"...", ("attr2":"...", ...))}
 * Fires the specified event, which will trigger the listener which all the properties match, see the section above for details.
 * 
 * > {"a":"unlisten", ("event":"...",) ("name":"...",) ("prop1":"...", ("attr2":"...", ...)), "actions":[...]}
 * Deletes the listener that would be fired if the rules for "listen" were true. Note that the event property is optional.
 * 
 * > {"a":"var", "name":"...", "value":"..."}
 * Sets the var specified with the value specified. Note that the value will be converted to a string if it is not already one.
 * 
 * > {"a":"thread", "name":"...", "actions":[...]}
 * The actions specified will now run in that thread. The current thread will continue going to the next line.
 * 
 * > {"a":"delvar", "name":"..."}
 * Deletes the variable named, this will free up memory or something.
 * 
 * System Vars:
 * 
 * sys-game-ver 		- The version of the game, same as DuskWolf.ver.
 * sys-game-verid 		- The version id of the game, same as DuskWolf.verId.
 * sys-game-name 		- The name of the game, same as DuskWolf.gameName.
 * sys-game-author 		- The author of the game, same as DuskWolf.author.
 * sys-game-frameRate 	- The frame rate, in frames per second. This is usually 30. Setting this has no affect on the frame rate.
 * 
 * Built-in Events:
 * 
 * > {"a":"fire", "event":"sys-event-frame"}
 * Fired every frame, it will be fired about <DuskWolf.frameRate> times a second. Note that on slow computers or large drawings this may be less than that.
 * 
 * > {"a":"fire", "ver":"...", "ver-id":"...", "gameName":"...", "event":"sys-event-load"}
 * Fired once, to signal that the game should start loading and processing any information it needs, like defining variables. The properties are the same as the ones in <DuskWolf>.
 * 
 * > {"a":"fire", "ver":"...", "ver-id":"...", "gameName":"...", "event":"sys-event-start"}
 * Fired once, to signal that the game should start running, you should listen for this rather than just dumping code in the main array so that other things are loaded. The properties are the same as the ones in <DuskWolf>.
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
	/** Variable: _game
	 * [<Game>] A link to the main game this is running for.
	 */
	this._game = game;
	
	/** Variable: _actions
	 * [object] A list of every action, each action is an array in the form [function to be called, scope to call function in]. You should add actions using <addAction>, rather than adding it to this directly.
	 */
	this._actions = {};
	/** Variable: _functions
	 * [object] A list of all the functions assigned, in the form of an array of actions. Generally, you shouldn't need to create functions outside the JSON files, so you can't do it.
	 */
	this._functions = {};
	/** Variable: _listeners
	 * [array] A list of all the listeners in use, this is an array of the action that set it, whith all it's properties.
	 */
	this._listeners = [];
	/** Variable: _vars
	 * [object] This is all the variables! You should set/retreive these using <getVar> and <setVar>, and the like.
	 */
	this._vars = {};
	/** Variable: _threads
	 * [object] This is all the threads that have been created. Each thread is an object with a "buffer" property, a "nexts" property and an "actions" property.
	 * 
	 * Nexts is the number of times <awaitNext> has been called, and is the number of times we have to call <next> for the program to continue.
	 * 
	 * Actions is the current list of actions that the engine is slowly working it's way through. Buffer is a "temprary storage area" for actions that should be ran next, and is inserted into "actions" before any more actions are ran.
	 * 
	 * The buffer is required so that the order of actions is intuitive, <run> calls that were called first should be ran first.
	 */
	this._threads = {};
	/** Variable: _frameHandlers
	 * [object] This is all the frame handlers, they are arrays in the form [function, scope].
	 */
	this._frameHandlers = {};
	/** Variable: _keyHandlers
	 * [object] The list of keyhandlers, they are arrays of the form [function, scope].
	 */
	this._keyHandlers = {};
	/** Variable: _keyUpHandlers
	 * [object] The list of keyuphandlers, they are arrays of the form [function, scope].
	 */
	this._keyUpHandlers = {};
	/** Variable: _modsInited
	 * [array] This is an array of all the mods that have been initiated.
	 */
	this._modsInited = {};
	
	/** Variable: thread
	 * [string] The currently running thread. Assuming you have not called <awaitNext>, you can read this to get your current thread. Setting it to anything will most likely break something.
	 */
	this.thread = "";
	
	//Set some vars
	this.setVar("sys-game-ver", duskWolf.ver);
	this.setVar("sys-game-verid", duskWolf.verId);
	this.setVar("sys-game-name", duskWolf.gameName);
	this.setVar("sys-game-author", duskWolf.author);
	this.setVar("sys-game-frameRate", duskWolf.frameRate);
	
	//Init modules
	for(var a = modsAvalable.length-1; a >= 0; a--){
		var name = modsAvalable[a];
		if(name != "IModule"){
			if(typeof(mods[name]) != "function")
				duskWolf.warn("module "+name+" failed to load.");
			else
				this._modsInited[name] = new mods[name](this);
		}
	}
	
	//Register actions
	this.registerAction("comment", function(what){}, this);
	this.registerAction("function", this._addFunction, this);
	this.registerAction("listen", this._addListener, this);
	this.registerAction("if", this._iffy, this);
	this.registerAction("ifset", this._ifset, this);
	this.registerAction("while", this._whiley, this);
	this.registerAction("call", this._callFunction, this);
	this.registerAction("fire", this._fire, this);
	this.registerAction("unlisten", this._unlisten, this);
	this.registerAction("var", this._setVarInternal, this);
	this.registerAction("delvar", this.delVarInternal, this);
	this.registerAction("thread", this._threadTo, this);
	this.registerAction("varDump", function(what){duskWolf.info(this._vars);}, this);
	
	for(var b in this._modsInited){
		this._modsInited[b].addActions();
	}
	
	//Load everything!
	for(var x = data.scripts.length-1; x >= 0; x--){
		this.run(data.scripts[x], "_init");
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
	if(this.getVar("_started") == "1"){
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
 * This performs an action, it takes the next action on the specified thread (if it exists) and runs it.
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
 * 	[boolean] Whether any actions were ran, if this returns false you should not call it again immediatly because nothing'll happen.
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

/** Function: _clone
 * 
 * This copies a simple object. This won't work on more complicated objects with prototypes and such.
 * 
 * It just loops through them and copies all the values to another object, which is returned.
 * 
 * Params:
 * 	o		- [object] The source object to copy.
 * 
 * Returns:
 * 	[object] An object with the same properties of the source one.
 */
Events.prototype._clone = function(o) {
	if(o == null || typeof(o) != 'object') return o;

	var tmp = o.constructor(); 
	for(var p in o) tmp[p] = this._clone(o[p]);

	return tmp;
};

/** Function: awaitNext
 * 
 * This increments the "nexts" value on the specified thread. This means that for each time you call awaitNext you must also call <next>.
 * 
 * Until you call all the required nexts, this thread won't do anything, so you can use this to do animation or something.
 * 
 * Params:
 * 	t		- [string] The thread to wait on. If undefined the current thread will be used.
 * 	count	- [number] The number of nexts to wait on, defaults to 1 if not given.
 * 
 * Returns:
 * 	[string] The thread that has been asked to wait. This will be equal to the t param.
 */
Events.prototype.awaitNext = function(t, count) {
	if(t === undefined) t = this.thread;
	if(count === undefined) count = 1;
	
	this._getThread(t).nexts += count;
	return t;
};

/** Function: replaceVar
 * 
 * This takes an object (such as an action), and replaces all of the properties containing vars with their correct values.
 * 	It will only replace properties that are strings, and won't touch the names of them.
 * 
 * You can also have it replace the vars of all the children of any arrays it finds, if you like...
 * 
 * Params:
 * 	data		- [object] The data that should have the properties evaluated.
 * 	children	- [boolean] If true then this function will be called with all the children of any arrays it finds in the data.
 * 
 * Returns:
 * 	[object] The data with all the properties evaluated and replaced.
 */
Events.prototype.replaceVar = function(data, children) {
	for(var p in data){
		if(typeof(data[p]) == "string"){
			data[p] = this._parseVar(data[p]);
		}else if(children && typeof(data[p]) == "array"){
			for(var i = data[p].length-1; i >= 0; i--){
				data[p][i] = this.replaceVar(data[p][i], false);
			}
		}
	}
	
	return data;
};

/** Function: _parseVar
 * 
 * This takes a string, and replaces all the vars it can find with their values, see the section at the top of the page about them.
 * 
 * It will only break down 20 times until it gives up.
 * 
 * Params:
 * 	data		- [string] The string to replace the vars in.
 * 	rec			- [number] Used internally, the function tracks how many times it has checked by incrementing this each time.
 * 
 * Returns:
 * 	[string/number] A fully parsed string, where all the variables are replaced. If when broken down the string can be a number, then it is returned as one.
 */ 
Events.prototype._parseVar = function(data, rec) {
	if(!rec) rec = 0;
	rec++;
	var done = false;
	
	var matches = data.match(/\$-[-a-zA-Z0-9]+;?/gi);
	if(matches) for(var k = matches.length-1; k >= 0; k--){
		done = true;
		data = data.replace(matches[k], String(-1*Number(this.getVar(matches[k].replace("$-", "").replace(";", "")))));
	}
	
	matches = data.match(/\$\{[^\{\}]+\}/gi);
	if(matches) for(k = matches.length-1; k >= 0; k--){
		done = true;
		var fragments = matches[k].replace("${", "").replace("}", "").split(",");
		var sum = 0;
		for(var i = fragments.length-1; i >= 0; i--){
			if(Number(this._parseVar(fragments[i]))) {
				sum += Number(this._parseVar(fragments[i]));
			}
		}
		data = data.replace(matches[k], sum);
	}
	
	matches = data.match(/\$\{\{[^\{\}]+\}\}/gi);
	if(matches) for(k = matches.length-1; k >= 0; k--) {
		done = true;
		fragments = matches[k].replace("${{", "").replace("}}", "").split(",");
		sum = 1;
		for(i = fragments.length-1; i >= 0; i--) {
			if(Number(this._parseVar(fragments[i])) != NaN){
				sum *= Number(this._parseVar(fragments[i]));
			}
		}
		data = data.replace(matches[k], sum);
	}
	
	matches = data.match(/\$[-a-zA-Z0-9]+;?/gi);
	if(matches) for(k = matches.length-1; k >= 0; k--) {
		done = true;
		data = data.replace(matches[k], this.getVar(matches[k].replace("$", "").replace(";", "")));
	}
	
	if(rec == 20) duskWolf.error("Overflow parsing var, got to "+data+".");
	if(done && rec < 20) return this._parseVar.call(this, data, rec);
	else return isNaN(data.replace(/\$;/g, "$"))?data.replace(/\$;/g, "$"):Number(data.replace(/\$;/g, "$"));
};

/** Function: registerAction
 * 
 * This registers a new action, when the action is going to be ran the function given here is ran in the specified scope.
 * 	The scope would most likely be "this".
 * 	The function will be passed the whole action as a parameter.
 * 
 * Params:
 * 	name		- [string] The name of the action to listen for, this should be the one the action has the "a" property set to.
 * 	funct		- [function([object]){[undefined]}] The function to be called to run the action. Said action will be passed as a parameter.
 * 	scope		- [object] The scope that the function will be ran in.
 */
Events.prototype.registerAction = function(name, funct, scope) {
	this._actions[name] = [funct, scope];
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
 * This gets a module, if it exists, returns null otherwise.
 * 
 * Params:
 * 	name		- [string] The name of the module to get.
 * 
 * Returns:
 * 	[<mods.IModule>] A module with that name.
 */
Events.prototype.getMod = function(name) {
	if(name in this._modsInited) {
		return this._modsInited[name];
	}
	
	return null;
};

/** Function: _addFunction
 * 
 * Used internally to do the action "function", you should use the <run> function instead of calling this directly.
 * 
 * Params:
 * 	data		- [object] The action to use, it should be a normal "function" action object.
 */
Events.prototype._addFunction = function(data) {
	if(!data.name) {duskWolf.error("No name for this function!");return;}
	if(!data.actions) {duskWolf.error("Defining "+data.name+", no actions.");return;}
	
	this._functions[data.name] = data.actions;
};

/** Function: _callFunction
 * 
 * Used internally to do the action "call", you should use the <run> function instead of calling this directly.
 * 
 * Params:
 * 	data		- [object] The action to use, it should be a normal "call" action object.
 */
Events.prototype._callFunction = function(data) {
	if(!data.name) {duskWolf.error("No name for this function!");return;}
	
	if(this._functions[data.name]){
		this.run(this._functions[data.name], data.thread?data.thread:this._thread);
	} else duskWolf.error("Function "+data.name+" does not exist!");
};

/** Function: _threadTo
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

/** Function: _getThread
 * 
 * This gets a thread. It can also create a new thread if it does not exist yet.
 * 
 * Params:
 * 	name		- [string] The name of the thread to find or create.
 * 	create		- [boolean] Whether to create a new thread if it doesn't exist. Defaults to false.
 * 
 * Returns:
 * 	[object] A "thread", see <_threads> for information on properties. If the thread doesn't exist and create is false, it returns null.
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
	
	return null;
}

/** Function: _addListener
 * 
 * Used internally to do the action "listen", you should use the <run> function instead of calling this directly.
 * 
 * Params:
 * 	data		- [object] The action to use, it should be a normal "listen" action object.
 */
Events.prototype._addListener = function(data) {
	if(!data.event){duskWolf.error("This listener won't listen to anything!");return;}
	
	this._listeners[this._listeners.length] = data;
}

/** Function: _unlisten
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

/** Function: _fire
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

/** Function: _iffy
 * 
 * Used internally to do the action "if", you should use the <run> function instead of calling this directly.
 * 
 * Params:
 * 	data		- [object] The action to use, it should be a normal "if" action object.
 */
Events.prototype._iffy = function(what) {
	if(!what.cond){duskWolf.error("No condition for if.");return;}
	
	if(this._cond(what.cond)) {
		if(what.then) this.run(what.then, this.thread);
	}else if(what["else"]) this.run(what["else"], this.thread);
};

/** Function: _ifSet
 * 
 * Used internally to do the action "ifSet", you should use the <run> function instead of calling this directly.
 * 
 * Params:
 * 	data		- [object] The action to use, it should be a normal "ifSet" action object.
 */
Events.prototype._ifSet = function(what) {
	if(!("value" in what)){duskWolf.error("No value for ifset.");return;}
	
	if(what.value !== "") {
		if("then" in what) this.run(what.then, this.thread);
	}else if("else" in what) {
		this.run(what["else"], this.thread);
	}
};

/** Function: _whiley
 * 
 * Used internally to do the action "while", you should use the <run> function instead of calling this directly.
 * 
 * Params:
 * 	data		- [object] The action to use, it should be a normal "while" action object.
 */
Events.prototype._whiley = function(what) {
	if(!what.cond){duskWolf.error("No condition for while.");return;}
	if(!what.actions){duskWolf.error("Nothing for while to loop through.");return;}
	
	if(this._cond(this._parseVar(what.cond))){
		var funId = (new Date()).getTime();
		what.actions[what.actions.length] = {"a":"if", "cond":what.cond, "then":[{"a":"call", "name":"_while_"+funId}]};
		this.run([{"a":"function", "name":"_while_"+funId, "actions":what.actions}, {"a":"call", "name":"_while_"+funId}], this.thread);
	}
};

/** Function: _cond
 * 
 * This is used in the likes of "while" and "if", give it a string and it will evaluate it, breaking it down into ether true or false. See the section on "Conditions" in the class description.
 * 
 * Params:
 * 	cond		- [string] The string to evaluate.
 * 
 * Returns:
 * 	[boolean] Ether true or false, if the condition breaks down to "1" then true, "0" then false.
 */
Events.prototype._cond = function(cond) {
	var originalCond = cond;
	cond = "("+cond.replace(/\s/g, "")+")";
	for(var i = 0; i <= 20; i++){
		if(cond.search(/\(([01])\)/g) > -1){cond = cond.replace(/\(([01])\)/g, "$1");}
		
		var matches = cond.match(/[^\(\)\|&!=<>]+=[^\(\)\|&!=<>]+/g);
		if(matches) for(var m = matches.length-1; m >= 0; m--){
			cond = cond.replace(new RegExp("([\(\)\|&!=<>])"+matches[m]+"([\(\)\|&!=<>])", "g"), "$1"+((matches[m].split("=")[0] == matches[m].split("=")[1])?"1":"0")+"$2");
		}
		
		matches = cond.match(/[^\(\)\|&!=<>]+!=[^\(\)\|&!=<>]+/g);
		if(matches) for(var n = matches.length-1; n >= 0; n--){
			cond = cond.replace(new RegExp("([\(\)\|&!=<>])"+matches[n]+"([\(\)\|&!=<>])", "g"), "$1"+((matches[n].split("!=")[0] == matches[n].split("!=")[1])?"0":"1")+"$2");
		}
		
		matches = cond.match(/[^\(\)\|&!=<>]+<[^\(\)\|&!=<>]+/g);
		if(matches) for(n = matches.length-1; n >= 0; n--){
			cond = cond.replace(new RegExp("([\(\)\|&!=<>])"+matches[n]+"([\(\)\|&!=<>])", "g"), "$1"+((Number(matches[n].split("<")[0]) < Number(matches[n].split("<")[1]))?"1":"0")+"$2");
		}
		
		matches = cond.match(/[^\(\)\|&!=<>]+>[^\(\)\|&!=<>]+/g);
		if(matches) for(n = matches.length-1; n >= 0; n--){
			cond = cond.replace(new RegExp("([\(\)\|&!=<>])"+matches[n]+"([\(\)\|&!=<>])", "g"), "$1"+((Number(matches[n].split(">")[0]) > Number(matches[n].split(">")[1]))?"1":"0")+"$2");
		}
		
		matches = cond.match(/[^\(\)\|&!=<>]+>=[^\(\)\|&!=<>]+/g);
		if(matches) for(n = matches.length-1; n >= 0; n--){
			cond = cond.replace(new RegExp("([\(\)\|&!=<>])"+matches[n]+"([\(\)\|&!=<>])", "g"), "$1"+((Number(matches[n].split(">=")[0]) >= Number(matches[n].split(">=")[1]))?"1":"0")+"$2");
		}
		
		matches = cond.match(/[^\(\)\|&!=<>]+<=[^\(\)\|&!=<>]+/g);
		if(matches) for(n = matches.length-1; n >= 0; n--){
			cond = cond.replace(new RegExp("([\(\)\|&!=<>])"+matches[n]+"([\(\)\|&!=<>])", "g"), "$1"+((Number(matches[n].split("<=")[0]) <= Number(matches[n].split("<=")[1]))?"1":"0")+"$2");
		}
		
		if(cond.search(/\!0/g) > -1){cond = cond.replace(/\!0/g, "1");}
		if(cond.search(/\!1/g) > -1){cond = cond.replace(/\!1/g, "0");}
		
		if(cond.search(/0&0/g) > -1){cond = cond.replace(/0&0/g, "0");}
		if(cond.search(/0&1/g) > -1){cond = cond.replace(/0&1/g, "0");}
		if(cond.search(/1&0/g) > -1){cond = cond.replace(/1&0/g, "0");}
		if(cond.search(/1&1/g) > -1){cond = cond.replace(/1&1/g, "1");}
		
		if(cond.search(/0\|0/g) > -1){cond = cond.replace(/0\|0/g, "0");}
		if(cond.search(/0\|1/g) > -1){cond = cond.replace(/0\|1/g, "1");}
		if(cond.search(/1\|0/g) > -1){cond = cond.replace(/1\|0/g, "1");}
		if(cond.search(/1\|1/g) > -1){cond = cond.replace(/1\|1/g, "1");}
		
		if(cond == "(1)"){
			return true;
		}
		
		if(cond == "(0)"){
			return false;
		}
	}
	
	duskWolf.error("Could not break down conditon \""+originalCond+"\", got to "+cond+".");
	return false;
};

/** Function: _setVarInternal
 * 
 * Used internally to do the action "var", you should use the public function <setVar> to do this, rather than this.
 * 
 * Params:
 * 	data		- [object] The action to use, it should be a normal "var" action object.
 * 
 * See:
 * 	* <setVar>
 */
Events.prototype._setVarInternal = function(data) {
	if(data.name === undefined) {duskWolf.error("No name given for var."); return;}
	if(data.value === undefined) {duskWolf.error("No value given for "+data.name+"."); return;}
	
	this.setVar(data.name.toLowerCase(), data.value);
};

/** Function: setVar
 * 
 * This sets the value of a variable. It is recommended to use this, rather than running actions. Variables are described in the class description.
 * 
 * Params:
 * 	name		- [string] The name of the var to set, should only use alphanumeric characters, "-" and "_".
 *	value		- [any] The value to set the named var to. It can be any type.
 * 
 * Returns:
 * 	[any] The value that was set, same as the param "value".
 * 
 * See:
 * 	* <setVars>
 * 	* <getVar>
 */
Events.prototype.setVar = function(name, value) {
	if(name.indexOf(",") != -1) duskWolf.warning("setVar", "A variable name with a comma in it may cause problems.");
	
	this._vars[name.toLowerCase()] = value;
	
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
 * This returns the value of a variable, and is the only way to get a variable. If the variable is undefined, an empty string is returned.
 * 
 * Params:
 * 	name		- [string] The name of the var to retrieve.
 * 
 * Returns:
 * 	[any] The value of the variable, or an empty string if the variable is undefined.
 * 
 * See:
 * 	* <setVar>
 * 	* <getVars>
 */
Events.prototype.getVar = function(name) {
	return this._vars[name.toLowerCase()]!==null?this._vars[name.toLowerCase()]:"";
};

/** Function: getVars
 * 
 * This returns the value of all variables matching a regexp.
 * 
 * Params:
 * 	expr		- [regexp] The regexp to check.
 * 
 * Returns:
 * 	[array] An array of [key, value] pairs. You should be able to call <setVars> on them to set the variables back.
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

/** Function: _delVarInternal
 * 
 * Used internally to do the action "delvar", you should use the public function <delVar> to do this, rather than this.
 * 
 * Params:
 * 	data		- [object] The action to use, it should be a normal "delvar" action object.
 * 
 * See:
 * 	* <delVar>
 */
Events.prototype._delVarInternal = function(data) {
	if(!data.name) {duskWolf.error("No name given for var."); return;}
	
	this.delVar(data.name.toLowerCase());
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
	delete this._vars[name.toLowerCase()];
};
