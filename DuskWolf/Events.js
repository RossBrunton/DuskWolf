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
 * To actually run an action, you need to call <run> with the array of actions, and the thread you want it to run in.
 * 
 * If you want to wait for something to happen (as in, say you want to wait for user input, or a file to load), you should call <awaitNext>, which reterns the current thread that you are waiting in.
 * When you want to start running again, call <next> with the thread to continue in.
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
 * > n < m
 * Breaks down to 1 if and only if n is less than m, 1 < 2 becomes 1, but 2 < 1 becomes 0.
 * 
 * > n > m
 * Breaks down to 1 if and only if n is greater than m, 1 > 2 becomes 0, and 2 > 1 becomes 1.
 * 
 * > n <= m, n >= m
 * Same as "<" and ">", but breaks down to 1 if they are equal.
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
 * Name, which should be a number, is inverted, if name was 4, for example, this would be replaced with -4.
 * 
 * Threads:
 * 
 * Threads (which are not done by the CPU) allow you to do multiple things at once, for example, you can animate a background while still having the player move.
 *  Basically, each thread maintains it's own list of actions it has to run, and an <awaitNext> call will only cause execution on the current thread to stop.
 *  In the actions thing, you can use the "thread" action to switch threads.
 *  You can get the current thread by reading <thread> of this, which will not work if you cave called <awaitNext>
 * 
 * Modules:
 * 
 * Modules are classes that implement <IModule> and generally provide a simple interface to let you DO something...
 *  Generally, a module calls <addAction> with details it needs, and when that action is found when running code the function registered is called.
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
 * Evaluates the condition using the rules above, if it is true, then the "Then" array is ran, else the "else" array is ran instead. Simple.
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
 * > {"a":"fire", "ver":"...", "ver-id":"...", "gameName":"...", "event":"sys-event-load"}
 * Fired once, to signal that the game should start running, you should listen for this rather than just dumping code in the main array so that other things are loaded. The properties are the same as the ones in <DuskWolf>.
 * 
 * See:
 * 	<modules.Module>
 */
window.Events = function(game) {
	/** Variable: _game
	 * [<Game>] A link to the main game this is running as.
	 */
	this._game = game;
	
	//Init vars
	/** Variable: _actions
	 * [object] A list of every action, each action is an array in the form [function to be called, scope to call function in]. You should add actions using <addAction>, rather than adding it to this directly.
	 */
	this._actions = {};
	/** variable: _functions
	 * [object] A list of all the functions assigned, in the form of an array of actions. Generally, you shouldn't need to create functions outside the JSON files, so you can't do it.
	 */
	this._functions = {};
	this._listeners = [];
	this._vars = {};
	this._threads = {};
	this._frameHandlers = {};
	this._keyHandlers = {};
	
	/** Variable: thread
	 * [string] The currently running thread. Assuming you have not called <awaitNext>, you can read this to get your current thread. Setting it will most likely break something.
	 */
	this.thread = "";
	
	//Init modules
	this._modsInited = [];
	for(var a = modsAvalable.length-1; a >= 0; a--){
		var name = modsAvalable[a];
		if(name != "IModule"){
			this._modsInited[a] = new mods[name](this);
		}
	}
	
	//Register actions
	this.registerAction("comment", function(what){}, this);
	this.registerAction("function", this._addFunction, this);
	this.registerAction("listen", this.addListener, this);
	this.registerAction("if", this._iffy, this);
	this.registerAction("while", this._whiley, this);
	this.registerAction("call", this._callFunction, this);
	this.registerAction("fire", this.fire, this);
	this.registerAction("unlisten", this.unlisten, this);
	this.registerAction("var", this._setVarInternal, this);
	this.registerAction("delvar", this.delVarInternal, this);
	this.registerAction("thread", this._threadTo, this);
	this.registerAction("varDump", function(what){duskWolf.info(this._vars);}, this);
	
	for(var b = this._modsInited.length-1; b >= 0; b--){
		this._modsInited[b].addActions();
	}
	
	//Load everything!
	for(var x = data.scripts.length-1; x >= 0; x--){
		this.run(data.scripts[x]);
	}
	
	//Set some vars
	this.setVar("sys-game-ver", duskWolf.ver);
	this.setVar("sys-game-verid", String(duskWolf.verId));
	this.setVar("sys-game-name", duskWolf.gameName);
	this.setVar("sys-game-author", duskWolf.author);
	this.setVar("sys-game-frameRate", String(duskWolf.frameRate));
};

Events.prototype.everyFrame = function() {
	//Fire event
	if(this.getVar("_started") == "1"){
		this.run([{"a":"fire", "event":"sys-event-frame"}], "_frame");
	}
	
	for(var h in this._frameHandlers){
		this._frameHandlers[h][1].__action = this._frameHandlers[h][0];
		this._frameHandlers[h][1].__action();
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

Events.prototype.keyPress = function(e) {
	for(var h in this._keyHandlers){
		this._keyHandlers[h][1].__action = this._keyHandlers[h][0].call(this._keyHandlers[h][1], e);
	}
}

Events.prototype.run = function(what, t) {
	if(!t) t = "main";
	if(typeof(what) == "string") what = JSON.parse(what);
	
	//Add all the commands to the buffer to be added before running any more commands
	for(var i = 0; i < what.length; i++){
		this._getThread(t, true).buffer[this._getThread(t, true).buffer.length] = what[i];
	}
}

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
	var current = this.clone(this._getThread(t).stack.pop());
	
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

Events.prototype.clone = function(o) {
	if(o == null || typeof(o) != 'object') return o;

	var tmp = o.constructor(); 
	for(var p in o) tmp[p] = this.clone(o[p]);

	return tmp;
};


Events.prototype.awaitNext = function(t, count) {
	if(count === undefined) count = 1;
	_getThread(t).nexts += count;
	return t;
}

Events.prototype.replaceVar = function(data, children) {
	for(var p in data){
		if(typeof(data[p]) == "string"){
			data[p] = this._parseVar(data[p]);
		}else if(children && typeof(data[p]) == "array"){
			for(var i = data[p].length-1; i >= 0; i--){
				this.replaceVar(data[p][i], false);
			}
		}
	}
	
	return data;
};

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
	else return data.replace(/\$;/g, "$");
};

Events.prototype.registerAction = function(name, funct, scope) {
	this._actions[name] = [funct, scope];
};

Events.prototype.registerFrameHandler = function(name, funct, scope){
	this._frameHandlers[name] = [funct, scope];
};

Events.prototype.registerKeyHandler = function(name, funct, scope){
	this._keyHandlers[name] = [funct, scope];
};

Events.prototype._addFunction = function(data) {
	if(!data.name) {duskWolf.error("No name for this function!");return;}
	if(!data.actions) {duskWolf.error("Defining "+data.name+", no actions.");return;}
	
	this._functions[data.name] = data.actions;
};

Events.prototype._callFunction = function(data) {
	if(!data.name) {duskWolf.error("No name for this function!");return;}
	
	if(this._functions[data.name]){
		this.run(this._functions[data.name], data.thread?data.thread:this._thread);
	} else duskWolf.error("Function "+data.name+" does not exist!");
};

Events.prototype._threadTo = function(data) {
	if(!data.name) {duskWolf.error("No thread name!");return;}
	if(!data.actions) {duskWolf.error("Threading to "+data.name+", no actions.");return;}
	
	this.run(data.actions, data.name);
};

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

Events.prototype.addListener = function(data) {
	if(!data.event){duskWolf.error("This listener won't listen to anything!");return;}
	
	this._listeners[this._listeners.length] = data;
}
	
Events.prototype.unlisten = function(data) {
	for(var l = this._listeners.length-1; l >= 0; l--){
		if(this._listeners[l].event == data.event){
			var fail;
			for(var p in this._listeners[l]){
				if((["actions", "event", "__proto__", "a"]).indexOf(p) == -1 && this._listeners[l][p] && ((this._listeners[l][p] != data[p] && this._listeners[l][p][0] != "!") || ("!"+this._listeners[l][p] == data[p] && this._listeners[l][p][0] == "!"))){
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

Events.prototype.fire = function(data) {
	if(!data.event){duskWolf.error("This won't fire anything!");return;}
	
	for(var l = this._listeners.length-1; l >= 0; l--){
		if(this._listeners[l].event == data.event){
			var fail;
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

Events.prototype._iffy = function(what) {
	if(!what.cond){duskWolf.error("No condition for if.");return;}
	
	if(this._cond(what.cond)) {
		if(what.then) this.run(what.then, this.thread);
	}else if(what["else"]) this.run(what["else"], this.thread);
};

Events.prototype._whiley = function(what) {
	if(!what.cond){duskWolf.error("No condition for while.");return;}
	if(!what.actions){duskWolf.error("Nothing for while to loop through.");return;}
	
	if(this._cond(this._parseVar(what.cond))){
		var funId = (new Date()).getTime();
		what.actions[what.actions.length] = {"a":"if", "cond":what.cond, "then":[{"a":"call", "name":"_while_"+funId}]};
		this.run([{"a":"function", "name":"_while_"+funId, "actions":what.actions}, {"a":"call", "name":"_while_"+funId}], this.thread);
	}
};

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

Events.prototype._setVarInternal = function(data) {
	if(!data.name) {duskWolf.error("No name given for var."); return;}
	if(!data.value) {duskWolf.error("No value given for "+data.name+"."); return;}
	
	this.setVar(data.name.toLowerCase(), data.value);
};

Events.prototype.setVar = function(name, value) {
	if(name.indexOf(",") != -1) duskWolf.warning("setVar", "A variable name with a comma in it may cause problems.");
	
	this._vars[name.toLowerCase()] = value;
	
	return value;
};

Events.prototype.setVars = function(list) {
	for(var i = list.length-1; i>= 0; i--){
		this.setVar(list[i][0], list[i][1]);
	}
};

Events.prototype.getVar = function(name) {
	return this._vars[name.toLowerCase()]!==null?this._vars[name.toLowerCase()]:"";
};

Events.prototype.getVars = function(expr) {
	var ret = [];
	for(var p in this._vars){
		if(expr.test(p)){
			ret[ret.length] = [p, this._vars[p]];
		}
	}
	
	return ret;
};

Events.prototype._delVarInternal = function(data) {
	if(!data.name) {duskWolf.error("No name given for var."); return;}
	
	this.delVar(data.name.toLowerCase());
};

Events.prototype.delVar = function(name) {
	delete this._vars[name.toLowerCase()];
};
