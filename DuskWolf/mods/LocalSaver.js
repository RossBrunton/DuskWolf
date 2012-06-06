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
 * 	If you specify RegExp as true, the var name(s) will be treated as regular expression(s). 
 *
 * > {"a":"local-load", "name":"..."}
 * Loads all the variables saved in the specified block.
 * 	It loads all of them, replacing any that may already be defined, there is no way to specify which ones.
 * 
 * > {"a":"local-clear", "name":"..."}
 * Erases the specified block.
 */

/** Function: mods.LocalSaver
 * 
 * Constructor, creates a new instance of this. Doesn't really do anything else of interest though.
 * 
 * Params:
 *	events	- [<Events>] The events system that this will be used for.
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
	this._events.registerAction("local-save", this._save, this, [["name", true, "STR"], ["vars", true, "ARR:STR"], ["regexp", false, "BLN"]]);
	this._events.registerAction("local-load", this._load, this, [["name", true, "STR"]]);
	this._events.registerAction("local-clear", this._clear, this, [["name", true, "STR"]]);
};

/*- Function: _save
 * 
 * Used internally to handle the "local-save" action.
 * 	You should use the standard ways of running actions, rather than calling this directly.
 * 
 * Params:
 * 	a			- [object] A "local-save" action.
 */
mods.LocalSaver.prototype._save = function(a) {
	if(!("name" in a)){duskWolf.error("No save data name given!");return;}
	if(!("vars" in a)){duskWolf.error("No vars to save!");return;}
	
	if("regexp" in a && a.regexp == "1") {
		if(typeof(a.vars) == "array"){
			//An array of regex checks
			var hold = [];
			for(var i = a.vars.length-1; i >= 0; i--) {
				hold = hold.concat(this._events.getVars(RegExp(a.vars[i])));
			}
			localStorage["dw_"+a.name] = JSON.stringify(hold);
		}else{
			localStorage["dw_"+a.name] = JSON.stringify(this._events.getVars(RegExp(a.vars)));
		}
	}else{
		if(typeof(a.vars) == "array"){
			var hold = [];
			for(var i = a.vars.length-1; i >= 0; i--) {
				hold = hold[hold.length] = [a.vars[i], this._events.getVar(a.vars[i])];
			}
			localStorage["dw_"+a.name] = JSON.stringify(hold);
		}else{
			localStorage["dw_"+a.name] = JSON.stringify([[a.vars, this._events.getVar(a.vars)]]);
		}
	}
};

/*- Function: _load
 * 
 * Used internally to handle the "local-load" action.
 * 	You should use the standard ways of running actions, rather than calling this directly.
 * 
 * Params:
 * 	a			- [object] A "local-load" action.
 */
mods.LocalSaver.prototype._load = function(a) {
	if(!("name" in a)){duskWolf.error("No save data name given!");return;}
	
	this._events.setVars(JSON.parse(localStorage["dw_"+a.name]));
};

/*- Function: _clear
 * 
 * Used internally to handle the "local-clear" action.
 * 	You should use the standard ways of running actions, rather than calling this directly.
 * 
 * Params:
 * 	a			- [object] A "local-clear" action.
 */
mods.LocalSaver.prototype._clear = function(data) {
	if(!("name" in a)){duskWolf.error("No save data name given!");return;}
	
	delete localStorage["dw_"+a.name];
};
