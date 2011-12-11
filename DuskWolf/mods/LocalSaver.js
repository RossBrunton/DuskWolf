//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

/** Class: mods.LocalSaver
 * 
 * This allows persistent data storage using HTML5's "localStorage" thing.
 * 	With this module you can save to and load from the user's computer, it will not sync with the internet or anything though.
 * 	Also, you need to be loading data from the same domain as you saved on, normal stuff like that.
 * 
 * Data is stored in "blocks", properties of the "localStorage" object with the name you specified with "dw_" as a prefix.
 * 	They consist of an object with the keys and values being the same as the vars they represent.
 * 
 * Inheritance:
 * 	mods.LocalSaver { <mods.IModule>
 * 
 * Provided Actions:
 * 
 * > {"a":"local-save", "name":"...", "vars":[...], ("regexp":true)}
 * Saves the named vars in the block specified by name.
 * 	The var property should be an array of strings with names of vars without the "$" things.
 * 	You can also specify a string instead of an array for vars, which will cause only that var to be saved.
 * 	If you specify RegExp, the var name(s) will be treated as regular expression(s). 
 *
 * > {"a":"local-load", "name":"..."}
 * Loads all the variables saved in the specified block.
 * 	It loads all of them, replacing any that may already be defined, there is no way to specify.
 * 
 * > {"a":"local-clear", "name":"..."}
 * Erases the specified block.
 */

/** Function: LocalSaver
 * 
 * Constructor, creates a new instance of this. Doesn't really do anything of interest though.
 */
mods.LocalSaver = function(events) {
	mods.IModule.call(this, events);
};
mods.LocalSaver.prototype = new mods.IModule();
mods.LocalSaver.constructor = mods.LocalSaver;

/** Function: addActions
 * 
 * Registers the actions this uses, see the class description for a list of avalable ones.
 * 
 * See:
 * * <mods.IModule.addActions>
 */
mods.LocalSaver.prototype.addActions = function() {
	this._events.registerAction("local-save", this._save, this);
	this._events.registerAction("local-load", this._load, this);
	this._events.registerAction("local-clear", this._clear, this);
};

/** Function: _save
 * 
 * Used internally to handle the "local-save" action.
 * 	You should use the standard ways of running actions, rather than calling this directly.
 * 
 * Params:
 * 	data		- [object] A "local-save" action.
 */
mods.LocalSaver.prototype._save = function(data) {
	if(!("name" in data)){duskWolf.error("No save data name given!");return;}
	if(!("vars" in data)){duskWolf.error("No vars to save!");return;}
	
	if("regexp" in data && data.regexp == "1") {
		if(typeof(data.vars) == "array"){
			//An array of regex checks
			var hold = [];
			for(var i = data.vars.length-1; i >= 0; i--) {
				hold = hold.concat(this._events.getVars(RegExp(data.vars[i])));
			}
			localStorage["dw_"+data.name] = JSON.stringify(hold);
		}else{
			localStorage["dw_"+data.name] = JSON.stringify(this._events.getVars(RegExp(data.vars)));
		}
	}else{
		if(typeof(data.vars) == "array"){
			var hold = [];
			for(var i = data.vars.length-1; i >= 0; i--) {
				hold = hold[hold.length] = [data.vars[i], this._events.getVar(data.vars[i])];
			}
			localStorage["dw_"+data.name] = JSON.stringify(hold);
		}else{
			localStorage["dw_"+data.name] = JSON.stringify([[data.vars, this._events.getVar(data.vars)]]);
		}
	}
};

/** Function: _load
 * 
 * Used internally to handle the "local-load" action.
 * 	You should use the standard ways of running actions, rather than calling this directly.
 * 
 * Params:
 * 	data		- [object] A "local-load" action.
 */
mods.LocalSaver.prototype._load = function(data) {
	if(!("name" in data)){duskWolf.error("No save data name given!");return;}
	
	this._events.setVars(JSON.parse(localStorage["dw_"+data.name]));
};

/** Function: _clear
 * 
 * Used internally to handle the "local-clear" action.
 * 	You should use the standard ways of running actions, rather than calling this directly.
 * 
 * Params:
 * 	data		- [object] A "local-clear" action.
 */
mods.LocalSaver.prototype._clear = function(data) {
	if(!("name" in data)){duskWolf.error("No save data name given!");return;}
	
	delete localStorage["dw_"+data.name];
};
