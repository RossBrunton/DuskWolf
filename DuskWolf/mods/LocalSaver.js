//Part of the DuskWolf engine
//Licensed under the MIT license, see COPYING.txt for details
"use strict";

dusk.load.provide("dusk.mods.localSaver");

/** @namespace dusk.mods.localSaver
 * 
 * @description This allows persistent data storage using HTML5's "localStorage" thing.
 * 	With this module you can save to and load from the user's computer, it will not sync with the internet or anything though.
 * 	Also, you need to be loading data from the same domain as you saved on, normal stuff like that.
 * 
 * Data is stored in "blocks", properties of the "localStorage" object with the name you specified with "dw_" as a prefix.
 * 	They consist of an object with the keys and values being the same as the vars they represent.
 * 
 * This namespace has no public members.
 */

/*
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

/** This initiates the module, registering all the actions and variables. This is called automatically when the file is loaded.
 * @private
 */
dusk.mods.localSaver._init = function() {
	dusk.actions.registerAction("local-save", this._save, this, [["name", true, "STR"], ["vars", true, "ARR:STR"], ["regexp", false, "BLN"]]);
	dusk.actions.registerAction("local-load", this._load, this, [["name", true, "STR"]]);
	dusk.actions.registerAction("local-clear", this._clear, this, [["name", true, "STR"]]);
};

/** Used internally to handle the `local-save` action. This should not be called by anything else.
 * @param {object} a An `local-save` action.
 * @private
 */
dusk.mods.localSaver._save = function(a) {
	if(!("name" in a)){throw new dusk.errors.PropertyMissing(a.a, "name");}
	if(!("vars" in a)){throw new dusk.errors.PropertyMissing(a.a, "vars");}
	
	if("regexp" in a && a.regexp == "1") {
		if(typeof(a.vars) == "array"){
			//An array of regex checks
			var hold = [];
			for(var i = a.vars.length-1; i >= 0; i--) {
				hold = hold.concat(dusk.actions.getVars(RegExp(a.vars[i])));
			}
			window.localStorage["dw_"+a.name] = JSON.stringify(hold);
		}else{
			window.localStorage["dw_"+a.name] = JSON.stringify(dusk.actions.getVars(RegExp(a.vars)));
		}
	}else{
		if(typeof(a.vars) == "array"){
			var hold = [];
			for(var i = a.vars.length-1; i >= 0; i--) {
				hold = hold[hold.length] = [a.vars[i], dusk.actions.getVar(a.vars[i])];
			}
			window.localStorage["dw_"+a.name] = JSON.stringify(hold);
		}else{
			window.localStorage["dw_"+a.name] = JSON.stringify([[a.vars, dusk.actions.getVar(a.vars)]]);
		}
	}
};

/** Used internally to handle the `local-load` action. This should not be called by anything else.
 * @param {object} a A `local-load` action.
 * @private
 */
dusk.mods.localSaver._load = function(a) {
	if(!("name" in a)){throw new dusk.errors.PropertyMissing(a.a, "name");}
	
	dusk.actions.setVars(window.JSON.parse(window.localStorage["dw_"+a.name]));
};

/** Used internally to handle the `local-clear` action. This should not be called by anything else.
 * @param {object} a A `local-clear` action.
 * @private
 */
dusk.mods.localSaver._clear = function(a) {
	if(!("name" in a)){throw new dusk.errors.PropertyMissing(a.a, "name");}
	
	delete window.localStorage["dw_"+a.name];
};

dusk.mods.localSaver._init();
